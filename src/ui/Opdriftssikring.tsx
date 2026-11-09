import { Fragment, type ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { beregnOpdrift, type GvsZone, type OpdriftResultat, type Status } from '../engine/opdrift';
import { beregnDybForankring, type DybForankring } from '../engine/dybforankring';
import {
  MAKS_ENDER,
  MAKS_GENNEMFOERINGER,
  type ReduktionFejl,
  type ReduktionResultat,
} from '../engine/reduktion';
import { geonetProdukter } from '../engine/geonet';
import standarder from '../engine/defaults.json' with { type: 'json' };
import {
  dybForankringSvg,
  laengdesnitSvg,
  losningSvg,
  opdriftsarealSvg,
  tvaersnitSvg,
  type Losning,
} from '../engine/figurer';
import { tal, talKort } from '../engine/format';
import {
  ballastNote,
  ballastRaekker,
  kontrolNoter,
  designRaekke,
  dybAdvarsel,
  dybGrupper,
  dybIndledning,
  dybUnderRoerbund,
  egenvaegtNote,
  forankringRaekker,
  friktionsvinkelRaekke,
  gammaFNote,
  kontrolUdenGeonet,
  kraftNote,
  kraftoptagelseRaekke,
  losningIndhold,
  losningNote,
  losningTitel,
  opdriftGrundlag,
  opdriftNote,
  heleRoeretGrupper,
  kontrolUdenGeonetHeleRoeret,
  reduktionForudsaetninger,
  reduktionHjaelp,
  reduktionIndledning,
  reduktionOpdriftNote,
  restopdriftRaekke,
  sikretLaengdeRaekker,
  rfRaekker,
  symbolerPrMeter,
  symbolerSikret,
  toLedningerNote,
  tovkraftNote,
  udfoerselPunkter,
  type Mellemregning,
  type Symboler,
} from './mellemregninger';
import { Fmt } from './Fmt';
import { Notice } from './Notice';
import { TabelRamme } from './TabelRamme';
import { PageFooter, PageHeader } from './page';
import { SaveState } from './SaveState';
import { useAccess } from './access';
import { useSession } from './SessionContext';
import { SettingField } from './SettingField';
import { ikkeNoedvendigTekst, kontrolpunktTekster } from './kontrolpunkter';
import { betingelser, projekteringsansvar } from './forudsaetninger';
import { Partialkoefficienter } from './Partialkoefficienter';
import { Udfold } from './Udfold';
import {
  kortNr,
  medReduktion,
  reduktionValgt,
  standardSession,
  tilMotorInput,
  type Session,
} from './state';
import './sider.css';

const { gammaW } = standarder;

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

/** Mellemregninger som tabel med forklaring, formel og resultat (beslutning 31. oktober 2026). */
function Beregning({
  titel,
  raekker,
  smal = false,
}: {
  titel?: string;
  raekker: Mellemregning[];
  /** Smal forklaringskolonne, når en figur står ved siden af. */
  smal?: boolean;
}) {
  return (
    <>
      {titel && <h3 className="beregning-titel">{titel}</h3>}
      <table className={`beregning-tabel${smal ? ' is-smal' : ''}`}>
        <tbody>
          {raekker.map((m) => (
            <tr key={`${m.forklaring} ${m.formel}`} className={m.hoved ? 'is-hoved' : undefined}>
              <th scope="row">
                <Fmt text={m.forklaring} />
                {/* Mellemrummet adskiller forklaring og detalje for skærmlæsere. */}
                {m.detalje && ' '}
                {m.detalje && (
                  <span className="beregning-detalje">
                    <Fmt text={m.detalje} />
                  </span>
                )}
              </th>
              <td colSpan={m.resultat === undefined ? 2 : undefined}>
                <Fmt text={m.formel} />
              </td>
              {m.resultat !== undefined && (
                <td className="num">
                  {m.resultat}
                  {m.status && ' '}
                  {m.status && <StatusMaerke status={m.status} />}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </>
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

function LosningKort({
  r,
  input,
  losning,
  ikkeRelevant,
  idPrefix = '',
  symboler,
  Lsikret,
}: {
  r: OpdriftResultat;
  input: ReturnType<typeof tilMotorInput>;
  losning: Losning;
  ikkeRelevant: boolean;
  /** Skelner overskrifterne i kort 7 og kort 8. */
  idPrefix?: string;
  symboler?: Symboler;
  /** Kort 8: den sikrede længde, som netarealet regnes for. */
  Lsikret?: number;
}) {
  const titel = losningTitel[losning];
  const indhold = losningIndhold(r, input, losning, { symboler, Lsikret });
  const id = `losning-${idPrefix}${losning}`;
  // Er sikring ikke nødvendig, udelades den målsatte figur, og rækkerne viser »Ikke relevant«.
  return (
    <article className="solution-card" aria-labelledby={id}>
      <h3 id={id}>{titel}</h3>
      {indhold ? (
        <>
          {!ikkeRelevant && (
            <Figur
              svg={losningSvg(r, input, losning)}
              label={`${titel}: geonet med forankringslængder og samlet bredde`}
            />
          )}
          <div className="solution-details">
            <Talraekke
              raekker={
                ikkeRelevant
                  ? indhold.raekker.map(([navn]): [string, string] => [navn, 'Ikke relevant'])
                  : indhold.raekker
              }
            />
            <p className="calc-note">
              <Fmt text={losningNote(r.omslagAfstand)[losning]} />
            </p>
            {(losning === 'B' || losning === 'D') && <p className="calc-note">{toLedningerNote}</p>}
          </div>
          {/* Mellemregningerne står i kortets fulde bredde under figur og tal. */}
          <Udfold titel="Mellemregninger" laast={ikkeRelevant}>
            <Beregning raekker={indhold.beregning} />
            {indhold.note && (
              <p className="calc-note">
                <Fmt text={indhold.note} />
              </p>
            )}
          </Udfold>
        </>
      ) : (
        <Notice>
          Omslag kræver, at rørmidten ligger mere end {talKort(r.omslagAfstand)} m under terræn.
        </Notice>
      )}
    </article>
  );
}

/** Dybere forankring ved begrænset plads for én ledning med omslag (fund K-25,
 * docs/FORSLAG_DYB_FORANKRING.md). Teksterne er godkendt 31. oktober 2026. Med reduktion regnes med
 * K_s pr. meter sikret længde (beslutning 9. november 2026). */
function DybForankringKort({
  r,
  input,
  session,
  saet,
  ikkeNoedvendigNote,
  omslagIkkeMuligt,
  dyb,
  kort,
  symboler,
}: {
  r: OpdriftResultat;
  input: ReturnType<typeof tilMotorInput>;
  session: Session;
  saet: (aendring: Partial<Session['inddata']>) => void;
  ikkeNoedvendigNote: string | null;
  omslagIkkeMuligt: boolean;
  dyb: { ok: true; resultat: DybForankring } | { ok: false; fejl: string } | null;
  /** Nummeret på kortet for forankring, som K kommer fra. */
  kort: number;
  symboler: Symboler;
}) {
  const i = session.inddata;
  const laast = ikkeNoedvendigNote !== null || omslagIkkeMuligt;
  const res = dyb?.ok ? dyb.resultat : null;
  const C = r.losninger.C;
  return (
    <>
      <p className="calc-note">{dybIndledning}</p>
      {ikkeNoedvendigNote && <Notice>{ikkeNoedvendigNote}</Notice>}
      {omslagIkkeMuligt && (
        <Notice>
          Omslag kræver, at rørmidten ligger mere end {talKort(r.omslagAfstand)} m under terræn.
        </Notice>
      )}
      <div className="calc-override">
        <SettingField
          field={{
            key: 'input-dyb-aktiv',
            label: 'Beregn nødvendig forankringsdybde',
            kind: 'checkbox',
            help: 'Angiv den forankringslængde pr. side, der er plads til. Gælder én ledning med omslag.',
          }}
          disabled={laast}
          value={i.dybForankringAktiv && !laast}
          change={(v) => saet({ dybForankringAktiv: Boolean(v) })}
        />
        <SettingField
          field={{
            key: 'input-dyb-L',
            label: 'Mulig forankringslængde pr. side L_{geonet} (m)',
            kind: 'number',
            min: 0,
            step: 0.01,
          }}
          disabled={laast || !i.dybForankringAktiv}
          value={i.dybForankringL}
          error={dyb && !dyb.ok ? dyb.fejl : undefined}
          change={(v) => saet({ dybForankringL: Number(v) })}
        />
      </div>
      {/* Advarslen vises først, når beregningen er slået til (beslutning 1. november 2026). Den står
          under valget, så afkrydsningen ikke flytter sig. */}
      {!laast && i.dybForankringAktiv && <Notice kind="warning">{dybAdvarsel}</Notice>}
      {res?.tilstand === 'tilstraekkelig' && C && (
        <Notice>
          <Fmt
            text={`Løsningen »Med omslag, én ledning« i kort ${kort} giver L_{geonet} = ${tal(C.L)} m pr. side med forankring ved rørmidten. Den angivne længde på ${tal(res.L)} m er tilstrækkelig, så dybere forankring er ikke nødvendig.`}
          />
        </Notice>
      )}
      {res?.tilstand === 'dybere' && (
        <DybResultat r={r} input={input} dyb={res} kort={kort} symboler={symboler} />
      )}
    </>
  );
}

function DybResultat({
  r,
  input,
  dyb,
  kort,
  symboler,
}: {
  r: OpdriftResultat;
  input: ReturnType<typeof tilMotorInput>;
  dyb: Extract<DybForankring, { tilstand: 'dybere' }>;
  kort: number;
  symboler: Symboler;
}) {
  const roerbund =
    Math.abs(dyb.underRoerbund) < 0.005
      ? 'ved rørbunden'
      : dyb.underRoerbund > 0
        ? `${tal(dyb.underRoerbund)} m under rørbunden`
        : `${tal(-dyb.underRoerbund)} m over rørbunden`;
  return (
    <>
      <div className="dim-results m9-result-cards">
        {/* Fliseoverskrifter skrives med store bogstaver, så symbolerne h_bund og Δh står i noten. */}
        <Flise
          label="Nødvendig dybde"
          vaerdi={tal(dyb.hBund)}
          enhed="m"
          note={`h_{bund}, øverste netlag h_{top} = ${tal(dyb.hTop)} m`}
        />
        <Flise
          label="Sænkning under rørmidten"
          vaerdi={tal(dyb.dh)}
          enhed="m"
          note={`Δh, ${roerbund}`}
        />
        <Flise
          label="Samlet netlængde L_{geonet,tot}"
          vaerdi={tal(dyb.Ltot)}
          enhed="m"
          note="inkl. 2 · Δh for siderne"
        />
        <Flise
          label="Opdriftskontrol"
          vaerdi={tal(dyb.kontrol)}
          status={dyb.status}
          note={`Krav > ${tal(standarder.krav.kontrol, 1)}`}
        />
      </div>
      <Figur
        svg={dybForankringSvg(r, input, dyb)}
        label="Dybere forankring med omslag: geonettet ført ned langs rørets sider til h_bund"
      />
      {dyb.underRoerbund > 0 && (
        <Notice kind="warning">{dybUnderRoerbund(dyb.underRoerbund)}</Notice>
      )}
      <Udfold titel="Mellemregninger">
        {dybGrupper(r, input, dyb, kort, symboler).map(({ titel, raekker }) => (
          <Beregning key={titel} titel={titel} raekker={raekker} />
        ))}
        <p className="calc-note">
          <Fmt text={kontrolNoter(symboler, r.omslagAfstand).medOmslag} />
        </p>
      </Udfold>
    </>
  );
}

type ReduktionBeregning =
  { ok: true; resultat: ReduktionResultat } | { ok: false; fejl: ReduktionFejl[] } | null;

/** Kort 4 med reduktion: rørets længde, afrundede ender og gennemføringer (fund K-29,
 * beslutning 9. november 2026). Kortene efter dette regner pr. meter sikret længde. */
function LaengdeKort({
  input,
  session,
  saet,
  red,
}: {
  input: ReturnType<typeof tilMotorInput>;
  session: Session;
  saet: (aendring: Partial<Session['inddata']>) => void;
  red: ReduktionBeregning;
}) {
  const i = session.inddata;
  const res = red?.ok ? red.resultat : null;
  const fejl = (felt: string) =>
    red && !red.ok ? red.fejl.find((f) => f.felt === felt)?.tekst : undefined;
  const antalValg = (maks: number) =>
    Array.from({ length: maks + 1 }, (_, n) => ({ value: n, label: String(n) }));
  const ende = (n: number) => (
    <SettingField
      key={`ende-${n}`}
      field={{
        key: `input-ende-${n}`,
        label: `Ende ${n + 1}, vandret udstrækning L_{ende,${n + 1}} (m)`,
        kind: 'number',
        min: 0,
        step: 0.01,
      }}
      value={i.ender[n]}
      error={fejl(`ende-${n}`)}
      change={(v) => {
        const ender: [number, number] = [...i.ender];
        ender[n] = Number(v);
        saet({ ender });
      }}
    />
  );
  // Hver gennemføring er cirkulær med diameteren d_g eller rektangulær med bredden d_g langs røret og
  // b_g på tværs (beslutning 9. november 2026).
  const gennemfoering = (n: number) => {
    const rektangulaer = i.gennemfoeringForm[n] === 'rektangulaer';
    return (
      <Fragment key={`gennemfoering-${n}`}>
        <SettingField
          field={{
            key: `input-gennemfoering-form-${n}`,
            label: `Gennemføring ${n + 1}, form`,
            kind: 'radio',
            segmented: true,
            options: [
              { value: 'cirkulaer', label: 'Cirkulær' },
              { value: 'rektangulaer', label: 'Rektangulær' },
            ],
          }}
          value={i.gennemfoeringForm[n]}
          change={(v) => {
            const gennemfoeringForm: Session['inddata']['gennemfoeringForm'] = [
              ...i.gennemfoeringForm,
            ];
            gennemfoeringForm[n] = v === 'rektangulaer' ? 'rektangulaer' : 'cirkulaer';
            saet({ gennemfoeringForm });
          }}
        />
        <SettingField
          field={{
            key: `input-gennemfoering-${n}`,
            label: rektangulaer
              ? `Gennemføring ${n + 1}, bredde langs røret d_{g,${n + 1}} (m)`
              : `Gennemføring ${n + 1}, diameter d_{g,${n + 1}} (m)`,
            kind: 'number',
            min: 0,
            step: 0.01,
          }}
          value={i.gennemfoeringer[n]}
          error={fejl(`gennemfoering-${n}`)}
          change={(v) => {
            const gennemfoeringer: [number, number] = [...i.gennemfoeringer];
            gennemfoeringer[n] = Number(v);
            saet({ gennemfoeringer });
          }}
        />
        {rektangulaer && (
          <SettingField
            field={{
              key: `input-gennemfoering-tvaers-${n}`,
              label: `Gennemføring ${n + 1}, bredde på tværs b_{g,${n + 1}} (m)`,
              kind: 'number',
              min: 0,
              step: 0.01,
            }}
            value={i.gennemfoeringTvaers[n]}
            error={fejl(`gennemfoering-tvaers-${n}`)}
            change={(v) => {
              const gennemfoeringTvaers: [number, number] = [...i.gennemfoeringTvaers];
              gennemfoeringTvaers[n] = Number(v);
              saet({ gennemfoeringTvaers });
            }}
          />
        )}
      </Fragment>
    );
  };
  return (
    <>
      <p className="calc-note">{reduktionIndledning}</p>
      <div className="calc-grid laengde-felter">
        <div className="calc-fields">
          <div className="is-fuld">
            <SettingField
              field={{
                key: 'input-reduktion-Lroer',
                label: 'Rørets samlede længde L_{rør} (m)',
                kind: 'number',
                min: 0,
                step: 0.01,
                help: 'Fra ende til ende, inkl. de afrundede ender.',
              }}
              value={i.reduktionLroer}
              error={fejl('Lroer')}
              change={(v) => saet({ reduktionLroer: Number(v) })}
            />
          </div>
          <div className="calc-stak">
            <SettingField
              field={{
                key: 'input-antal-ender',
                label: 'Antal afrundede ender',
                kind: 'radio',
                segmented: true,
                options: antalValg(MAKS_ENDER),
              }}
              value={i.antalEnder}
              change={(v) => saet({ antalEnder: Number(v) })}
            />
            {Array.from({ length: i.antalEnder }, (_, n) => ende(n))}
          </div>
          <div className="calc-stak">
            <SettingField
              field={{
                key: 'input-antal-gennemfoeringer',
                label: 'Antal gennemføringer',
                kind: 'radio',
                segmented: true,
                options: antalValg(MAKS_GENNEMFOERINGER),
              }}
              value={i.antalGennemfoeringer}
              change={(v) => saet({ antalGennemfoeringer: Number(v) })}
            />
            {Array.from({ length: i.antalGennemfoeringer }, (_, n) => gennemfoering(n))}
          </div>
        </div>
        {res && (
          <Figur
            svg={laengdesnitSvg(input, res)}
            label={`Længdesnit: rør på ${tal(res.Lroer)} m med ${res.ender.length} afrundede ender og ${res.gennemfoeringer.length} gennemføringer. Den sikrede længde er ${tal(res.Lsikret)} m.`}
          />
        )}
      </div>
      <h3 className="beregning-titel">Forudsætninger</h3>
      <ul className="settings-prose forudsaetninger">
        {reduktionForudsaetninger.map((t) => (
          <li key={t}>
            <Fmt text={t} />
          </li>
        ))}
      </ul>
      {res && (
        <Udfold titel="Mellemregninger">
          <Beregning titel="Sikret længde" raekker={sikretLaengdeRaekker(res)} />
        </Udfold>
      )}
    </>
  );
}

export function Opdriftssikring() {
  const { session, update, externalChange, loadMessage, reload } = useSession();
  const { avanceretBeregning } = useAccess();
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
  // Beregning med reduktion for ender og gennemføringer (fund K-29), valgt i kort 3 i avanceret
  // beregning. Så er kort 4 længde, ender og gennemføringer, de følgende kort rykker et nummer, og
  // kortene for opdrift og ballast, geonet og forankring regner pr. meter sikret længde.
  const redAktiv = reduktionValgt(session);
  const nr = (n: number) => kortNr(redAktiv, n);
  const reduktion = r ? medReduktion(session, input, r) : null;
  const red = reduktion?.red ?? null;
  const redRes = reduktion?.res ?? null;
  const rv = reduktion?.rv ?? null;
  const sym = redAktiv ? symbolerSikret : symbolerPrMeter;
  const ikkeNoedvendig = rv?.S1Status === 'OK';
  // Noten i kortene for geonet og forankring, når opdriftssikring ikke er nødvendig (beslutning
  // 31. oktober 2026).
  const ikkeNoedvendigNote =
    rv?.S1 === null
      ? 'Røret påvirkes ikke af opdrift, så opdriftssikring er ikke nødvendig.'
      : ikkeNoedvendigTekst;
  const pk = r?.partialkoefficienter;
  const avanceret = session.avanceret;
  const zone = r?.gvsZone ?? null;
  const cc3 = session.konsekvensklasse === 'CC3';
  // Standardberegningen og CC3 regner altid med GVS i terræn (beslutning 30. oktober 2026).
  const gvsLaast = cc3 || !avanceret;
  // Kun i avanceret beregning med GVS mellem rørtop og rørbund.
  const arealfigur = r ? opdriftsarealSvg(r, input) : null;
  // Dybere forankring ved begrænset plads (fund K-25, docs/FORSLAG_DYB_FORANKRING.md): kun i avanceret
  // beregning og kun for én ledning med omslag. Med reduktion regnes med K_s.
  const omslagIkkeMuligt = rv !== null && rv.losninger.C === null;
  const dybLaast = ikkeNoedvendig || omslagIkkeMuligt;
  const dyb =
    rv && avanceret && i.dybForankringAktiv && !dybLaast
      ? beregnDybForankring(rv, input, i.dybForankringL)
      : null;
  const dybRes = dyb?.ok ? dyb.resultat : null;
  const dybere = dybRes?.tilstand === 'dybere' ? dybRes : null;
  // Den dybere forankring har sine advarsler i sit eget kort og ikke under »Kontrolpunkter«
  // (beslutning 1. november 2026).
  const punkter = rv ? kontrolpunktTekster(rv, sym.F) : [];

  return (
    <>
      <PageHeader
        page="opdriftssikring"
        title="Opdriftssikring"
        intro="Opdrift og ballast for rør, nødvendigt geonet og forankringslængder for X-GRID."
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
        {avanceretBeregning && (
          <SettingField
            field={{
              key: 'avanceret',
              label: 'Avanceret beregning',
              kind: 'checkbox',
              help: 'I avanceret beregning kan der regnes med vandspejl under terræn, samt konsekvensklasse 3, manuelt valg af geonet i 2 lag, reduktion for ender og gennemføringer og dybere forankring ved begrænset plads.',
            }}
            value={session.avanceret}
            // CC3 kan kun vælges i avanceret beregning, så standardberegningen går tilbage til CC2.
            change={(v) =>
              update({
                ...session,
                avanceret: Boolean(v),
                konsekvensklasse: v ? session.konsekvensklasse : 'CC2',
              })
            }
          />
        )}
        <Button
          variant="outline"
          onClick={() => update({ ...standardSession(), rapport: session.rapport })}
        >
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
        opsummering={`d = ${tal(i.d)} m · h₁ = ${tal(i.h1)} m · ${input.gvs === 0 ? 'GVS i terræn' : `GVS ${tal(input.gvs)} m under terræn`}`}
      >
        <div className="calc-grid">
          <div className="calc-fields">
            {talfelt('d', 'Rørdiameter d (m)', 'Udvendig diameter.')}
            {talfelt(
              'h1',
              'Jorddækning h₁ (m)',
              'Fra terræn til rørets top. Midten ligger i T₃ = h₁ + d/2.',
            )}
            {avanceretBeregning && (
              <>
                <SettingField
                  field={{
                    key: 'input-gvs-terraen',
                    label: 'GVS i terræn',
                    kind: 'checkbox',
                    help: 'Grundvandsspejlet ligger i terræn. Det er normalt den ugunstigste realistiske vandstand.',
                  }}
                  value={i.gvsITerraen || gvsLaast}
                  disabled={gvsLaast}
                  change={(v) => saet({ gvsITerraen: Boolean(v) })}
                />
                {talfelt(
                  'gvs',
                  'GVS under terræn (m)',
                  avanceret
                    ? 'Dybden fra terræn til grundvandsspejlet. Ligger GVS under rørtoppen, giver kun den del af røret, der står under vand, opdrift.'
                    : 'Dybden fra terræn til grundvandsspejlet. Bruges kun i den avancerede beregning.',
                  { disabled: i.gvsITerraen || gvsLaast },
                )}
                <div className="is-fuld">
                  <SettingField
                    field={{
                      key: 'input-reduktion-aktiv',
                      label: 'Beregning med reduktion for ender og gennemføringer',
                      kind: 'checkbox',
                      help: avanceret
                        ? reduktionHjaelp
                        : `${reduktionHjaelp} Bruges kun i den avancerede beregning.`,
                    }}
                    value={redAktiv}
                    disabled={!avanceret}
                    change={(v) => saet({ reduktionAktiv: Boolean(v) })}
                  />
                </div>
              </>
            )}
          </div>
          {r && (
            <Figur
              svg={tvaersnitSvg(r, input)}
              label={`Tværsnit: rør med diameter ${tal(i.d)} m, jorddækning ${tal(i.h1)} m og GVS ${tal(input.gvs)} m under terræn`}
            />
          )}
        </div>
        {cc3 && (
          <Notice>
            Ved konsekvensklasse CC3 regnes altid med GVS i terræn, da der skal tages højde for
            ekstremhændelser: 100-års hændelser for skybrud og oversvømmelse, stigning i havvands-
            og grundvandsspejl og risiko for svigt af drænsystemer.
          </Notice>
        )}
        {!avanceret && !cc3 && (
          <Notice>
            {avanceretBeregning
              ? 'Standardberegningen regner altid med GVS i terræn.'
              : 'Der regnes altid med GVS i terræn.'}
          </Notice>
        )}
        {avanceret && input.gvs > 0 && (
          <Notice kind="warning">
            GVS skal være den højeste vandstand i ledningens levetid, også under anlæg og ved
            skybrud. Værste tilfælde er GVS i terræn. Hvis GVS sættes herunder skal der sikres
            tilstrækkelige drænforanstaltninger eller på anden vis dokumenteres at vandstanden ikke
            kan blive højere. Beregninger på eget ansvar.
          </Notice>
        )}
      </Trin>

      {redAktiv && (
        <Trin
          nr={4}
          titel="Længde, ender og gennemføringer"
          opsummering={
            redRes
              ? `L_{rør} = ${tal(redRes.Lroer)} m · L_{sikret} = ${tal(redRes.Lsikret)} m`
              : undefined
          }
        >
          <LaengdeKort input={input} session={session} saet={saet} red={red} />
        </Trin>
      )}

      <Trin
        nr={nr(4)}
        titel="Egenvægt og fyldmateriale"
        opsummering={`E_{k} = ${tal(i.roervaegt, 0)} kg/m · γ_{våd} = ${tal(i.gamma)} kN/m³ · φ_{k} = ${tal(i.phi)}°`}
      >
        <div className="calc-fields calc-fields-4">
          {talfelt(
            'roervaegt',
            'Rørets egenvægt E_{k} (kg/m)',
            'Karakteristisk egenvægt pr. meter. Den regnes til gunst med faktoren 0,9. Med 0 kg/m ses der bort fra rørets egenvægt, hvilket er på den sikre side.',
            { step: 1 },
          )}
          {talfelt(
            'gamma',
            'Rumvægt, våd γ_{våd} (kN/m³)',
            'Karakteristisk rumvægt af fyldet under GVS.',
          )}
          {avanceretBeregning &&
            talfelt(
              'gammaTor',
              'Rumvægt, tør γ_{tør} (kN/m³)',
              'Karakteristisk rumvægt af fyldet over GVS. Bruges kun i den avancerede beregning ved GVS under terræn.',
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
          </>
        )}
      </Trin>

      {!r || !pk || !rv ? (
        <section className="section-card settings-card" aria-label="Resultater">
          <Notice kind="warning">Beregningen vises, når inddata er rettet.</Notice>
        </section>
      ) : (
        <>
          <Trin
            nr={nr(5)}
            titel="Opdrift og stabiliserende ballast"
            opsummering={rv.S1 === null ? 'Ingen opdrift' : `S₁ = ${tal(rv.S1)} · ${rv.S1Status}`}
          >
            {/* Med reduktion viser fliserne opdrift og ballast pr. meter sikret længde med de samlede
                værdier i noten (beslutning 9. november 2026). */}
            {redRes ? (
              <div className="dim-results m9-result-cards">
                <Flise
                  label="Regningsmæssig opdrift O_{d,s}"
                  vaerdi={tal(redRes.Os)}
                  enhed="kN/m"
                  note={`O_{d,tot} = ${tal(redRes.Otot)} kN på L_{sikret} = ${tal(redRes.Lsikret)} m`}
                />
                <Flise
                  label="Stabiliserende ballast B_{d,s}"
                  vaerdi={tal(redRes.Bs)}
                  enhed="kN/m"
                  note={`B_{d,tot} = ${tal(redRes.Btot)} kN`}
                />
                <Flise
                  label="Kontrol uden geonet S₁ = B_{d,tot}/O_{d,tot}"
                  vaerdi={tal(redRes.S1)}
                  status={redRes.S1Status}
                  note={
                    redRes.S1 === null ? 'Ingen opdrift' : `Krav ≥ ${tal(standarder.krav.S1, 1)}`
                  }
                />
              </div>
            ) : (
              <div className="dim-results m9-result-cards">
                <Flise
                  label="Regningsmæssig opdrift O_{d}"
                  vaerdi={tal(r.O)}
                  enhed="kN/m"
                  note={`γ_{f} = ${tal(pk.gammaF)}`}
                />
                <Flise
                  label="Stabiliserende ballast B_{d}"
                  vaerdi={tal(r.B)}
                  enhed="kN/m"
                  note="Fyld og egenvægt"
                />
                <Flise
                  label="Kontrol uden geonet S₁ = B_{d}/O_{d}"
                  vaerdi={tal(r.S1)}
                  status={r.S1Status}
                  note={r.S1 === null ? 'Ingen opdrift' : `Krav ≥ ${tal(standarder.krav.S1, 1)}`}
                />
              </div>
            )}
            <p className="calc-conclusion">{rv.konklusion.join(' ')}</p>
            <Udfold titel="Mellemregninger">
              {/* Grupper med forklaring, formel og resultat (beslutning 31. oktober 2026). */}
              <div className={arealfigur ? 'mellemregninger-med-figur' : undefined}>
                <div>
                  <Beregning
                    smal={Boolean(arealfigur)}
                    titel={redRes ? 'Opdrift pr. meter rør' : 'Opdrift'}
                    raekker={opdriftGrundlag(r, input, zone)}
                  />
                </div>
                {arealfigur && (
                  <Figur
                    svg={arealfigur}
                    label="Rørets tværsnit delt af GVS: arealet over og under GVS"
                  />
                )}
              </div>
              <p className="calc-note">
                <Fmt text={gammaFNote} />
              </p>
              <p className="calc-note">
                <Fmt text={opdriftNote(avanceret)} />
              </p>
              <Beregning
                smal={Boolean(arealfigur)}
                titel={redRes ? 'Stabiliserende ballast pr. meter rør' : 'Stabiliserende ballast'}
                raekker={ballastRaekker(r, input, zone)}
              />
              <p className="calc-note">
                <Fmt text={ballastNote} />
              </p>
              <p className="calc-note">{egenvaegtNote}</p>
              {redRes && (
                <>
                  {heleRoeretGrupper(r, input, redRes).map(({ titel, raekker }) => (
                    <Beregning key={titel} titel={titel} raekker={raekker} />
                  ))}
                  <p className="calc-note">
                    <Fmt text={reduktionOpdriftNote} />
                  </p>
                </>
              )}
              <Beregning
                smal={Boolean(arealfigur) && !redRes}
                titel="Kontrol uden geonet"
                raekker={[redRes ? kontrolUdenGeonetHeleRoeret(redRes) : kontrolUdenGeonet(r)]}
              />
            </Udfold>
          </Trin>

          <Trin
            nr={nr(6)}
            titel="Geonet"
            opsummering={
              rv.geonet.uts === null
                ? 'Kontakt leverandør'
                : ikkeNoedvendig
                  ? 'Ikke relevant'
                  : `X-GRID ${rv.geonet.navn} · P_{d}/${sym.F} = ${tal(rv.geonet.sikkerhed)}`
            }
            dimmed={ikkeNoedvendig}
          >
            {ikkeNoedvendig && <Notice>{ikkeNoedvendigNote}</Notice>}
            {/* Er sikring ikke nødvendig, viser fliserne »Ikke relevant«, og manuelt netvalg og
                mellemregninger er låst (beslutning 31. oktober 2026). Et gemt manuelt valg bevares. */}
            <div className="dim-results m9-result-cards">
              <Flise
                label={`Restopdrift ${sym.F}`}
                vaerdi={ikkeNoedvendig ? 'Ikke relevant' : tal(rv.Fopdrift)}
                enhed={ikkeNoedvendig ? undefined : 'kN/m'}
                note={`${sym.F} = ${sym.O} − ${sym.B}`}
              />
              <Flise
                label="Valgt geonet"
                vaerdi={
                  ikkeNoedvendig
                    ? 'Ikke relevant'
                    : rv.geonet.uts === null
                      ? 'Kontakt leverandør'
                      : `X-GRID ${rv.geonet.navn}`
                }
                note={
                  ikkeNoedvendig
                    ? undefined
                    : rv.geonet.uts === null
                      ? 'Der produceres ikke geonet med den nødvendige styrke.'
                      : `Medregnet korttidstrækstyrke UTS = ${tal(rv.geonet.uts, 0)} kN/m`
                }
              />
              <Flise
                label="Designtrækstyrke P_{d}"
                vaerdi={ikkeNoedvendig ? 'Ikke relevant' : tal(rv.geonet.Ptill)}
                enhed={ikkeNoedvendig || rv.geonet.Ptill === null ? undefined : 'kN/m'}
                note="P_{d} = UTS/RF"
              />
              <Flise
                label={`Styrkekontrol P_{d}/${sym.F}`}
                vaerdi={ikkeNoedvendig ? 'Ikke relevant' : tal(rv.geonet.sikkerhed)}
                status={ikkeNoedvendig ? null : rv.geonet.status}
                note={
                  rv.geonet.sikkerhed !== null && !ikkeNoedvendig
                    ? `Krav: P_{d}/${sym.F} > ${tal(standarder.krav.geonet)} (P_{d} udnyttet ${tal(100 / rv.geonet.sikkerhed, 0)}%)`
                    : `Krav: P_{d}/${sym.F} > ${tal(standarder.krav.geonet)}`
                }
              />
            </div>
            <p className="calc-note">
              Geonettet rulles ud på tværs af ledningen, så nettets styrke på langs af rullen
              udnyttes.
            </p>
            <Notice>{tovkraftNote.styrke}</Notice>
            {avanceretBeregning && (
              <div className="calc-override">
                <SettingField
                  field={{
                    key: 'input-overstyring',
                    label: `Vælg geonet manuelt i ${standarder.geonet.lagVedManueltValg} lag`,
                    kind: 'checkbox',
                    help: 'Hvis den krævede trækstyrke ikke er tilstrækkelig med 1 net kan der lægges et ekstra net af samme type ovenpå, for derved at fordoble den regningsmæssige trækstyrke. Påvirker kun kraftoverførslen, ikke forankringslængden.',
                  }}
                  disabled={ikkeNoedvendig || !avanceret}
                  value={i.overstyringAktiv && !ikkeNoedvendig && avanceret}
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
                  disabled={!i.overstyringAktiv || ikkeNoedvendig || !avanceret}
                  value={i.produkt}
                  error={fejl('overstyring')}
                  change={(v) => saet({ produkt: Number(v) })}
                />
              </div>
            )}
            {!avanceret && (
              <p className="calc-note">
                {avanceretBeregning
                  ? 'Standardberegningen vælger altid geonettet automatisk. Geonettet kan vælges manuelt med avanceret beregning.'
                  : 'Geonettet vælges automatisk.'}
              </p>
            )}
            <Udfold titel="Mellemregninger" laast={ikkeNoedvendig}>
              <Beregning titel="Restopdrift" raekker={[restopdriftRaekke(rv, sym)]} />
              <h3 className="beregning-titel">Reduktionsfaktor (RF)</h3>
              <p className="calc-note">RF beregnes som produktet af følgende faktorer:</p>
              <Beregning raekker={rfRaekker(rv)} />
              <p className="calc-note">
                Reduktionsfaktorer fremgår af “British Board of Agreement” (BBA) certifikat No.{' '}
                {standarder.geonet.bba}, se{' '}
                <a href="https://www.byggros.com" target="_blank" rel="noreferrer">
                  www.byggros.com
                </a>
              </p>
              <Beregning titel="Designtrækstyrke" raekker={[designRaekke(rv, sym)]} />
            </Udfold>
          </Trin>

          <Trin
            nr={nr(7)}
            titel="Forankring"
            opsummering={
              ikkeNoedvendig
                ? 'Ikke relevant'
                : `${sym.K} = ${tal(rv.K)} kN/m · F_{bund} = ${tal(rv.Fbund)} kN/m`
            }
            dimmed={ikkeNoedvendig}
          >
            {ikkeNoedvendig && <Notice>{ikkeNoedvendigNote}</Notice>}
            {/* Er sikring ikke nødvendig, viser fliser og løsninger »Ikke relevant«, og
                mellemregningerne er låst (beslutning 31. oktober 2026). */}
            <div className="dim-results m9-result-cards">
              <Flise
                label="Kraftoverførsel F_{bund}"
                vaerdi={ikkeNoedvendig ? 'Ikke relevant' : tal(rv.Fbund)}
                enhed={ikkeNoedvendig ? undefined : 'kN/m'}
                note={ikkeNoedvendig ? undefined : `h_{bund} = ${tal(rv.hBund)} m`}
              />
              <Flise
                label="Kraftoverførsel F_{top}"
                vaerdi={ikkeNoedvendig ? 'Ikke relevant' : tal(rv.Ftop)}
                enhed={ikkeNoedvendig ? undefined : 'kN/m'}
                note={ikkeNoedvendig ? undefined : `h_{top} = ${tal(rv.hTop)} m`}
              />
              <Flise
                label={`Kraftoptagelse ${sym.K}`}
                vaerdi={ikkeNoedvendig ? 'Ikke relevant' : tal(rv.K)}
                enhed={ikkeNoedvendig ? undefined : 'kN/m'}
                note={`${sym.K} = ${sym.F} · S₂, S₂ = ${tal(rv.S2)}`}
              />
            </div>
            {/* S₂ kan ændres inden for arkets interval (fund K-14). Feltet afviser selv værdier uden
                for intervallet, så kortet ikke forsvinder ved en ugyldig værdi. */}
            <div className="calc-fields">
              <div>
                <SettingField
                  field={{
                    key: 'input-S2',
                    label: 'Partialkoefficient for kraftoptagelse S₂',
                    kind: 'number',
                    min: standarder.S2Interval.min,
                    max: standarder.S2Interval.max,
                    step: 0.01,
                  }}
                  disabled={ikkeNoedvendig}
                  value={i.S2}
                  error={fejl('S2')}
                  change={(v) => saet({ S2: Number(v) })}
                />
                <p className="calc-note">
                  S₂ er partialkoefficienten for kraftoptagelse. Den fastlægges beregningsteknisk
                  ved skøn ({tal(standarder.S2Interval.min)}–{tal(standarder.S2Interval.max)})
                  afhængig af rørdimensionen og påvirker forankringslængden.
                </p>
              </div>
              {/* Afstanden mellem netlagene ved omslag (fund K-26). */}
              <div>
                <SettingField
                  field={{
                    key: 'input-omslagAfstand',
                    label: 'Afstand mellem netlagene ved omslag (m)',
                    kind: 'number',
                    min: standarder.omslagInterval.min,
                    max: standarder.omslagInterval.max,
                    step: 0.01,
                  }}
                  disabled={ikkeNoedvendig}
                  value={i.omslagAfstand}
                  error={fejl('omslagAfstand')}
                  change={(v) => saet({ omslagAfstand: Number(v) })}
                />
                <p className="calc-note">
                  Den lodrette afstand mellem netlagene ved omslag er mindst{' '}
                  {talKort(standarder.omslagInterval.min)} m. I praksis udføres den ofte med{' '}
                  {talKort(standarder.omslagInterval.min)}–{talKort(standarder.omslagInterval.max)}{' '}
                  m, så fyldet kan komprimeres. En større afstand giver længere forankring med
                  omslag.
                </p>
              </div>
            </div>
            <Notice>{tovkraftNote.forankring}</Notice>
            <Udfold titel="Mellemregninger for kraftoverførsel" laast={ikkeNoedvendig}>
              <Beregning
                raekker={[
                  friktionsvinkelRaekke(rv, input),
                  ...forankringRaekker(rv, input),
                  kraftoptagelseRaekke(rv, sym),
                ]}
              />
              <p className="calc-note">
                <Fmt text={kraftNote(avanceret && input.gvs > 0, sym)} />
              </p>
            </Udfold>
            <div className="solutions">
              {losninger.map((l) => (
                <LosningKort
                  key={l}
                  r={rv}
                  input={input}
                  losning={l}
                  ikkeRelevant={ikkeNoedvendig}
                  symboler={sym}
                  Lsikret={redRes?.Lsikret}
                />
              ))}
            </div>
          </Trin>

          {avanceret && (
            <Trin
              nr={nr(8)}
              titel="Dybere forankring ved begrænset plads"
              opsummering={
                ikkeNoedvendig
                  ? 'Ikke relevant'
                  : omslagIkkeMuligt
                    ? 'Omslag ikke muligt'
                    : dybRes?.tilstand === 'tilstraekkelig'
                      ? 'Ikke nødvendig'
                      : dybere
                        ? `h_{bund} = ${tal(dybere.hBund)} m · L_{geonet} = ${tal(dybere.L)} m`
                        : undefined
              }
              dimmed={ikkeNoedvendig}
            >
              <DybForankringKort
                r={rv}
                input={input}
                session={session}
                saet={saet}
                ikkeNoedvendigNote={ikkeNoedvendig ? ikkeNoedvendigNote : null}
                omslagIkkeMuligt={omslagIkkeMuligt}
                dyb={dyb}
                kort={nr(7)}
                symboler={sym}
              />
            </Trin>
          )}

          {/* Udførelsen er det sidste kort (beslutning 10. november 2026). */}
          <Trin nr={avanceret ? nr(9) : nr(8)} titel="Udførsel" dimmed={ikkeNoedvendig}>
            {ikkeNoedvendig && <Notice>{ikkeNoedvendigNote}</Notice>}
            <ul className="settings-prose forudsaetninger">
              {udfoerselPunkter(input, rv).map((t) => (
                <li key={t}>
                  <Fmt text={t} />
                </li>
              ))}
            </ul>
          </Trin>

          {punkter.length > 0 && (
            <section
              className="section-card settings-card calc-card"
              aria-labelledby="kontrolpunkter"
            >
              <h2 id="kontrolpunkter">Kontrolpunkter</h2>
              <p className="calc-note">
                Forhold, der påvirker denne beregning. Kontrolpunkterne indgår ikke i rapporten.
              </p>
              {punkter.map(({ kode, tekst }) => (
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
