import assert from 'node:assert/strict';
import { test } from 'node:test';
import { tal } from '../src/engine/format.ts';
import {
  aflaesning,
  beregnEksempel,
  jordreaktion,
  standardEksempel,
  traekPrSide,
  vinkelVedS2,
  vinkelVedTraek,
  type EksempelBeregnet,
  type EksempelInput,
} from '../src/engine/kraftensvej.ts';
import { beregnOpdrift } from '../src/engine/opdrift.ts';
import { standardSession, tilMotorInput } from '../src/ui/state.ts';

function beregnet(input: EksempelInput): EksempelBeregnet {
  const e = beregnEksempel(input);
  assert.equal(e.tilstand, 'beregnet');
  return e as EksempelBeregnet;
}

test('kraftens vej: sammenhængene giver de kendte facit', () => {
  assert.equal(tal(traekPrSide(2, 0)), '1,00');
  assert.equal(tal(traekPrSide(2, 45)), '1,41');
  assert.equal(tal(traekPrSide(2, 60)), '2,00'); // grænsen for faktor 2
  assert.equal(tal(jordreaktion(1, 0)), '0,00');
  assert.equal(tal(jordreaktion(1, 45)), '0,77');
  assert.equal(tal(jordreaktion(1, 90)), '1,41');
  assert.equal(tal(jordreaktion(1, 180)), '2,00');
  assert.equal(tal(vinkelVedTraek(2, 2), 1), '60,0');
  assert.equal(tal(vinkelVedS2(1.05), 1), '17,8');
  assert.equal(tal(vinkelVedS2(1.2), 1), '33,6');
});

test('kraftens vej: standardeksemplet er Ø2500 med 1,5 m jorddække og GVS i terræn', () => {
  const e = beregnet(standardEksempel);
  assert.equal(e.net?.navn, 'X-GRID 80');
  assert.equal(tal(e.net?.Pd), '37,98');
  assert.equal(tal(e.net?.alfa, 1), '68,7');
  const kN = {
    F: '27,56',
    T: '13,78',
    forankring: '14,47',
    R: '19,49',
    T45: '19,49',
    R45: '14,92',
  };
  for (const [navn, vaerdi] of Object.entries(kN))
    assert.equal(tal(e[navn as keyof typeof kN]), vaerdi, navn);
});

test('kraftens vej: eksemplet regner som standardberegningen på siden Opdriftssikring', () => {
  const side = beregnOpdrift(tilMotorInput(standardSession()));
  assert.ok(side.ok);
  const e = beregnet(standardEksempel);
  assert.equal(e.F, side.resultat.Fopdrift);
  assert.equal(e.S1, side.resultat.S1);
  assert.equal(e.net?.Pd, side.resultat.geonet.Ptill);
});

test('kraftens vej: aflæsningen ved 30° og ved 0°', () => {
  const e = beregnet(standardEksempel);
  const a = aflaesning(30, e);
  assert.equal(tal(a.T), '15,91');
  assert.equal(tal(a.lodret), '13,78');
  assert.equal(tal(a.vandret), '7,96');
  assert.equal(tal(a.netUdnyttelse), '0,42');
  assert.equal(tal(a.forankringUdnyttelse), '1,10');
  // Ved 0° er trækket F_op,d/2, og forankringen har tillægget fra S₂.
  assert.equal(tal(aflaesning(0, e).forankringUdnyttelse), tal(1 / e.S2));
});

test('kraftens vej: et andet rør vælger et andet net, og forankringens procent følger kun vinklen', () => {
  const e = beregnet({ d: 3, h1: 1, roervaegt: 340 });
  assert.equal(e.net?.navn, 'X-GRID 130');
  assert.equal(tal(e.F), '53,73');
  assert.equal(tal(e.net?.Pd), '61,71');
  assert.equal(tal(e.forankring), '28,21');
  assert.equal(
    tal(aflaesning(30, e).forankringUdnyttelse),
    tal(aflaesning(30, beregnet(standardEksempel)).forankringUdnyttelse),
  );
});

test('kraftens vej: ingen sikring nødvendig, når ballasten er tilstrækkelig', () => {
  const e = beregnEksempel({ d: 1, h1: 1.5, roervaegt: 340 });
  assert.equal(e.tilstand, 'ikkeNoedvendig');
  assert.equal(e.tilstand === 'ikkeNoedvendig' && tal(e.S1), '1,33');
  // Egenvægten afgør det ved små rør.
  assert.equal(beregnEksempel({ d: 1, h1: 1, roervaegt: 340 }).tilstand, 'ikkeNoedvendig');
  assert.equal(tal(beregnet({ d: 1, h1: 1, roervaegt: 0 }).F), '2,77');
});

test('kraftens vej: trækket vises, selv om intet geonet er stærkt nok', () => {
  const e = beregnet({ d: 4, h1: 1, roervaegt: 340 });
  assert.equal(e.net, null);
  assert.equal(tal(e.F), '104,93');
  assert.equal(tal(e.forankring), '55,09');
  const a = aflaesning(30, e);
  assert.equal(a.netUdnyttelse, null);
  assert.equal(tal(a.forankringUdnyttelse), '1,10');
});

test('kraftens vej: ugyldige værdier giver ikke et eksempel', () => {
  assert.equal(beregnEksempel({ d: 0, h1: 1.5, roervaegt: 340 }).tilstand, 'ugyldig');
  assert.equal(beregnEksempel({ d: 2.5, h1: -1, roervaegt: 340 }).tilstand, 'ugyldig');
});
