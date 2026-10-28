/** Opdriftssikring med geonet, regnet præcis som regnearket (docs/EXCEL_KORTLAEGNING.md).
 * Kommentarerne henviser til arkets celler i »Rapporten«. Afvigelser fra arket står i docs/FUND.md
 * og indføres kun efter beslutning. */
import standarder from './defaults.json' with { type: 'json' };
import { geonetProdukter, vaelgGeonet, type GeonetValg } from './geonet.ts';

export type Konsekvensklasse = 'CC1' | 'CC2' | 'CC3';
export interface GeonetOverstyring {
  uts: number; // UTS pr. lag, kN/m
  lag: number; // 1 eller 2; siden bruger altid 2 ved manuelt valg
}
export interface OpdriftInput {
  d: number; // F123, udvendig diameter, m
  h1: number; // F121, jorddækning over rørtop, m
  gvs: number; // F122, GVS under terræn, m (0 = i terræn)
  roervaegt: number; // D148, karakteristisk, kg/m
  gamma: number; // C157, kN/m³
  gammaTor: number; // C158, kN/m³
  phi: number; // C159, grader
  konsekvensklasse: Konsekvensklasse;
  overstyring: GeonetOverstyring | null;
}
export type Status = 'OK' | 'EJ OK';
export type Kontrolpunkt = 'K-02' | 'K-03' | 'K-05' | 'K-12' | 'K-13';
export interface Inputfejl {
  felt: keyof OpdriftInput;
  tekst: string;
}

export interface OpdriftResultat {
  T3: number;
  partialkoefficienter: { KFI: number; gammaF: number; gammaGstb: number; gammaPhi: number };
  gammaD: number;
  gammaTorD: number;
  phiD: number;
  gammaEffD: number;
  roervaegtD: number;
  projektbeskrivelse: { d: number; h1: number; gvs: number | 'i Terræn' };
  O: number;
  /** Ballastens led: fyld over GVS, fyld under GVS, rørets øverste halvdel (trækkes fra) og egenvægt. */
  ballastLed: { torFyld: number; vaadFyld: number; roerHalvdel: number; egenvaegt: number };
  B: number;
  S1: number;
  S1Status: Status;
  konklusion: [string, string];
  Fopdrift: number;
  geonet: GeonetValg;
  hBund: number;
  hTop: number;
  Fbund: number;
  Ftop: number;
  K: number;
  losninger: {
    /** Afsnit 9: ét rør uden omslag. */
    A: {
      toLVist: number;
      L: number;
      La: number;
      Ltot: number;
      ballastForankring: number;
      kontrol: number;
      status: Status;
    };
    /** Afsnit 10: to rør uden omslag. */
    B: {
      sigmaV: number;
      toLMellemBeregnet: number;
      toLMellem: number;
      L: number;
      La: number;
      Ltot: number;
    };
    /** Afsnit 11: ét rør med omslag. */
    C: {
      toL: number;
      L: number;
      La: number;
      Ltot: number;
      ballastForankring: number;
      kontrol: number;
      status: Status;
    };
    /** Afsnit 12: to rør med omslag. */
    D: { toLMellem: number; L: number; La: number; Ltot: number };
  };
  kontrolpunkter: Kontrolpunkt[];
}

// A169:A170, ordret som i arket.
const konklusionNoedvendig: [string, string] = [
  'Som det ses af ovennævnte beregninger er sikring mod opdrift nødvendig, idet der ønskes en',
  'totalsikkerhed mod opdrift på min. 1,0. Der bør derfor indbygges geonet som opdriftssikring.',
];
const konklusionIkkeNoedvendig: [string, string] = [
  'Som det ses af ovennævnte beregninger er sikring mod opdrift IKKE nødvendig',
  'totalsikkerhed mod opdrift på min. 1,0 er opnået',
];

const { pi, gammaW, mu, krav, mindstelaengder: min } = standarder;
const status = (vaerdi: number, graense: number): Status => (vaerdi > graense ? 'OK' : 'EJ OK');
/** Tal i fejltekster med dansk decimalkomma, fx 0,9. */
const dansk = (x: number) => String(x).replace('.', ',');

export function beregnOpdrift(
  input: OpdriftInput,
): { ok: true; resultat: OpdriftResultat } | { ok: false; fejl: Inputfejl[] } {
  const fejl = valider(input);
  if (fejl.length) return { ok: false, fejl };
  const { d, h1, gvs } = input;

  const KFI = standarder.KFI[input.konsekvensklasse];
  const gammaF = standarder.gammaGdst * KFI; // E92 = 1,1 · K_FI
  const gammaD = input.gamma * standarder.gammaGstb; // F157
  const gammaTorD = input.gammaTor * standarder.gammaGstb; // F158
  const phiD =
    (Math.atan(Math.tan((input.phi * Math.PI) / 180) / standarder.gammaPhi) * 180) / Math.PI; // F159
  const gammaEffD = gammaD - gammaW; // C286
  const roervaegtD = input.roervaegt * standarder.gammaGstb; // D149
  const T3 = h1 + d / 2; // B123

  const O = (pi / 4) * d ** 2 * gammaW * gammaF; // G133
  // G145 i fire led, lagt sammen i arkets rækkefølge.
  const ballastLed = {
    torFyld: gvs * d * gammaTorD,
    vaadFyld: (T3 - gvs) * d * gammaEffD,
    roerHalvdel: ((pi / 4) * d ** 2 * gammaEffD) / 2,
    egenvaegt: (roervaegtD * standarder.g) / 1000,
  };
  const B =
    ballastLed.torFyld + ballastLed.vaadFyld - ballastLed.roerHalvdel + ballastLed.egenvaegt;
  const S1 = B / O; // E167
  const Fopdrift = O - B; // G177
  const geonet = vaelgGeonet(Fopdrift, input.overstyring); // G199:H238

  const hBund = T3; // C285
  const hTop = hBund - standarder.omslagAfstand; // E285
  const tanPhiD = Math.tan((phiD * Math.PI) / 180);
  const Fbund = hBund * gammaEffD * mu * tanPhiD; // C289
  const Ftop = hTop * gammaEffD * mu * tanPhiD; // E289
  const K = Fopdrift * standarder.S2; // F299

  // Afsnit 9: G312, C315, B319, B320, A333, E333
  const toLVist = Math.max(min.udenOmslag.iAlt, K / Fbund);
  const LA = Math.max(min.udenOmslag.prSide, toLVist / 2);
  const ballastForankringA = B + Fbund * LA * 2;
  const kontrolA = ballastForankringA / O;

  // Afsnit 10: E363, G363, C366, C369, B384, B385
  const sigmaV = gvs * gammaTorD + (T3 - gvs) * gammaEffD;
  const toLMellemBeregnet = (0.5 * Fopdrift * 2 * standarder.faktorMellemRoer) / sigmaV;
  const toLMellem = Math.max(min.udenOmslag.mellemRoer, toLMellemBeregnet);

  // Afsnit 11: G404, C407, B411, B412, A427, E427
  const x = K / (Fbund + Ftop / 2) + standarder.omslagAfstand * 2;
  const toL = x < min.medOmslag.naarXUnder ? min.medOmslag.iAlt : x;
  const LC = Math.max(min.medOmslag.prSide, toL / 2);
  const ballastForankringC = B + ((Fbund + Ftop) / 2) * LC * 4;
  const kontrolC = ballastForankringC / O;
  const tillaeg = standarder.netTillaegOmslag; // 0,4 i B412 og B470 (K-09)

  return {
    ok: true,
    resultat: {
      T3,
      partialkoefficienter: {
        KFI,
        gammaF,
        gammaGstb: standarder.gammaGstb,
        gammaPhi: standarder.gammaPhi,
      },
      gammaD,
      gammaTorD,
      phiD,
      gammaEffD,
      roervaegtD,
      projektbeskrivelse: { d, h1, gvs: gvs === 0 ? 'i Terræn' : gvs }, // C8:C10
      O,
      ballastLed,
      B,
      S1,
      S1Status: status(S1, krav.S1), // H167
      konklusion: S1 < krav.S1 ? konklusionNoedvendig : konklusionIkkeNoedvendig,
      Fopdrift,
      geonet,
      hBund,
      hTop,
      Fbund,
      Ftop,
      K,
      losninger: {
        A: {
          toLVist,
          L: LA,
          La: LA * 2 + d,
          Ltot: LA * 2 + (pi * d) / 2,
          ballastForankring: ballastForankringA,
          kontrol: kontrolA,
          status: status(kontrolA, krav.kontrol), // H333
        },
        B: {
          sigmaV,
          toLMellemBeregnet,
          toLMellem,
          L: LA, // C369 = C315
          La: 2 * LA + toLMellem + 2 * d,
          Ltot: 2 * LA + toLMellem + pi * d,
        },
        C: {
          toL,
          L: LC,
          La: LC * 2 + d,
          Ltot: 4 * (LC + tillaeg) + (pi * d) / 2,
          ballastForankring: ballastForankringC,
          kontrol: kontrolC,
          status: status(kontrolC, krav.kontrol), // H427
        },
        D: {
          toLMellem: 2 * LC, // C452
          L: LC, // C455 = C407
          La: 2 * (LC * 2 + d),
          Ltot: 4 * (2 * LC + tillaeg) + pi * d,
        },
      },
      kontrolpunkter: kontrolpunkter(input, geonet, Fopdrift, S1, toLVist, LA),
    },
  };
}

/** Oplysninger om aktive fund (docs/FUND.md). De ændrer ikke beregningen. */
function kontrolpunkter(
  input: OpdriftInput,
  geonet: GeonetValg,
  Fopdrift: number,
  S1: number,
  toLVist: number,
  LA: number,
): Kontrolpunkt[] {
  const k: Kontrolpunkt[] = [];
  const valgt = geonet.automatisk && geonet.Ptill !== null ? geonet.Ptill : null;
  const indtastet = geonetProdukter.find((p) => p.uts === geonet.uts)?.indtastetGraense;
  if (valgt !== null && indtastet && Fopdrift >= valgt) k.push('K-02');
  if (valgt !== null && Fopdrift > 0 && Fopdrift < valgt && valgt / Fopdrift <= krav.udnyttelse)
    k.push('K-03');
  if (input.gvs > input.h1) k.push('K-05');
  if (S1 >= krav.S1) k.push('K-12');
  if (toLVist !== 2 * LA) k.push('K-13');
  return k;
}

/** Afviser kun værdier uden fysisk mening; ellers regnes som i arket. */
function valider(input: OpdriftInput): Inputfejl[] {
  const fejl: Inputfejl[] = [];
  const regler: [keyof OpdriftInput, string, (v: number) => boolean, string][] = [
    ['d', 'Diameteren d', (v) => v > 0, 'skal være større end 0 m.'],
    ['h1', 'Jorddækningen h₁', (v) => v >= 0, 'kan ikke være negativ.'],
    ['gvs', 'GVS-dybden', (v) => v >= 0, 'kan ikke være negativ.'],
    ['roervaegt', 'Egenvægten', (v) => v >= 0, 'kan ikke være negativ.'],
    [
      'gamma',
      'γ',
      (v) => v * standarder.gammaGstb > gammaW,
      `skal opfylde γ · ${dansk(standarder.gammaGstb)} > γ_w = ${dansk(gammaW)} kN/m³. Ellers er den effektive rumvægt under vand ikke positiv, og forankringen kan ikke beregnes.`,
    ],
    ['gammaTor', 'γ_tør', (v) => v > 0, 'skal være større end 0 kN/m³.'],
    ['phi', 'φ_k', (v) => v > 0 && v < 90, 'skal være større end 0° og mindre end 90°.'],
  ];
  for (const [felt, navn, gyldig, tekst] of regler) {
    const v = input[felt] as number;
    if (!Number.isFinite(v)) fejl.push({ felt, tekst: `${navn} skal være et tal.` });
    else if (!gyldig(v)) fejl.push({ felt, tekst: `${navn} ${tekst}` });
  }
  const o = input.overstyring;
  if (o) {
    if (!geonetProdukter.some((p) => p.uts === o.uts))
      fejl.push({
        felt: 'overstyring',
        tekst: 'Geonettet skal være et produkt fra produktlisten.',
      });
    // Højst 2 lag: et net i midten af tre eller flere lag kan ikke udnyttes.
    if (!Number.isInteger(o.lag) || o.lag < 1 || o.lag > standarder.geonet.lagVedManueltValg)
      fejl.push({
        felt: 'overstyring',
        tekst: `Antallet af lag skal være 1 eller ${standarder.geonet.lagVedManueltValg}. Et net i midten af flere lag kan ikke udnyttes.`,
      });
  }
  return fejl;
}
