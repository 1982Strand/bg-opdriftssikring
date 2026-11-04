/** Tekster til de kontrolpunkter, motoren melder (docs/FUND.md). Sænket skrift skrives som
 * `F_{top}`. Kontrolpunkterne ændrer ikke beregningen og indgår ikke i rapporten. */
import type { Kontrolpunkt, OpdriftResultat } from '../engine/opdrift.ts';
import { tal, talKort } from '../engine/format.ts';

export function kontrolpunktTekst(k: Kontrolpunkt, r: OpdriftResultat): string {
  switch (k) {
    case 'K-05':
      return `GVS ligger under toppen af røret. Standardberegningen regner opdrift og ballast, som om røret står helt under vand.`;
    case 'K-08':
      return `Kontrollen ved omslag regner det øverste lag med fuld F_{top} over hele L_{geonet}, mens længden dimensioneres med F_{top}/2 og uden ${talKort(r.omslagAfstand)} m pr. side. Kontrollen viser derfor en større margin end dimensioneringen.`;
    case 'K-12':
      return `S₁ = ${tal(r.S1)} ≥ 1,0, så opdriftssikring er ikke nødvendig. Tallene for geonet og forankring er regnet videre med F_{op,d} = ${tal(r.Fopdrift)} kN/m og er kun til orientering.`;
  }
}

export const kontrolpunktTekster = (r: OpdriftResultat) =>
  r.kontrolpunkter.map((k) => ({ kode: k, tekst: kontrolpunktTekst(k, r) }));
