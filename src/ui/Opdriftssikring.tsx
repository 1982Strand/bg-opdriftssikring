import type { ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { beregnOpdrift, type OpdriftResultat, type Status } from '../engine/opdrift';
import { geonetProdukter } from '../engine/geonet';
import standarder from '../engine/defaults.json' with { type: 'json' };
import { losningSvg, tvaersnitSvg, type Losning } from '../engine/figurer';
import { tal } from '../engine/format';
import { Fmt } from './Fmt';
import { Notice } from './Notice';
import { TabelRamme } from './TabelRamme';
import { PageFooter, PageHeader } from './page';
import { SaveState } from './SaveState';
import { useSession } from './SessionContext';
import { SettingField } from './SettingField';
import { kontrolpunktTekster } from './kontrolpunkter';
import { betingelser, projekteringsansvar } from './forudsaetninger';
import { Partialkoefficienter } from './Partialkoefficienter';
import { Udfold } from './Udfold';
import { standardSession, tilMotorInput, type Session } from './state';
import './sider.css';

const { pi, gammaW, g } = standarder;

/** Nummereret afsnitskort med opsummering til højre, som på MSL's Dimensionering. */
function Trin({
  nr,
  titel,
  opsummering,
  dimmed = false,
  children,
}: {
  nr: number;
  titel: string;
  opsummering?: string;
  dimmed?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      className={`section-card settings-card calc-card${dimmed ? ' is-dimmed' : ''}`}
      aria-labelledby={`trin-${nr}`}
    >
      <div className="bg-trin-hoved">
        <h2 id={`trin-${nr}`}>
          <span className="bg-trin-nr">{nr}</span> <span className="bg-trin-titel">{titel}</span>
        </h2>
        {opsummering && (
          <span className="bg-trin-opsum">
            <Fmt text={opsummering} />
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

function StatusMaerke({ status }: { status: Status }) {
  return <span className={`m9-badge${status === 'EJ OK' ? ' is-warning' : ''}`}>{status}</span>;
}

function Flise({
  label,
  vaerdi,
  enhed,
  note,
  status,
}: {
  label: string;
  vaerdi: string;
  enhed?: string;
  note?: string;
  status?: Status | null;
}) {
  return (
    <div>
      <div className="m9-result-label">
        <h3>
          <Fmt text={label} />
        </h3>
        {status && <StatusMaerke status={status} />}
      </div>
      <div className="m9-result-value">
        <strong>{vaerdi}</strong>
        {enhed && <span>{enhed}</span>}
      </div>
      {note && (
        <p>
          <Fmt text={note} />
        </p>
      )}
    </div>
  );
}

/** Formellinjer med sænket skrift; tallene står med dansk komma. */
function Formler({ linjer }: { linjer: string[] }) {
  return (
    <ul className="formler">
      {linjer.map((linje) => (
        <li key={linje}>
          <Fmt text={linje} />
        </li>
      ))}
    </ul>
  );
}

function Figur({ svg, label }: { svg: string; label: string }) {
  return (
    <figure
      className="calc-figure"
      role="img"
      aria-label={label}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

function Talraekke({ raekker }: { raekker: [string, string, (Status | null)?][] }) {
  return (
    <table className="data-table solution-table">
      <tbody>
        {raekker.map(([navn, vaerdi, status]) => (
          <tr key={navn}>
            <th scope="row">
              <Fmt text={navn} />
            </th>
            <td className="num">
              {vaerdi} {status && <StatusMaerke status={status} />}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const losningTitel: Record<Losning, string> = {
  A: 'Uden omslag, én ledning',
  B: 'Uden omslag, to ledninger',
  C: 'Med omslag, én ledning',
  D: 'Med omslag, to ledninger',
};

function LosningKort({
  r,
  input,
  losning,
}: {
  r: OpdriftResultat;
  input: ReturnType<typeof tilMotorInput>;
  losning: Losning;
}) {
  const { A, B, C, D } = r.losninger;
  const titel = losningTitel[losning];
  const d = input.d;
  const faelles = (x: { La: number; Ltot: number }): [string, string][] => [
    ['Samlet bredde L_{a}', `${tal(x.La)} m`],
    ['Samlet netlængde L_{geonet,tot}', `${tal(x.Ltot)} m`],
  ];
  const raekker: [string, string, (Status | null)?][] =
    losning === 'A'
      ? [
          ['Forankring pr. side L_{geonet}', `${tal(A.L)} m`],
          ...faelles(A),
          ['Opdriftskontrol', tal(A.kontrol), A.status],
        ]
      : losning === 'C'
        ? [
            ['Forankring pr. side L_{geonet}', `${tal(C.L)} m`],
            ...faelles(C),
            ['Opdriftskontrol', tal(C.kontrol), C.status],
          ]
        : [
            ['Forankring yderst L_{geonet}', `${tal(r.losninger[losning].L)} m`],
            [
              'Mellem ledningerne 2 · L_{geonet}',
              `${tal(losning === 'B' ? B.toLMellem : D.toLMellem)} m`,
            ],
            ...faelles(r.losninger[losning]),
          ];
  const formler = {
    A: [
      `2L = max(1,0; K/F_{bund}) = max(1,0; ${tal(r.K)}/${tal(r.Fbund)}) = ${tal(A.toLVist)} m`,
      `L_{geonet} = max(1,0; 2L/2) = ${tal(A.L)} m pr. side`,
      `L_{a} = 2 · L_{geonet} + d = 2 · ${tal(A.L)} + ${tal(d)} = ${tal(A.La)} m`,
      `L_{geonet,tot} = 2 · L_{geonet} + π · d/2 = ${tal(A.Ltot)} m`,
      `Kontrol = (B + F_{bund} · 2 · L_{geonet})/O = (${tal(r.B)} + ${tal(r.Fbund)} · 2 · ${tal(A.L)})/${tal(r.O)} = ${tal(A.kontrol)} (krav > 1,0)`,
    ],
    B: [
      `σ′_{v} = T₂ · γ_{tør,d} + (T₃ − T₂) · γ′_{d} = ${tal(B.sigmaV)} kN/m²`,
      `2 · L_{geonet} mellem = max(0,5; F_{opdrift} · 1,2/σ′_{v}) = max(0,5; ${tal(r.Fopdrift)} · 1,2/${tal(B.sigmaV)}) = ${tal(B.toLMellem)} m`,
      `L_{geonet} yderst = ${tal(B.L)} m, som uden omslag`,
      `L_{a} = 2 · L_{geonet} + 2 · L_{geonet,mellem} + 2 · d = ${tal(B.La)} m`,
      `L_{geonet,tot} = 2 · L_{geonet} + 2 · L_{geonet,mellem} + π · d = ${tal(B.Ltot)} m`,
    ],
    C: [
      `2L = K/(F_{bund} + F_{top}/2) + 2 · 0,2 = ${tal(r.K)}/(${tal(r.Fbund)} + ${tal(r.Ftop)}/2) + 0,4 = ${tal(C.toL)} m (mindst 1,2 m)`,
      `L_{geonet} = max(0,6; 2L/2) = ${tal(C.L)} m pr. side`,
      `L_{a} = 2 · L_{geonet} + d = ${tal(C.La)} m`,
      `L_{geonet,tot} = 4 · (L_{geonet} + 0,4) + π · d/2 = ${tal(C.Ltot)} m`,
      `Kontrol = (B + (F_{bund} + F_{top})/2 · 4 · L_{geonet})/O = ${tal(C.kontrol)} (krav > 1,0)`,
    ],
    D: [
      `2 · L_{geonet} mellem = 2 · L_{geonet} = ${tal(D.toLMellem)} m, som med omslag`,
      `L_{a} = 2 · (2 · L_{geonet} + d) = ${tal(D.La)} m`,
      `L_{geonet,tot} = 4 · (2 · L_{geonet} + 0,4) + π · d = ${tal(D.Ltot)} m`,
    ],
  }[losning];
  return (
    <article className="solution-card" aria-labelledby={`losning-${losning}`}>
      <h3 id={`losning-${losning}`}>{titel}</h3>
      <Figur
        svg={losningSvg(r, input, losning)}
        label={`${titel}: geonet med forankringslængder og samlet bredde`}
      />
      <div className="solution-details">
        <Talraekke raekker={raekker} />
        {(losning === 'B' || losning === 'D') && (
          <p className="calc-note">
            Regnearket har ingen opdriftskontrol for to ledninger. Ved to forskellige ledninger
            angives den største diameter og den mindste egenvægt, som regnearket forudsætter.
          </p>
        )}
        <Udfold titel="Mellemregninger">
          <Formler linjer={formler} />
        </Udfold>
      </div>
    </article>
  );
}

export function Opdriftssikring() {
  const { session, update, externalChange, loadMessage, reload } = useSession();
  const input = tilMotorInput(session);
  const beregning = beregnOpdrift(input);
  const r = beregning.ok ? beregning.resultat : null;
  const fejl = (felt: string) =>
    beregning.ok ? undefined : beregning.fejl.find((f) => f.felt === felt)?.tekst;
  const i = session.inddata;
  const saet = (aendring: Partial<Session['inddata']>) =>
    update({ ...session, inddata: { ...i, ...aendring } });
  const talfelt = (
    key: 'd' | 'h1' | 'gvs' | 'roervaegt' | 'gamma' | 'gammaTor' | 'phi',
    label: string,
    help: string,
    ekstra: { disabled?: boolean; step?: number } = {},
  ) => (
    <SettingField
      field={{
        key: `input-${key}`,
        label,
        kind: 'number',
        help,
        step: ekstra.step ?? 0.01,
      }}
      disabled={ekstra.disabled}
      value={i[key]}
      error={fejl(key)}
      change={(v) => saet({ [key]: Number(v) })}
    />
  );
  const losninger: Losning[] = ['A', 'C', 'B', 'D'];
  const ikkeNoedvendig = r?.S1Status === 'OK';
  const pk = r?.partialkoefficienter;

  return (
    <>
      <PageHeader
        page="opdriftssikring"
        title="Opdriftssikring"
        intro="Opdrift og ballast for rør, nødvendigt geonet og forankringslængder. Beregningen følger regnearket for X-GRID."
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
      <div className="calc-mode">
        <Button variant="outline" onClick={() => update(standardSession())}>
          <RotateCcw aria-hidden="true" />
          Nulstil beregning
        </Button>
      </div>

      <Trin
        nr={1}
        titel="Generelle beregningsforudsætninger"
        opsummering="DS/EN 1997-1 DK NA:2021 · levetid 120 år"
      >
        <h3 className="settings-subheading forudsaetninger-start">Betingelser</h3>
        <ul className="settings-prose forudsaetninger">
          {betingelser(session.konsekvensklasse).map((tekst) => (
            <li key={tekst}>{tekst}</li>
          ))}
        </ul>
        <h3 className="settings-subheading">Projekteringsansvar</h3>
        {projekteringsansvar.map((tekst) => (
          <p className="settings-prose" key={tekst}>
            {tekst}
          </p>
        ))}
      </Trin>

      <Trin
        nr={2}
        titel="Partialkoefficienter"
        opsummering={`${session.konsekvensklasse} · K_{FI} = ${tal(standarder.KFI[session.konsekvensklasse], 1)} · γ_{f} = ${tal(standarder.gammaGdst * standarder.KFI[session.konsekvensklasse])}`}
      >
        <Partialkoefficienter />
      </Trin>

      <Trin
        nr={3}
        titel="Geometri og grundvand"
        opsummering={`d = ${tal(i.d)} m · h₁ = ${tal(i.h1)} m · ${i.gvsITerraen ? 'GVS i terræn' : `GVS ${tal(i.gvs)} m under terræn`}`}
      >
        <div className="calc-grid">
          <div className="calc-fields">
            {talfelt('d', 'Rørdiameter d (m)', 'Udvendig diameter.')}
            {talfelt(
              'h1',
              'Jorddækning h₁ (m)',
              'Fra terræn til rørets top. Midten ligger i T₃ = h₁ + d/2.',
            )}
            <SettingField
              field={{
                key: 'input-gvs-terraen',
                label: 'GVS i terræn',
                kind: 'checkbox',
                help: 'Grundvandsspejlet ligger i terræn. Det er normalt den ugunstigste realistiske vandstand.',
              }}
              value={i.gvsITerraen}
              change={(v) => saet({ gvsITerraen: Boolean(v) })}
            />
            {talfelt(
              'gvs',
              'GVS under terræn (m)',
              'Dybden fra terræn til grundvandsspejlet. Regnearket forudsætter GVS over midten af røret (fund K-05).',
              { disabled: i.gvsITerraen },
            )}
          </div>
          {r && (
            <Figur
              svg={tvaersnitSvg(r, input)}
              label={`Tværsnit: rør med diameter ${tal(i.d)} m, jorddækning ${tal(i.h1)} m og GVS ${tal(input.gvs)} m under terræn`}
            />
          )}
        </div>
      </Trin>

      <Trin
        nr={4}
        titel="Egenvægt og fyldmateriale"
        opsummering={`E_{k} = ${tal(i.roervaegt, 0)} kg/m · γ_{våd} = ${tal(i.gamma)} kN/m³ · φ_{k} = ${tal(i.phi)}°`}
      >
        <div className="calc-fields calc-fields-4">
          {talfelt(
            'roervaegt',
            'Rørets egenvægt E_{k} (kg/m)',
            'Karakteristisk egenvægt pr. meter. Den regnes til gunst med faktoren 0,9. 0 kg/m giver den største sikkerhed.',
            { step: 1 },
          )}
          {talfelt(
            'gamma',
            'Rumvægt, våd γ_{våd} (kN/m³)',
            'Karakteristisk rumvægt af fyldet under GVS.',
          )}
          {talfelt(
            'gammaTor',
            'Rumvægt, tør γ_{tør} (kN/m³)',
            'Karakteristisk rumvægt af fyldet over GVS.',
          )}
          {talfelt(
            'phi',
            'Friktionsvinkel φ_{k} (°)',
            'Karakteristisk friktionsvinkel for fyldet. Fyldet skal være friktionsfyld.',
            { step: 0.5 },
          )}
        </div>
        {r && pk && (
          <>
            <TabelRamme label="Fyldparametre">
              <table className="data-table params-table fyld-table">
                <thead>
                  <tr>
                    <th scope="col">Parameter</th>
                    <th scope="col" className="symbol">
                      <span className="sr-only">Symbol</span>
                    </th>
                    <th scope="col" className="num">
                      Karakteristisk
                    </th>
                    <th scope="col" className="symbol">
                      <span className="sr-only">Symbol</span>
                    </th>
                    <th scope="col" className="num">
                      Regningsmæssig
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(
                    [
                      [
                        'Rumvægt, våd',
                        'γ_{våd}',
                        `${tal(i.gamma)} kN/m³`,
                        'γ_{våd,d}',
                        `${tal(r.gammaD)} kN/m³`,
                      ],
                      [
                        'Rumvægt, tør',
                        'γ_{tør}',
                        `${tal(i.gammaTor)} kN/m³`,
                        'γ_{tør,d}',
                        `${tal(r.gammaTorD)} kN/m³`,
                      ],
                      [
                        'Effektiv rumvægt under vand',
                        'γ′ = γ_{våd} − γ_{w}',
                        `${tal(i.gamma - gammaW)} kN/m³`,
                        'γ′_{d} = γ_{våd,d} − γ_{w}',
                        `${tal(r.gammaEffD)} kN/m³`,
                      ],
                      ['Friktionsvinkel', 'φ_{k}', `${tal(i.phi)}°`, 'φ_{d}', `${tal(r.phiD)}°`],
                      [
                        'Rørets egenvægt',
                        'E_{k}',
                        `${tal(i.roervaegt)} kg/m`,
                        'E_{d}',
                        `${tal(r.roervaegtD)} kg/m`,
                      ],
                    ] as const
                  ).map(([p, symK, k, symD, d]) => (
                    <tr key={p}>
                      <th scope="row">{p}</th>
                      <td className="symbol">
                        <Fmt text={symK} />
                      </td>
                      <td className="num">{k}</td>
                      <td className="symbol">
                        <Fmt text={symD} />
                      </td>
                      <td className="num">{d}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TabelRamme>
            <p className="calc-note">
              <Fmt
                text={`Konsekvensklasse ${session.konsekvensklasse}: γ_{G;stb} = ${tal(pk.gammaGstb)} på fyld og egenvægt, γ_{φ} = ${tal(pk.gammaPhi)} på tan φ og γ_{f} = ${tal(pk.gammaF)} på opdriften.`}
              />
            </p>
          </>
        )}
      </Trin>

      {!r || !pk ? (
        <section className="section-card settings-card" aria-label="Resultater">
          <Notice kind="warning">Beregningen vises, når inddata er rettet.</Notice>
        </section>
      ) : (
        <>
          <Trin
            nr={5}
            titel="Opdrift uden geonet"
            opsummering={`S₁ = ${tal(r.S1)} · ${r.S1Status}`}
          >
            <div className="dim-results m9-result-cards">
              <Flise
                label="Opdrift O"
                vaerdi={tal(r.O)}
                enhed="kN/m"
                note={`γ_{f} = ${tal(pk.gammaF)}`}
              />
              <Flise label="Ballast B" vaerdi={tal(r.B)} enhed="kN/m" note="Fyld og egenvægt" />
              <Flise
                label="Sikkerhed S₁ = B/O"
                vaerdi={tal(r.S1)}
                status={r.S1Status}
                note="Krav > 1,0"
              />
            </div>
            <p className="calc-conclusion">{r.konklusion.join(' ')}</p>
            <Udfold titel="Mellemregninger">
              <Formler
                linjer={[
                  `γ_{f} = γ_{G;dst} = ${tal(standarder.gammaGdst, 1)} · K_{FI} = ${tal(standarder.gammaGdst, 1)} · ${tal(pk.KFI, 1)} = ${tal(pk.gammaF)} (konsekvensklasse ${session.konsekvensklasse})`,
                  `O = π/4 · d² · γ_{w} · γ_{f} = ${tal(pi)}/4 · ${tal(i.d)}² · ${tal(gammaW)} · ${tal(pk.gammaF)} = ${tal(r.O)} kN/m`,
                  `B = T₂ · d · γ_{tør,d} + (T₃ − T₂) · d · γ′_{d} − (π/4 · d² · γ′_{d})/2 + E_{d} · g/1000`,
                  `B = ${tal(r.ballastLed.torFyld)} + ${tal(r.ballastLed.vaadFyld)} − ${tal(r.ballastLed.roerHalvdel)} + ${tal(r.ballastLed.egenvaegt)} = ${tal(r.B)} kN/m`,
                  `S₁ = B/O = ${tal(r.B)}/${tal(r.O)} = ${tal(r.S1)}`,
                ]}
              />
              <p className="calc-note">
                <Fmt
                  text={`γ_{f} er partialkoefficienten γ_{G;dst} for ugunstig tyngde af (grund)vand i DS/EN 1997-1 DK NA:2021, tabel A.4-1 NA, som gælder for løftning (UPL) med trækelementer som geonet. Konsekvensfaktoren K_{FI} er 1,0 i CC1 og CC2 og 1,1 i CC3 (afsnit A.1). `}
                />
                Konsekvensklassen vælges i afsnit 2.
              </p>
              <p className="calc-note">
                T₃ = h₁ + d/2 = {tal(r.T3)} m. Som i regnearket regnes med π = {tal(pi)} og g ={' '}
                {tal(g)} m/s² (fund K-06 og K-07).
              </p>
            </Udfold>
          </Trin>

          <Trin
            nr={6}
            titel="Geonet"
            opsummering={
              r.geonet.uts === null
                ? 'Kontakt leverandør'
                : `X-GRID ${r.geonet.navn} · P_{till}/F_{opdrift} = ${tal(r.geonet.sikkerhed)}`
            }
            dimmed={ikkeNoedvendig}
          >
            {ikkeNoedvendig && (
              <Notice>
                S₁ &gt; 1,0: opdriftssikring er ikke nødvendig. Tallene nedenfor vises som i
                regnearket.
              </Notice>
            )}
            <div className="dim-results m9-result-cards">
              <Flise
                label="Krav til geonettets trækstyrke F_{opdrift}"
                vaerdi={tal(r.Fopdrift)}
                enhed="kN/m"
                note="F_{opdrift} = O − B"
              />
              <Flise
                label="Valgt geonet"
                vaerdi={r.geonet.uts === null ? 'Kontakt leverandør' : `X-GRID ${r.geonet.navn}`}
                note={
                  r.geonet.uts === null
                    ? 'Der produceres ikke geonet med den nødvendige styrke.'
                    : `${r.geonet.automatisk ? 'Automatisk valgt' : 'Valgt manuelt'} · UTS = ${tal(r.geonet.uts, 0)} kN/m`
                }
              />
              <Flise
                label="Tilladelig træklast i geonet P_{till}"
                vaerdi={tal(r.geonet.Ptill)}
                enhed={r.geonet.Ptill === null ? undefined : 'kN/m'}
                note="P_{till} = UTS/RF"
              />
              <Flise
                label="Sikkerhed P_{till}/F_{opdrift}"
                vaerdi={tal(r.geonet.sikkerhed)}
                status={r.geonet.status}
                note={
                  r.geonet.sikkerhed !== null && r.Fopdrift > 0
                    ? `Udnyttelse af P_{till}: ${tal(100 / r.geonet.sikkerhed, 0)} % · krav > 1,01`
                    : 'Krav > 1,01'
                }
              />
            </div>
            <div className="calc-override">
              <SettingField
                field={{
                  key: 'input-overstyring',
                  label: `Vælg geonet manuelt i ${standarder.geonet.lagVedManueltValg} lag`,
                  kind: 'checkbox',
                  help: `Når ét lag ikke er nok, lægges ${standarder.geonet.lagVedManueltValg} net af samme produkt oven på hinanden. Flere lag kan ikke udnyttes, fordi et net i midten ikke kan optage kraft. Forankringslængderne afhænger ikke af nettet.`,
                }}
                value={i.overstyringAktiv}
                change={(v) => saet({ overstyringAktiv: Boolean(v) })}
              />
              <SettingField
                field={{
                  key: 'input-produkt',
                  label: `Produkt i ${standarder.geonet.lagVedManueltValg} lag`,
                  kind: 'select',
                  options: geonetProdukter.map((p) => ({
                    value: p.uts,
                    label: `X-GRID ${p.uts} · UTS ${p.uts * standarder.geonet.lagVedManueltValg} kN/m`,
                  })),
                }}
                disabled={!i.overstyringAktiv}
                value={i.produkt}
                error={fejl('overstyring')}
                change={(v) => saet({ produkt: Number(v) })}
              />
            </div>
            <Udfold titel="Mellemregninger">
              <Formler
                linjer={[
                  `RF = f_{kryb} · f_{m} · f_{d} · f_{e} = ${[standarder.geonet.fKryb, standarder.geonet.fM, standarder.geonet.fD, standarder.geonet.fE].map((x) => tal(x)).join(' · ')} = ${tal(r.geonet.RF, 4)}`,
                  r.geonet.uts === null
                    ? `Intet produkt har en valggrænse over F_{opdrift} = ${tal(r.Fopdrift)} kN/m.`
                    : `P_{till} = UTS/RF = ${tal(r.geonet.uts, 0)}/${tal(r.geonet.RF, 4)} = ${tal(r.geonet.Ptill)} kN/m`,
                ]}
              />
              <TabelRamme label="Geonetprodukter">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th scope="col">Produkt</th>
                      <th scope="col" className="num">
                        UTS (kN/m)
                      </th>
                      <th scope="col" className="num">
                        <Fmt text="P_{till} (kN/m)" />
                      </th>
                      <th scope="col" className="num">
                        <Fmt text="P_{till}/F_{opdrift}" />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {geonetProdukter.map((p) => (
                      <tr
                        key={p.uts}
                        className={
                          r.geonet.automatisk && r.geonet.uts === p.uts ? 'dim-selected' : undefined
                        }
                      >
                        <th scope="row">X-GRID {p.uts}</th>
                        <td className="num">{tal(p.uts, 0)}</td>
                        <td className="num">{tal(p.graense)}</td>
                        <td className="num">{tal(p.graense / r.Fopdrift)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TabelRamme>
              <p className="calc-note">
                Reduktionsfaktorerne er fra BBA-certifikat {standarder.geonet.bba}. Det automatiske
                valg tager det mindste produkt, hvor F<sub>opdrift</sub> er under P<sub>till</sub>.
                X-GRID 130 og 200 er tilføjet fra databladet, og regnearkets valggrænse på 78,9 kN/m
                for X-GRID 150 er udgået (fund K-21 og K-02).
              </p>
            </Udfold>
          </Trin>

          <Trin
            nr={7}
            titel="Forankring"
            opsummering={`K = ${tal(r.K)} kN/m · F_{bund} = ${tal(r.Fbund)} kN/m`}
            dimmed={ikkeNoedvendig}
          >
            <div className="dim-results m9-result-cards">
              <Flise
                label="Kraftoverførsel F_{bund}"
                vaerdi={tal(r.Fbund)}
                enhed="kN/m"
                note={`h_{bund} = ${tal(r.hBund)} m`}
              />
              <Flise
                label="Kraftoverførsel F_{top}"
                vaerdi={tal(r.Ftop)}
                enhed="kN/m"
                note={`h_{top} = ${tal(r.hTop)} m`}
              />
              <Flise
                label="Kraftoptagelse K"
                vaerdi={tal(r.K)}
                enhed="kN/m"
                note={`K = F_{opdrift} · S₂, S₂ = ${tal(standarder.S2)}`}
              />
            </div>
            <Udfold titel="Mellemregninger for kraftoverførsel">
              <Formler
                linjer={[
                  `φ_{d} = arctan(tan φ_{k}/γ_{φ}) = arctan(tan ${tal(i.phi)}°/${tal(pk.gammaPhi)}) = ${tal(r.phiD)}°`,
                  `F_{bund} = h_{bund} · γ′_{d} · μ · tan φ_{d} = ${tal(r.hBund)} · ${tal(r.gammaEffD)} · ${tal(standarder.mu)} · tan ${tal(r.phiD)}° = ${tal(r.Fbund)} kN/m`,
                  `F_{top} = h_{top} · γ′_{d} · μ · tan φ_{d} = ${tal(r.hTop)} · ${tal(r.gammaEffD)} · ${tal(standarder.mu)} · tan ${tal(r.phiD)}° = ${tal(r.Ftop)} kN/m`,
                  `K = F_{opdrift} · S₂ = ${tal(r.Fopdrift)} · ${tal(standarder.S2)} = ${tal(r.K)} kN/m`,
                ]}
              />
              <p className="calc-note">
                Geonettet antages forankret i våd jord, så γ′<sub>d</sub> bruges uanset GVS. Hele
                opdriften bruges til forankringen, selv om tovkraften på hver side er halvdelen.
              </p>
            </Udfold>
            <div className="solutions">
              {losninger.map((l) => (
                <LosningKort key={l} r={r} input={input} losning={l} />
              ))}
            </div>
          </Trin>

          {r.kontrolpunkter.length > 0 && (
            <section
              className="section-card settings-card calc-card"
              aria-labelledby="kontrolpunkter"
            >
              <h2 id="kontrolpunkter">Kontrolpunkter</h2>
              <p className="calc-note">
                Fund fra regnearket, der påvirker denne beregning. Tallene er regnet som i
                regnearket. Kontrolpunkterne indgår ikke i rapporten.
              </p>
              {kontrolpunktTekster(r).map(({ kode, tekst }) => (
                <Notice kind="warning" key={kode}>
                  <Fmt text={tekst} />
                </Notice>
              ))}
            </section>
          )}
        </>
      )}
      <PageFooter />
    </>
  );
}
