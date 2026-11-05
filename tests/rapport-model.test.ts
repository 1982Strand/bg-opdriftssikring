import { test } from 'node:test';
import assert from 'node:assert/strict';
import { beregnOpdrift } from '../src/engine/opdrift.ts';
import { losningSvg } from '../src/engine/figurer.ts';
import {
  rapportDokument,
  rapportFilnavn,
  regning,
  type Blok,
} from '../src/report/rapport-model.ts';
import { parseSession, standardSession, tilMotorInput, type Session } from '../src/ui/state.ts';

function dokument(aendr: (s: Session) => void = () => {}) {
  const s = standardSession();
  s.rapport.projekt = 'Eksempelprojekt';
  s.rapport.sagsbehandler = { navn: 'Navn Navnesen', telefon: '12345678', mail: 'n@example.com' };
  aendr(s);
  const input = tilMotorInput(s);
  const b = beregnOpdrift(input);
  assert.ok(b.ok);
  const { model } = rapportDokument(s, input, b.resultat, 'Odense', '2026-11-04');
  return { s, model, tekst: JSON.stringify(model) };
}
const titler = (m: ReturnType<typeof dokument>['model']) =>
  m.afsnit.map((a) => a.titel.map((d) => d.t).join(''));
const samlet = (b: Blok) => JSON.stringify(b).replace(/","sub":(true|false)\},\{"t":"/g, '');

test('rapporten har case 1-tallene fra beregningen', () => {
  const { model } = dokument();
  const alt = model.afsnit.flatMap((a) => a.blokke.map(samlet)).join(' ');
  for (const tal of ['54,00', '26,43', '27,56', '37,98', '28,94', '1,70', '2,27', '10,67', '10,98'])
    assert.ok(alt.includes(tal), tal);
  assert.ok(alt.includes('X-GRID 80'));
  assert.deepEqual(titler(model).slice(0, 7), [
    '1. Generelle beregningsforudsætninger',
    '2. Partialkoefficienter',
    '3. Geometri og grundvand',
    '4. Egenvægt og fyldmateriale',
    '5. Opdrift og stabiliserende ballast',
    '6. Geonet',
    '7. Forankring',
  ]);
});

test('fravalgte løsninger udelades, og resten nummereres fortløbende', () => {
  const { model } = dokument((s) => {
    s.rapport.losninger.A = false;
    s.rapport.losninger.D = false;
  });
  assert.deepEqual(titler(model).slice(7), [
    '7.1 Med omslag, én ledning',
    '7.2 Uden omslag, to ledninger',
  ]);
});

test('er sikring ikke nødvendig, slutter rapporten efter afsnit 5', () => {
  const { model } = dokument((s) => {
    s.inddata.h1 = 6;
  });
  assert.equal(titler(model).at(-1), '5. Opdrift og stabiliserende ballast');
});

test('teksterne og afsnit 8 følger beregningsmetoden', () => {
  const standard = dokument().tekst;
  assert.ok(standard.includes('Røret regnes tomt og helt under vand'));
  assert.ok(!standard.includes('8. Dybere forankring'));
  const { model, tekst } = dokument((s) => {
    s.avanceret = true;
    s.inddata.dybForankringAktiv = true;
    s.inddata.dybForankringL = 1;
    s.rapport.dybForankring = true;
  });
  // Beregningen alene tager ikke afsnit 8 med; det vælges på rapportsiden.
  const ikkeValgt = dokument((s) => {
    s.avanceret = true;
    s.inddata.dybForankringAktiv = true;
    s.inddata.dybForankringL = 1;
  }).tekst;
  assert.ok(!ikkeValgt.includes('8. Dybere forankring'));
  assert.ok(tekst.includes('den del af rørets udvendige tværsnit'));
  assert.ok(titler(model).includes('8. Dybere forankring ved begrænset plads'));
  assert.ok(tekst.includes('Dybere forankring er ikke en dokumenteret metode'));
  assert.ok(tekst.includes('fra afsnit 7'));
  assert.ok(!tekst.includes('fra kort 7'));
  // Den indtastede forankringslængde står øverst i beregningsdetaljerne.
  const otte = model.afsnit.find((a) => a.titel[0].t.startsWith('8.'))!;
  const start = otte.blokke.findIndex((b) => b.type === 'h3');
  assert.ok(samlet(otte.blokke[start + 1]).includes('Mulig forankringslængde pr. side'));
  // Den ønskede længde står før den nødvendige dybde, som i løsningerne.
  const resultater = otte.blokke.filter((b) => b.type === 'resultat').map(samlet);
  assert.ok(resultater[0].includes('der armeres med ønsket længde'));
  assert.ok(resultater[0].includes('1,00 m på hver side (med omslag)'));
  assert.ok(resultater[1].includes('Nødvendig dybde til nederste netlag'));
});

test('ultimal styrke følger antallet af lag', () => {
  const et = dokument().model.afsnit.find((a) => a.titel[0].t.startsWith('6.'))!;
  assert.ok(samlet(et.blokke[3]).includes('1 lag X-GRID 80'));
  const { model } = dokument((s) => {
    s.avanceret = true;
    s.inddata.overstyringAktiv = true;
    s.inddata.produkt = 150;
  });
  const to = model.afsnit.find((a) => a.titel[0].t.startsWith('6.'))!;
  assert.ok(samlet(to.blokke[3]).includes('2 lag X-GRID 150 = 2 · 150'));
  assert.ok(samlet(to.blokke[3]).includes('"vaerdi":"300"'));
});

test('forside og afslutning viser projekt, personer og dato', () => {
  const { model } = dokument();
  assert.equal(model.forside.venstre[2].vaerdi, '04-11-2026');
  assert.deepEqual(model.forside.beskrivelse.slice(0, 3), [
    'Ø2500 mm, regnet tom',
    'Jorddækning 1,50 m',
    'GVS i terræn',
  ]);
  assert.deepEqual(model.afslutning, {
    by_og_dato: 'Odense d. 04-11-2026',
    personer: [['Navn Navnesen', '12 34 56 78', 'n@example.com']],
  });
  assert.equal(
    dokument((s) => {
      s.rapport.sagsbehandler = { navn: '', telefon: '', mail: '' };
    }).model.afslutning,
    null,
  );
});

test('formlen deles i symboler, tal, resultat og krav', () => {
  const b = regning({
    forklaring: 'Ballast i forhold til opdrift',
    formel: 'S₁ = B_{d}/O_{d} = 26,43/54,00 (krav ≥ 1,0)',
    resultat: '0,49',
    status: 'EJ OK',
    hoved: true,
  });
  assert.equal(b.type, 'regning');
  if (b.type !== 'regning') return;
  assert.equal(b.formel.map((d) => d.t).join(''), 'S₁ = Bd/Od');
  assert.equal(b.tal?.map((d) => d.t).join(''), '= 26,43/54,00');
  assert.equal(b.krav, '≥ 1,0');
  assert.equal(b.vaerdi, '0,49');
  const v = regning({ forklaring: 'x', formel: 'φ_{d} = a = b', resultat: '30,26°' });
  assert.ok(v.type === 'regning' && v.vaerdi === '30,26' && v.enhed === '°');
});

test('figuren med kun symboler viser ingen værdier', () => {
  const b = beregnOpdrift(tilMotorInput(standardSession()));
  assert.ok(b.ok);
  const input = tilMotorInput(standardSession());
  const symboler = losningSvg(b.resultat, input, 'C', 'symboler');
  assert.ok(!/= \d/.test(symboler));
  assert.ok(symboler.includes('>top<'));
  assert.ok(/= \d/.test(losningSvg(b.resultat, input, 'C')));
});

test('filnavnet er uden ulovlige tegn', () => {
  assert.equal(
    rapportFilnavn('Vej/bro: 3', '04-11-2026'),
    'Opdriftssikring - Vej-bro- 3 - 04-11-2026.pdf',
  );
  assert.equal(rapportFilnavn('', '04-11-2026'), 'Opdriftssikring - 04-11-2026.pdf');
});

test('beregninger gemt før rapportsiden indlæses med tomme oplysninger', () => {
  const { session, error } = parseSession(JSON.stringify({ inddata: { d: 3 } }));
  assert.equal(error, false);
  assert.equal(session.inddata.d, 3);
  assert.deepEqual(session.rapport, standardSession().rapport);
  const gemt = parseSession(
    JSON.stringify({ inddata: {}, rapport: { projekt: 'A', losninger: { B: false } } }),
  ).session.rapport;
  assert.equal(gemt.projekt, 'A');
  assert.deepEqual(gemt.losninger, { A: true, B: false, C: true, D: true });
});
