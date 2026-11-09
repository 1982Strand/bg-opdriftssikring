import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { beregnOpdrift, type OpdriftInput } from '../src/engine/opdrift.ts';
import { beregnReduktion, type ReduktionInput } from '../src/engine/reduktion.ts';

/** Godkendte kontroltal for reduktion for ender og gennemføringer (fund K-29), regnet uden motoren. */
interface Case {
  navn: string;
  input: {
    d: number;
    h1: number;
    gvs: number;
    metode: 'standard' | 'avanceret';
  } & ReduktionInput;
  forventet: Record<string, number>;
}
const { cases } = JSON.parse(
  readFileSync(new URL('./cases/reduktion.json', import.meta.url), 'utf8'),
) as { cases: Case[] };

const motorInput = (
  d: number,
  h1: number,
  gvs: number,
  metode: 'standard' | 'avanceret' = 'standard',
): OpdriftInput => ({
  d,
  h1,
  gvs,
  roervaegt: 340,
  gamma: 17,
  gammaTor: 16,
  phi: 35,
  konsekvensklasse: 'CC2',
  overstyring: null,
  metode,
  S2: 1.05,
  omslagAfstand: 0.2,
});
const reduktion = (input: OpdriftInput, red: ReduktionInput) => {
  const b = beregnOpdrift(input);
  assert.ok(b.ok);
  return beregnReduktion(b.resultat, input, red);
};
const naer = (faktisk: number, forventet: number, navn: string) =>
  assert.ok(
    Math.abs(faktisk - forventet) <= Math.max(1e-12, 1e-9 * Math.abs(forventet)),
    `${navn}: ${faktisk} ≠ ${forventet}`,
  );

for (const c of cases) {
  test(`kontrolcase: ${c.navn}`, () => {
    const { d, h1, gvs, metode, ...red } = c.input;
    const res = reduktion(motorInput(d, h1, gvs, metode), red);
    assert.ok(res.ok);
    const x = res.resultat;
    const { A, B, C } = x.r.losninger;
    const faktisk: Record<string, number | null | undefined> = {
      Lsikret: x.Lsikret,
      Otot: x.Otot,
      Btot: x.Btot,
      S1: x.S1,
      Fs: x.r.Fopdrift,
      uts: x.r.geonet.uts,
      sikkerhed: x.r.geonet.sikkerhed,
      K: x.r.K,
      LA: A.L,
      LtotA: A.Ltot,
      kontrolA: A.kontrol,
      LmellemB: B.toLMellem,
      LC: C?.L,
      LtotC: C?.Ltot,
      kontrolC: C?.kontrol,
    };
    for (const [navn, forventet] of Object.entries(c.forventet)) {
      const v = faktisk[navn];
      assert.equal(typeof v, 'number', navn);
      naer(v as number, forventet, navn);
    }
  });
}

test('den sikrede længde skal være større end 0 m, og hver ende og gennemføring større end 0 m', () => {
  const input = motorInput(2.5, 1.5, 0);
  const forKort = reduktion(input, { Lroer: 2, ender: [0.6, 0.6], gennemfoeringer: [0.8] });
  assert.ok(!forKort.ok);
  assert.deepEqual(
    forKort.fejl.map((f) => f.felt),
    ['Lroer'],
  );
  const nul = reduktion(input, { Lroer: 10, ender: [0.6, 0], gennemfoeringer: [-0.1] });
  assert.ok(!nul.ok);
  assert.deepEqual(
    nul.fejl.map((f) => f.felt),
    ['ende-1', 'gennemfoering-0'],
  );
});

test('en rektangulær gennemføring giver opdrift af d_g · b_g og fjerner ballast i bredden d_g', () => {
  // Kontrolcasen for tanken på 10 m med en rektangulær gennemføring på 0,80 m langs og 1,00 m på
  // tværs af røret: ΔO_g = 0,80 · 1,00 · 1,50 · 10 · 1,10 = 13,20 kN. Regnet uden motoren.
  const input = motorInput(2.5, 1.5, 0);
  const red = { Lroer: 10, ender: [0.6, 0.6], gennemfoeringer: [0.8] };
  const res = reduktion(input, { ...red, gennemfoeringTvaers: [1] });
  assert.ok(res.ok);
  const x = res.resultat;
  assert.equal(x.gennemfoeringer[0].form, 'rektangulaer');
  naer(x.gennemfoeringer[0].O, 13.2, 'ΔO_g');
  naer(x.Otot, 553.1612373357458, 'Otot');
  naer(x.Btot, 243.19521885231381, 'Btot');
  naer(x.r.Fopdrift, 38.745752310429, 'Fs');
  naer(x.r.K, 40.683039925950446, 'K');
  // null betyder cirkulær som uden formvalg.
  const cirkulaer = reduktion(input, { ...red, gennemfoeringTvaers: [null] });
  assert.ok(cirkulaer.ok);
  assert.equal(cirkulaer.resultat.gennemfoeringer[0].form, 'cirkulaer');
  naer(cirkulaer.resultat.Otot, 548.2550419412228, 'Otot cirkulær');
  const fejl = reduktion(input, { ...red, gennemfoeringTvaers: [0] });
  assert.ok(!fejl.ok);
  assert.deepEqual(
    fejl.fejl.map((f) => f.felt),
    ['gennemfoering-tvaers-0'],
  );
});

test('S₁ ≥ 1 pr. meter, men under 1 for hele røret, når gennemføringen fjerner ballast', () => {
  const input = motorInput(1, 1.5, 0);
  const b = beregnOpdrift(input);
  assert.ok(b.ok && b.resultat.S1 !== null && b.resultat.S1 > 1);
  const res = reduktion(input, { Lroer: 3, ender: [], gennemfoeringer: [1] });
  assert.ok(res.ok);
  assert.equal(res.resultat.S1Status, 'EJ OK');
  assert.ok(res.resultat.r.Fopdrift > 0);
});
