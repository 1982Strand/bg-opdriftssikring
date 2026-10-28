/** Tekster til de kontrolpunkter, motoren melder (docs/FUND.md). Sænket skrift skrives som
 * `P_{till}`. Kontrolpunkterne ændrer ikke beregningen og indgår ikke i rapporten. */
import type { Kontrolpunkt, OpdriftResultat } from '../engine/opdrift.ts';
import { tal } from '../engine/format.ts';

export function kontrolpunktTekst(k: Kontrolpunkt, r: OpdriftResultat): string {
  const g = r.geonet;
  switch (k) {
    case 'K-03':
      return `P_{till}/F_{opdrift} = ${tal(g.sikkerhed, 3)} er under kravet 1,01, selv om F_{opdrift} er mindre end P_{till}. Regnearket vælger nettet efter F_{opdrift} < P_{till} og eftervisningen efter kravet 1,01 (fund K-03).`;
    case 'K-05':
      return `GVS ligger under toppen af røret. Regnearket regner opdrift og ballast, som om røret står helt under vand (fund K-05).`;
    case 'K-12':
      return `S₁ = ${tal(r.S1)} ≥ 1,0, så opdriftssikring er ikke nødvendig. Regnearket regner alligevel videre med F_{opdrift} = ${tal(r.Fopdrift)} kN/m (fund K-12).`;
    case 'K-13':
      return `Uden omslag viser regnearket 2 · L_{geonet} = ${tal(r.losninger.A.toLVist)} m, men regner med mindst ${tal(r.losninger.A.L)} m pr. side, dvs. ${tal(2 * r.losninger.A.L)} m i alt (fund K-13).`;
  }
}

export const kontrolpunktTekster = (r: OpdriftResultat) =>
  r.kontrolpunkter.map((k) => ({ kode: k, tekst: kontrolpunktTekst(k, r) }));
