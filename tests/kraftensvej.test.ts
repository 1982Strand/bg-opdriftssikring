import assert from 'node:assert/strict';
import { test } from 'node:test';
import { tal } from '../src/engine/format.ts';
import {
  aflaesning,
  eksempel,
  jordreaktion,
  traekPrSide,
  vinkelVedTraek,
} from '../src/engine/kraftensvej.ts';

test('kraftens vej: sammenhængene giver de kendte facit', () => {
  assert.equal(tal(traekPrSide(2, 0)), '1,00');
  assert.equal(tal(traekPrSide(2, 45)), '1,41');
  assert.equal(tal(traekPrSide(2, 60)), '2,00'); // grænsen for faktor 2
  assert.equal(tal(jordreaktion(1, 0)), '0,00');
  assert.equal(tal(jordreaktion(1, 45)), '0,77');
  assert.equal(tal(jordreaktion(1, 90)), '1,41');
  assert.equal(tal(jordreaktion(1, 180)), '2,00');
  assert.equal(tal(vinkelVedTraek(2, 2), 1), '60,0');
});

test('kraftens vej: eksemplet er Ø2500 med 1,5 m jorddække og GVS i terræn', () => {
  assert.equal(eksempel.netNavn, 'X-GRID 80');
  const kN = {
    F: '27,56',
    T: '13,78',
    forankring: '14,47',
    R: '19,49',
    T45: '19,49',
    R45: '14,92',
    Pd: '37,98',
  } as const;
  for (const [navn, vaerdi] of Object.entries(kN))
    assert.equal(tal(eksempel[navn as keyof typeof kN]), vaerdi, navn);
  assert.equal(tal(eksempel.alfaNet, 1), '68,7');
  assert.equal(tal(eksempel.alfaS2Min, 1), '17,8');
  assert.equal(tal(eksempel.alfaS2Max, 1), '33,6');
});

test('kraftens vej: aflæsningen ved 30° og ved 0°', () => {
  const a = aflaesning(30);
  assert.equal(tal(a.andel), '0,58');
  assert.equal(tal(a.forhold), '1,15');
  assert.equal(tal(a.T), '15,91');
  assert.equal(tal(a.lodret), '13,78');
  assert.equal(tal(a.vandret), '7,96');
  assert.equal(tal(a.netUdnyttelse), '0,42');
  assert.equal(tal(a.forankringUdnyttelse), '1,10');
  // Ved 0° er trækket F_op,d/2, og forankringen har tillægget fra S₂.
  assert.equal(tal(aflaesning(0).forankringUdnyttelse), tal(1 / eksempel.S2));
});
