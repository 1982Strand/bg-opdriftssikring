import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { beregnOpdrift, type OpdriftInput } from '../src/engine/opdrift.ts';
import { kontrolpunktTekster } from '../src/ui/kontrolpunkter.ts';

const { cases } = JSON.parse(
  readFileSync(new URL('./cases/excel-cases.json', import.meta.url), 'utf8'),
) as { cases: { navn: string; input: OpdriftInput }[] };
const tekster = (delnavn: string) => {
  const sag = cases.find((c) => c.navn.includes(delnavn))!;
  const r = beregnOpdrift(sag.input);
  assert.ok(r.ok, delnavn);
  return kontrolpunktTekster(r.resultat);
};

test('K-03 viser udnyttelsen med tre decimaler', () => {
  const [k] = tekster('K-03: bånd for X-GRID 80');
  assert.equal(k.kode, 'K-03');
  assert.match(k.tekst, /^P_\{till\}\/F_\{opdrift\} = 1,005 er under kravet 1,01/);
});

test('GVS under rørtoppen giver K-05, K-12 og K-13 i den rækkefølge', () => {
  assert.deepEqual(
    tekster('GVS i 2,0 m').map((k) => k.kode),
    ['K-05', 'K-12', 'K-13'],
  );
  const k13 = tekster('GVS i 1,0 m')[0];
  assert.equal(
    k13.tekst,
    'Uden omslag viser regnearket 2 · L_{geonet} = 1,00 m, men regner med mindst 1,00 m pr. side, dvs. 2,00 m i alt (fund K-13).',
  );
});

test('K-12 viser S₁ og den negative F_opdrift', () => {
  const k12 = tekster('GVS i 1,5 m').find((k) => k.kode === 'K-12')!;
  assert.equal(
    k12.tekst,
    'S₁ = 1,12 ≥ 1,0, så opdriftssikring er ikke nødvendig. Regnearket regner alligevel videre med F_{opdrift} = −6,60 kN/m (fund K-12).',
  );
});

test('ingen kontrolpunkter for case 1', () => {
  assert.deepEqual(tekster('Case 1:'), []);
});
