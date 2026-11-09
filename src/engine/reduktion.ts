/** Beregning med reduktion for afrundede ender og gennemføringer (fund K-29,
 * docs/FORSLAG_SIKRET_LAENGDE.md). Beregningen er ikke i regnearket.
 *
 * Opdriften virker på hele røret, men geonettet kan ikke lægges over de afrundede ender og ved
 * gennemføringerne. Opdrift og ballast regnes for hele røret og fordeles på den sikrede længde.
 * Geonet og forankring regnes derefter med de samme formler som pr. meter rør. */
import standarder from './defaults.json' with { type: 'json' };
import { tal } from './format.ts';
import {
  konstanter,
  medOpdriftOgBallast,
  type Konstanter,
  type OpdriftInput,
  type OpdriftResultat,
  type Status,
} from './opdrift.ts';

const { gammaW, krav } = standarder;

/** Højst to afrundede ender og to gennemføringer (beslutning 9. november 2026). */
export const MAKS_ENDER = 2;
export const MAKS_GENNEMFOERINGER = 2;

export interface ReduktionInput {
  /** Rørets samlede længde fra ende til ende, inkl. de afrundede ender, m. */
  Lroer: number;
  /** Vandret udstrækning af hver afrundet ende, m (0–2 stk.). */
  ender: number[];
  /** Bredde langs røret af hver gennemføring, m (0–2 stk.). For en cirkulær gennemføring er det
   * diameteren. */
  gennemfoeringer: number[];
  /** Bredde på tværs af røret for hver rektangulær gennemføring, m. null eller mangler: cirkulær. */
  gennemfoeringTvaers?: (number | null)[];
}

export interface ReduktionFejl {
  /** 'Lroer', 'ende-n', 'gennemfoering-n' eller 'gennemfoering-tvaers-n' (n = 0 eller 1). */
  felt: string;
  tekst: string;
}

export interface GennemfoeringResultat {
  form: 'cirkulaer' | 'rektangulaer';
  /** Bredde langs røret, m. For en cirkulær gennemføring er det diameteren. */
  d: number;
  /** Bredde på tværs af røret for en rektangulær gennemføring, m; ellers null. */
  b: number | null;
  /** Tværsnitsareal, π/4 · d² eller d · b, m². */
  A: number;
  /** Højden af gennemføringens hulrum under GVS, max(0; h₁ − T₂), m. */
  h: number;
  /** Opdrift af hulrummet, A · h · γ_w · γ_f, kN. */
  O: number;
}

export interface ReduktionResultat {
  Lroer: number;
  ender: number[];
  gennemfoeringer: GennemfoeringResultat[];
  /** Summen af endernes udstrækning, m. */
  sumEnder: number;
  /** Summen af gennemføringernes bredde, m. */
  sumGennemfoeringer: number;
  /** Længden, hvor geonettet kan lægges, L_rør − ΣL_ende − Σd_g, m. */
  Lsikret: number;
  /** Længden med ballast, L_rør − Σd_g, m. Ved gennemføringerne er der ingen jorddække. */
  Lballast: number;
  /** Rørets opdrift i hele længden, O_d · L_rør, kN. */
  Oroer: number;
  Otot: number;
  Btot: number;
  Ftot: number;
  /** B_tot/O_tot; null, når røret ikke påvirkes af opdrift. */
  S1: number | null;
  S1Status: Status;
  /** Opdrift og ballast pr. meter sikret længde, kN/m. */
  Os: number;
  Bs: number;
  /** Geonet, kraftoverførsel og løsninger pr. meter sikret længde. */
  r: OpdriftResultat;
}

export function beregnReduktion(
  r: OpdriftResultat,
  input: OpdriftInput,
  red: ReduktionInput,
  k: Konstanter = konstanter,
): { ok: true; resultat: ReduktionResultat } | { ok: false; fejl: ReduktionFejl[] } {
  const fejl: ReduktionFejl[] = [];
  const positiv = (v: number) => Number.isFinite(v) && v > 0;
  if (!positiv(red.Lroer))
    fejl.push({ felt: 'Lroer', tekst: 'Rørets længde L_{rør} skal være større end 0 m.' });
  if (red.ender.length > MAKS_ENDER || red.gennemfoeringer.length > MAKS_GENNEMFOERINGER)
    fejl.push({
      felt: 'Lroer',
      tekst: `Der kan regnes med højst ${MAKS_ENDER} ender og ${MAKS_GENNEMFOERINGER} gennemføringer.`,
    });
  red.ender.forEach((v, n) => {
    if (!positiv(v))
      fejl.push({
        felt: `ende-${n}`,
        tekst: `Endens udstrækning L_{ende,${n + 1}} skal være større end 0 m.`,
      });
  });
  red.gennemfoeringer.forEach((v, n) => {
    if (!positiv(v))
      fejl.push({
        felt: `gennemfoering-${n}`,
        tekst: `Gennemføringens bredde d_{g,${n + 1}} skal være større end 0 m.`,
      });
    const b = red.gennemfoeringTvaers?.[n];
    if (b !== undefined && b !== null && !positiv(b))
      fejl.push({
        felt: `gennemfoering-tvaers-${n}`,
        tekst: `Gennemføringens bredde på tværs b_{g,${n + 1}} skal være større end 0 m.`,
      });
  });
  if (fejl.length) return { ok: false, fejl };

  const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
  const sumEnder = sum(red.ender);
  const sumGennemfoeringer = sum(red.gennemfoeringer);
  const Lsikret = red.Lroer - sumEnder - sumGennemfoeringer;
  if (!(Lsikret > 1e-9))
    return {
      ok: false,
      fejl: [
        {
          felt: 'Lroer',
          tekst: `Den sikrede længde L_{sikret} = L_{rør} − ΣL_{ende} − Σd_{g} = ${tal(Lsikret)} m skal være større end 0 m.`,
        },
      ],
    };

  // Gennemføringens hulrum fra rørtoppen til terræn giver opdrift under GVS med sit cirkulære eller
  // rektangulære tværsnit. Standardberegningen regner med GVS i terræn.
  const T2 = r.gvsZone === null ? 0 : input.gvs;
  const h = Math.max(0, input.h1 - T2);
  const gammaF = r.partialkoefficienter.gammaF;
  const ingenOpdrift = r.S1 === null;
  const gennemfoeringer = red.gennemfoeringer.map((d, n): GennemfoeringResultat => {
    const b = red.gennemfoeringTvaers?.[n] ?? null;
    const A = b === null ? (k.pi / 4) * d ** 2 : d * b;
    return {
      form: b === null ? 'cirkulaer' : 'rektangulaer',
      d,
      b,
      A,
      h,
      O: ingenOpdrift ? 0 : A * h * gammaW * gammaF,
    };
  });

  // Enderne regnes med fuldt tværsnit, hvilket er på den sikre side. Ved gennemføringerne er
  // jorden gravet væk, så der regnes ingen ballast i deres bredde.
  const Lballast = red.Lroer - sumGennemfoeringer;
  const Oroer = r.O * red.Lroer;
  const Otot = Oroer + sum(gennemfoeringer.map((g) => g.O));
  const Btot = r.B * Lballast;
  const S1 = ingenOpdrift ? null : Btot / Otot;
  const Os = Otot / Lsikret;
  const Bs = Btot / Lsikret;

  return {
    ok: true,
    resultat: {
      Lroer: red.Lroer,
      ender: red.ender,
      gennemfoeringer,
      sumEnder,
      sumGennemfoeringer,
      Lsikret,
      Lballast,
      Oroer,
      Otot,
      Btot,
      Ftot: Otot - Btot,
      S1,
      S1Status: S1 === null || S1 >= krav.S1 ? 'OK' : 'EJ OK',
      Os,
      Bs,
      r: medOpdriftOgBallast(r, input, Os, Bs, k),
    },
  };
}
