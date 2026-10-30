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

const klasser: Konsekvensklasse[] = ['CC2', 'CC3'];
const losninger = ['A', 'C', 'B', 'D'] as const;
const navn = {
  A: 'uden omslag, én ledning',
  B: 'uden omslag, to ledninger',
  C: 'med omslag, én ledning',
  D: 'med omslag, to ledninger',
};

/** Indholdet af afsnittet Partialkoefficienter: valg af konsekvensklasse med K_FI, koefficienterne
 * fra tabel A.4-1 NA og en sammenligning af CC2 og CC3 for den aktuelle beregning. */
export function Partialkoefficienter() {
  const { session, update } = useSession();
  const valgt = session.konsekvensklasse;
  // Hver klasse regnes med sine egne regler, så CC3 altid regnes med GVS i terræn.
  const beregn = (klasse: Konsekvensklasse) => {
    const b = beregnOpdrift(tilMotorInput({ ...session, konsekvensklasse: klasse }));
    return b.ok ? b.resultat : null;
  };
  const resultater = klasser.map(beregn);
  const KFI = standarder.KFI[valgt];
  const raekker: [string, (r: OpdriftResultat) => string][] = [
    ['Regningsmæssig opdrift O_{d}', (r) => `${tal(r.O)} kN/m`],
    [
      'Kontrol uden geonet S₁',
      (r) => (r.S1 === null ? 'Ingen opdrift' : `${tal(r.S1)} · ${r.S1Status}`),
    ],
    ['Restopdrift F_{op,d}', (r) => `${tal(r.Fopdrift)} kN/m`],
    [
      'Valgt geonet',
      (r) => (r.geonet.uts === null ? 'Kontakt leverandør' : `X-GRID ${r.geonet.navn}`),
    ],
    [
      'Styrkekontrol P_{d}/F_{op,d}',
      (r) =>
        r.Fopdrift <= 0
          ? 'Ikke relevant'
          : r.geonet.status
            ? `${tal(r.geonet.sikkerhed)} · ${r.geonet.status}`
            : '–',
    ],
    ...losninger.map((l): [string, (r: OpdriftResultat) => string] => [
      `L_{geonet}, ${navn[l]}`,
      (r) => {
        const valgt = r.losninger[l];
        return valgt ? `${tal(valgt.L)} m` : 'Omslag ikke muligt';
      },
    ]),
  ];

  return (
    <>
      <p className="settings-prose">
        Partialkoefficienterne følger DS/EN 1997-1 DK NA:2021 (Eurocode 7), tabel A.4-1 NA for
        løftning (UPL) med trækelementer.
      </p>
      <div className="klasse-valg">
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
        {/* Ekstra span, så mellemrummene i teksten ikke forsvinder i flex-boksen. */}
        <span className="klasse-kfi">
          <span>
            <Fmt text={`K_{FI} = ${tal(KFI, 1)}`} />
          </span>
        </span>
      </div>
      {valgt === 'CC3' && (
        <Notice kind="warning">
          Ved konsekvensklasse CC3 kræves særskilt kontrol fra certificeret statiker, godkendt til
          KK3/CC3. Der regnes altid med GVS i terræn.
        </Notice>
      )}
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
        {resultater.every((r) => r !== null) ? (
          <TabelRamme label="Konsekvens for den aktuelle beregning">
            <table className="data-table class-compare">
              <thead>
                <tr>
                  <th scope="col">Størrelse</th>
                  {klasser.map((k) => (
                    <th scope="col" className="num" key={k}>
                      {k}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {raekker.map(([navnet, vis]) => (
                  <tr key={navnet}>
                    <th scope="row">
                      <Fmt text={navnet} />
                    </th>
                    {resultater.map((r, i) => (
                      <td className="num" key={klasser[i]}>
                        {vis(r!)}
                      </td>
                    ))}
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
