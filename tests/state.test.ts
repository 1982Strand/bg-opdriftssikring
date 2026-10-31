import test from 'node:test';
import assert from 'node:assert/strict';
import {
  loadSession,
  parseSession,
  saveSession,
  standardSession,
  tilMotorInput,
  STORAGE_KEY,
} from '../src/ui/state.ts';
test('standardsession og motorinput følger arket', () => {
  const s = standardSession();
  assert.equal(s.inddata.d, 2.5);
  assert.equal(s.inddata.h1, 1.5);
  assert.equal(tilMotorInput(s).gvs, 0);
  assert.equal(tilMotorInput(s).overstyring, null);
  assert.equal(s.konsekvensklasse, 'CC2');
});
test('validerer og falder tilbage felt for felt', () => {
  const p = parseSession(
    JSON.stringify({
      inddata: { d: -2, h1: 0.8, gvs: 2, gvsITerraen: false, phi: 95, produkt: 12, lag: 0 },
      konsekvensklasse: 'CC3',
      avanceret: true,
    }),
  );
  assert.equal(p.session.inddata.d, 2.5);
  assert.equal(p.session.inddata.h1, 0.8);
  assert.equal(p.session.inddata.phi, 35);
  assert.equal(p.session.inddata.produkt, 150);
  assert.equal(p.session.konsekvensklasse, 'CC3');
});
test('CC1 indlæses som CC2, og CC3 og standardberegningen regner altid med GVS i terræn', () => {
  assert.equal(
    parseSession(JSON.stringify({ inddata: {}, konsekvensklasse: 'CC1' })).session.konsekvensklasse,
    'CC2',
  );
  // CC3 kan kun vælges i avanceret beregning; en gemt standardberegning i CC3 indlæses som CC2.
  assert.equal(
    parseSession(JSON.stringify({ inddata: {}, konsekvensklasse: 'CC3' })).session.konsekvensklasse,
    'CC2',
  );
  const s = parseSession(
    JSON.stringify({
      inddata: { gvs: 1.6, gvsITerraen: false },
      konsekvensklasse: 'CC3',
      avanceret: true,
    }),
  ).session;
  assert.equal(s.konsekvensklasse, 'CC3');
  assert.equal(tilMotorInput(s).gvs, 0);
  assert.equal(s.inddata.gvs, 1.6);
  assert.equal(tilMotorInput({ ...s, konsekvensklasse: 'CC2', avanceret: false }).gvs, 0);
  assert.equal(tilMotorInput({ ...s, konsekvensklasse: 'CC2', avanceret: true }).gvs, 1.6);
  assert.equal(tilMotorInput({ ...s, konsekvensklasse: 'CC3', avanceret: true }).gvs, 0);
});
test('dybere forankring gemmes og indlæses slået fra i ældre beregninger', () => {
  assert.equal(standardSession().inddata.dybForankringAktiv, false);
  assert.equal(standardSession().inddata.dybForankringL, 2);
  const gammel = parseSession(JSON.stringify({ inddata: { d: 3 } })).session.inddata;
  assert.equal(gammel.dybForankringAktiv, false);
  assert.equal(gammel.dybForankringL, 2);
  const ny = parseSession(
    JSON.stringify({ inddata: { dybForankringAktiv: true, dybForankringL: 0.5 } }),
  ).session.inddata;
  assert.equal(ny.dybForankringAktiv, true);
  // En for kort længde gemmes, så feltfejlen kan vises; negative tal afvises.
  assert.equal(ny.dybForankringL, 0.5);
  assert.equal(
    parseSession(JSON.stringify({ inddata: { dybForankringL: -1 } })).session.inddata
      .dybForankringL,
    2,
  );
});
test('alle produkter i listen kan gemmes som manuelt valg', () => {
  for (const uts of [35, 55, 80, 110, 130, 150, 200])
    assert.equal(
      parseSession(JSON.stringify({ inddata: { produkt: uts } })).session.inddata.produkt,
      uts,
    );
});
test('gemte valg af antal ledninger og konstruktion fra før ignoreres', () => {
  const s = parseSession(JSON.stringify({ inddata: {}, antal: 2, konstruktion: 'tank' })).session;
  assert.deepEqual(Object.keys(s).sort(), ['avanceret', 'inddata', 'konsekvensklasse']);
});
test('ugyldigt dokument giver standarder og fejl', () => {
  assert.equal(parseSession('{').error, true);
  assert.equal(parseSession('{').session.inddata.d, 2.5);
  assert.equal(parseSession('{}').error, true);
});
test('lagring håndterer blokeret lager og én versionsnøgle', () => {
  const s = standardSession();
  let saved = '';
  assert.equal(
    saveSession(
      {
        setItem: (k, v) => {
          saved = k + v;
        },
      },
      s,
    ),
    true,
  );
  assert.match(saved, new RegExp(STORAGE_KEY));
  assert.equal(loadSession({ getItem: () => '{' }).error, true);
  assert.equal(
    saveSession(
      {
        setItem: () => {
          throw Error();
        },
      },
      s,
    ),
    false,
  );
  assert.equal(
    loadSession({
      getItem: () => {
        throw Error();
      },
    }).error,
    true,
  );
});

test('S₂ gemmes og indlæses med 1,05 uden for intervallet (K-14)', () => {
  assert.equal(standardSession().inddata.S2, 1.05);
  assert.equal(tilMotorInput(standardSession()).S2, 1.05);
  const ind = (S2: unknown) => parseSession(JSON.stringify({ inddata: { S2 } })).session.inddata.S2;
  assert.equal(ind(1.2), 1.2);
  assert.equal(ind(1.1), 1.1);
  assert.equal(ind(1.3), 1.05);
  assert.equal(ind(1), 1.05);
  assert.equal(ind('x'), 1.05);
});

test('afstanden mellem netlagene gemmes og indlæses med 0,2 uden for intervallet (K-26)', () => {
  assert.equal(standardSession().inddata.omslagAfstand, 0.2);
  assert.equal(tilMotorInput(standardSession()).omslagAfstand, 0.2);
  const ind = (omslagAfstand: unknown) =>
    parseSession(JSON.stringify({ inddata: { omslagAfstand } })).session.inddata.omslagAfstand;
  assert.equal(ind(0.4), 0.4);
  assert.equal(ind(0.3), 0.3);
  assert.equal(ind(0.5), 0.2);
  assert.equal(ind(0.1), 0.2);
});
