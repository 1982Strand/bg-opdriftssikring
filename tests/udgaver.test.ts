import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  defaultProfileState,
  employeesForRoster,
  exportCompanyProfile,
  importCompanyProfile,
  keepEmployees,
  parseEmployeeFile,
} from '../src/report/company-profile.ts';
import { standardSession, tilMotorInput, udenAvanceret } from '../src/ui/state.ts';
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

test('den offentlige udgave har kun standardberegningen, også for en gemt avanceret beregning', () => {
  assert.equal(ACCESS.lokal.avanceretBeregning, true);
  assert.equal(ACCESS.intern.avanceretBeregning, true);
  assert.equal(ACCESS.offentlig.avanceretBeregning, false);
  const gemt = standardSession();
  gemt.avanceret = true;
  gemt.konsekvensklasse = 'CC3';
  gemt.inddata.gvsITerraen = false;
  gemt.inddata.gvs = 2;
  gemt.inddata.overstyringAktiv = true;
  gemt.inddata.gammaTor = 18;
  assert.deepEqual(tilMotorInput(udenAvanceret(gemt)), tilMotorInput(standardSession()));
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

test('kartoteket indlæses fra en ren liste eller en profil fra en af de to apps', () => {
  const ada = { navn: 'Ada Eksempel', initialer: 'AE', mail: '', telefon: '' };
  assert.deepEqual(parseEmployeeFile(JSON.stringify([ada])), [ada]);
  // En profil fra den anden app har andre felter; kun medarbejderne bruges.
  const profil = { version: 1, profile: { sv: {}, afsluttende_afsnit: [], medarbejdere: [ada] } };
  assert.deepEqual(parseEmployeeFile(JSON.stringify(profil)), [ada]);
  assert.throws(() => parseEmployeeFile('{'), /JSON/);
  assert.throws(() => parseEmployeeFile('[{"navn":""}]'), /ugyldigt/);
});

test('firmaprofilen eksporteres uden kartotek, og import og nulstilling bevarer kartoteket', () => {
  const logo = {
    mime: 'image/jpeg' as const,
    bytes: new Uint8Array(
      readFileSync(new URL('../public/report/logo/byggros_logo.jpeg', import.meta.url)),
    ),
  };
  const standard = defaultProfileState();
  const med = { ...standard, profile: { ...standard.profile, medarbejdere: [person] } };
  const json = exportCompanyProfile(med, logo);
  assert.ok(!('medarbejdere' in JSON.parse(json).profile));
  const importeret = importCompanyProfile(json, logo);
  assert.deepEqual(importeret.profile.medarbejdere, []);
  assert.deepEqual(keepEmployees(importeret, med).profile.medarbejdere, [person]);
});
