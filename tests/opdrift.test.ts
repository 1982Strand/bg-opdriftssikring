import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { arketsKonstanter, beregnOpdrift, type OpdriftInput } from '../src/engine/opdrift.ts';
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
        'γ_{våd} skal opfylde γ_{våd} · 0,9 > γ_{w} = 10 kN/m³. Ellers er den effektive rumvægt under vand ikke positiv, og forankringen kan ikke beregnes.',
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

test('geonettet vælges, så P_till/F_opdrift > 1,01, lige under og over hver grænse (K-03)', () => {
  for (const [i, produkt] of geonetProdukter.entries()) {
    const graense = produkt.graense / 1.01;
    assert.equal(vaelgGeonet(graense * (1 - 1e-12), null).uts, produkt.uts, `under ${graense}`);
    assert.equal(vaelgGeonet(graense * (1 + 1e-12), null).uts, geonetProdukter[i + 1]?.uts ?? null);
  }
  // Arkets bånd: F_opdrift lige under P_till for X-GRID 80 giver nu X-GRID 110.
  assert.equal(vaelgGeonet(37.77, null).uts, 110);
});

test('det automatiske valg opfylder altid kravet 1,01', () => {
  for (let F = 0.5; F < 96; F += 0.137) {
    const g = vaelgGeonet(F, null);
    if (g.uts !== null) {
      assert.ok(g.sikkerhed! > 1.01, `F = ${F}`);
      assert.equal(g.status, 'OK');
    }
  }
});

test('kontrolpunkter følger udvalgte Excel-cases', () => {
  const forventninger: [string, string[]][] = [
    ['Case 1:', ['K-08']],
    ['Case 2: Ø4000', ['K-08']],
    ['K-02: grænsen 78,9', ['K-08']],
    ['K-03: bånd for X-GRID 35', ['K-08']],
    ['K-03: bånd for X-GRID 80', ['K-08']],
    ['K-03: bånd for X-GRID 150', ['K-08']],
    ['Over grænsen: kontakt leverandør', ['K-08']],
    ['GVS i 1,0 m', ['K-08']],
    ['GVS i 1,5 m', ['K-12']],
    ['GVS i 2,0 m', ['K-05', 'K-12']],
    ['GVS i 4,5 m', ['K-05', 'K-12']],
  ];
  for (const [delnavn, kontrolpunkter] of forventninger) {
    const sag = caseMed(delnavn);
    assert.ok(sag, `Mangler Excel-case med navn ${delnavn}`);
    const resultat = beregnOpdrift(sag.input, arketsKonstanter);
    assert.equal(resultat.ok, true, sag.navn);
    if (resultat.ok) assert.deepEqual(resultat.resultat.kontrolpunkter, kontrolpunkter, sag.navn);
  }
});

test('S₁-status og konklusionen er enige, også tæt på S₁ = 1', () => {
  for (let roervaegt = 0; roervaegt <= 6000; roervaegt += 25) {
    const b = beregnOpdrift({ ...basis, roervaegt });
    assert.ok(b.ok);
    const ikkeNoedvendig = b.resultat.konklusion[0].includes('IKKE nødvendig');
    assert.equal(b.resultat.S1Status === 'OK', ikkeNoedvendig, `egenvægt ${roervaegt}`);
    assert.equal(b.resultat.S1Status === 'OK', b.resultat.S1! >= 1);
  }
});

test('omslag er ikke muligt, når det øverste lag ville ligge over terræn', () => {
  const lav = beregnOpdrift({ ...basis, d: 0.1, h1: 0 });
  assert.ok(lav.ok);
  assert.equal(lav.resultat.hTop < 0, true);
  assert.equal(lav.resultat.losninger.C, null);
  assert.equal(lav.resultat.losninger.D, null);
  assert.ok(lav.resultat.losninger.A.L > 0 && lav.resultat.losninger.B.L > 0);
  assert.equal(lav.resultat.kontrolpunkter.includes('K-08'), false);
  // h_top = 0 er heller ikke muligt; lige under er det muligt.
  const graense = beregnOpdrift({ ...basis, d: 0.4, h1: 0 });
  assert.ok(graense.ok);
  assert.equal(graense.resultat.losninger.C, null);
  const lige = beregnOpdrift({ ...basis, d: 0.4, h1: 0.001 });
  assert.ok(lige.ok);
  assert.notEqual(lige.resultat.losninger.C, null);
});

test('mindstelængderne svarer til max(mindstelængde; beregnet 2L/2)', () => {
  for (const d of [0.3, 0.8, 1.2, 2.5, 4])
    for (const h1 of [0.3, 0.6, 1, 2]) {
      const b = beregnOpdrift({ ...basis, d, h1 });
      assert.ok(b.ok);
      const { A, C } = b.resultat.losninger;
      assert.equal(A.L, Math.max(1, A.toLBeregnet / 2));
      assert.equal(A.toLBeregnet, b.resultat.K / b.resultat.Fbund);
      if (C) assert.equal(C.L, Math.max(0.6, C.toLBeregnet / 2));
    }
});

test('CC2 giver γ_f = 1,1, og CC3 giver γ_f = 1,1 · 1,1', () => {
  const cc2 = beregnOpdrift({ ...basis, konsekvensklasse: 'CC2' });
  const cc3 = beregnOpdrift({ ...basis, konsekvensklasse: 'CC3' });
  assert.ok(cc2.ok && cc3.ok);
  assert.equal(cc2.resultat.partialkoefficienter.gammaF, 1.1);
  assert.equal(cc3.resultat.partialkoefficienter.gammaF, 1.1 * 1.1);
});

test('CC1 afvises, fordi appen kun regner i CC2 og CC3', () => {
  const cc1 = beregnOpdrift({ ...basis, konsekvensklasse: 'CC1' as never });
  assert.equal(cc1.ok, false);
  if (!cc1.ok)
    assert.deepEqual(cc1.fejl, [
      {
        felt: 'konsekvensklasse',
        tekst: 'Appen regner kun i konsekvensklasse CC2 og CC3.',
      },
    ]);
});

test('CC3 kræver GVS i terræn i begge beregningsmetoder', () => {
  for (const metode of ['standard', 'avanceret'] as const) {
    assert.equal(beregnOpdrift({ ...basis, konsekvensklasse: 'CC3', gvs: 0, metode }).ok, true);
    const lav = beregnOpdrift({ ...basis, konsekvensklasse: 'CC3', gvs: 1, metode });
    assert.equal(lav.ok, false);
    if (!lav.ok)
      assert.deepEqual(lav.fejl, [
        { felt: 'gvs', tekst: 'Ved konsekvensklasse CC3 regnes altid med GVS i terræn.' },
      ]);
  }
  assert.equal(beregnOpdrift({ ...basis, konsekvensklasse: 'CC2', gvs: 1 }).ok, true);
});

test('appen regner med π, og kontrollen mod arket bruger 3,14 (K-06)', () => {
  const app = beregnOpdrift(basis);
  const ark = beregnOpdrift(basis, arketsKonstanter);
  assert.ok(app.ok && ark.ok);
  assert.equal(app.resultat.O, (Math.PI / 4) * 2.5 ** 2 * 10 * 1.1);
  assert.equal(ark.resultat.O, (3.14 / 4) * 2.5 ** 2 * 10 * 1.1);
  assert.equal(app.resultat.losninger.A.Ltot - 2 * app.resultat.losninger.A.L, (Math.PI * 2.5) / 2);
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
