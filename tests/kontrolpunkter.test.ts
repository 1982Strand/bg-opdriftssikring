import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { arketsKonstanter, beregnOpdrift, type OpdriftInput } from '../src/engine/opdrift.ts';
import { kontrolpunktTekster } from '../src/ui/kontrolpunkter.ts';

const { cases } = JSON.parse(
  readFileSync(new URL('./cases/excel-cases.json', import.meta.url), 'utf8'),
) as { cases: { navn: string; input: OpdriftInput }[] };
// Teksterne kontrolleres med arkets tal, dvs. π = 3,14 (K-06).
const tekster = (delnavn: string) => {
  const sag = cases.find((c) => c.navn.includes(delnavn))!;
  const r = beregnOpdrift(sag.input, arketsKonstanter);
  assert.ok(r.ok, delnavn);
  return kontrolpunktTekster(r.resultat);
};

test('kontrollen ved omslag giver intet kontrolpunkt; forklaringen står i mellemregningerne', () => {
  assert.deepEqual(tekster('Case 1:'), []);
});

test('GVS under rørtoppen giver K-05 og K-12 i den rækkefølge', () => {
  assert.deepEqual(
    tekster('GVS i 2,0 m').map((k) => k.kode),
    ['K-05', 'K-12'],
  );
});

test('K-12 viser S₁ og den negative F_opdrift', () => {
  const k12 = tekster('GVS i 1,5 m').find((k) => k.kode === 'K-12')!;
  assert.equal(
    k12.tekst,
    'S₁ = 1,12 ≥ 1,0, så opdriftssikring er ikke nødvendig. Tallene for geonet og forankring er regnet videre med F_{op,d} = −6,60 kN/m og er kun til orientering.',
  );
});

test('når sikring ikke er nødvendig, vises kun K-12', () => {
  assert.deepEqual(
    tekster('GVS i 1,5 m').map((k) => k.kode),
    ['K-12'],
  );
});
