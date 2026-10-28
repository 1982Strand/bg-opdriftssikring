import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { beregnOpdrift, type OpdriftInput } from '../src/engine/opdrift.ts';
import { losningSvg, tvaersnitSvg } from '../src/engine/figurer.ts';
import { tal } from '../src/engine/format.ts';

const { cases } = JSON.parse(
  readFileSync(new URL('./cases/excel-cases.json', import.meta.url), 'utf8'),
) as { cases: { navn: string; input: OpdriftInput }[] };
const beregn = (input: OpdriftInput) => {
  const r = beregnOpdrift(input);
  assert.ok(r.ok);
  return r.resultat;
};
/** Teksten i figuren uden tspan-markering, fx »Lgeonet = 1,70 m«. */
const tekst = (svg: string) =>
  [...svg.matchAll(/<text[^>]*>(.*?)<\/text>/g)].map((m) => m[1].replace(/<[^>]+>/g, ''));
const gyldig = (svg: string) => {
  assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 640 [\d.]+"/);
  assert.match(svg, /<\/svg>$/);
  assert.doesNotMatch(svg, /NaN|Infinity|undefined|null/);
};

test('alle 42 cases giver gyldige figurer for tværsnit og de fire løsninger', () => {
  for (const sag of cases) {
    const r = beregn(sag.input);
    gyldig(tvaersnitSvg(r, sag.input));
    for (const l of ['A', 'B', 'C', 'D'] as const) gyldig(losningSvg(r, sag.input, l));
  }
});

test('tværsnittet for case 1 viser koter, mål og GVS', () => {
  const i = cases[0].input;
  const t = tekst(tvaersnitSvg(beregn(i), i));
  for (const forventet of [
    'T₁ terræn: 0,00 m',
    'T₂ GVS: 0,00 m',
    'T₃ rørmidte: 2,75 m',
    'h₁ = 1,50 m',
    'd/2 = 1,25 m',
    'd = 2,50 m',
    'GVS',
    'B',
  ])
    assert.ok(t.includes(forventet), forventet);
});

test('løsningerne viser de beregnede længder med dansk komma og sænket skrift', () => {
  const i = cases[0].input;
  const r = beregn(i);
  const a = losningSvg(r, i, 'A');
  assert.match(a, /L<tspan baseline-shift="sub" font-size="9">geonet<\/tspan> = 1,70 m/);
  assert.deepEqual(
    tekst(a).filter((t) => /^[Lh]/.test(t)),
    ['La = 5,90 m', 'Lgeonet = 1,70 m', 'Lgeonet = 1,70 m', 'hbund = 2,75 m'],
  );
  const c = tekst(losningSvg(r, i, 'C'));
  assert.ok(c.includes('htop = 2,55 m') && c.includes('hbund = 2,75 m'));
  const b = tekst(losningSvg(r, i, 'B'));
  assert.ok(b.includes(`2·Lgeonet = ${tal(r.losninger.B.toLMellem)} m`));
  assert.ok(tekst(losningSvg(r, i, 'D')).includes(`La = ${tal(r.losninger.D.La)} m`));
});

test('GVS under figuren angives med tekst, og figurerne er ens for samme input', () => {
  const i = { ...cases[0].input, gvs: 30 };
  const r = beregn(i);
  assert.ok(tekst(tvaersnitSvg(r, i)).includes('GVS i 30,00 m (under figuren)'));
  assert.equal(losningSvg(r, i, 'C'), losningSvg(r, i, 'C'));
});

test('teksten escapes', () => {
  const i = cases[0].input;
  assert.match(tvaersnitSvg(beregn(i), i, '<tank>'), /&lt;tank&gt;/);
});

test('omslaget tegnes som en vending ved hver ende og et kortere toplag', () => {
  const i = cases[0].input;
  const r = beregn(i);
  const buer = (l: 'A' | 'B' | 'C' | 'D') => {
    const d = losningSvg(r, i, l).match(/<path d="([^"]+)"/)![1];
    return d.match(/ A /g)!.length;
  };
  // Én bue pr. rør, plus to vendinger pr. net med omslag.
  assert.deepEqual([buer('A'), buer('B'), buer('C'), buer('D')], [1, 2, 3, 6]);
  // Toplaget starter inde mod røret, går ud til vendingen og bukker ned til bundlaget.
  const c = losningSvg(r, i, 'C').match(
    /<path d="M ([\d.]+) ([\d.]+) H ([\d.]+) A [\d.]+ [\d.]+ 0 0 0 [\d.]+ ([\d.]+)/,
  )!;
  const [, xStart, yStart, xEnde, yBund] = c.map(Number);
  assert.ok(yBund - yStart >= 16, 'toplaget ligger mindst 16 px over bundlaget');
  assert.ok(xStart > xEnde, 'toplaget starter inde mod røret og går ud til vendingen');
});
