import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { beregnOpdrift, type OpdriftInput } from '../src/engine/opdrift.ts';
import { RF, geonetProdukter, vaelgGeonet } from '../src/engine/geonet.ts';

const excelCases = JSON.parse(
  readFileSync(new URL('./cases/excel-cases.json', import.meta.url), 'utf8'),
) as {
  cases: { navn: string; input: OpdriftInput }[];
  navneTabel: { RF: number; graenser: Record<string, number> };
};
const caseMed = (tekst: string) => excelCases.cases.find((sag) => sag.navn.includes(tekst))!;
const basis: OpdriftInput = {
  d: 2.5,
  h1: 1.5,
  gvs: 0,
  roervaegt: 340,
  gamma: 17,
  gammaTor: 16,
  phi: 35,
  konsekvensklasse: 'CC2',
  overstyring: null,
};
const fejlFelter = (input: OpdriftInput) => {
  const resultat = beregnOpdrift(input);
  assert.equal(resultat.ok, false);
  return resultat.ok ? [] : resultat.fejl.map((f) => f.felt);
};

test('afviser hvert felt uden fysisk mening og knytter fejlen til feltet', () => {
  assert.deepEqual(fejlFelter({ ...basis, d: 0 }), ['d']);
  assert.deepEqual(fejlFelter({ ...basis, h1: -0.1 }), ['h1']);
  assert.deepEqual(fejlFelter({ ...basis, gvs: -0.1 }), ['gvs']);
  assert.deepEqual(fejlFelter({ ...basis, roervaegt: -1 }), ['roervaegt']);
  assert.deepEqual(fejlFelter({ ...basis, gamma: 100 / 9 }), ['gamma']);
  assert.deepEqual(fejlFelter({ ...basis, gammaTor: 0 }), ['gammaTor']);
  assert.deepEqual(fejlFelter({ ...basis, phi: 0 }), ['phi']);
  assert.deepEqual(fejlFelter({ ...basis, phi: 90 }), ['phi']);
  assert.deepEqual(fejlFelter({ ...basis, d: Number.NaN }), ['d']);
  assert.deepEqual(fejlFelter({ ...basis, gamma: Number.POSITIVE_INFINITY }), ['gamma']);
});

test('tillader grænseværdierne h₁ = 0, GVS = 0 og rørvægt = 0', () => {
  assert.equal(beregnOpdrift({ ...basis, h1: 0, gvs: 0, roervaegt: 0 }).ok, true);
});

test('samler fejl fra flere felter og fra overstyringen', () => {
  assert.deepEqual(fejlFelter({ ...basis, d: -1, h1: -2, phi: 0 }), ['d', 'h1', 'phi']);
  assert.deepEqual(fejlFelter({ ...basis, overstyring: { uts: 42, lag: 1.5 } }), [
    'overstyring',
    'overstyring',
  ]);
});

test('manuelt valg tillader 1 eller 2 lag, aldrig flere', () => {
  assert.equal(beregnOpdrift({ ...basis, overstyring: { uts: 150, lag: 1 } }).ok, true);
  assert.equal(beregnOpdrift({ ...basis, overstyring: { uts: 150, lag: 2 } }).ok, true);
  const tre = beregnOpdrift({ ...basis, overstyring: { uts: 150, lag: 3 } });
  assert.equal(tre.ok, false);
  if (!tre.ok)
    assert.deepEqual(tre.fejl, [
      {
        felt: 'overstyring',
        tekst:
          'Antallet af lag skal være 1 eller 2. Et net i midten af flere lag kan ikke udnyttes.',
      },
    ]);
});

test('fejlteksterne er danske og nævner feltet', () => {
  const resultat = beregnOpdrift({ ...basis, d: Number.NaN, gamma: 10 });
  assert.equal(resultat.ok, false);
  if (!resultat.ok)
    assert.deepEqual(
      resultat.fejl.map((f) => f.tekst),
      [
        'Diameteren d skal være et tal.',
        'γ skal opfylde γ · 0,9 > γ_w = 10 kN/m³. Ellers er den effektive rumvægt under vand ikke positiv, og forankringen kan ikke beregnes.',
      ],
    );
});

test('produkterne følger databladet, og valggrænsen er UTS/RF (K-21)', () => {
  assert.equal(RF, excelCases.navneTabel.RF);
  assert.deepEqual(
    geonetProdukter.map((p) => p.uts),
    [35, 55, 80, 110, 130, 150, 200],
  );
  for (const p of geonetProdukter) assert.equal(p.graense, p.uts / RF);
  // De fire første grænser er som i Navne tabel; 78,9 for X-GRID 150 er udgået (K-02).
  const g = excelCases.navneTabel.graenser;
  assert.deepEqual(
    geonetProdukter.slice(0, 4).map((p) => p.graense),
    [g['35'], g['55'], g['80'], g['110']],
  );
  assert.notEqual(geonetProdukter[5].graense, g['200']);
});

test('geonettet vælges med streng ulighed lige under og over hver valggrænse', () => {
  for (const [i, produkt] of geonetProdukter.entries()) {
    const under = produkt.graense * (1 - 1e-12);
    const over = produkt.graense * (1 + 1e-12);
    assert.equal(vaelgGeonet(under, null).uts, produkt.uts, `under ${produkt.graense}`);
    assert.equal(vaelgGeonet(produkt.graense, null).uts, geonetProdukter[i + 1]?.uts ?? null);
    assert.equal(vaelgGeonet(over, null).uts, geonetProdukter[i + 1]?.uts ?? null);
  }
  // Uden afrunding af grænsen: 26,109 ligger over 55/RF = 26,1084 og giver 80 som i arket.
  assert.equal(vaelgGeonet(26.109, null).uts, 80);
});

test('kontrolpunkter følger udvalgte Excel-cases', () => {
  const forventninger: [string, string[]][] = [
    ['Case 1:', []],
    ['Case 2: Ø4000', []],
    ['K-02: grænsen 78,9', []],
    ['K-03: bånd for X-GRID 35', ['K-03']],
    ['K-03: bånd for X-GRID 80', ['K-03']],
    ['K-03: bånd for X-GRID 150', ['K-03']],
    ['Over grænsen: kontakt leverandør', []],
    ['GVS i 1,0 m', ['K-13']],
    ['GVS i 1,5 m', ['K-12', 'K-13']],
    ['GVS i 2,0 m', ['K-05', 'K-12', 'K-13']],
    ['GVS i 4,5 m', ['K-05', 'K-12', 'K-13']],
  ];
  for (const [delnavn, kontrolpunkter] of forventninger) {
    const sag = caseMed(delnavn);
    assert.ok(sag, `Mangler Excel-case med navn ${delnavn}`);
    const resultat = beregnOpdrift(sag.input);
    assert.equal(resultat.ok, true, sag.navn);
    if (resultat.ok) assert.deepEqual(resultat.resultat.kontrolpunkter, kontrolpunkter, sag.navn);
  }
});

test('overstyring giver ingen kontrolpunkter for netvalget', () => {
  const resultat = beregnOpdrift({
    ...caseMed('K-02: grænsen 78,9').input,
    overstyring: { uts: 150, lag: 1 },
  });
  assert.equal(resultat.ok, true);
  if (resultat.ok) assert.deepEqual(resultat.resultat.kontrolpunkter, []);
});

test('CC1 giver samme resultat som CC2, og CC3 giver γ_f = 1,1 · 1,1', () => {
  const cc1 = beregnOpdrift({ ...basis, konsekvensklasse: 'CC1' });
  const cc2 = beregnOpdrift({ ...basis, konsekvensklasse: 'CC2' });
  const cc3 = beregnOpdrift({ ...basis, konsekvensklasse: 'CC3' });
  assert.ok(cc1.ok && cc2.ok && cc3.ok);
  assert.deepEqual(cc1.resultat, cc2.resultat);
  assert.equal(cc2.resultat.partialkoefficienter.gammaF, 1.1);
  assert.equal(cc3.resultat.partialkoefficienter.gammaF, 1.1 * 1.1);
});

test('motoren ændrer ikke inputobjektet', () => {
  const input = { ...basis, overstyring: { uts: 150, lag: 2 } };
  const kopi = structuredClone(input);
  beregnOpdrift(input);
  assert.deepEqual(input, kopi);
});

test('motoren importerer ikke kontrolcases', () => {
  const motor = ['opdrift.ts', 'geonet.ts']
    .map((f) => readFileSync(new URL(`../src/engine/${f}`, import.meta.url), 'utf8'))
    .join('\n');
  assert.doesNotMatch(motor, /excel-cases|tests[\\/]cases/);
});
