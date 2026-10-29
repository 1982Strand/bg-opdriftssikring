import { beregnOpdrift, type Konsekvensklasse, type OpdriftResultat } from '../engine/opdrift';
import standarder from '../engine/defaults.json' with { type: 'json' };
import { tal } from '../engine/format';
import { Fmt } from './Fmt';
import { Notice } from './Notice';
import { TabelRamme } from './TabelRamme';
import { SettingField } from './SettingField';
import { Udfold } from './Udfold';
import { useSession } from './SessionContext';
import { tilMotorInput } from './state';

const STANDARD: Konsekvensklasse = 'CC2';
const klasser: Konsekvensklasse[] = ['CC1', 'CC2', 'CC3'];
const losninger = ['A', 'C', 'B', 'D'] as const;
const navn = {
  A: 'uden omslag, én ledning',
  B: 'uden omslag, to ledninger',
  C: 'med omslag, én ledning',
  D: 'med omslag, to ledninger',
};

/** Indholdet af afsnittet Partialkoefficienter: valg af konsekvensklasse, koefficienterne fra
 * tabel A.4-1 NA og klassens konsekvens for den aktuelle beregning. */
export function Partialkoefficienter() {
  const { session, update } = useSession();
  const valgt = session.konsekvensklasse;
  const beregn = (klasse: Konsekvensklasse) => {
    const b = beregnOpdrift({ ...tilMotorInput(session), konsekvensklasse: klasse });
    return b.ok ? b.resultat : null;
  };
  const standard = beregn(STANDARD);
  const aktuel = beregn(valgt);
  const KFI = standarder.KFI[valgt];
  const raekker: [string, (r: OpdriftResultat) => string][] = [
    ['Opdrift O', (r) => `${tal(r.O)} kN/m`],
    ['Sikkerhed S₁', (r) => (r.S1 === null ? 'Ingen opdrift' : `${tal(r.S1)} · ${r.S1Status}`)],
    ['F_{opdrift}', (r) => `${tal(r.Fopdrift)} kN/m`],
    [
      'Valgt geonet',
      (r) => (r.geonet.uts === null ? 'Kontakt leverandør' : `X-GRID ${r.geonet.navn}`),
    ],
    [
      'P_{till}/F_{opdrift}',
      (r) => (r.geonet.status ? `${tal(r.geonet.sikkerhed)} · ${r.geonet.status}` : '–'),
    ],
    ...losninger.map((l): [string, (r: OpdriftResultat) => string] => [
      `L_{geonet}, ${navn[l]}`,
      (r) => `${tal(r.losninger[l].L)} m`,
    ]),
  ];

  return (
    <>
      <p className="settings-prose">
        Partialkoefficienterne følger DS/EN 1997-1 DK NA:2021 (Eurocode 7), tabel A.4-1 NA for
        løftning (UPL) med trækelementer. Konsekvensfaktoren K<sub>FI</sub> følger af afsnit A.1:
        CC1 og CC2 giver 1,0, og CC3 giver 1,1. K<sub>FI</sub> indgår kun i den ugunstige last, dvs.
        opdriften. Regnearket svarer til CC2.
      </p>
      <SettingField
        field={{
          key: 'konsekvensklasse',
          label: 'Konsekvensklasse',
          kind: 'radio',
          segmented: true,
          options: klasser.map((k) => ({ value: k, label: k })),
        }}
        value={valgt}
        change={(v) => update({ ...session, konsekvensklasse: v as Konsekvensklasse })}
      />
      <TabelRamme label="Partialkoefficienter">
        <table className="data-table params-table class-compare">
          <thead>
            <tr>
              <th scope="col">Partialkoefficient (tabel A.4-1 NA)</th>
              <th scope="col" className="num">
                {valgt}
              </th>
              <th scope="col">Bruges på</th>
            </tr>
          </thead>
          <tbody>
            {(
              [
                [
                  'γ_{G;dst} = 1,1 · K_{FI}, ugunstig',
                  tal(standarder.gammaGdst * KFI),
                  'Opdriften (γ_{f})',
                ],
                ['γ_{G;stb}, gunstig', tal(standarder.gammaGstb), 'Fyld og egenvægt'],
                ['γ_{φ}', tal(standarder.gammaPhi), 'tan φ'],
              ] as const
            ).map(([navnet, vaerdi, brug]) => (
              <tr key={navnet}>
                <th scope="row">
                  <Fmt text={navnet} />
                </th>
                <td className="num">{vaerdi}</td>
                <td>
                  <Fmt text={brug} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TabelRamme>
      <Udfold titel="Konsekvens for den aktuelle beregning">
        {standard && aktuel ? (
          <TabelRamme label="Konsekvens for den aktuelle beregning">
            <table className="data-table class-compare">
              <thead>
                <tr>
                  <th scope="col">Størrelse</th>
                  <th scope="col" className="num">
                    Standard ({STANDARD})
                  </th>
                  <th scope="col" className="num">
                    Valgt ({valgt})
                  </th>
                </tr>
              </thead>
              <tbody>
                {raekker.map(([navnet, vis]) => (
                  <tr key={navnet}>
                    <th scope="row">
                      <Fmt text={navnet} />
                    </th>
                    <td className="num">{vis(standard)}</td>
                    <td className="num">{vis(aktuel)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TabelRamme>
        ) : (
          <Notice kind="warning">Konsekvensen vises, når inddata er rettet.</Notice>
        )}
      </Udfold>
    </>
  );
}
