import { Fragment, type ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { beregnOpdrift, type GvsZone, type OpdriftResultat, type Status } from '../engine/opdrift';
import { beregnDybForankring, type DybForankring } from '../engine/dybforankring';
import {
  beregnReduktion,
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
  reduktionForudsaetninger,
  reduktionGrupper,
  reduktionIndledning,
  reduktionKantNote,
  reduktionKraftNote,
  restopdriftRaekke,
  rfRaekker,
  symbolerPrMeter,
  symbolerSikret,
  toLedningerNote,
  tovkraftNote,
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
import { standardSession, tilMotorInput, tilReduktionInput, type Session } from './state';
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

/** Kort 9: dybere forankring ved begrænset plads for én ledning med omslag (fund K-25,
 * docs/FORSLAG_DYB_FORANKRING.md). Teksterne er godkendt 31. oktober 2026. Når kort 8 er slået til,
 * regnes videre med K_s pr. meter sikret længde (beslutning 9. november 2026). */
function DybForankringKort({
  r,
  input,
  session,
  saet,
  ikkeNoedvendigNote,
  omslagIkkeMuligt,
  dyb,
  kort,
  grundlagMangler,
}: {
  r: OpdriftResultat;
  input: ReturnType<typeof tilMotorInput>;
  session: Session;
  saet: (aendring: Partial<Session['inddata']>) => void;
  ikkeNoedvendigNote: string | null;
  omslagIkkeMuligt: boolean;
  dyb: { ok: true; resultat: DybForankring } | { ok: false; fejl: string } | null;
  /** Kortet, K kommer fra. */
  kort: 7 | 8;
  /** Kort 8 er slået til, men har fejl i inddata. */
  grundlagMangler: boolean;
}) {
  const i = session.inddata;
  const laast = ikkeNoedvendigNote !== null || omslagIkkeMuligt || grundlagMangler;
  const res = dyb?.ok ? dyb.resultat : null;
  const C = r.losninger.C;
  return (
    <>
      <p className="calc-note">{dybIndledning}</p>
      {kort === 8 && (
        <p className="calc-note">
          <Fmt text="Kort 8 er slået til, så der regnes med K_{s} pr. meter sikret længde fra kort 8." />
        </p>
      )}
      {grundlagMangler && <Notice>Ret inddata i kort 8, så kort 9 kan regnes.</Notice>}
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
      {res?.tilstand === 'dybere' && <DybResultat r={r} input={input} dyb={res} kort={kort} />}
    </>
  );
}

function DybResultat({
  r,
  input,
  dyb,
  kort,
}: {
  r: OpdriftResultat;
  input: ReturnType<typeof tilMotorInput>;
  dyb: Extract<DybForankring, { tilstand: 'dybere' }>;
  kort: 7 | 8;
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
        {dybGrupper(r, input, dyb, kort).map(({ titel, raekker }) => (
          <Beregning key={titel} titel={titel} raekker={raekker} />
        ))}
        <p className="calc-note">
          <Fmt text={kontrolNoter(kort === 8 ? symbolerSikret : symbolerPrMeter).medOmslag} />
        </p>
      </Udfold>
    </>
  );
}

type ReduktionBeregning =
  { ok: true; resultat: ReduktionResultat } | { ok: false; fejl: ReduktionFejl[] } | null;

/** Kort 8: beregning med reduktion for afrundede ender og gennemføringer (fund K-29,
 * docs/FORSLAG_SIKRET_LAENGDE.md, beslutning 9. november 2026). */
function ReduktionKort({
  r,
  input,
  session,
  saet,
  red,
  ikkeNoedvendigNote,
}: {
  r: OpdriftResultat;
  input: ReturnType<typeof tilMotorInput>;
  session: Session;
  saet: (aendring: Partial<Session['inddata']>) => void;
  red: ReduktionBeregning;
  ikkeNoedvendigNote: string;
}) {
  const i = session.inddata;
  const aktiv = i.reduktionAktiv;
  const res = red?.ok ? red.resultat : null;
  const fejl = (felt: string) =>
    red && !red.ok ? red.fejl.find((f) => f.felt === felt)?.tekst : undefined;
  const ikkeRelevant = res !== null && res.S1Status === 'OK';
  const rs = res?.r ?? null;
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
      disabled={!aktiv}
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
          disabled={!aktiv}
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
          disabled={!aktiv}
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
            disabled={!aktiv}
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
      <div className="calc-override">
        <SettingField
          field={{
            key: 'input-reduktion-aktiv',
            label: 'Beregn med reduktion for ender og gennemføringer',
            kind: 'checkbox',
            help: 'Angiv rørets samlede længde og de afrundede ender og gennemføringer, hvor geonettet ikke kan lægges.',
          }}
          value={aktiv}
          change={(v) => saet({ reduktionAktiv: Boolean(v) })}
        />
      </div>
      <div className="calc-grid">
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
              disabled={!aktiv}
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
              disabled={!aktiv}
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
              disabled={!aktiv}
              value={i.antalGennemfoeringer}
              change={(v) => saet({ antalGennemfoeringer: Number(v) })}
            />
            {Array.from({ length: i.antalGennemfoeringer }, (_, n) => gennemfoering(n))}
          </div>
        </div>
        {aktiv && res && (
          <Figur
            svg={laengdesnitSvg(input, res)}
            label={`Længdesnit: rør på ${tal(res.Lroer)} m med ${res.ender.length} afrundede ender og ${res.gennemfoeringer.length} gennemføringer. Den sikrede længde er ${tal(res.Lsikret)} m.`}
          />
        )}
      </div>
      {aktiv && res && rs && (
        <>
          {ikkeRelevant && <Notice>{ikkeNoedvendigNote}</Notice>}
          {!ikkeRelevant && r.S1Status === 'OK' && r.S1 !== null && res.S1 !== null && (
            <Notice>{reduktionKantNote(r.S1, res.S1)}</Notice>
          )}
          <div className="dim-results m9-result-cards">
            <Flise
              label="Sikret længde L_{sikret}"
              vaerdi={tal(res.Lsikret)}
              enhed="m"
              note={`L_{rør} = ${tal(res.Lroer)} m`}
            />
            <Flise
              label="Kontrol uden geonet S₁"
              vaerdi={tal(res.S1)}
              status={res.S1Status}
              note={
                res.S1 === null
                  ? 'Ingen opdrift'
                  : `S₁ = B_{d,tot}/O_{d,tot}, krav ≥ ${tal(standarder.krav.S1, 1)}`
              }
            />
            <Flise
              label="Restopdrift F_{op,d,s}"
              vaerdi={ikkeRelevant ? 'Ikke relevant' : tal(rs.Fopdrift)}
              enhed={ikkeRelevant ? undefined : 'kN/m'}
              note="Pr. meter sikret længde"
            />
            <Flise
              label="Valgt geonet"
              vaerdi={
                ikkeRelevant
                  ? 'Ikke relevant'
                  : rs.geonet.uts === null
                    ? 'Kontakt leverandør'
                    : `X-GRID ${rs.geonet.navn}`
              }
              status={ikkeRelevant ? null : rs.geonet.status}
              note={
                ikkeRelevant
                  ? undefined
                  : rs.geonet.uts === null
                    ? 'Der produceres ikke geonet med den nødvendige styrke.'
                    : `P_{d}/F_{op,d,s} = ${tal(rs.geonet.sikkerhed)}, krav > ${tal(standarder.krav.geonet)}`
              }
            />
          </div>
          <h3 className="beregning-titel">Forudsætninger</h3>
          <ul className="settings-prose forudsaetninger">
            {reduktionForudsaetninger.map((t) => (
              <li key={t}>
                <Fmt text={t} />
              </li>
            ))}
          </ul>
          <Udfold titel="Mellemregninger" laast={ikkeRelevant}>
            {reduktionGrupper(r, input, res).map(({ titel, raekker }) => (
              <Beregning key={titel} titel={titel} raekker={raekker} />
            ))}
            <p className="calc-note">
              <Fmt text={reduktionKraftNote(r)} />
            </p>
          </Udfold>
          <div className="solutions">
            {(['A', 'C', 'B', 'D'] as Losning[]).map((l) => (
              <LosningKort
                key={l}
                r={rs}
                input={input}
                losning={l}
                ikkeRelevant={ikkeRelevant}
                idPrefix="reduktion-"
                symboler={symbolerSikret}
                Lsikret={res.Lsikret}
              />
            ))}
          </div>
        </>
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
  const ikkeNoedvendig = r?.S1Status === 'OK';
  // Noten i kort 6 og 7, når opdriftssikring ikke er nødvendig (beslutning 31. oktober 2026).
  const ikkeNoedvendigNote =
    r?.S1 === null
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
  // Beregning med reduktion for ender og gennemføringer (fund K-29): kun i avanceret beregning.
  const redAktiv = r !== null && avanceret && i.reduktionAktiv;
  const red = r && redAktiv ? beregnReduktion(r, input, tilReduktionInput(session)) : null;
  const redRes = red?.ok ? red.resultat : null;
  const redIkkeNoedvendig = redRes !== null && redRes.S1Status === 'OK';
  const redNote = (S1: number | null) =>
    S1 === null
      ? 'Røret påvirkes ikke af opdrift, så opdriftssikring er ikke nødvendig.'
      : ikkeNoedvendigTekst;
  // Dybere forankring ved begrænset plads (fund K-25, docs/FORSLAG_DYB_FORANKRING.md): kun i avanceret
  // beregning og kun for én ledning med omslag. Når kort 8 er slået til, regnes videre fra kort 8.
  const dybKort: 7 | 8 = redAktiv ? 8 : 7;
  const dybGrundlag = redAktiv ? (redRes?.r ?? null) : r;
  const dybIkkeNoedvendig = dybGrundlag !== null && dybGrundlag.S1Status === 'OK';
  const omslagIkkeMuligt = r !== null && r.losninger.C === null;
  const dybLaast = dybGrundlag === null || dybIkkeNoedvendig || omslagIkkeMuligt;
  const dyb =
    dybGrundlag && avanceret && i.dybForankringAktiv && !dybLaast
      ? beregnDybForankring(dybGrundlag, input, i.dybForankringL)
      : null;
  const dybRes = dyb?.ok ? dyb.resultat : null;
  const dybere = dybRes?.tilstand === 'dybere' ? dybRes : null;
  // Den dybere forankring har sine advarsler i kort 9 og ikke under »Kontrolpunkter«
  // (beslutning 1. november 2026).
  const punkter = r ? kontrolpunktTekster(r) : [];

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

      <Trin
        nr={4}
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

      {!r || !pk ? (
        <section className="section-card settings-card" aria-label="Resultater">
          <Notice kind="warning">Beregningen vises, når inddata er rettet.</Notice>
        </section>
      ) : (
        <>
          <Trin
            nr={5}
            titel="Opdrift og stabiliserende ballast"
            opsummering={r.S1 === null ? 'Ingen opdrift' : `S₁ = ${tal(r.S1)} · ${r.S1Status}`}
          >
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
            <p className="calc-conclusion">{r.konklusion.join(' ')}</p>
            <Udfold titel="Mellemregninger">
              {/* Grupper med forklaring, formel og resultat (beslutning 31. oktober 2026). */}
              <div className={arealfigur ? 'mellemregninger-med-figur' : undefined}>
                <div>
                  <Beregning
                    smal={Boolean(arealfigur)}
                    titel="Opdrift"
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
                titel="Stabiliserende ballast"
                raekker={ballastRaekker(r, input, zone)}
              />
              <p className="calc-note">
                <Fmt text={ballastNote} />
              </p>
              <p className="calc-note">{egenvaegtNote}</p>
              <Beregning
                smal={Boolean(arealfigur)}
                titel="Kontrol uden geonet"
                raekker={[kontrolUdenGeonet(r)]}
              />
            </Udfold>
          </Trin>

          <Trin
            nr={6}
            titel="Geonet"
            opsummering={
              r.geonet.uts === null
                ? 'Kontakt leverandør'
                : ikkeNoedvendig
                  ? 'Ikke relevant'
                  : `X-GRID ${r.geonet.navn} · P_{d}/F_{op,d} = ${tal(r.geonet.sikkerhed)}`
            }
            dimmed={ikkeNoedvendig}
          >
            {ikkeNoedvendig && <Notice>{ikkeNoedvendigNote}</Notice>}
            {/* Er sikring ikke nødvendig, viser fliserne »Ikke relevant«, og manuelt netvalg og
                mellemregninger er låst (beslutning 31. oktober 2026). Et gemt manuelt valg bevares. */}
            <div className="dim-results m9-result-cards">
              <Flise
                label="Restopdrift F_{op,d}"
                vaerdi={ikkeNoedvendig ? 'Ikke relevant' : tal(r.Fopdrift)}
                enhed={ikkeNoedvendig ? undefined : 'kN/m'}
                note="F_{op,d} = O_{d} − B_{d}"
              />
              <Flise
                label="Valgt geonet"
                vaerdi={
                  ikkeNoedvendig
                    ? 'Ikke relevant'
                    : r.geonet.uts === null
                      ? 'Kontakt leverandør'
                      : `X-GRID ${r.geonet.navn}`
                }
                note={
                  ikkeNoedvendig
                    ? undefined
                    : r.geonet.uts === null
                      ? 'Der produceres ikke geonet med den nødvendige styrke.'
                      : `Medregnet korttidstrækstyrke UTS = ${tal(r.geonet.uts, 0)} kN/m`
                }
              />
              <Flise
                label="Designtrækstyrke P_{d}"
                vaerdi={ikkeNoedvendig ? 'Ikke relevant' : tal(r.geonet.Ptill)}
                enhed={ikkeNoedvendig || r.geonet.Ptill === null ? undefined : 'kN/m'}
                note="P_{d} = UTS/RF"
              />
              <Flise
                label="Styrkekontrol P_{d}/F_{op,d}"
                vaerdi={ikkeNoedvendig ? 'Ikke relevant' : tal(r.geonet.sikkerhed)}
                status={ikkeNoedvendig ? null : r.geonet.status}
                note={
                  r.geonet.sikkerhed !== null && !ikkeNoedvendig
                    ? `Krav: P_{d}/F_{op,d} > ${tal(standarder.krav.geonet)} (P_{d} udnyttet ${tal(100 / r.geonet.sikkerhed, 0)}%)`
                    : `Krav: P_{d}/F_{op,d} > ${tal(standarder.krav.geonet)}`
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
              <Beregning titel="Restopdrift" raekker={[restopdriftRaekke(r)]} />
              <h3 className="beregning-titel">Reduktionsfaktor (RF)</h3>
              <p className="calc-note">RF beregnes som produktet af følgende faktorer:</p>
              <Beregning raekker={rfRaekker(r)} />
              <p className="calc-note">
                Reduktionsfaktorer fremgår af “British Board of Agreement” (BBA) certifikat No.{' '}
                {standarder.geonet.bba}, se{' '}
                <a href="https://www.byggros.com" target="_blank" rel="noreferrer">
                  www.byggros.com
                </a>
              </p>
              <Beregning titel="Designtrækstyrke" raekker={[designRaekke(r)]} />
            </Udfold>
          </Trin>

          <Trin
            nr={7}
            titel="Forankring"
            opsummering={
              ikkeNoedvendig
                ? 'Ikke relevant'
                : `K = ${tal(r.K)} kN/m · F_{bund} = ${tal(r.Fbund)} kN/m`
            }
            dimmed={ikkeNoedvendig}
          >
            {ikkeNoedvendig && <Notice>{ikkeNoedvendigNote}</Notice>}
            {/* Er sikring ikke nødvendig, viser fliser og løsninger »Ikke relevant«, og
                mellemregningerne er låst (beslutning 31. oktober 2026). */}
            <div className="dim-results m9-result-cards">
              <Flise
                label="Kraftoverførsel F_{bund}"
                vaerdi={ikkeNoedvendig ? 'Ikke relevant' : tal(r.Fbund)}
                enhed={ikkeNoedvendig ? undefined : 'kN/m'}
                note={ikkeNoedvendig ? undefined : `h_{bund} = ${tal(r.hBund)} m`}
              />
              <Flise
                label="Kraftoverførsel F_{top}"
                vaerdi={ikkeNoedvendig ? 'Ikke relevant' : tal(r.Ftop)}
                enhed={ikkeNoedvendig ? undefined : 'kN/m'}
                note={ikkeNoedvendig ? undefined : `h_{top} = ${tal(r.hTop)} m`}
              />
              <Flise
                label="Kraftoptagelse K"
                vaerdi={ikkeNoedvendig ? 'Ikke relevant' : tal(r.K)}
                enhed={ikkeNoedvendig ? undefined : 'kN/m'}
                note={`K = F_{op,d} · S₂, S₂ = ${tal(r.S2)}`}
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
                  friktionsvinkelRaekke(r, input),
                  ...forankringRaekker(r, input),
                  kraftoptagelseRaekke(r),
                ]}
              />
              <p className="calc-note">
                <Fmt text={kraftNote(avanceret)} />
              </p>
            </Udfold>
            <div className="solutions">
              {losninger.map((l) => (
                <LosningKort
                  key={l}
                  r={r}
                  input={input}
                  losning={l}
                  ikkeRelevant={ikkeNoedvendig}
                />
              ))}
            </div>
          </Trin>

          {avanceret && (
            <Trin
              nr={8}
              titel="Beregning med reduktion for gennemføringer"
              opsummering={
                !redRes
                  ? undefined
                  : redIkkeNoedvendig
                    ? 'Ikke relevant'
                    : `L_{sikret} = ${tal(redRes.Lsikret)} m · ${redRes.r.geonet.uts === null ? 'Kontakt leverandør' : `X-GRID ${redRes.r.geonet.navn}`} · K_{s} = ${tal(redRes.r.K)} kN/m`
              }
              dimmed={redIkkeNoedvendig}
            >
              <ReduktionKort
                r={r}
                input={input}
                session={session}
                saet={saet}
                red={red}
                ikkeNoedvendigNote={redNote(redRes?.S1 ?? null)}
              />
            </Trin>
          )}

          {avanceret && (
            <Trin
              nr={9}
              titel="Dybere forankring ved begrænset plads"
              opsummering={
                dybIkkeNoedvendig
                  ? 'Ikke relevant'
                  : omslagIkkeMuligt
                    ? 'Omslag ikke muligt'
                    : dybRes?.tilstand === 'tilstraekkelig'
                      ? 'Ikke nødvendig'
                      : dybere
                        ? `h_{bund} = ${tal(dybere.hBund)} m · L_{geonet} = ${tal(dybere.L)} m`
                        : undefined
              }
              dimmed={dybIkkeNoedvendig}
            >
              <DybForankringKort
                r={dybGrundlag ?? r}
                input={input}
                session={session}
                saet={saet}
                ikkeNoedvendigNote={dybIkkeNoedvendig ? redNote(dybGrundlag.S1) : null}
                omslagIkkeMuligt={omslagIkkeMuligt}
                dyb={dyb}
                kort={dybKort}
                grundlagMangler={dybGrundlag === null}
              />
            </Trin>
          )}

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
