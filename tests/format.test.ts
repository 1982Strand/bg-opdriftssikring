import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tal } from '../src/engine/format.ts';

test('dansk komma, tusindtalspunktum, decimaler og manglende værdier', () => {
  assert.equal(tal(53.96875), '53,97');
  assert.equal(tal(12345.6), '12.345,60');
  assert.equal(tal(2.1066045, 4), '2,1066');
  assert.equal(tal(340, 0), '340');
  assert.equal(tal(null), '–');
  assert.equal(tal(undefined), '–');
  assert.equal(tal(Number.NaN), '–');
});

test('negative tal har rigtigt minustegn, og afrundet nul har intet fortegn', () => {
  assert.equal(tal(-6.597), '−6,60');
  assert.equal(tal(-0.001), '0,00');
  assert.equal(tal(-0), '0,00');
});
