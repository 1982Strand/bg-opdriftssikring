import { RotateCcw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { beregnOpdrift, type Konsekvensklasse, type OpdriftResultat } from '../engine/opdrift';
import standarder from '../engine/defaults.json' with { type: 'json' };
import { tal } from '../engine/format';
import { Fmt } from './Fmt';
import { Notice } from './Notice';
import { TabelRamme } from './TabelRamme';
import { PageFooter, PageHeader } from './page';
import { SaveState } from './SaveState';
import { useSession } from './SessionContext';
import { SettingField } from './SettingField';
import { nulstilIndstillinger, tilMotorInput } from './state';
import './sider.css';

const STANDARD: Konsekvensklasse = 'CC2';
const klasser: Konsekvensklasse[] = ['CC1', 'CC2', 'CC3'];

export function Indstillinger() {
  const { session, update, externalChange, loadMessage, reload } = useSession();
  const valgt = session.konsekvensklasse;
  const beregn = (klasse: Konsekvensklasse) => {
    const b = beregnOpdrift({ ...tilMotorInput(session), konsekvensklasse: klasse });
    return b.ok ? b.resultat : null;
  };
  const standard = beregn(STANDARD);
  const aktuel = beregn(valgt);
  const KFI = standarder.KFI[valgt];
  const losninger = ['A', 'C', 'B', 'D'] as const;
  const navn = {
    A: 'uden omslag, én ledning',
    B: 'uden omslag, to ledninger',
    C: 'med omslag, én ledning',
    D: 'med omslag, to ledninger',
  };
  const raekker: [string, (r: OpdriftResultat) => string][] = [
    ['Opdrift O', (r) => `${tal(r.O)} kN/m`],
    ['Sikkerhed S₁', (r) => `${tal(r.S1)} · ${r.S1Status}`],
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
      <PageHeader
        page="indstillinger"
        title="Indstillinger"
        intro="Valgene gælder den aktuelle beregning og gemmes i denne browser sammen med den."
        status={<SaveState />}
      />
      <div className="settings-start">
        {loadMessage && (
          <Notice kind="warning" role="alert">
            {loadMessage}
          </Notice>
        )}
        {externalChange && (
          <Notice kind="warning" role="alert">
            Data er ændret i en anden fane.{' '}
            <Button size="sm" onClick={reload}>
              Genindlæs data
            </Button>
          </Notice>
        )}
      </div>
      <section className="section-card settings-card" aria-labelledby="indstilling-1">
        <div className="bg-trin-hoved">
          <h2 id="indstilling-1">
            <span className="bg-trin-nr">1</span>{' '}
            <span className="bg-trin-titel">Konsekvensklasse</span>
          </h2>
          <span className="bg-trin-opsum">
            <Fmt text={`${valgt} · K_{FI} = ${tal(KFI, 1)}`} />
          </span>
        </div>
        <p className="settings-prose">
          Konsekvensfaktoren K<sub>FI</sub> følger af DS/EN 1997-1 DK NA:2021, afsnit A.1: CC1 og
          CC2 giver 1,0, og CC3 giver 1,1. I tabel A.4-1 NA for løftning (UPL) med trækelementer
          indgår K<sub>FI</sub> kun i den ugunstige last, dvs. opdriften. Regnearket svarer til CC2.
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
        <h3 className="settings-subheading">Konsekvens for den aktuelle beregning</h3>
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
          <Notice kind="warning">
            Konsekvensen vises, når inddata på siden Opdriftssikring er rettet.
          </Notice>
        )}
        <div className="settings-actions">
          <Button variant="outline" onClick={() => update(nulstilIndstillinger(session))}>
            <RotateCcw aria-hidden="true" />
            Nulstil indstillinger
          </Button>
        </div>
      </section>
      <PageFooter />
    </>
  );
}
