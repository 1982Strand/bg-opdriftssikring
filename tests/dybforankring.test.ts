import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { beregnDybForankring, dybFejl } from '../src/engine/dybforankring.ts';
import {
  arketsKonstanter,
  beregnOpdrift,
  konstanter,
  type OpdriftInput,
} from '../src/engine/opdrift.ts';

/** Godkendte kontroltal for dybere forankring (fund K-25), regnet uden motoren. */
interface Case {
  navn: string;
  input: { d: number; h1: number; gvs: number; L: number };
  arketsPi: boolean;
  forventet: Record<string, number | string>;
}
const { cases } = JSON.parse(
  readFileSync(new URL('./cases/dyb-forankring.json', import.meta.url), 'utf8'),
) as { cases: Case[] };

const motorInput = (d: number, h1: number, gvs: number): OpdriftInput => ({
  d,
  h1,
  gvs,
  roervaegt: 340,
  gamma: 17,
  gammaTor: 16,
  phi: 35,
  konsekvensklasse: 'CC2',
  overstyring: null,
  metode: 'avanceret',
});
const naer = (faktisk: number, forventet: number, navn: string) =>
  assert.ok(
    Math.abs(faktisk - forventet) <= Math.max(1e-12, 1e-9 * Math.abs(forventet)),
    `${navn}: ${faktisk} ≠ ${forventet}`,
  );

for (const c of cases)
  test(`dybere forankring: ${c.navn}`, () => {
    const k = c.arketsPi ? arketsKonstanter : konstanter;
    const input = motorInput(c.input.d, c.input.h1, c.input.gvs);
    const b = beregnOpdrift(input, k);
    assert.ok(b.ok);
    naer(b.resultat.losninger.C!.L, c.forventet.LC as number, 'LC');
    const dyb = beregnDybForankring(b.resultat, input, c.input.L, k);
    if (c.forventet.tilstand === 'fejl') {
      assert.deepEqual(dyb, { ok: false, fejl: dybFejl });
      return;
    }
    assert.ok(dyb.ok);
    const res = dyb.resultat;
    assert.equal(res.tilstand, c.forventet.tilstand);
    if (res.tilstand !== 'dybere') return;
    for (const navn of [
      'hBund',
      'hTop',
      'underRoerbund',
      'Fbund',
      'Ftop',
      'Ltot',
      'kontrol',
    ] as const)
      naer(res[navn], c.forventet[navn] as number, navn);
    // Indsat igen i formlen for løsning C giver dybden præcis den angivne længde.
    naer(res.toL / 2, c.input.L, 'L igen');
    naer(res.dh, res.hBund - b.resultat.T3, 'Δh');
  });

test('dybere forankring er ikke relevant uden sikringsbehov og kræver omslag', () => {
  const ingen = motorInput(2.5, 1.5, 2);
  const b = beregnOpdrift(ingen);
  assert.ok(b.ok && b.resultat.Fopdrift <= 0);
  assert.deepEqual(beregnDybForankring(b.resultat, ingen, 0.1), {
    ok: true,
    resultat: { tilstand: 'ikke relevant' },
  });
  // Et let rør med rørmidten 0,2 m under terræn: omslag er ikke muligt (K-23).
  const lav = { ...motorInput(0.4, 0, 0), roervaegt: 0 };
  const l = beregnOpdrift(lav);
  assert.ok(l.ok && l.resultat.losninger.C === null && l.resultat.Fopdrift > 0);
  assert.deepEqual(beregnDybForankring(l.resultat, lav, 1), {
    ok: true,
    resultat: { tilstand: 'omslag ikke muligt' },
  });
});

test('dybere forankring ændrer ikke opdrift, ballast eller løsningerne i kort 7', () => {
  const input = motorInput(4, 0.6, 0.8);
  const b = beregnOpdrift(input);
  assert.ok(b.ok);
  const foer = JSON.stringify(b.resultat);
  beregnDybForankring(b.resultat, input, 2.5);
  assert.equal(JSON.stringify(b.resultat), foer);
});

test('dybden vokser, når den angivne længde bliver kortere', () => {
  const input = motorInput(4, 0.6, 0.8);
  const b = beregnOpdrift(input);
  assert.ok(b.ok);
  let forrige = b.resultat.T3;
  for (const L of [2.6, 2.2, 1.8, 1.4, 1.0, 0.6]) {
    const d = beregnDybForankring(b.resultat, input, L);
    assert.ok(d.ok && d.resultat.tilstand === 'dybere');
    assert.ok(d.resultat.hBund > forrige);
    naer(d.resultat.toL / 2, L, `L igen ved ${L}`);
    forrige = d.resultat.hBund;
  }
});
