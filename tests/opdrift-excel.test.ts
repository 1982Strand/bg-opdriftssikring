import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { arketsKonstanter, beregnOpdrift, type OpdriftResultat } from '../src/engine/opdrift.ts';

interface Case {
  navn: string;
  input: Parameters<typeof beregnOpdrift>[0];
  excel: Record<string, number | string>;
}

const cases = JSON.parse(
  readFileSync(new URL('./cases/excel-cases.json', import.meta.url), 'utf8'),
) as { cases: Case[]; resultatCeller: Record<string, string> };

/** Bevidste afvigelser fra regnearket. Hver afvigelse hører til en beslutning i
 * docs/BESLUTNINGER.md og angiver de berørte cellers nye forventning. Excels facit ændres ikke. */
interface Afvigelse {
  id: string;
  dato: string;
  beslutning: string;
  beregning: string;
  celler: Record<string, Record<string, number | string>>;
}
const { afvigelser } = JSON.parse(
  readFileSync(new URL('./cases/afvigelser.json', import.meta.url), 'utf8'),
) as { afvigelser: Afvigelse[] };
const forventning = (sag: Case) => {
  const celler = { ...sag.excel };
  for (const a of afvigelser) Object.assign(celler, a.celler[sag.navn] ?? {});
  return celler;
};
const celleTilFelt: Record<string, (r: OpdriftResultat) => number | string | null> = {
  C8: (r) => r.projektbeskrivelse.d,
  C9: (r) => r.projektbeskrivelse.h1,
  C10: (r) => r.projektbeskrivelse.gvs,
  B123: (r) => r.T3,
  F157: (r) => r.gammaD,
  F158: (r) => r.gammaTorD,
  F159: (r) => r.phiD,
  D149: (r) => r.roervaegtD,
  C286: (r) => r.gammaEffD,
  G133: (r) => r.O,
  G145: (r) => r.B,
  E167: (r) => r.S1,
  H167: (r) => r.S1Status,
  A169: (r) => r.konklusion[0],
  A170: (r) => r.konklusion[1],
  G177: (r) => r.Fopdrift,
  G207: (r) => r.geonet.uts ?? r.geonet.tekst,
  G199: (r) => r.geonet.navn,
  G213: (r) => r.geonet.RF,
  G229: (r) => r.geonet.Ptill,
  E238: (r) => r.geonet.sikkerhed,
  H238: (r) => r.geonet.status,
  C285: (r) => r.hBund,
  E285: (r) => r.hTop,
  C289: (r) => r.Fbund,
  E289: (r) => r.Ftop,
  F299: (r) => r.K,
  G312: (r) => r.losninger.A.toLVist,
  C315: (r) => r.losninger.A.L,
  B319: (r) => r.losninger.A.La,
  B320: (r) => r.losninger.A.Ltot,
  A333: (r) => r.losninger.A.ballastForankring,
  E333: (r) => r.losninger.A.kontrol,
  H333: (r) => r.losninger.A.status,
  E363: (r) => r.losninger.B.sigmaV,
  G363: (r) => r.losninger.B.toLMellemBeregnet,
  C366: (r) => r.losninger.B.toLMellem,
  C369: (r) => r.losninger.B.L,
  B384: (r) => r.losninger.B.La,
  B385: (r) => r.losninger.B.Ltot,
  G404: (r) => r.losninger.C.toL,
  C407: (r) => r.losninger.C.L,
  B411: (r) => r.losninger.C.La,
  B412: (r) => r.losninger.C.Ltot,
  A427: (r) => r.losninger.C.ballastForankring,
  E427: (r) => r.losninger.C.kontrol,
  H427: (r) => r.losninger.C.status,
  C452: (r) => r.losninger.D.toLMellem,
  C455: (r) => r.losninger.D.L,
  B469: (r) => r.losninger.D.La,
  B470: (r) => r.losninger.D.Ltot,
};

for (const sag of cases.cases) {
  test(sag.navn, () => {
    const beregning = beregnOpdrift(sag.input, arketsKonstanter);
    assert.equal(beregning.ok, true, JSON.stringify(beregning));
    if (!beregning.ok) return;
    assert.deepEqual(
      Object.keys(sag.excel).sort(),
      Object.keys(celleTilFelt).sort(),
      'Kontrolcellerne skal alle sammenlignes',
    );
    for (const [celle, forventet] of Object.entries(forventning(sag))) {
      const faktisk = celleTilFelt[celle](beregning.resultat);
      if (celle === 'G199' && typeof forventet === 'number') {
        assert.equal(faktisk, String(forventet), celle);
        continue;
      }
      if (typeof forventet === 'number') {
        assert.equal(
          typeof faktisk,
          'number',
          `${celle}: forventede et tal, fik ${String(faktisk)}`,
        );
        const tolerance = Math.max(1e-12, Math.abs(forventet) * 1e-9);
        assert.ok(
          Math.abs((faktisk as number) - forventet) <= tolerance,
          `${celle}: forventede ${forventet}, fik ${faktisk}`,
        );
      } else if (forventet === '#VALUE!') {
        assert.equal(faktisk, null, `${celle}: #VALUE! skal svare til null`);
      } else {
        assert.equal(faktisk, forventet, celle);
      }
    }
  });
}

test('afvigelserne gælder kendte cases og celler og ændrer arkets værdi', () => {
  for (const a of afvigelser) {
    assert.match(a.id, /^K-\d{2}$/);
    assert.ok(a.beslutning && a.beregning, a.id);
    for (const [navn, celler] of Object.entries(a.celler)) {
      const sag = cases.cases.find((c) => c.navn === navn);
      assert.ok(sag, `${a.id}: ukendt case ${navn}`);
      for (const [celle, vaerdi] of Object.entries(celler)) {
        assert.ok(celle in cases.resultatCeller, `${a.id}: ukendt celle ${celle}`);
        assert.notEqual(sag.excel[celle], vaerdi, `${a.id}: ${navn} ${celle} er som i arket`);
      }
    }
  }
});
