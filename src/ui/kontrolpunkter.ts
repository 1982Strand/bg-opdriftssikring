/** Tekster til de kontrolpunkter, motoren melder (docs/FUND.md). Sænket skrift skrives som
 * `F_{top}`. Kontrolpunkterne ændrer ikke beregningen og indgår ikke i rapporten. */
import type { DybForankring } from '../engine/dybforankring.ts';
import type { Kontrolpunkt, OpdriftResultat } from '../engine/opdrift.ts';
import { tal, talKort } from '../engine/format.ts';

export function kontrolpunktTekst(k: Kontrolpunkt, r: OpdriftResultat): string {
  switch (k) {
    case 'K-05':
      return `GVS ligger under toppen af røret. Regnearket regner opdrift og ballast, som om røret står helt under vand (fund K-05).`;
    case 'K-08':
      return `Kontrollen ved omslag regner det øverste lag med fuld F_{top} over hele L_{geonet}, mens længden dimensioneres med F_{top}/2 og uden ${talKort(r.omslagAfstand)} m pr. side. Kontrollen viser derfor en større margin end dimensioneringen (fund K-08).`;
    case 'K-12':
      return `S₁ = ${tal(r.S1)} ≥ 1,0, så opdriftssikring er ikke nødvendig. Regnearket regner alligevel videre med F_{op,d} = ${tal(r.Fopdrift)} kN/m (fund K-12).`;
  }
}

export const kontrolpunktTekster = (r: OpdriftResultat) =>
  r.kontrolpunkter.map((k) => ({ kode: k, tekst: kontrolpunktTekst(k, r) }));

/** Kontrolpunktet for dybere forankring ved begrænset plads (fund K-25). */
export const dybKontrolpunktTekst = (dyb: Extract<DybForankring, { tilstand: 'dybere' }>) =>
  `Dybere forankring ved begrænset plads giver h_{bund} = ${tal(dyb.hBund)} m for L_{geonet} = ${tal(dyb.L)} m pr. side. Metoden er ikke i regnearket og kræver særskilt statisk og geoteknisk eftervisning (fund K-25).`;
