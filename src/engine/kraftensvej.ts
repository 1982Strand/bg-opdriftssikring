/** Kraftens vej i geonettet: sammenhængene og det regnede eksempel på hjælpesiden. Modulet ændrer
 * ikke beregningen; eksemplets tal kommer fra beregnOpdrift, så tekst og beregning følges ad. */
import defaults from './defaults.json' with { type: 'json' };
import { beregnOpdrift, type OpdriftInput } from './opdrift.ts';

const rad = (grader: number) => (grader * Math.PI) / 180;
const grader = (radianer: number) => (radianer * 180) / Math.PI;

/** Træk pr. side, når nettet slipper røret med vinklen α fra lodret: T = F/(2 · cos α). */
export const traekPrSide = (F: number, alfa: number) => F / (2 * Math.cos(rad(alfa)));

/** Kraften, der skal holde nettet på plads ved et retningsskift θ: R = 2 · T · sin(θ/2). */
export const jordreaktion = (T: number, theta: number) => 2 * T * Math.sin(rad(theta / 2));

/** Den vinkel α, hvor trækket pr. side netop når værdien T. */
export const vinkelVedTraek = (F: number, T: number) => grader(Math.acos(F / (2 * T)));

/** Ø2500 med 1,5 m jorddække og GVS i terræn. */
const eksempelInput: OpdriftInput = {
  d: 2.5,
  h1: 1.5,
  gvs: 0,
  roervaegt: 340,
  gamma: 17,
  gammaTor: 16,
  phi: 35,
  konsekvensklasse: 'CC2',
  overstyring: null,
};

function beregnEksempel() {
  const beregning = beregnOpdrift(eksempelInput);
  if (!beregning.ok) throw new Error('Eksemplet kan ikke beregnes.');
  const { Fopdrift: F, S2, geonet } = beregning.resultat;
  const Pd = geonet.Ptill;
  if (Pd === null) throw new Error('Eksemplet kan ikke beregnes.');
  const T = traekPrSide(F, 0);
  const forankring = S2 * T;
  const T45 = traekPrSide(F, 45);
  return {
    F,
    S2,
    T,
    forankring,
    /** Jordreaktionen i knækket ved 90°. */
    R: jordreaktion(T, 90),
    T45,
    /** Jordreaktionen ved bøjningen fra 45° til vandret. */
    R45: jordreaktion(T45, 45),
    netNavn: `${defaults.geonet.navn} ${geonet.navn}`,
    Pd,
    /** Vinklen, hvor trækket når nettets styrke. */
    alfaNet: vinkelVedTraek(F, Pd),
    /** Vinklerne, hvor trækket når forankringens regneværdi ved mindste og største S₂. */
    alfaS2Min: vinkelVedTraek(F, defaults.S2Interval.min * T),
    alfaS2Max: vinkelVedTraek(F, defaults.S2Interval.max * T),
  };
}

export const eksempel = beregnEksempel();
export const s2Interval = defaults.S2Interval;

/** Aflæsningen ved figuren over rørets ligevægt for vinklen α. */
export function aflaesning(alfa: number) {
  const T = traekPrSide(eksempel.F, alfa);
  return {
    T,
    /** Trækket som andel af F_op,d. */
    andel: T / eksempel.F,
    /** Trækket i forhold til α = 0. */
    forhold: T / eksempel.T,
    lodret: T * Math.cos(rad(alfa)),
    vandret: T * Math.sin(rad(alfa)),
    netUdnyttelse: T / eksempel.Pd,
    forankringUdnyttelse: T / eksempel.forankring,
  };
}
