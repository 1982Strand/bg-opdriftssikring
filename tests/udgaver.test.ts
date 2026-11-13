import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { standardSession, tilMotorInput, udenAvanceret } from '../src/ui/state.ts';
import { ACCESS, udgaveFraMiljoe } from '../src/ui/udgaver.ts';

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('kun lokal og intern udgave har rapport', () => {
  assert.equal(udgaveFraMiljoe(undefined), 'lokal');
  assert.equal(ACCESS.lokal.rapport, true);
  assert.equal(ACCESS.intern.rapport, true);
  assert.equal(ACCESS.offentlig.rapport, false);
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

test('Cloudflare bygger og udruller fortsat den interne udgave', () => {
  const workflow = read('.github/workflows/cloudflare.yml');
  assert.match(workflow, /node tools\/build-udgave\.ts intern/);
  assert.match(workflow, /Udrul intern udgave/);
  assert.match(read('hosting/cloudflare/wrangler.jsonc'), /dist-intern/);
  assert.match(read('hosting/cloudflare/wrangler-offentlig.jsonc'), /dist-offentlig/);
  assert.match(read('vite.config.ts'), /envPrefix: \['VITE_UDGAVE'\]/);
});
