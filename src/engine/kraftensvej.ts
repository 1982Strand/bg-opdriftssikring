/** Kraftens vej i geonettet: sammenhængene og det regnede eksempel på hjælpesiden. Modulet ændrer
 * ikke beregningen; eksemplets tal kommer fra beregnOpdrift som standardberegning med GVS i terræn. */
import defaults from './defaults.json' with { type: 'json' };
import { beregnOpdrift } from './opdrift.ts';

const rad = (grader: number) => (grader * Math.PI) / 180;
const grader = (radianer: number) => (radianer * 180) / Math.PI;

/** Træk pr. side, når nettet slipper røret med vinklen α fra lodret: T = F/(2 · cos α). */
export const traekPrSide = (F: number, alfa: number) => F / (2 * Math.cos(rad(alfa)));

/** Kraften, der skal holde nettet på plads ved et retningsskift θ: R = 2 · T · sin(θ/2). */
export const jordreaktion = (T: number, theta: number) => 2 * T * Math.sin(rad(theta / 2));

/** Den vinkel α, hvor trækket pr. side netop når værdien T. */
export const vinkelVedTraek = (F: number, T: number) => grader(Math.acos(F / (2 * T)));

/** Den vinkel α, hvor et skråt træk netop når tillægget fra S₂: cos α = 1/S₂. */
export const vinkelVedS2 = (S2: number) => grader(Math.acos(1 / S2));

export const s2Interval = defaults.S2Interval;
export const eksempelS2 = defaults.S2;

/** Det, der kan indtastes i eksemplet. */
export interface EksempelInput {
  d: number;
  h1: number;
  roervaegt: number;
}

export const standardEksempel: EksempelInput = { d: 2.5, h1: 1.5, roervaegt: 340 };

/** De faste værdier i eksemplet, som i standardberegningen. */
export const fasteVaerdier = {
  gamma: 17,
  gammaTor: 16,
  phi: 35,
  konsekvensklasse: 'CC2',
} as const;

export interface EksempelBeregnet {
  tilstand: 'beregnet';
  S1: number | null;
  F: number;
  S2: number;
  T: number;
  forankring: number;
  /** Jordreaktionen i knækket ved 90°. */
  R: number;
  T45: number;
  /** Jordreaktionen ved bøjningen fra 45° til vandret. */
  R45: number;
  /** Mangler, når der ikke produceres geonet med den nødvendige styrke. */
  net: {
    navn: string;
    Pd: number;
    /** Vinklen, hvor trækket når nettets styrke. */
    alfa: number;
  } | null;
}

export type Eksempel =
  EksempelBeregnet | { tilstand: 'ikkeNoedvendig'; S1: number | null } | { tilstand: 'ugyldig' };

export function beregnEksempel(input: EksempelInput): Eksempel {
  const beregning = beregnOpdrift({ ...input, ...fasteVaerdier, gvs: 0, overstyring: null });
  if (!beregning.ok) return { tilstand: 'ugyldig' };
  const { S1, S1Status, Fopdrift: F, S2, geonet } = beregning.resultat;
  if (S1Status === 'OK') return { tilstand: 'ikkeNoedvendig', S1 };
  const T = traekPrSide(F, 0);
  const T45 = traekPrSide(F, 45);
  const Pd = geonet.Ptill;
  return {
    tilstand: 'beregnet',
    S1,
    F,
    S2,
    T,
    forankring: S2 * T,
    R: jordreaktion(T, 90),
    T45,
    R45: jordreaktion(T45, 45),
    net:
      Pd === null
        ? null
        : { navn: `${defaults.geonet.navn} ${geonet.navn}`, Pd, alfa: vinkelVedTraek(F, Pd) },
  };
}

/** Aflæsningen ved figuren over rørets ligevægt for vinklen α. */
export function aflaesning(alfa: number, e: EksempelBeregnet) {
  const T = traekPrSide(e.F, alfa);
  return {
    T,
    lodret: T * Math.cos(rad(alfa)),
    vandret: T * Math.sin(rad(alfa)),
    netUdnyttelse: e.net && T / e.net.Pd,
    forankringUdnyttelse: T / e.forankring,
  };
}
