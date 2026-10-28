import test from 'node:test';
import assert from 'node:assert/strict';
import { betingelser, projekteringsansvar } from '../src/ui/forudsaetninger.ts';

test('betingelserne nævner den valgte konsekvensklasse', () => {
  assert.ok(
    betingelser('CC2').includes('Analysen sker i konsekvensklasse CC2 (middel konsekvensklasse).'),
  );
  assert.ok(
    betingelser('CC3').includes('Analysen sker i konsekvensklasse CC3 (høj konsekvensklasse).'),
  );
  assert.ok(
    betingelser('CC1').includes('Analysen sker i konsekvensklasse CC1 (lav konsekvensklasse).'),
  );
});

test('projekteringsansvaret har arkets begrænsning til 5 gange honoraret', () => {
  assert.equal(projekteringsansvar.length, 2);
  assert.match(projekteringsansvar[1], /begrænset til 5 gange honoraret\.$/);
});
