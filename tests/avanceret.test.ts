import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { beregnOpdrift, type OpdriftInput, type OpdriftResultat } from '../src/engine/opdrift.ts';
import { losningSvg, tvaersnitSvg } from '../src/engine/figurer.ts';
import { parseSession, standardSession, tilMotorInput } from '../src/ui/state.ts';

// Den avancerede beregning (docs/FORSLAG_K-05.md). Standardberegningen kontrolleres mod regnearket
// i opdrift-excel.test.ts.
// CC1 er udgået, fordi opdrift ikke kan regnes i CC1 (beslutning 29. oktober 2026). CC1-casen
// kontrolleres i opdrift-excel.test.ts ved, at motoren afviser den.
const cases = (
  JSON.parse(readFileSync(new URL('./cases/excel-cases.json', import.meta.url), 'utf8')) as {
    cases: { navn: string; input: OpdriftInput }[];
  }
).cases.filter((c) => (c.input.konsekvensklasse as string) !== 'CC1');
const beregn = (input: OpdriftInput) => {
  const b = beregnOpdrift(input);
  assert.ok(b.ok, JSON.stringify(b));
  return b.resultat;
};
const avanceret = (input: OpdriftInput) => beregn({ ...input, metode: 'avanceret' });
const naer = (faktisk: number, forventet: number, tol = 1e-9) =>
  assert.ok(
    Math.abs(faktisk - forventet) <= tol * Math.max(1, Math.abs(forventet)),
    `${faktisk} ≠ ${forventet}`,
  );
/** Resultatet uden metodens egne felter. */
const faelles = ({ metode: _m, gvsZone: _z, ...rest }: OpdriftResultat) => rest;
const case2: OpdriftInput = {
  d: 4,
  h1: 0.6,
  gvs: 0,
  roervaegt: 340,
  gamma: 17,
  gammaTor: 16,
  phi: 35,
  konsekvensklasse: 'CC2',
  overstyring: null,
};
const egenvaegt = (340 * 0.9 * 9.82) / 1000;

/** O og B ved numerisk integration over rørets vinkel, uafhængigt af formlen for cirkelafsnit.
 * Dybden i røret er y = T₃ − r · cos θ, og rørets bredde er 2r · sin θ. */
function integreret(i: OpdriftInput) {
  const r = i.d / 2;
  const T3 = i.h1 + r;
  const gt = i.gammaTor * 0.9;
  const ge = i.gamma * 0.9 - 10;
  const simpson = (f: (t: number) => number, a: number, b: number, n = 2000) => {
    if (b <= a) return 0;
    const h = (b - a) / n;
    let s = f(a) + f(b);
    for (let k = 1; k < n; k++) s += f(a + k * h) * (k % 2 ? 4 : 2);
    return (s * h) / 3;
  };
  const areal = (a: number, b: number) => simpson((t) => 2 * r * r * Math.sin(t) ** 2, a, b);
  const thetaGvs = i.gvs <= i.h1 ? 0 : i.gvs >= i.h1 + i.d ? Math.PI : Math.acos((T3 - i.gvs) / r);
  const O = areal(thetaGvs, Math.PI) * 10 * 1.1;
  // Søjlen fra terræn til rørmidte; den øverste rørhalvdel trækkes fra, tør over GVS og våd under.
  const soejle = Math.min(i.gvs, T3) * i.d * gt + Math.max(0, T3 - i.gvs) * i.d * ge;
  const tg = Math.min(thetaGvs, Math.PI / 2);
  const B = soejle - areal(0, tg) * gt - areal(tg, Math.PI / 2) * ge + egenvaegt;
  return { O, B };
}

test('med GVS i terræn regner den avancerede beregning præcis som standarden', () => {
  let antal = 0;
  for (const sag of cases) {
    if (sag.input.gvs !== 0) continue;
    assert.deepEqual(faelles(avanceret(sag.input)), faelles(beregn(sag.input)), sag.navn);
    antal++;
  }
  assert.equal(antal, 34);
});

test('med GVS ned til rørtoppen er opdrift, ballast og netvalg som standarden', () => {
  let antal = 0;
  for (const sag of cases) {
    if (sag.input.gvs > sag.input.h1) continue;
    const a = avanceret(sag.input);
    const s = beregn(sag.input);
    for (const felt of ['O', 'B', 'S1', 'S1Status', 'Fopdrift', 'geonet', 'K'] as const)
      assert.deepEqual(a[felt], s[felt], `${sag.navn}: ${felt}`);
    // Forankringen regnes med den faktiske spænding (K-19) og er aldrig mindre end i arket.
    assert.ok(a.Fbund >= s.Fbund && a.Ftop >= s.Ftop, sag.navn);
    antal++;
  }
  assert.equal(antal, 37);
});

test('standardberegningen er uændret, også når metoden angives', () => {
  for (const sag of cases) {
    const r = beregn({ ...sag.input, metode: 'standard' });
    assert.deepEqual(r, beregn(sag.input), sag.navn);
    assert.equal(r.gvsZone, null);
  }
});

test('håndregningen for case 2 med GVS i 1,6 m (zone 2)', () => {
  const r = avanceret({ ...case2, gvs: 1.6 });
  const Ator = 4 * Math.acos(0.5) - Math.sqrt(3);
  assert.equal(r.gvsZone?.zone, 2);
  naer(r.gvsZone!.a, 1);
  naer(r.gvsZone!.Ator, Ator);
  naer(r.gvsZone!.Avaad, 4 * Math.PI - Ator);
  naer(r.O, (4 * Math.PI - Ator) * 11);
  naer(r.B, 1.6 * 4 * 14.4 + 4 * 5.3 - Ator * 14.4 - (2 * Math.PI - Ator) * 5.3 + egenvaegt);
  assert.deepEqual(
    [r.O, r.B, r.S1!, r.Fopdrift].map((x) => x.toFixed(2)),
    ['111.21', '60.71', '0.55', '50.50'],
  );
  assert.equal(r.geonet.uts, 110);
  // Forankringen med den faktiske spænding i nettets niveau (K-19): 1,6 m tør fyld over GVS.
  const tanPhiD = Math.tan((35 * Math.PI) / 180) / 1.2;
  naer(r.forankringsspaending.bund, 1.6 * 14.4 + 1.0 * 5.3);
  naer(r.forankringsspaending.top, 1.6 * 14.4 + 0.8 * 5.3);
  naer(r.Fbund, (1.6 * 14.4 + 1.0 * 5.3) * tanPhiD);
  naer(r.Ftop, (1.6 * 14.4 + 0.8 * 5.3) * tanPhiD);
  assert.deepEqual(
    [r.Fbund, r.Ftop, r.losninger.A.L, r.losninger.C?.L ?? NaN, r.losninger.B.toLMellem].map((x) =>
      x.toFixed(2),
    ),
    ['16.54', '15.92', '1.60', '1.28', '2.14'],
  );
});

test('forankringen bruger samme spænding i rørmidten som afstanden mellem to ledninger', () => {
  for (const gvs of [0, 0.3, 1.6, 2.6, 3.2, 5]) {
    const r = avanceret({ ...case2, gvs });
    naer(r.forankringsspaending.bund, r.losninger.B.sigmaV);
    // Under nettets niveau er al fyld tør.
    if (gvs >= r.hBund) naer(r.forankringsspaending.bund, r.hBund * r.gammaTorD);
  }
});

test('med K-19 bliver F_bund aldrig mindre og L aldrig større end i standardberegningen', () => {
  for (const d of [0.4, 1, 2.5, 4])
    for (const h1 of [0, 0.5, 1.5, 3])
      for (let f = 0; f <= 1.2; f += 0.05) {
        const input = { ...case2, d, h1, gvs: Math.max(0, h1 + (f - 0.5) * d) };
        const a = avanceret(input);
        const s = beregn(input);
        assert.ok(a.Fbund >= s.Fbund - 1e-12 && a.Ftop >= s.Ftop - 1e-12);
        if (a.Fopdrift > 0) {
          assert.ok(a.losninger.A.L <= s.losninger.A.L + 1e-12);
          // Omslag er ikke muligt ved h_top ≤ 0, og det afhænger kun af geometrien.
          assert.equal(a.losninger.C === null, s.losninger.C === null);
          if (a.losninger.C && s.losninger.C) assert.ok(a.losninger.C.L <= s.losninger.C.L + 1e-12);
        }
      }
});

test('håndregningen for case 2 med GVS i 2,9 m (zone 3)', () => {
  const r = avanceret({ ...case2, gvs: 2.9 });
  const Ator = 4 * Math.acos(-0.15) + 0.3 * Math.sqrt(4 - 0.09);
  assert.equal(r.gvsZone?.zone, 3);
  naer(r.gvsZone!.Ator, Ator);
  naer(r.O, (4 * Math.PI - Ator) * 11);
  naer(r.B, (2.6 * 4 - 2 * Math.PI) * 14.4 + egenvaegt);
  assert.deepEqual(
    [r.O, r.B, r.S1!].map((x) => x.toFixed(2)),
    ['55.96', '62.29', '1.11'],
  );
  assert.equal(r.S1Status, 'OK');
});

test('O og B stemmer med numerisk integration for GVS i alle zoner', () => {
  let antal = 0;
  for (const d of [0.3, 1, 2.5, 4, 6])
    for (const h1 of [0, 0.5, 1.5, 3])
      for (const [gamma, gammaTor] of [
        [17, 16],
        [20, 18],
        [18, 18],
      ])
        // GVS i trin på d/10 fra 0,2 · d over rørtoppen til 0,3 · d under rørbunden; hele tiendedele
        // rammer rørtop, rørmidte og rørbund præcist.
        for (let trin = -2; trin <= 13; trin++) {
          const input = {
            ...case2,
            d,
            h1,
            gamma,
            gammaTor,
            gvs: Math.max(0, h1 + (d * trin) / 10),
          };
          const r = avanceret(input);
          const k = integreret(input);
          naer(r.O, k.O);
          naer(r.B, k.B);
          antal++;
        }
  assert.equal(antal, 960);
});

test('A_tør har de rigtige grænser og er symmetrisk om rørmidten', () => {
  const zone = (gvs: number) => avanceret({ ...case2, gvs }).gvsZone!;
  naer(zone(0.6).Ator, 0);
  naer(zone(2.6).Ator, 2 * Math.PI);
  naer(zone(4.6).Ator, 4 * Math.PI);
  for (const a of [0.3, 1, 1.9]) naer(zone(2.6 - a).Ator + zone(2.6 + a).Ator, 4 * Math.PI);
});

test('O og B springer ikke ved rørtoppen, rørmidten og rørbunden', () => {
  for (const base of [case2, { ...case2, d: 2.5, h1: 1.5 }])
    for (const T of [base.h1, base.h1 + base.d / 2, base.h1 + base.d]) {
      const over = avanceret({ ...base, gvs: T - 1e-9 });
      const under = avanceret({ ...base, gvs: T + 1e-9 });
      naer(over.O, under.O, 1e-6);
      naer(over.B, under.B, 1e-6);
    }
});

test('når GVS sænkes, aftager O og F_opdrift, og B vokser eller er konstant', () => {
  for (const base of [case2, { ...case2, d: 2.5, h1: 1.5 }]) {
    let forrige = avanceret(base);
    for (let gvs = 0.01; gvs <= base.h1 + base.d + 1; gvs += 0.01) {
      const r = avanceret({ ...base, gvs });
      assert.ok(r.O <= forrige.O + 1e-9, `O ved ${gvs}`);
      assert.ok(r.B >= forrige.B - 1e-9, `B ved ${gvs}`);
      assert.ok(r.Fopdrift <= forrige.Fopdrift + 1e-9, `F ved ${gvs}`);
      forrige = r;
    }
  }
});

test('GVS ved eller under rørbunden giver ingen opdrift', () => {
  for (const gvs of [4.6, 6]) {
    const r = avanceret({ ...case2, gvs });
    assert.equal(r.gvsZone?.zone, 4);
    assert.equal(r.O, 0);
    assert.equal(r.S1, null);
    assert.equal(r.S1Status, 'OK');
    assert.deepEqual(r.konklusion, [
      'GVS ligger ved eller under rørbunden, så røret påvirkes ikke af opdrift.',
      'Opdriftssikring er ikke nødvendig.',
    ]);
    assert.equal(r.losninger.A.kontrol, null);
    assert.equal(r.losninger.A.status, null);
    assert.equal(r.losninger.C?.kontrol, null);
    assert.equal(r.losninger.C?.status, null);
    assert.ok(r.Fopdrift < 0);
    assert.deepEqual(
      r.kontrolpunkter.filter((k) => k === 'K-05' || k === 'K-12'),
      [],
    );
  }
});

test('σ′_v regnes med tør jord til rørmidten, når GVS ligger under midten', () => {
  const z3 = avanceret({ ...case2, gvs: 3.2 });
  naer(z3.losninger.B.sigmaV, 2.6 * 14.4);
  const z2 = avanceret({ ...case2, gvs: 1.6 });
  assert.equal(z2.losninger.B.sigmaV, beregn({ ...case2, gvs: 1.6 }).losninger.B.sigmaV);
});

test('K-05 gælder kun standardberegningen', () => {
  for (const sag of cases) {
    assert.ok(!avanceret(sag.input).kontrolpunkter.includes('K-05'), sag.navn);
    assert.equal(
      beregn(sag.input).kontrolpunkter.includes('K-05'),
      sag.input.gvs > sag.input.h1,
      sag.navn,
    );
  }
});

test('når der skal bruges net, er F_opdrift aldrig større end i standardberegningen', () => {
  for (const d of [0.4, 1, 2.5, 4])
    for (const h1 of [0.3, 1, 1.5, 3])
      for (const [gamma, gammaTor] of [
        [17, 16],
        [20, 18],
        [17, 17],
      ])
        for (let f = 0; f <= 1.3; f += 0.05) {
          const input = { ...case2, d, h1, gamma, gammaTor, gvs: h1 + f * d };
          const a = avanceret(input);
          if (a.Fopdrift > 0) assert.ok(beregn(input).Fopdrift >= a.Fopdrift - 1e-9);
        }
});

test('figurerne er gyldige for GVS i alle zoner', () => {
  for (const gvs of [0, 0.6, 1.6, 2.6, 2.9, 4.6, 6]) {
    const input = { ...case2, gvs, metode: 'avanceret' as const };
    const r = beregn(input);
    for (const svg of [
      tvaersnitSvg(r, input),
      ...(['A', 'B', 'C', 'D'] as const).map((l) => losningSvg(r, input, l)),
    ])
      assert.doesNotMatch(svg, /NaN|Infinity|undefined|null/);
  }
});

test('valget gemmes i sessionen og standarden er regnearkets beregning', () => {
  assert.equal(standardSession().avanceret, false);
  assert.equal(tilMotorInput(standardSession()).metode, 'standard');
  const s = parseSession(JSON.stringify({ inddata: {}, avanceret: true })).session;
  assert.equal(s.avanceret, true);
  assert.equal(tilMotorInput(s).metode, 'avanceret');
  assert.equal(
    parseSession(JSON.stringify({ inddata: {}, avanceret: 'ja' })).session.avanceret,
    false,
  );
});
