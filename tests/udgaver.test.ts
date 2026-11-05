import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { employeesForRoster } from '../src/report/company-profile.ts';
import { ACCESS, udgaveFraMiljoe } from '../src/ui/udgaver.ts';
import { buildEdition, readEmployeeList } from '../tools/build-udgave.ts';

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const person = { navn: 'Ada Eksempel', initialer: 'AE', mail: '', telefon: '' };

test('kun lokal og intern udgave har rapport, og kun den interne har indbygget kartotek', () => {
  assert.equal(udgaveFraMiljoe(undefined), 'lokal');
  assert.equal(ACCESS.lokal.rapport, true);
  assert.equal(ACCESS.intern.rapport, true);
  assert.equal(ACCESS.offentlig.rapport, false);
  assert.equal(ACCESS.intern.kartotek, 'indbygget');
  assert.equal(ACCESS.offentlig.kartotek, 'intet');
  const liste = JSON.stringify([person]);
  assert.deepEqual(employeesForRoster('intet', liste), []);
  assert.deepEqual(employeesForRoster('indbygget', liste), [person]);
  assert.deepEqual(employeesForRoster('indbygget', '{ugyldig'), []);
});

test('den offentlige udgave kan ikke bygges med et kartotek', async () => {
  await assert.rejects(
    buildEdition('offentlig', { file: 'tests/fixtures/medarbejdere-syntetisk.json' }),
    /offentlige udgave/,
  );
});

test('kartoteket læses som liste eller eksporteret profil og afvises, hvis det er ugyldigt', async () => {
  const liste = JSON.stringify([person]);
  assert.deepEqual(await readEmployeeList({ environment: liste }), [person]);
  assert.deepEqual(
    await readEmployeeList({
      environment: JSON.stringify({ profile: { medarbejdere: [person] } }),
    }),
    [person],
  );
  assert.equal(await readEmployeeList({ environment: '' }), undefined);
  await assert.rejects(readEmployeeList({ environment: '[{"navn":""}]' }), /ugyldigt/);
});

test('hemmeligheden med kartoteket bruges kun, når den interne udgave bygges', () => {
  const job = read('.github/workflows/cloudflare.yml');
  assert.equal((job.match(/secrets\.MEDARBEJDERE_JSON/g) ?? []).length, 1);
  const trin = job.slice(job.indexOf('Byg intern udgave'), job.indexOf('Kontrollér filstørrelser'));
  assert.match(trin, /secrets\.MEDARBEJDERE_JSON/);
  assert.match(read('vite.config.ts'), /VITE_UDGAVE === 'intern'/);
  assert.match(read('hosting/cloudflare/wrangler-offentlig.jsonc'), /dist-offentlig/);
});
