import type { Konsekvensklasse, OpdriftInput, OpdriftResultat } from '../engine/opdrift.ts';
import { beregnReduktion, type ReduktionInput } from '../engine/reduktion.ts';
import standarder from '../engine/defaults.json' with { type: 'json' };

export interface RapportPerson {
  navn: string;
  /** Står på forsiden ud for »Udført af« og »Kvalitetssikring«; navnet står i afslutningen. */
  initialer: string;
  telefon: string;
  mail: string;
}
/** Oplysningerne på rapportsiden; de gemmes sammen med beregningen. */
export interface RapportOplysninger {
  projekt: string;
  udfoeresFor: string;
  /** ISO-dato; tom betyder dagens dato. */
  dato: string;
  /** Fri tekst, der tilføjes til projektbeskrivelsen. */
  beskrivelse: string;
  sagsbehandler: RapportPerson;
  kontrollant: RapportPerson;
  losninger: Record<'A' | 'B' | 'C' | 'D', boolean>;
  /** Dybere forankring medtages som sidste afsnit; vælges på rapportsiden. */
  dybForankring: boolean;
}
export type GennemfoeringForm = 'cirkulaer' | 'rektangulaer';
export interface Session {
  inddata: {
    d: number;
    h1: number;
    gvs: number;
    gvsITerraen: boolean;
    roervaegt: number;
    gamma: number;
    gammaTor: number;
    phi: number;
    overstyringAktiv: boolean;
    /** UTS pr. lag ved manuelt valg; der regnes altid med 2 lag. */
    produkt: number;
    /** Partialkoefficient for kraftoptagelse S₂ (fund K-14). */
    S2: number;
    /** Lodret afstand mellem netlagene ved omslag, m (fund K-26). */
    omslagAfstand: number;
    /** Dybere forankring ved begrænset plads (fund K-25); kun i avanceret beregning. */
    dybForankringAktiv: boolean;
    /** Forankringslængden pr. side, der er plads til, m. */
    dybForankringL: number;
    /** Beregning med reduktion for ender og gennemføringer (fund K-29), valgt i kort 3; kun i
     * avanceret beregning. */
    reduktionAktiv: boolean;
    /** Rørets samlede længde L_rør, m. */
    reduktionLroer: number;
    /** Antal afrundede ender, 0–2. Værdierne for ubrugte ender gemmes. */
    antalEnder: number;
    /** Hver afrundet endes vandrette udstrækning, m. */
    ender: [number, number];
    /** Antal gennemføringer, 0–2. Værdierne for ubrugte gennemføringer gemmes. */
    antalGennemfoeringer: number;
    /** Hver gennemførings bredde langs røret, m. For en cirkulær gennemføring er det diameteren. */
    gennemfoeringer: [number, number];
    /** Hver gennemførings form. */
    gennemfoeringForm: [GennemfoeringForm, GennemfoeringForm];
    /** Hver rektangulær gennemførings bredde på tværs af røret, m. */
    gennemfoeringTvaers: [number, number];
  };
  konsekvensklasse: Konsekvensklasse;
  /** Avanceret beregning (docs/FORSLAG_K-05.md); ellers regnes som regnearket. */
  avanceret: boolean;
  rapport: RapportOplysninger;
}
export const STORAGE_KEY = 'opdrift.session';
const tomPerson = (): RapportPerson => ({ navn: '', initialer: '', telefon: '', mail: '' });
export const standardRapport = (): RapportOplysninger => ({
  projekt: '',
  udfoeresFor: '',
  dato: '',
  beskrivelse: '',
  sagsbehandler: tomPerson(),
  kontrollant: tomPerson(),
  losninger: { A: true, B: true, C: true, D: true },
  dybForankring: false,
});
export const standardSession = (): Session => ({
  inddata: {
    d: 2.5,
    h1: 1.5,
    gvs: 0,
    gvsITerraen: true,
    roervaegt: 340,
    gamma: 17,
    gammaTor: 16,
    phi: 35,
    overstyringAktiv: false,
    produkt: 150,
    S2: standarder.S2,
    omslagAfstand: standarder.omslagAfstand,
    dybForankringAktiv: false,
    dybForankringL: 2,
    reduktionAktiv: false,
    reduktionLroer: 10,
    antalEnder: 2,
    ender: [0.6, 0.6],
    antalGennemfoeringer: 1,
    gennemfoeringer: [0.8, 0.8],
    gennemfoeringForm: ['cirkulaer', 'cirkulaer'],
    gennemfoeringTvaers: [0.8, 0.8],
  },
  konsekvensklasse: 'CC2',
  avanceret: false,
  rapport: standardRapport(),
});
export function tilMotorInput(s: Session): OpdriftInput {
  const i = s.inddata;
  return {
    d: i.d,
    h1: i.h1,
    // Standardberegningen og CC3 regnes altid med GVS i terræn; den indtastede GVS gemmes til den
    // avancerede beregning i CC2.
    gvs: i.gvsITerraen || s.konsekvensklasse === 'CC3' || !s.avanceret ? 0 : i.gvs,
    roervaegt: i.roervaegt,
    gamma: i.gamma,
    gammaTor: i.gammaTor,
    phi: i.phi,
    konsekvensklasse: s.konsekvensklasse,
    // Geonettet kan kun vælges manuelt i avanceret beregning (beslutning 1. november 2026); valget
    // gemmes og bruges igen, når avanceret beregning slås til.
    overstyring:
      s.avanceret && i.overstyringAktiv
        ? { uts: i.produkt, lag: standarder.geonet.lagVedManueltValg }
        : null,
    metode: s.avanceret ? 'avanceret' : 'standard',
    S2: i.S2,
    omslagAfstand: i.omslagAfstand,
  };
}
/** Rørets længde, ender og gennemføringer til beregningen med reduktion (kort 8). */
export function tilReduktionInput(s: Session): ReduktionInput {
  const i = s.inddata;
  return {
    Lroer: i.reduktionLroer,
    ender: i.ender.slice(0, i.antalEnder),
    gennemfoeringer: i.gennemfoeringer.slice(0, i.antalGennemfoeringer),
    gennemfoeringTvaers: i.gennemfoeringForm
      .slice(0, i.antalGennemfoeringer)
      .map((f, n) => (f === 'rektangulaer' ? i.gennemfoeringTvaers[n] : null)),
  };
}
/** Beregningen med reduktion, når den er valgt i kort 3 i avanceret beregning (fund K-29). `rv` er
 * resultatet, som kortene for opdrift og ballast, geonet og forankring viser: pr. meter sikret længde
 * med reduktion, ellers pr. meter rør. `rv` er null, når længder, ender eller gennemføringer har fejl. */
export function medReduktion(s: Session, input: OpdriftInput, r: OpdriftResultat) {
  const aktiv = s.avanceret && s.inddata.reduktionAktiv;
  const red = aktiv ? beregnReduktion(r, input, tilReduktionInput(s)) : null;
  const res = red?.ok ? red.resultat : null;
  return { aktiv, red, res, rv: aktiv ? (res?.r ?? null) : r };
}
/** Kortenes og rapportens numre: kortet for længde, ender og gennemføringer er kort 4, når
 * reduktionen er valgt, og de følgende kort rykker et nummer (beslutning 9. november 2026). */
export const kortNr = (reduktion: boolean, nr: number) => (reduktion && nr >= 4 ? nr + 1 : nr);
export const reduktionValgt = (s: Session) => s.avanceret && s.inddata.reduktionAktiv;
const num = (v: unknown, d: number, min = -Infinity, max = Infinity) =>
  typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max ? v : d;
const tekst = (v: unknown) => (typeof v === 'string' ? v : '');
const form = (v: unknown): GennemfoeringForm => (v === 'rektangulaer' ? v : 'cirkulaer');
const antal = (v: unknown, d: number) => (v === 0 || v === 1 || v === 2 ? v : d);
const par = (v: unknown, d: [number, number]): [number, number] =>
  Array.isArray(v) ? [num(v[0], d[0], 0), num(v[1], d[1], 0)] : d;
const person = (v: unknown): RapportPerson => {
  const p = (v && typeof v === 'object' ? v : {}) as Record<string, unknown>;
  return {
    navn: tekst(p.navn),
    initialer: tekst(p.initialer),
    telefon: tekst(p.telefon),
    mail: tekst(p.mail),
  };
};
/** Beregninger gemt før rapportsiden indlæses med tomme oplysninger og alle løsninger valgt. */
function parseRapport(v: unknown): RapportOplysninger {
  const r = (v && typeof v === 'object' ? v : {}) as Record<string, unknown>;
  const l = (r.losninger && typeof r.losninger === 'object' ? r.losninger : {}) as Record<
    string,
    unknown
  >;
  return {
    projekt: tekst(r.projekt),
    udfoeresFor: tekst(r.udfoeresFor),
    dato: tekst(r.dato),
    beskrivelse: tekst(r.beskrivelse),
    sagsbehandler: person(r.sagsbehandler),
    kontrollant: person(r.kontrollant),
    losninger: { A: l.A !== false, B: l.B !== false, C: l.C !== false, D: l.D !== false },
    dybForankring: r.dybForankring === true,
  };
}
export function parseSession(raw: string): { session: Session; error: boolean; message?: string } {
  const standard = standardSession();
  try {
    const x = JSON.parse(raw);
    if (!x || typeof x !== 'object' || !x.inddata || typeof x.inddata !== 'object')
      return {
        session: standard,
        error: true,
        message: 'Gemte data kunne ikke indlæses. Standardværdier er indlæst.',
      };
    const i = x.inddata;
    return {
      session: {
        inddata: {
          d: typeof i.d === 'number' && Number.isFinite(i.d) && i.d > 0 ? i.d : 2.5,
          h1: num(i.h1, 1.5, 0),
          gvs: num(i.gvs, 0, 0),
          gvsITerraen: typeof i.gvsITerraen === 'boolean' ? i.gvsITerraen : true,
          roervaegt: num(i.roervaegt, 340, 0),
          gamma:
            typeof i.gamma === 'number' && Number.isFinite(i.gamma) && i.gamma * 0.9 > 10
              ? i.gamma
              : 17,
          gammaTor:
            typeof i.gammaTor === 'number' && Number.isFinite(i.gammaTor) && i.gammaTor > 0
              ? i.gammaTor
              : 16,
          phi:
            typeof i.phi === 'number' && Number.isFinite(i.phi) && i.phi > 0 && i.phi < 90
              ? i.phi
              : 35,
          overstyringAktiv: typeof i.overstyringAktiv === 'boolean' ? i.overstyringAktiv : false,
          produkt: standarder.geonet.produkter.some((p) => p.uts === i.produkt) ? i.produkt : 150,
          S2: num(i.S2, standarder.S2, standarder.S2Interval.min, standarder.S2Interval.max),
          omslagAfstand: num(
            i.omslagAfstand,
            standarder.omslagAfstand,
            standarder.omslagInterval.min,
            standarder.omslagInterval.max,
          ),
          dybForankringAktiv:
            typeof i.dybForankringAktiv === 'boolean' ? i.dybForankringAktiv : false,
          dybForankringL: num(i.dybForankringL, 2, 0),
          // Beregninger gemt før kort 8 indlæses med reduktionen slået fra og standardværdierne.
          reduktionAktiv: i.reduktionAktiv === true,
          reduktionLroer: num(i.reduktionLroer, standard.inddata.reduktionLroer, 0),
          antalEnder: antal(i.antalEnder, standard.inddata.antalEnder),
          ender: par(i.ender, standard.inddata.ender),
          antalGennemfoeringer: antal(
            i.antalGennemfoeringer,
            standard.inddata.antalGennemfoeringer,
          ),
          gennemfoeringer: par(i.gennemfoeringer, standard.inddata.gennemfoeringer),
          // Beregninger gemt før formvalget indlæses med cirkulære gennemføringer.
          gennemfoeringForm: [form(i.gennemfoeringForm?.[0]), form(i.gennemfoeringForm?.[1])],
          gennemfoeringTvaers: par(i.gennemfoeringTvaers, standard.inddata.gennemfoeringTvaers),
        },
        // CC3 kan kun vælges i avanceret beregning; ellers indlæses CC2.
        konsekvensklasse: x.konsekvensklasse === 'CC3' && x.avanceret === true ? 'CC3' : 'CC2',
        avanceret: x.avanceret === true,
        rapport: parseRapport(x.rapport),
      },
      error: false,
    };
  } catch {
    return {
      session: standard,
      error: true,
      message: 'Gemte data kunne ikke indlæses. Standardværdier er indlæst.',
    };
  }
}
/** En beregning i en udgave uden avanceret beregning. Felterne for GVS og det manuelle geonet
 * bruges ikke i standardberegningen. Den tørre rumvægt vises i tabellen, men kan ikke ændres der. */
export const udenAvanceret = (s: Session): Session => ({
  ...s,
  avanceret: false,
  konsekvensklasse: 'CC2',
  inddata: { ...s.inddata, gammaTor: standardSession().inddata.gammaTor },
});

export function loadSession(storage: Pick<Storage, 'getItem'>): {
  session: Session;
  error: boolean;
  message?: string;
} {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return raw ? parseSession(raw) : { session: standardSession(), error: false };
  } catch {
    return { session: standardSession(), error: true, message: 'Lageret er ikke tilgængeligt.' };
  }
}
export function saveSession(storage: Pick<Storage, 'setItem'>, session: Session): boolean {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, ...session }));
    return true;
  } catch {
    return false;
  }
}
