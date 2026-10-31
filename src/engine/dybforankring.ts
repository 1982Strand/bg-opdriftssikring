/** Dybere forankring ved begrænset plads for én ledning med omslag (fund K-25,
 * docs/FORSLAG_DYB_FORANKRING.md). Beregningen er ikke i regnearket. Ud fra den forankringslængde pr.
 * side, der er plads til, findes den dybde til det nederste netlag, hvor formlen for løsning C giver
 * netop den længde. Opdrift, ballast og K er uændrede fra `beregnOpdrift`. */
import standarder from './defaults.json' with { type: 'json' };
import {
  konstanter,
  type Konstanter,
  type OpdriftInput,
  type OpdriftResultat,
  type Status,
} from './opdrift.ts';

const { mu, krav, omslagAfstand, netTillaegOmslag, mindstelaengder: min } = standarder;

export type DybForankring =
  | { tilstand: 'ikke relevant' }
  | { tilstand: 'omslag ikke muligt' }
  /** Løsning C ved rørmidten er allerede kort nok. */
  | { tilstand: 'tilstraekkelig'; L: number; LC: number }
  | {
      tilstand: 'dybere';
      L: number;
      /** L_geonet for løsning C ved rørmidten. */
      LC: number;
      /** F_bund + F_top/2, der skal til, kN/m. */
      krav: number;
      hBund: number;
      hTop: number;
      /** Sænkning under rørmidten, h_bund − T₃. */
      dh: number;
      /** Positiv, når det nederste netlag ligger under rørbunden. */
      underRoerbund: number;
      spaending: { bund: number; top: number };
      Fbund: number;
      Ftop: number;
      /** 2L efter formlen for løsning C med dybden indsat igen; giver 2 · L. */
      toL: number;
      Ltot: number;
      kontrol: number;
      status: Status;
    };

export const dybFejl = `Forankringslængden skal være mindst ${String(min.medOmslag.prSide).replace('.', ',')} m pr. side, som er mindstelængden med omslag.`;

export function beregnDybForankring(
  r: OpdriftResultat,
  input: OpdriftInput,
  L: number,
  { pi }: Konstanter = konstanter,
): { ok: true; resultat: DybForankring } | { ok: false; fejl: string } {
  if (r.Fopdrift <= 0) return { ok: true, resultat: { tilstand: 'ikke relevant' } };
  const C = r.losninger.C;
  if (!C) return { ok: true, resultat: { tilstand: 'omslag ikke muligt' } };
  if (!Number.isFinite(L) || L < min.medOmslag.prSide) return { ok: false, fejl: dybFejl };
  if (L >= C.L) return { ok: true, resultat: { tilstand: 'tilstraekkelig', L, LC: C.L } };

  // Spændingen som i beregnOpdrift: den avancerede beregning regner tør fyld over GVS og effektiv
  // rumvægt under; arket regner altid med γ′_d.
  const gvs = input.gvs;
  const avanceret = r.gvsZone !== null;
  const haeldning = (z: number) => (avanceret && z < gvs ? r.gammaTorD : r.gammaEffD);
  const sigma = (z: number) =>
    avanceret
      ? Math.min(gvs, z) * r.gammaTorD + Math.max(0, z - gvs) * r.gammaEffD
      : z * r.gammaEffD;
  const c = mu * Math.tan((r.phiD * Math.PI) / 180);
  const Feq = (z: number) => (sigma(z) + sigma(z - omslagAfstand) / 2) * c;
  const kravF = r.K / (2 * L - 2 * omslagAfstand);

  // F_bund + F_top/2 er stykvis lineær og voksende i dybden med knæk, hvor et af netlagene passerer
  // GVS. Løsningen findes eksakt i det interval, hvor kravet nås. L < L_C giver Feq(T₃) < kravet.
  const knaek = avanceret
    ? [gvs, gvs + omslagAfstand].filter((z) => z > r.T3).sort((a, b) => a - b)
    : [];
  let z0 = r.T3;
  let hBund = Infinity;
  for (const z1 of [...knaek, Infinity]) {
    const midt = Number.isFinite(z1) ? (z0 + z1) / 2 : z0 + 1;
    const stigning = (haeldning(midt) + haeldning(midt - omslagAfstand) / 2) * c;
    const z = z0 + (kravF - Feq(z0)) / stigning;
    if (z <= z1) {
      hBund = z;
      break;
    }
    z0 = z1;
  }

  const hTop = hBund - omslagAfstand;
  const spaending = { bund: sigma(hBund), top: sigma(hTop) };
  const Fbund = spaending.bund * c;
  const Ftop = spaending.top * c;
  const dh = hBund - r.T3;
  const kontrol = (r.B + ((Fbund + Ftop) / 2) * L * 4) / r.O;
  return {
    ok: true,
    resultat: {
      tilstand: 'dybere',
      L,
      LC: C.L,
      krav: kravF,
      hBund,
      hTop,
      dh,
      underRoerbund: hBund - (input.h1 + input.d),
      spaending,
      Fbund,
      Ftop,
      toL: r.K / (Fbund + Ftop / 2) + 2 * omslagAfstand,
      Ltot: 4 * (L + netTillaegOmslag) + (pi * input.d) / 2 + 2 * dh,
      kontrol,
      status: kontrol > krav.kontrol ? 'OK' : 'EJ OK',
    },
  };
}
