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

test('K-08 forklarer, at kontrollen ved omslag viser en større margin end dimensioneringen', () => {
  assert.deepEqual(tekster('Case 1:'), [
    {
      kode: 'K-08',
      tekst:
        'Kontrollen ved omslag regner det øverste lag med fuld F_{top} over hele L_{geonet}, mens længden dimensioneres med F_{top}/2 og uden 0,2 m pr. side. Kontrollen viser derfor en større margin end dimensioneringen (fund K-08).',
    },
  ]);
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
    'S₁ = 1,12 ≥ 1,0, så opdriftssikring er ikke nødvendig. Regnearket regner alligevel videre med F_{op,d} = −6,60 kN/m (fund K-12).',
  );
});

test('K-08 vises ikke, når sikring ikke er nødvendig', () => {
  assert.deepEqual(
    tekster('GVS i 1,5 m').map((k) => k.kode),
    ['K-12'],
  );
});
