import type { ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { beregnOpdrift, type GvsZone, type OpdriftResultat, type Status } from '../engine/opdrift';
import { geonetProdukter } from '../engine/geonet';
import standarder from '../engine/defaults.json' with { type: 'json' };
import { losningSvg, opdriftsarealSvg, tvaersnitSvg, type Losning } from '../engine/figurer';
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

const { gammaW, g } = standarder;

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

const { mindstelaengder: mindste, omslagAfstand, netTillaegOmslag, faktorMellemRoer } = standarder;

/** Arkets forskrifter for løsningerne (Rapporten A308, A358:A362, A398:A400 og A440:A449). */
const losningNote: Record<Losning, string> = {
  A: `Der forankres altid med mindst ${tal(mindste.udenOmslag.prSide, 1)} m på hver side.`,
  B: `Der forankres altid med mindst ${tal(mindste.udenOmslag.prSide, 1)} m yderst på hver side. Mellem ledningerne holdes nettet nede af fyldets vægt, så længden dér er et opdriftsproblem og ikke et forankringsproblem. Der regnes med en partialkoefficient på ${tal(faktorMellemRoer, 1)} mellem ledningerne.`,
  C: `Omslag kan bruges ved pladsproblemer. Der forankres altid med mindst ${tal(mindste.medOmslag.prSide, 1)} m på hver side. Der armeres lige meget i top og bund med ${tal(omslagAfstand, 1)} m mellem lagene.`,
  D: 'Som med omslag ved én ledning. Afstanden mellem rørene skal være mindst 2 · L_{geonet}.',
};

/** Arkets tillæg i netlængden med omslag ud over de lodrette stykker på 0,2 m (fund K-09). */
const tillaegOmslag = {
  C: 4 * netTillaegOmslag - 2 * omslagAfstand,
  D: 4 * netTillaegOmslag - 4 * omslagAfstand,
};

/** Rækker og mellemregninger for én løsning. null, når omslag ikke er muligt. */
function losningIndhold(
  r: OpdriftResultat,
  input: ReturnType<typeof tilMotorInput>,
  losning: Losning,
): { raekker: [string, string, (Status | null)?][]; formler: string[] } | null {
  const { A, B, C, D } = r.losninger;
  const torTilMidte = r.gvsZone !== null && r.gvsZone.zone >= 3;
  const ingenKontrol = 'Kontrollen kan ikke regnes, da røret ikke påvirkes af opdrift.';
  const d = input.d;
  const faelles = (x: { La: number; Ltot: number }, tillaeg?: number): [string, string][] => [
    ['Samlet bredde L_{a}', `${tal(x.La)} m`],
    [
      tillaeg === undefined
        ? 'Samlet netlængde L_{geonet,tot}'
        : `Samlet netlængde L_{geonet,tot} inkl. ${tal(tillaeg, 1)} m tillæg til omslag og overlæg`,
      `${tal(x.Ltot)} m`,
    ],
  ];
  // Den beregnede længde og den anvendte mindstelængde vises hver for sig (beslutning 30. oktober 2026).
  const bestemmende = (L: number, beregnet: number) =>
    L > beregnet / 2 ? ', mindstelængden er bestemmende' : '';
  switch (losning) {
    case 'A':
      return {
        raekker: [
          ['Forankring pr. side L_{geonet}', `${tal(A.L)} m`],
          ...faelles(A),
          ['Opdriftskontrol', tal(A.kontrol), A.status],
        ],
        formler: [
          `Beregnet 2L = K/F_{bund} = ${tal(r.K)}/${tal(r.Fbund)} = ${tal(A.toLBeregnet)} m`,
          `L_{geonet} = max(${tal(mindste.udenOmslag.prSide, 1)}; 2L/2) = max(${tal(mindste.udenOmslag.prSide, 1)}; ${tal(A.toLBeregnet / 2)}) = ${tal(A.L)} m pr. side${bestemmende(A.L, A.toLBeregnet)}`,
          `L_{a} = 2 · L_{geonet} + d = 2 · ${tal(A.L)} + ${tal(d)} = ${tal(A.La)} m`,
          `L_{geonet,tot} = 2 · L_{geonet} + π · d/2 = ${tal(A.Ltot)} m`,
          A.kontrol === null
            ? ingenKontrol
            : `Kontrol = (B_{d} + F_{bund} · 2 · L_{geonet})/O_{d} = (${tal(r.B)} + ${tal(r.Fbund)} · 2 · ${tal(A.L)})/${tal(r.O)} = ${tal(A.kontrol)} (krav > 1,0)`,
        ],
      };
    case 'B':
      return {
        raekker: [
          ['Forankring yderst L_{geonet}', `${tal(B.L)} m`],
          ['Mellem ledningerne 2 · L_{geonet}', `${tal(B.toLMellem)} m`],
          ...faelles(B),
        ],
        formler: [
          torTilMidte
            ? `σ′_{v} = T₃ · γ_{tør,d} = ${tal(r.T3)} · ${tal(r.gammaTorD)} = ${tal(B.sigmaV)} kN/m², da GVS ligger under rørmidten`
            : `σ′_{v} = T₂ · γ_{tør,d} + (T₃ − T₂) · γ′_{d} = ${tal(B.sigmaV)} kN/m²`,
          `2 · L_{geonet} mellem = max(0,5; F_{op,d} · 1,2/σ′_{v}) = max(0,5; ${tal(r.Fopdrift)} · 1,2/${tal(B.sigmaV)}) = ${tal(B.toLMellem)} m`,
          `L_{geonet} yderst = ${tal(B.L)} m, som uden omslag`,
          `L_{a} = 2 · L_{geonet} + 2 · L_{geonet,mellem} + 2 · d = ${tal(B.La)} m`,
          `L_{geonet,tot} = 2 · L_{geonet} + 2 · L_{geonet,mellem} + π · d = ${tal(B.Ltot)} m`,
        ],
      };
    case 'C':
      return (
        C && {
          raekker: [
            ['Forankring pr. side L_{geonet}', `${tal(C.L)} m`],
            ...faelles(C, tillaegOmslag.C),
            ['Opdriftskontrol', tal(C.kontrol), C.status],
          ],
          formler: [
            `Beregnet 2L = K/(F_{bund} + F_{top}/2) + 2 · 0,2 = ${tal(r.K)}/(${tal(r.Fbund)} + ${tal(r.Ftop)}/2) + 0,4 = ${tal(C.toLBeregnet)} m`,
            `L_{geonet} = max(${tal(mindste.medOmslag.prSide, 1)}; 2L/2) = max(${tal(mindste.medOmslag.prSide, 1)}; ${tal(C.toLBeregnet / 2)}) = ${tal(C.L)} m pr. side${bestemmende(C.L, C.toLBeregnet)}`,
            `L_{a} = 2 · L_{geonet} + d = ${tal(C.La)} m`,
            `L_{geonet,tot} = 4 · (L_{geonet} + 0,4) + π · d/2 = ${tal(C.Ltot)} m`,
            C.kontrol === null
              ? ingenKontrol
              : `Kontrol = (B_{d} + (F_{bund} + F_{top})/2 · 4 · L_{geonet})/O_{d} = ${tal(C.kontrol)} (krav > 1,0)`,
          ],
        }
      );
    case 'D':
      return (
        D && {
          raekker: [
            ['Forankring yderst L_{geonet}', `${tal(D.L)} m`],
            ['Mellem ledningerne 2 · L_{geonet}', `${tal(D.toLMellem)} m`],
            ...faelles(D, tillaegOmslag.D),
          ],
          formler: [
            `2 · L_{geonet} mellem = 2 · L_{geonet} = ${tal(D.toLMellem)} m, som med omslag`,
            `L_{a} = 2 · (2 · L_{geonet} + d) = ${tal(D.La)} m`,
            `L_{geonet,tot} = 4 · (2 · L_{geonet} + 0,4) + π · d = ${tal(D.Ltot)} m`,
          ],
        }
      );
  }
}

function LosningKort({
  r,
  input,
  losning,
}: {
  r: OpdriftResultat;
  input: ReturnType<typeof tilMotorInput>;
  losning: Losning;
}) {
  const titel = losningTitel[losning];
  const indhold = losningIndhold(r, input, losning);
  return (
    <article className="solution-card" aria-labelledby={`losning-${losning}`}>
      <h3 id={`losning-${losning}`}>{titel}</h3>
      {indhold ? (
        <>
          <Figur
            svg={losningSvg(r, input, losning)}
            label={`${titel}: geonet med forankringslængder og samlet bredde`}
          />
          <div className="solution-details">
            <Talraekke raekker={indhold.raekker} />
            <p className="calc-note">
              <Fmt text={losningNote[losning]} />
            </p>
            {(losning === 'B' || losning === 'D') && (
              <p className="calc-note">
                Der er ingen opdriftskontrol for to ledninger. Ved to forskellige ledninger angives
                den største diameter og den mindste egenvægt.
              </p>
            )}
            <Udfold titel="Mellemregninger">
              <Formler linjer={indhold.formler} />
            </Udfold>
          </div>
        </>
      ) : (
        <Notice>
          Omslag kræver, at rørmidten ligger mere end {tal(omslagAfstand, 1)} m under terræn.
        </Notice>
      )}
    </article>
  );
}

/** Mellemregningerne for O. I avanceret beregning med GVS under rørtoppen vises arealet under GVS. */
function opdriftLinjer(
  r: OpdriftResultat,
  input: ReturnType<typeof tilMotorInput>,
  zone: GvsZone | null,
): string[] {
  const { gammaF } = r.partialkoefficienter;
  if (!zone || zone.zone === 1)
    return [
      `O_{d} = π/4 · d² · γ_{w} · γ_{f} = π/4 · ${tal(input.d)}² · ${tal(gammaW)} · ${tal(gammaF)} = ${tal(r.O)} kN/m`,
    ];
  if (zone.zone === 4)
    return [
      `O_{d} = 0, da GVS ligger ved eller under rørbunden: T₂ = ${tal(input.gvs)} m ≥ h₁ + d = ${tal(input.h1 + input.d)} m`,
    ];
  return [
    `r = d/2 = ${tal(input.d / 2)} m og a = T₃ − T₂ = ${tal(r.T3)} − ${tal(input.gvs)} = ${tal(zone.a)} m`,
    `A_{tør} = r² · arccos(a/r) − a · √(r² − a²) = ${tal(zone.Ator, 4)} m²`,
    `A_{våd} = π/4 · d² − A_{tør} = ${tal(zone.Avaad + zone.Ator, 4)} − ${tal(zone.Ator, 4)} = ${tal(zone.Avaad, 4)} m²`,
    `O_{d} = A_{våd} · γ_{w} · γ_{f} = ${tal(zone.Avaad, 4)} · ${tal(gammaW)} · ${tal(gammaF)} = ${tal(r.O)} kN/m`,
  ];
}

/** Mellemregningerne for F_bund og F_top. Den avancerede beregning viser spændingen i nettets niveau
 * (K-19); arket regner altid med γ′_d. */
function forankringLinjer(r: OpdriftResultat, input: ReturnType<typeof tilMotorInput>): string[] {
  const mu = tal(standarder.mu);
  const tanPhi = `tan ${tal(r.phiD)}°`;
  if (r.metode === 'standard')
    return [
      `F_{bund} = h_{bund} · γ′_{d} · μ · tan φ_{d} = ${tal(r.hBund)} · ${tal(r.gammaEffD)} · ${mu} · ${tanPhi} = ${tal(r.Fbund)} kN/m`,
      `F_{top} = h_{top} · γ′_{d} · μ · tan φ_{d} = ${tal(r.hTop)} · ${tal(r.gammaEffD)} · ${mu} · ${tanPhi} = ${tal(r.Ftop)} kN/m`,
    ];
  const T2 = input.gvs;
  const spaending = (navn: string, h: number, sigma: number) =>
    T2 >= h
      ? `σ′_{v,${navn}} = h_{${navn}} · γ_{tør,d} = ${tal(h)} · ${tal(r.gammaTorD)} = ${tal(sigma)} kN/m², da GVS ligger under nettet`
      : `σ′_{v,${navn}} = T₂ · γ_{tør,d} + (h_{${navn}} − T₂) · γ′_{d} = ${tal(T2)} · ${tal(r.gammaTorD)} + ${tal(h - T2)} · ${tal(r.gammaEffD)} = ${tal(sigma)} kN/m²`;
  return [
    spaending('bund', r.hBund, r.forankringsspaending.bund),
    `F_{bund} = σ′_{v,bund} · μ · tan φ_{d} = ${tal(r.forankringsspaending.bund)} · ${mu} · ${tanPhi} = ${tal(r.Fbund)} kN/m`,
    spaending('top', r.hTop, r.forankringsspaending.top),
    `F_{top} = σ′_{v,top} · μ · tan φ_{d} = ${tal(r.forankringsspaending.top)} · ${mu} · ${tanPhi} = ${tal(r.Ftop)} kN/m`,
  ];
}

/** Mellemregningerne for B efter GVS' placering (docs/FORSLAG_K-05.md, afsnit 5). */
function ballastLinjer(r: OpdriftResultat, zone: GvsZone | null): string[] {
  const b = r.ballastLed;
  if (zone && zone.zone >= 3)
    return [
      'B_{d} = (T₃ · d − π · r²/2) · γ_{tør,d} + E_{d} · g/1000, da GVS ligger under rørmidten',
      `B_{d} = ${tal(b.torFyld)} − ${tal(b.roerHalvdel)} + ${tal(b.egenvaegt)} = ${tal(r.B)} kN/m`,
    ];
  if (b.roerDele)
    return [
      'B_{d} = T₂ · d · γ_{tør,d} + (T₃ − T₂) · d · γ′_{d} − A_{tør} · γ_{tør,d} − (π · r²/2 − A_{tør}) · γ′_{d} + E_{d} · g/1000',
      `B_{d} = ${tal(b.torFyld)} + ${tal(b.vaadFyld)} − ${tal(b.roerDele.tor)} − ${tal(b.roerDele.vaad)} + ${tal(b.egenvaegt)} = ${tal(r.B)} kN/m`,
    ];
  return [
    'B_{d} = T₂ · d · γ_{tør,d} + (T₃ − T₂) · d · γ′_{d} − (π/4 · d² · γ′_{d})/2 + E_{d} · g/1000',
    `B_{d} = ${tal(b.torFyld)} + ${tal(b.vaadFyld)} − ${tal(b.roerHalvdel)} + ${tal(b.egenvaegt)} = ${tal(r.B)} kN/m`,
  ];
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
  const avanceret = session.avanceret;
  const zone = r?.gvsZone ?? null;
  const cc3 = session.konsekvensklasse === 'CC3';
  // Standardberegningen og CC3 regner altid med GVS i terræn (beslutning 30. oktober 2026).
  const gvsLaast = cc3 || !avanceret;
  const ikkeRelevant = r !== null && r.Fopdrift <= 0;
  // Kun i avanceret beregning med GVS mellem rørtop og rørbund.
  const arealfigur = r ? opdriftsarealSvg(r, input) : null;

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
        <SettingField
          field={{
            key: 'avanceret',
            label: 'Avanceret beregning',
            kind: 'checkbox',
            help: 'I avanceret beregning kan der regnes med vandspejl under terræn, samt konsekvensklasse 3.',
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
        <Button variant="outline" onClick={() => update(standardSession())}>
          <RotateCcw aria-hidden="true" />
          Nulstil beregning
        </Button>
      </div>
      {avanceret && (
        <Notice className="calc-mode-notice">
          Avanceret beregning er valgt. Ved GVS under terræn regnes forankringen med tør fyld over
          GVS. Ligger GVS under rørtoppen, regnes opdrift og ballast desuden ud fra den del af
          røret, der står under vand. Ved GVS i terræn er resultatet det samme som i
          standardberegningen.
        </Notice>
      )}

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
            Standardberegningen regner altid med GVS i terræn. GVS under terræn kan regnes med
            avanceret beregning.
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
          {talfelt(
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
              <div className={arealfigur ? 'mellemregninger-med-figur' : undefined}>
                <div>
                  <Formler
                    linjer={[
                      `γ_{f} = γ_{G;dst} = ${tal(standarder.gammaGdst, 1)} · K_{FI} = ${tal(standarder.gammaGdst, 1)} · ${tal(pk.KFI, 1)} = ${tal(pk.gammaF)} (konsekvensklasse ${session.konsekvensklasse})`,
                      ...opdriftLinjer(r, input, zone),
                      ...ballastLinjer(r, zone),
                      r.S1 === null
                        ? 'S₁ kan ikke regnes, da røret ikke påvirkes af opdrift.'
                        : `S₁ = B_{d}/O_{d} = ${tal(r.B)}/${tal(r.O)} = ${tal(r.S1)}`,
                    ]}
                  />
                  <p className="calc-note">
                    <Fmt
                      text={`γ_{f} er partialkoefficienten γ_{G;dst} for ugunstig tyngde af (grund)vand i DS/EN 1997-1 DK NA:2021, tabel A.4-1 NA, som gælder for løftning (UPL) med trækelementer som geonet.`}
                    />
                  </p>
                  <p className="calc-note">
                    <Fmt
                      text={
                        avanceret
                          ? 'Opdriften O_{d} er vægten af det vand, røret fortrænger: den del af rørets udvendige tværsnit, der ligger under GVS, gange γ_{w}. Røret regnes tomt.'
                          : 'Opdriften O_{d} er vægten af det vand, røret fortrænger: rørets udvendige tværsnit π/4 · d² gange γ_{w}. Røret regnes tomt og helt under vand.'
                      }
                    />
                  </p>
                  <p className="calc-note">
                    Ballasten B<sub>d</sub> er fyldet i en lodret søjle med rørets bredde fra terræn
                    til rørmidte, minus rørets øverste halvdel, plus rørets egenvægt.
                  </p>
                  <p className="calc-note">
                    T₃ = h₁ + d/2 = {tal(r.T3)} m. Rørets egenvægt omregnes fra kg/m til kN/m med g
                    = {tal(g)} m/s², som er tyngdeaccelerationen i Danmark.
                  </p>
                </div>
                {arealfigur && (
                  <Figur
                    svg={arealfigur}
                    label="Rørets tværsnit delt af GVS: arealet over og under GVS"
                  />
                )}
              </div>
            </Udfold>
          </Trin>

          <Trin
            nr={6}
            titel="Geonet"
            opsummering={
              r.geonet.uts === null
                ? 'Kontakt leverandør'
                : ikkeRelevant
                  ? 'Ikke relevant'
                  : `X-GRID ${r.geonet.navn} · P_{d}/F_{op,d} = ${tal(r.geonet.sikkerhed)}`
            }
            dimmed={ikkeNoedvendig}
          >
            {ikkeNoedvendig && (
              <Notice>
                {r.S1 === null
                  ? 'Røret påvirkes ikke af opdrift, så opdriftssikring er ikke nødvendig. Tallene nedenfor vises til orientering.'
                  : `S₁ ≥ ${tal(standarder.krav.S1, 1)}: opdriftssikring er ikke nødvendig. Tallene nedenfor vises til orientering.`}
              </Notice>
            )}
            <div className="dim-results m9-result-cards">
              <Flise
                label="Restopdrift F_{op,d}"
                vaerdi={tal(r.Fopdrift)}
                enhed="kN/m"
                note="F_{op,d} = O_{d} − B_{d}"
              />
              <Flise
                label="Valgt geonet"
                vaerdi={r.geonet.uts === null ? 'Kontakt leverandør' : `X-GRID ${r.geonet.navn}`}
                note={
                  r.geonet.uts === null
                    ? 'Der produceres ikke geonet med den nødvendige styrke.'
                    : `Medregnet korttidstrækstyrke UTS = ${tal(r.geonet.uts, 0)} kN/m`
                }
              />
              <Flise
                label="Designtrækstyrke P_{d}"
                vaerdi={tal(r.geonet.Ptill)}
                enhed={r.geonet.Ptill === null ? undefined : 'kN/m'}
                note="P_{d} = UTS/RF"
              />
              {/* Ved F_op,d ≤ 0 er der intet at kontrollere (beslutning 30. oktober 2026). */}
              <Flise
                label="Styrkekontrol P_{d}/F_{op,d}"
                vaerdi={ikkeRelevant ? 'Ikke relevant' : tal(r.geonet.sikkerhed)}
                status={ikkeRelevant ? null : r.geonet.status}
                note={
                  r.geonet.sikkerhed !== null && !ikkeRelevant
                    ? `Krav: P_{d}/F_{op,d} > ${tal(standarder.krav.geonet)} (P_{d} udnyttet ${tal(100 / r.geonet.sikkerhed, 0)}%)`
                    : `Krav: P_{d}/F_{op,d} > ${tal(standarder.krav.geonet)}`
                }
              />
            </div>
            <p className="calc-note">
              Geonettet rulles ud på tværs af ledningen, så nettets styrke på langs af rullen
              udnyttes.
            </p>
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
                  `F_{op,d} = O_{d} − B_{d} = ${tal(r.O)} − ${tal(r.B)} = ${tal(r.Fopdrift)} kN/m`,
                  r.geonet.uts === null
                    ? `Intet produkt i ét lag opfylder P_{d}/F_{op,d} > ${tal(standarder.krav.geonet)} ved F_{op,d} = ${tal(r.Fopdrift)} kN/m.`
                    : `P_{d} = UTS/RF = ${tal(r.geonet.uts, 0)}/${tal(r.geonet.RF)} = ${tal(r.geonet.Ptill)} kN/m`,
                ]}
              />
              <h3 className="mellemregninger-overskrift">Reduktionsfaktor (RF)</h3>
              <p className="calc-note">RF beregnes som produktet af følgende faktorer:</p>
              <TabelRamme label="Reduktionsfaktor">
                <table className="data-table rf-table">
                  <tbody>
                    {(
                      [
                        [
                          'Krybningsfaktor (f_{kryb})',
                          'max 120 års levetid',
                          standarder.geonet.fKryb,
                        ],
                        [
                          'Produktions- og ekstrapolationsfaktor (f_{m})',
                          'max 120 års levetid',
                          standarder.geonet.fM,
                        ],
                        [
                          'Mekanisk beskadigelse (f_{d})',
                          'afrundede kornfraktioner, D < 35 mm',
                          standarder.geonet.fD,
                        ],
                        ['Kemisk påvirkning (f_{e})', 'pH 4,1–8,9', standarder.geonet.fE],
                      ] as const
                    ).map(([navn, note, vaerdi]) => (
                      <tr key={navn}>
                        <th scope="row">
                          <Fmt text={navn} />
                          <span className="rf-note">{note}</span>
                        </th>
                        <td className="num">{tal(vaerdi)}</td>
                      </tr>
                    ))}
                    <tr className="rf-sum">
                      <th scope="row">
                        Samlet reduktionsfaktor (RF)
                        <span className="rf-note">
                          <Fmt text="RF = f_{kryb} · f_{m} · f_{d} · f_{e}" />
                        </span>
                      </th>
                      <td className="num">{tal(r.geonet.RF)}</td>
                    </tr>
                  </tbody>
                </table>
              </TabelRamme>
              <p className="calc-note">
                Reduktionsfaktorer fremgår af “British Board of Agreement” (BBA) certifikat No.{' '}
                {standarder.geonet.bba}, se{' '}
                <a href="https://www.byggros.com" target="_blank" rel="noreferrer">
                  www.byggros.com
                </a>
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
                note={`K = F_{op,d} · S₂, S₂ = ${tal(standarder.S2)}`}
              />
            </div>
            <Udfold titel="Mellemregninger for kraftoverførsel">
              <Formler
                linjer={[
                  `φ_{d} = arctan(tan φ_{k}/γ_{φ}) = arctan(tan ${tal(i.phi)}°/${tal(pk.gammaPhi)}) = ${tal(r.phiD)}°`,
                  ...forankringLinjer(r, input),
                  `K = F_{op,d} · S₂ = ${tal(r.Fopdrift)} · ${tal(standarder.S2)} = ${tal(r.K)} kN/m`,
                ]}
              />
              <p className="calc-note">
                <Fmt
                  text={`${avanceret ? 'Kraftoverførslen regnes med den effektive lodrette spænding i nettets niveau: tør fyld over GVS og effektiv rumvægt under.' : 'Geonettet ligger under GVS, så kraftoverførslen regnes med γ′_{d}.'} Forankringen på begge sider skal tilsammen optage K = F_{op,d} · S₂.`}
                />
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
