import test from 'node:test';
import assert from 'node:assert/strict';
import {
  loadSession,
  nulstilBeregning,
  nulstilIndstillinger,
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
    }),
  );
  assert.equal(p.session.inddata.d, 2.5);
  assert.equal(p.session.inddata.h1, 0.8);
  assert.equal(p.session.inddata.phi, 35);
  assert.equal(p.session.inddata.produkt, 150);
  assert.equal(p.session.konsekvensklasse, 'CC3');
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
  assert.deepEqual(Object.keys(s).sort(), ['inddata', 'konsekvensklasse']);
});
test('ugyldigt dokument giver standarder og fejl', () => {
  assert.equal(parseSession('{').error, true);
  assert.equal(parseSession('{').session.inddata.d, 2.5);
  assert.equal(parseSession('{}').error, true);
});
test('nulstillinger bevarer det andet lag', () => {
  const s = {
    ...standardSession(),
    inddata: { ...standardSession().inddata, d: 4 },
    konsekvensklasse: 'CC3' as const,
  };
  assert.equal(nulstilBeregning(s).inddata.d, 2.5);
  assert.equal(nulstilBeregning(s).konsekvensklasse, 'CC3');
  assert.equal(nulstilIndstillinger(s).inddata.d, 4);
  assert.equal(nulstilIndstillinger(s).konsekvensklasse, 'CC2');
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
