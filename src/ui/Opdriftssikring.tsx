import type { ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { beregnOpdrift, type GvsZone, type OpdriftResultat, type Status } from '../engine/opdrift';
import { beregnDybForankring, type DybForankring } from '../engine/dybforankring';
import { geonetProdukter } from '../engine/geonet';
import standarder from '../engine/defaults.json' with { type: 'json' };
import {
  dybForankringSvg,
  losningSvg,
  opdriftsarealSvg,
  tvaersnitSvg,
  type Losning,
} from '../engine/figurer';
import { tal, talKort } from '../engine/format';
import { Fmt } from './Fmt';
import { Notice } from './Notice';
import { TabelRamme } from './TabelRamme';
import { PageFooter, PageHeader } from './page';
import { SaveState } from './SaveState';
import { useSession } from './SessionContext';
import { SettingField } from './SettingField';
import { dybKontrolpunktTekst, kontrolpunktTekster } from './kontrolpunkter';
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

/** Én mellemregning: forklaring, formel med indsatte tal og resultat. */
interface Mellemregning {
  forklaring: string;
  /** Betingelse eller bemærkning med lille skrift under forklaringen. */
  detalje?: string;
  formel: string;
  /** Uden resultat fylder formlen også resultatkolonnen. */
  resultat?: string;
  status?: Status | null;
  /** Gruppens resultat og kontroller fremhæves. */
  hoved?: boolean;
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

const kNm = (x: number | null) => `${tal(x)} kN/m`;
const meter = (x: number | null) => `${tal(x)} m`;

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
const losningNote = (afstand: number): Record<Losning, string> => ({
  A: `Der forankres altid med mindst ${tal(mindste.udenOmslag.prSide, 1)} m på hver side.`,
  B: `Der forankres altid med mindst ${tal(mindste.udenOmslag.prSide, 1)} m yderst på hver side. Mellem ledningerne holdes nettet nede af fyldets vægt, så L_{mellem} er et opdriftsproblem og ikke et forankringsproblem. Der regnes med en partialkoefficient på ${tal(faktorMellemRoer, 1)} mellem ledningerne.`,
  C: `Omslag kan bruges ved pladsproblemer. Der forankres altid med mindst ${tal(mindste.medOmslag.prSide, 1)} m på hver side. Der armeres lige meget i top og bund med ${talKort(afstand)} m mellem lagene.`,
  D: 'Som med omslag ved én ledning. Afstanden mellem rørene L_{mellem} skal være mindst 2 · L_{geonet}.',
});

/** Arkets tillæg i netlængden med omslag ud over de lodrette stykker (fund K-09). Det er det samme
 * for alle afstande mellem netlagene (fund K-26). */
const tillaegOmslag = {
  C: 4 * netTillaegOmslag - 2 * omslagAfstand,
  D: 4 * netTillaegOmslag - 4 * omslagAfstand,
};

/** Noter om kontrollen ved løsningerne med én ledning (fund K-11, beslutning 31. oktober 2026). */
const kontrolNote = {
  udenOmslag:
    'Kontrollen er eftervisningen for løftning: O_{d} ≤ B_{d} + F_{bund} · 2 · L_{geonet}. Den er altid opfyldt, når forankringslængden er dimensioneret efter K = F_{op,d} · S₂, og viser tillægget fra S₂ (fund K-11).',
  medOmslag:
    'Kontrollen er eftervisningen for løftning med begge netlag. Den er altid opfyldt, når forankringslængden er dimensioneret efter K = F_{op,d} · S₂ (fund K-11).',
};

/** Ekstra lodrette stykker i netlængden, når netlagene ligger mere end 0,2 m fra hinanden (K-26). */
const lodretTillaegTal = (r: OpdriftResultat, antal: number) =>
  r.omslagAfstand === standarder.omslagAfstand
    ? ''
    : ` + ${antal} · (${talKort(r.omslagAfstand)} − ${talKort(standarder.omslagAfstand)})`;

/** Rækker og mellemregninger for én løsning. null, når omslag ikke er muligt. */
function losningIndhold(
  r: OpdriftResultat,
  input: ReturnType<typeof tilMotorInput>,
  losning: Losning,
): {
  raekker: [string, string, (Status | null)?][];
  beregning: Mellemregning[];
  note?: string;
} | null {
  const { A, B, C, D } = r.losninger;
  const torTilMidte = r.gvsZone !== null && r.gvsZone.zone >= 3;
  const lodretTillaeg = (antal: number) => lodretTillaegTal(r, antal);
  const d = input.d;
  const T2 = input.gvs;
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
  const forankring = (L: number, beregnet: number, mindst: number): Mellemregning => ({
    forklaring: 'Anvendt forankringslængde pr. side',
    detalje: L > beregnet / 2 ? 'mindstelængden er bestemmende' : undefined,
    formel: `L_{geonet} = max(${tal(mindst, 1)}; 2L/2) = max(${tal(mindst, 1)}; ${tal(beregnet / 2)})`,
    resultat: meter(L),
  });
  const bredde = (formel: string, La: number): Mellemregning => ({
    forklaring: 'Vandret bredde fra nettets ene ende til den anden',
    formel,
    resultat: meter(La),
  });
  const netlaengde = (
    forklaring: string,
    formel: string,
    Ltot: number,
    detalje?: string,
  ): Mellemregning => ({
    forklaring,
    detalje,
    formel,
    resultat: meter(Ltot),
  });
  const kontrol = (
    formel: string,
    x: { kontrol: number | null; status: Status | null },
  ): Mellemregning => ({
    forklaring: 'Ballast og forankring i forhold til opdriften',
    ...(x.kontrol === null
      ? { formel: 'Kontrollen kan ikke regnes, da røret ikke påvirkes af opdrift.' }
      : { formel: `${formel} (krav > 1,0)`, resultat: tal(x.kontrol), status: x.status }),
    hoved: true,
  });
  switch (losning) {
    case 'A':
      return {
        raekker: [
          ['Forankring pr. side L_{geonet}', `${tal(A.L)} m`],
          ...faelles(A),
          ['Opdriftskontrol', tal(A.kontrol), A.status],
        ],
        note: A.kontrol === null ? undefined : kontrolNote.udenOmslag,
        beregning: [
          {
            forklaring: 'Samlet forankringslængde der skal til for at optage K',
            formel: `Beregnet 2L = K/F_{bund} = ${tal(r.K)}/${tal(r.Fbund)}`,
            resultat: meter(A.toLBeregnet),
          },
          forankring(A.L, A.toLBeregnet, mindste.udenOmslag.prSide),
          bredde(`L_{a} = 2 · L_{geonet} + d = 2 · ${tal(A.L)} + ${tal(d)}`, A.La),
          netlaengde(
            'Samlet længde geonet på tværs af ledningen',
            'L_{geonet,tot} = 2 · L_{geonet} + π · d/2',
            A.Ltot,
          ),
          kontrol(
            `Kontrol = (B_{d} + F_{bund} · 2 · L_{geonet})/O_{d} = (${tal(r.B)} + ${tal(r.Fbund)} · 2 · ${tal(A.L)})/${tal(r.O)}`,
            A,
          ),
        ],
      };
    case 'B':
      return {
        raekker: [
          ['Forankring yderst L_{geonet}', `${tal(B.L)} m`],
          ['Mellem ledningerne L_{mellem}', `${tal(B.toLMellem)} m`],
          ...faelles(B),
        ],
        beregning: [
          {
            forklaring: 'Effektiv lodret spænding mellem ledningerne',
            detalje: `i nettets niveau${torTilMidte ? ', GVS ligger under rørmidten' : ''}`,
            formel: torTilMidte
              ? `σ′_{v} = T₃ · γ_{tør,d} = ${tal(r.T3)} · ${tal(r.gammaTorD)}`
              : `σ′_{v} = T₂ · γ_{tør,d} + (T₃ − T₂) · γ′_{d} = ${tal(T2)} · ${tal(r.gammaTorD)} + ${tal(r.T3 - T2)} · ${tal(r.gammaEffD)}`,
            resultat: `${tal(B.sigmaV)} kN/m²`,
          },
          {
            forklaring: 'Nettets længde mellem ledningerne',
            detalje: 'hvor fyldets vægt holder nettet nede',
            formel: `L_{mellem} = max(0,5; F_{op,d} · 1,2/σ′_{v}) = max(0,5; ${tal(r.Fopdrift)} · 1,2/${tal(B.sigmaV)})`,
            resultat: meter(B.toLMellem),
          },
          {
            forklaring: 'Forankringslængde yderst på hver side',
            detalje: 'som uden omslag',
            formel: 'L_{geonet} yderst = L_{geonet} uden omslag',
            resultat: meter(B.L),
          },
          bredde('L_{a} = 2 · L_{geonet} + L_{mellem} + 2 · d', B.La),
          netlaengde(
            'Samlet længde geonet på tværs af ledningerne',
            'L_{geonet,tot} = 2 · L_{geonet} + L_{mellem} + π · d',
            B.Ltot,
          ),
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
          note: C.kontrol === null ? undefined : kontrolNote.medOmslag,
          beregning: [
            {
              forklaring: 'Samlet forankringslængde der skal til for at optage K',
              detalje: 'med omslag',
              formel: `Beregnet 2L = K/(F_{bund} + F_{top}/2) + 2 · ${talKort(r.omslagAfstand)} = ${tal(r.K)}/(${tal(r.Fbund)} + ${tal(r.Ftop)}/2) + ${talKort(2 * r.omslagAfstand)}`,
              resultat: meter(C.toLBeregnet),
            },
            forankring(C.L, C.toLBeregnet, mindste.medOmslag.prSide),
            bredde(`L_{a} = 2 · L_{geonet} + d = 2 · ${tal(C.L)} + ${tal(d)}`, C.La),
            netlaengde(
              'Samlet længde geonet på tværs af ledningen',
              `L_{geonet,tot} = 4 · (L_{geonet} + 0,4) + π · d/2${lodretTillaeg(2)}`,
              C.Ltot,
              'inkl. omslag og overlæg',
            ),
            kontrol('Kontrol = (B_{d} + (F_{bund} + F_{top})/2 · 4 · L_{geonet})/O_{d}', C),
          ],
        }
      );
    case 'D':
      return (
        D && {
          raekker: [
            ['Forankring yderst L_{geonet}', `${tal(D.L)} m`],
            ['Mellem ledningerne L_{mellem}', `${tal(D.toLMellem)} m`],
            ...faelles(D, tillaegOmslag.D),
          ],
          beregning: [
            {
              forklaring: 'Nettets længde mellem ledningerne',
              detalje: 'som med omslag',
              formel: 'L_{mellem} = 2 · L_{geonet}',
              resultat: meter(D.toLMellem),
            },
            bredde('L_{a} = 2 · L_{geonet} + L_{mellem} + 2 · d', D.La),
            netlaengde(
              'Samlet længde geonet på tværs af ledningerne',
              `L_{geonet,tot} = 4 · (2 · L_{geonet} + 0,4) + π · d${lodretTillaeg(4)}`,
              D.Ltot,
              'inkl. omslag og overlæg',
            ),
          ],
        }
      );
  }
}

function LosningKort({
  r,
  input,
  losning,
  ikkeRelevant,
}: {
  r: OpdriftResultat;
  input: ReturnType<typeof tilMotorInput>;
  losning: Losning;
  ikkeRelevant: boolean;
}) {
  const titel = losningTitel[losning];
  const indhold = losningIndhold(r, input, losning);
  // Er sikring ikke nødvendig, udelades den målsatte figur, og rækkerne viser »Ikke relevant«.
  return (
    <article className="solution-card" aria-labelledby={`losning-${losning}`}>
      <h3 id={`losning-${losning}`}>{titel}</h3>
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
            {(losning === 'B' || losning === 'D') && (
              <p className="calc-note">
                Der er ingen opdriftskontrol for to ledninger. Ved to forskellige ledninger angives
                den største diameter og den mindste egenvægt.
              </p>
            )}
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

/** Mellemregningerne for O_d. I avanceret beregning med GVS under rørtoppen vises arealet under GVS. */
function opdriftRaekker(
  r: OpdriftResultat,
  input: ReturnType<typeof tilMotorInput>,
  zone: GvsZone | null,
): Mellemregning[] {
  const { gammaF } = r.partialkoefficienter;
  const opdrift = (formel: string): Mellemregning => ({
    forklaring: 'Regningsmæssig opdrift',
    formel,
    resultat: kNm(r.O),
    hoved: true,
  });
  if (!zone || zone.zone === 1)
    return [
      opdrift(
        `O_{d} = π/4 · d² · γ_{w} · γ_{f} = π/4 · ${tal(input.d)}² · ${tal(gammaW)} · ${tal(gammaF)}`,
      ),
    ];
  if (zone.zone === 4)
    return [
      opdrift(
        `O_{d} = 0, da GVS ligger ved eller under rørbunden: T₂ = ${tal(input.gvs)} m ≥ h₁ + d = ${tal(input.h1 + input.d)} m`,
      ),
    ];
  return [
    {
      forklaring: 'Rørets radius',
      formel: `r = d/2 = ${tal(input.d)}/2`,
      resultat: meter(input.d / 2),
    },
    {
      forklaring: "GVS' højde over rørmidten",
      formel: `a = T₃ − T₂ = ${tal(r.T3)} − ${tal(input.gvs)}`,
      resultat: meter(zone.a),
    },
    {
      forklaring: 'Rørets tværsnit over GVS',
      formel: 'A_{tør} = r² · arccos(a/r) − a · √(r² − a²)',
      resultat: `${tal(zone.Ator, 4)} m²`,
    },
    {
      forklaring: 'Rørets tværsnit under GVS',
      formel: `A_{våd} = π/4 · d² − A_{tør} = ${tal(zone.Avaad + zone.Ator, 4)} − ${tal(zone.Ator, 4)}`,
      resultat: `${tal(zone.Avaad, 4)} m²`,
    },
    opdrift(
      `O_{d} = A_{våd} · γ_{w} · γ_{f} = ${tal(zone.Avaad, 4)} · ${tal(gammaW)} · ${tal(gammaF)}`,
    ),
  ];
}

/** Mellemregningerne for B_d led for led efter GVS' placering (docs/FORSLAG_K-05.md, afsnit 5). */
function ballastRaekker(
  r: OpdriftResultat,
  input: ReturnType<typeof tilMotorInput>,
  zone: GvsZone | null,
): Mellemregning[] {
  const b = r.ballastLed;
  const d = input.d;
  const T2 = input.gvs;
  const tor = tal(r.gammaTorD);
  const eff = tal(r.gammaEffD);
  // Rørets øverste halvdel, (π/4 · d²)/2.
  const halvRoer = zone ? (zone.Avaad + zone.Ator) / 2 : 0;
  const egenvaegt: Mellemregning = {
    forklaring: 'Rørets egenvægt',
    formel: `E_{d} · g/1000 = ${tal(r.roervaegtD)} · ${tal(g)}/1000`,
    resultat: kNm(b.egenvaegt),
  };
  const sum = (led: string): Mellemregning => ({
    forklaring: 'Stabiliserende ballast',
    formel: `B_{d} = ${led}`,
    resultat: kNm(r.B),
    hoved: true,
  });
  if (zone && zone.zone >= 3)
    return [
      {
        forklaring: 'Tørt fyld til rørmidten',
        detalje: 'GVS ligger under rørmidten',
        formel: `T₃ · d · γ_{tør,d} = ${tal(r.T3)} · ${tal(d)} · ${tor}`,
        resultat: kNm(b.torFyld),
      },
      {
        forklaring: 'Rørets øverste halvdel',
        formel: `(π/4 · d²)/2 · γ_{tør,d} = ${tal(halvRoer, 4)} · ${tor}`,
        resultat: kNm(-b.roerHalvdel),
      },
      egenvaegt,
      sum(`${tal(b.torFyld)} − ${tal(b.roerHalvdel)} + ${tal(b.egenvaegt)}`),
    ];
  const fyld: Mellemregning[] = [
    {
      forklaring: 'Fyld over GVS',
      formel: `T₂ · d · γ_{tør,d} = ${tal(T2)} · ${tal(d)} · ${tor}`,
      resultat: kNm(b.torFyld),
    },
    {
      forklaring: 'Fyld under GVS',
      formel: `(T₃ − T₂) · d · γ′_{d} = ${tal(r.T3 - T2)} · ${tal(d)} · ${eff}`,
      resultat: kNm(b.vaadFyld),
    },
  ];
  if (zone && b.roerDele)
    return [
      ...fyld,
      {
        forklaring: 'Rørets del over GVS',
        formel: `A_{tør} · γ_{tør,d} = ${tal(zone.Ator, 4)} · ${tor}`,
        resultat: kNm(-b.roerDele.tor),
      },
      {
        forklaring: 'Resten af rørets øverste halvdel',
        formel: `((π/4 · d²)/2 − A_{tør}) · γ′_{d} = (${tal(halvRoer, 4)} − ${tal(zone.Ator, 4)}) · ${eff}`,
        resultat: kNm(-b.roerDele.vaad),
      },
      egenvaegt,
      sum(
        `${tal(b.torFyld)} + ${tal(b.vaadFyld)} − ${tal(b.roerDele.tor)} − ${tal(b.roerDele.vaad)} + ${tal(b.egenvaegt)}`,
      ),
    ];
  return [
    ...fyld,
    {
      forklaring: 'Rørets øverste halvdel',
      formel: `(π/4 · d² · γ′_{d})/2 = (π/4 · ${tal(d)}² · ${eff})/2`,
      resultat: kNm(-b.roerHalvdel),
    },
    egenvaegt,
    sum(`${tal(b.torFyld)} + ${tal(b.vaadFyld)} − ${tal(b.roerHalvdel)} + ${tal(b.egenvaegt)}`),
  ];
}

/** Mellemregningerne for F_bund og F_top. Den avancerede beregning viser spændingen i nettets niveau
 * (K-19); arket regner altid med γ′_d. */
function forankringRaekker(
  r: OpdriftResultat,
  input: ReturnType<typeof tilMotorInput>,
): Mellemregning[] {
  const mu = tal(standarder.mu);
  const tanPhi = `tan ${tal(r.phiD)}°`;
  const niveau = { bund: 'i nettets niveau ved rørmidten', top: 'i det øverste netlags niveau' };
  const kraft = (navn: 'bund' | 'top', formel: string, F: number): Mellemregning => ({
    forklaring: `Kraftoverførsel ${niveau[navn]}`,
    detalje: `pr. meter forankringslængde${navn === 'top' ? ' ved omslag' : ''}`,
    formel,
    resultat: kNm(F),
  });
  if (r.metode === 'standard')
    return [
      kraft(
        'bund',
        `F_{bund} = h_{bund} · γ′_{d} · μ · tan φ_{d} = ${tal(r.hBund)} · ${tal(r.gammaEffD)} · ${mu} · ${tanPhi}`,
        r.Fbund,
      ),
      kraft(
        'top',
        `F_{top} = h_{top} · γ′_{d} · μ · tan φ_{d} = ${tal(r.hTop)} · ${tal(r.gammaEffD)} · ${mu} · ${tanPhi}`,
        r.Ftop,
      ),
    ];
  const T2 = input.gvs;
  const spaending = (navn: 'bund' | 'top', h: number, sigma: number): Mellemregning => ({
    forklaring: `Effektiv lodret spænding ${niveau[navn]}`,
    detalje: T2 >= h ? 'GVS ligger under nettet' : undefined,
    formel:
      T2 >= h
        ? `σ′_{v,${navn}} = h_{${navn}} · γ_{tør,d} = ${tal(h)} · ${tal(r.gammaTorD)}`
        : `σ′_{v,${navn}} = T₂ · γ_{tør,d} + (h_{${navn}} − T₂) · γ′_{d} = ${tal(T2)} · ${tal(r.gammaTorD)} + ${tal(h - T2)} · ${tal(r.gammaEffD)}`,
    resultat: `${tal(sigma)} kN/m²`,
  });
  const { bund, top } = r.forankringsspaending;
  return [
    spaending('bund', r.hBund, bund),
    kraft(
      'bund',
      `F_{bund} = σ′_{v,bund} · μ · tan φ_{d} = ${tal(bund)} · ${mu} · ${tanPhi}`,
      r.Fbund,
    ),
    spaending('top', r.hTop, top),
    kraft('top', `F_{top} = σ′_{v,top} · μ · tan φ_{d} = ${tal(top)} · ${mu} · ${tanPhi}`, r.Ftop),
  ];
}

/** Kort 8: dybere forankring ved begrænset plads for én ledning med omslag (fund K-25,
 * docs/FORSLAG_DYB_FORANKRING.md). Teksterne er godkendt 31. oktober 2026. */
function DybForankringKort({
  r,
  input,
  session,
  saet,
  ikkeNoedvendigNote,
  omslagIkkeMuligt,
  dyb,
}: {
  r: OpdriftResultat;
  input: ReturnType<typeof tilMotorInput>;
  session: Session;
  saet: (aendring: Partial<Session['inddata']>) => void;
  ikkeNoedvendigNote: string | null;
  omslagIkkeMuligt: boolean;
  dyb: { ok: true; resultat: DybForankring } | { ok: false; fejl: string } | null;
}) {
  const i = session.inddata;
  const laast = ikkeNoedvendigNote !== null || omslagIkkeMuligt;
  const res = dyb?.ok ? dyb.resultat : null;
  const C = r.losninger.C;
  return (
    <>
      <p className="calc-note">
        Når der ikke er plads til forankringslængden fra løsningen med omslag for én ledning, kan
        nettet føres længere ned langs rørets sider og forankres dybere. Beregningen finder den
        dybde, hvor den angivne forankringslængde er tilstrækkelig.
      </p>
      {ikkeNoedvendigNote && <Notice>{ikkeNoedvendigNote}</Notice>}
      {omslagIkkeMuligt && (
        <Notice>
          Omslag kræver, at rørmidten ligger mere end {talKort(r.omslagAfstand)} m under terræn.
        </Notice>
      )}
      {!laast && (
        <Notice kind="warning">
          Dybere forankring er ikke en dokumenteret metode og indgår ikke i regnearket. Længden
          regnes med samme friktionsmodel som løsningen med omslag. Lokal jordreaktion ved nettets
          retningsændringer, jordbrud, netkræfter og deformationer er ikke eftervist og skal
          eftervises særskilt, før løsningen bruges til udførelse.
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
      {res?.tilstand === 'tilstraekkelig' && C && (
        <Notice>
          <Fmt
            text={`Løsningen »Med omslag, én ledning« i kort 7 giver L_{geonet} = ${tal(C.L)} m pr. side med forankring ved rørmidten. Den angivne længde på ${tal(res.L)} m er tilstrækkelig, så dybere forankring er ikke nødvendig.`}
          />
        </Notice>
      )}
      {res?.tilstand === 'dybere' && <DybResultat r={r} input={input} dyb={res} />}
    </>
  );
}

function DybResultat({
  r,
  input,
  dyb,
}: {
  r: OpdriftResultat;
  input: ReturnType<typeof tilMotorInput>;
  dyb: Extract<DybForankring, { tilstand: 'dybere' }>;
}) {
  const { d, gvs } = input;
  const mu = tal(standarder.mu);
  const tanPhi = `tan ${tal(r.phiD)}°`;
  const roerbund =
    Math.abs(dyb.underRoerbund) < 0.005
      ? 'ved rørbunden'
      : dyb.underRoerbund > 0
        ? `${tal(dyb.underRoerbund)} m under rørbunden`
        : `${tal(-dyb.underRoerbund)} m over rørbunden`;
  const spaending = (
    navn: 'bund' | 'top',
    h: number,
    sigma: number,
    lag: string,
  ): Mellemregning => ({
    forklaring: `Effektiv lodret spænding i ${lag} netlag`,
    detalje: gvs >= h ? 'GVS ligger under nettet' : undefined,
    formel:
      gvs >= h
        ? `σ′_{v,${navn}} = h_{${navn}} · γ_{tør,d} = ${tal(h)} · ${tal(r.gammaTorD)}`
        : `σ′_{v,${navn}} = T₂ · γ_{tør,d} + (h_{${navn}} − T₂) · γ′_{d} = ${tal(gvs)} · ${tal(r.gammaTorD)} + ${tal(h - gvs)} · ${tal(r.gammaEffD)}`,
    resultat: `${tal(sigma)} kN/m²`,
  });
  const kraft = (navn: 'bund' | 'top', sigma: number, F: number, lag: string): Mellemregning => ({
    forklaring: `Kraftoverførsel i ${lag} netlag`,
    detalje: 'pr. meter forankringslængde',
    formel: `F_{${navn}} = σ′_{v,${navn}} · μ · tan φ_{d} = ${tal(sigma)} · ${mu} · ${tanPhi}`,
    resultat: kNm(F),
  });
  return (
    <>
      {dyb.underRoerbund > 0 && (
        <Notice kind="warning">
          Det nederste netlag ligger {tal(dyb.underRoerbund)} m under rørbunden. Udgravning,
          indbygning og komprimering under røret skal vurderes særskilt.
        </Notice>
      )}
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
      <Udfold titel="Mellemregninger">
        <Beregning
          titel="Nødvendig kraftoverførsel"
          raekker={[
            {
              forklaring: 'Kraft forankringen skal dimensioneres for',
              detalje: 'fra kort 7',
              formel: `K = F_{op,d} · S₂ = ${tal(r.Fopdrift)} · ${tal(r.S2)}`,
              resultat: kNm(r.K),
            },
            {
              forklaring: 'Mulig forankringslængde pr. side',
              formel: 'L_{geonet}, angivet',
              resultat: meter(dyb.L),
            },
            {
              forklaring: 'Nødvendig kraftoverførsel',
              formel: `F_{bund} + F_{top}/2 = K/(2 · L_{geonet} − 2 · ${talKort(r.omslagAfstand)}) = ${tal(r.K)}/(2 · ${tal(dyb.L)} − ${talKort(2 * r.omslagAfstand)})`,
              resultat: kNm(dyb.krav),
              hoved: true,
            },
          ]}
        />
        <Beregning
          titel="Nødvendig dybde"
          raekker={[
            spaending('bund', dyb.hBund, dyb.spaending.bund, 'nederste'),
            kraft('bund', dyb.spaending.bund, dyb.Fbund, 'nederste'),
            spaending('top', dyb.hTop, dyb.spaending.top, 'øverste'),
            kraft('top', dyb.spaending.top, dyb.Ftop, 'øverste'),
            {
              forklaring: 'Nødvendig dybde til nederste netlag',
              formel: `h_{bund}, hvor F_{bund} + F_{top}/2 = ${tal(dyb.Fbund)} + ${tal(dyb.Ftop)}/2 = ${tal(dyb.krav)} kN/m`,
              resultat: meter(dyb.hBund),
              hoved: true,
            },
            {
              forklaring: 'Længden med dybden indsat igen',
              detalje: `L_{geonet} = 2L/2 = ${tal(dyb.toL / 2)} m`,
              formel: `2L = K/(F_{bund} + F_{top}/2) + 2 · ${talKort(r.omslagAfstand)} = ${tal(r.K)}/(${tal(dyb.Fbund)} + ${tal(dyb.Ftop)}/2) + ${talKort(2 * r.omslagAfstand)}`,
              resultat: meter(dyb.toL),
            },
          ]}
        />
        <Beregning
          titel="Netlængde og kontrol"
          raekker={[
            {
              forklaring: 'Sænkning under rørmidten',
              formel: `Δh = h_{bund} − T₃ = ${tal(dyb.hBund)} − ${tal(r.T3)}`,
              resultat: meter(dyb.dh),
            },
            {
              forklaring: 'Samlet længde geonet på tværs af ledningen',
              detalje: 'inkl. omslag, overlæg og sider',
              formel: `L_{geonet,tot} = 4 · (L_{geonet} + ${tal(netTillaegOmslag, 1)}) + π · d/2 + 2 · Δh = 4 · (${tal(dyb.L)} + ${tal(netTillaegOmslag, 1)}) + π · ${tal(d)}/2 + 2 · ${tal(dyb.dh)}${lodretTillaegTal(r, 2)}`,
              resultat: meter(dyb.Ltot),
            },
            {
              forklaring: 'Ballast og forankring i forhold til opdriften',
              formel:
                'Kontrol = (B_{d} + (F_{bund} + F_{top})/2 · 4 · L_{geonet})/O_{d} (krav > 1,0)',
              resultat: tal(dyb.kontrol),
              status: dyb.status,
              hoved: true,
            },
          ]}
        />
        <p className="calc-note">
          <Fmt text={kontrolNote.medOmslag} />
        </p>
      </Udfold>
    </>
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
  // Noten i kort 6 og 7, når opdriftssikring ikke er nødvendig (beslutning 31. oktober 2026).
  const ikkeNoedvendigNote =
    r?.S1 === null
      ? 'Røret påvirkes ikke af opdrift, så opdriftssikring er ikke nødvendig.'
      : `S₁ ≥ ${tal(standarder.krav.S1, 1)}: opdriftssikring er ikke nødvendig da ballasten er tilstrækkelig til at modvirke opdriften.`;
  const pk = r?.partialkoefficienter;
  const avanceret = session.avanceret;
  const zone = r?.gvsZone ?? null;
  const cc3 = session.konsekvensklasse === 'CC3';
  // Standardberegningen og CC3 regner altid med GVS i terræn (beslutning 30. oktober 2026).
  const gvsLaast = cc3 || !avanceret;
  // Kun i avanceret beregning med GVS mellem rørtop og rørbund.
  const arealfigur = r ? opdriftsarealSvg(r, input) : null;
  // Dybere forankring ved begrænset plads (fund K-25, docs/FORSLAG_DYB_FORANKRING.md): kun i avanceret
  // beregning og kun for én ledning med omslag.
  const omslagIkkeMuligt = r !== null && r.losninger.C === null;
  const dybLaast = ikkeNoedvendig || omslagIkkeMuligt;
  const dyb =
    r && avanceret && i.dybForankringAktiv && !dybLaast
      ? beregnDybForankring(r, input, i.dybForankringL)
      : null;
  const dybRes = dyb?.ok ? dyb.resultat : null;
  const dybere = dybRes?.tilstand === 'dybere' ? dybRes : null;
  const punkter = r
    ? [
        ...kontrolpunktTekster(r),
        ...(dybere ? [{ kode: 'K-25', tekst: dybKontrolpunktTekst(dybere) }] : []),
      ]
    : [];

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
            help: 'I avanceret beregning kan der regnes med vandspejl under terræn, samt konsekvensklasse 3 og dybere forankring ved begrænset plads.',
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
                    raekker={[
                      {
                        forklaring: 'Partialkoefficient på opdriften',
                        formel: `γ_{f} = γ_{G;dst} = ${tal(standarder.gammaGdst, 1)} · K_{FI} = ${tal(standarder.gammaGdst, 1)} · ${tal(pk.KFI, 1)} (${session.konsekvensklasse})`,
                        resultat: tal(pk.gammaF),
                      },
                      {
                        forklaring: 'Dybde fra terræn til rørmidten',
                        formel: `T₃ = h₁ + d/2 = ${tal(input.h1)} + ${tal(input.d)}/2`,
                        resultat: meter(r.T3),
                      },
                      ...opdriftRaekker(r, input, zone),
                    ]}
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
              <Beregning
                smal={Boolean(arealfigur)}
                titel="Stabiliserende ballast"
                raekker={ballastRaekker(r, input, zone)}
              />
              <p className="calc-note">
                Ballasten B<sub>d</sub> er fyldet i en lodret søjle med rørets bredde fra terræn til
                rørmidte, minus rørets øverste halvdel, plus rørets egenvægt.
              </p>
              <p className="calc-note">
                Rørets egenvægt omregnes fra kg/m til kN/m med tyngdeaccelerationen g = {tal(g)}{' '}
                m/s².
              </p>
              <Beregning
                smal={Boolean(arealfigur)}
                titel="Kontrol uden geonet"
                raekker={[
                  r.S1 === null
                    ? {
                        forklaring: 'Ballast i forhold til opdrift',
                        formel: 'S₁ kan ikke regnes, da røret ikke påvirkes af opdrift.',
                        hoved: true,
                      }
                    : {
                        forklaring: 'Ballast i forhold til opdrift',
                        formel: `S₁ = B_{d}/O_{d} = ${tal(r.B)}/${tal(r.O)} (krav ≥ ${tal(standarder.krav.S1, 1)})`,
                        resultat: tal(r.S1),
                        status: r.S1Status,
                        hoved: true,
                      },
                ]}
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
            <div className="calc-override">
              <SettingField
                field={{
                  key: 'input-overstyring',
                  label: `Vælg geonet manuelt i ${standarder.geonet.lagVedManueltValg} lag`,
                  kind: 'checkbox',
                  help: `Når ét lag ikke er nok, lægges ${standarder.geonet.lagVedManueltValg} net af samme produkt oven på hinanden. Flere lag kan ikke udnyttes, fordi et net i midten ikke kan optage kraft. Forankringslængderne afhænger ikke af nettet.`,
                }}
                disabled={ikkeNoedvendig}
                value={i.overstyringAktiv && !ikkeNoedvendig}
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
                disabled={!i.overstyringAktiv || ikkeNoedvendig}
                value={i.produkt}
                error={fejl('overstyring')}
                change={(v) => saet({ produkt: Number(v) })}
              />
            </div>
            <Udfold titel="Mellemregninger" laast={ikkeNoedvendig}>
              <Beregning
                titel="Restopdrift"
                raekker={[
                  {
                    forklaring: 'Resterende opdrift som skal optages af geonet',
                    formel: `F_{op,d} = O_{d} − B_{d} = ${tal(r.O)} − ${tal(r.B)}`,
                    resultat: kNm(r.Fopdrift),
                    hoved: true,
                  },
                ]}
              />
              <h3 className="beregning-titel">Reduktionsfaktor (RF)</h3>
              <p className="calc-note">RF beregnes som produktet af følgende faktorer:</p>
              <Beregning
                raekker={[
                  ...(
                    [
                      [
                        'Krybningsfaktor',
                        'max 120 års levetid',
                        'f_{kryb}',
                        standarder.geonet.fKryb,
                      ],
                      [
                        'Produktions- og ekstrapolationsfaktor',
                        'max 120 års levetid',
                        'f_{m}',
                        standarder.geonet.fM,
                      ],
                      [
                        'Mekanisk beskadigelse',
                        'afrundede kornfraktioner, D < 35 mm',
                        'f_{d}',
                        standarder.geonet.fD,
                      ],
                      ['Kemisk påvirkning', 'pH 4,1–8,9', 'f_{e}', standarder.geonet.fE],
                    ] as const
                  ).map(([forklaring, detalje, formel, vaerdi]) => ({
                    forklaring,
                    detalje,
                    formel,
                    resultat: tal(vaerdi),
                  })),
                  {
                    forklaring: 'Samlet reduktionsfaktor',
                    formel: `RF = f_{kryb} · f_{m} · f_{d} · f_{e} = ${tal(standarder.geonet.fKryb)} · ${tal(standarder.geonet.fM)} · ${tal(standarder.geonet.fD)} · ${tal(standarder.geonet.fE)}`,
                    resultat: tal(r.geonet.RF),
                    hoved: true,
                  },
                ]}
              />
              <p className="calc-note">
                Reduktionsfaktorer fremgår af “British Board of Agreement” (BBA) certifikat No.{' '}
                {standarder.geonet.bba}, se{' '}
                <a href="https://www.byggros.com" target="_blank" rel="noreferrer">
                  www.byggros.com
                </a>
              </p>
              <Beregning
                titel="Designtrækstyrke"
                raekker={[
                  r.geonet.uts === null
                    ? {
                        forklaring: 'Regningsmæssig trækstyrke geonettet kan levere',
                        formel: `Intet produkt i ét lag opfylder P_{d}/F_{op,d} > ${tal(standarder.krav.geonet)} ved F_{op,d} = ${tal(r.Fopdrift)} kN/m.`,
                        hoved: true,
                      }
                    : {
                        forklaring: 'Regningsmæssig trækstyrke geonettet kan levere',
                        formel: `P_{d} = UTS/RF = ${tal(r.geonet.uts, 0)}/${tal(r.geonet.RF)}`,
                        resultat: kNm(r.geonet.Ptill),
                        hoved: true,
                      },
                ]}
              />
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
            <Udfold titel="Mellemregninger for kraftoverførsel" laast={ikkeNoedvendig}>
              <Beregning
                raekker={[
                  {
                    forklaring: 'Regningsmæssig friktionsvinkel for fyldet',
                    formel: `φ_{d} = arctan(tan φ_{k}/γ_{φ}) = arctan(tan ${tal(i.phi)}°/${tal(pk.gammaPhi)})`,
                    resultat: `${tal(r.phiD)}°`,
                  },
                  ...forankringRaekker(r, input),
                  {
                    forklaring: 'Kraft forankringen skal dimensioneres for',
                    formel: `K = F_{op,d} · S₂ = ${tal(r.Fopdrift)} · ${tal(r.S2)}`,
                    resultat: kNm(r.K),
                    hoved: true,
                  },
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
                r={r}
                input={input}
                session={session}
                saet={saet}
                ikkeNoedvendigNote={ikkeNoedvendig ? ikkeNoedvendigNote : null}
                omslagIkkeMuligt={omslagIkkeMuligt}
                dyb={dyb}
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
                Fund fra regnearket, der påvirker denne beregning. Tallene er regnet som i
                regnearket. Kontrolpunkterne indgår ikke i rapporten.
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
