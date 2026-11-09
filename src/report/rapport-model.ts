/** Rapportens indhold som JSON til skabelonen. Tal, formler og noter kommer fra samme kilder som
 * skærmen (src/ui/mellemregninger.ts), så skærm og rapport har samme opbygning. Modulet bruger ikke
 * React og kan afprøves med node --test. */
import { beregnDybForankring, type DybForankring } from '../engine/dybforankring.ts';
import {
  dybForankringSvg,
  laengdesnitSvg,
  losningSvg,
  opdriftsarealSvg,
  tvaersnitSvg,
  type Losning,
} from '../engine/figurer.ts';
import { tal, talKort } from '../engine/format.ts';
import type { OpdriftInput, OpdriftResultat } from '../engine/opdrift.ts';
import standarder from '../engine/defaults.json' with { type: 'json' };
import { betingelser, projekteringsansvar } from '../ui/forudsaetninger.ts';
import { formatPhone } from './phone-format.ts';
import {
  ballastNote,
  ballastRaekker,
  bbaNote,
  designRaekke,
  dybAdvarsel,
  dybGrupper,
  dybIndledning,
  dybUnderRoerbund,
  egenvaegtNote,
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
  reduktionIndledning,
  reduktionOpdriftNote,
  restopdriftRaekke,
  rfFaktorer,
  sikretLaengdeRaekker,
  symbolerPrMeter,
  symbolerSikret,
  toLedningerNote,
  tovkraftNote,
  type Mellemregning,
  type Symboler,
} from '../ui/mellemregninger.ts';
import { kortNr, medReduktion, type RapportOplysninger, type Session } from '../ui/state.ts';

/** Tekst med sænket skrift som stykker, så intet tolkes som Typst-opmærkning. */
export type Tekst = { t: string; sub: boolean }[];

export const dele = (s: string): Tekst =>
  s
    .split(/_\{([^}]*)\}/)
    .map((t, i) => ({ t, sub: i % 2 === 1 }))
    .filter((d) => d.t !== '');

export type Blok =
  | { type: 'tekst' | 'lille' | 'h3' | 'advarsel'; tekst: Tekst }
  | { type: 'punkter'; punkter: Tekst[]; /** Med lille, grå skrift som noter. */ lille?: boolean }
  | { type: 'inddata'; felter: { tekst: Tekst; vaerdi: string; enhed: Tekst }[] }
  | {
      type: 'regning';
      forklaring: Tekst | null;
      detalje: Tekst | null;
      formel: Tekst;
      tal: Tekst | null;
      vaerdi: string | null;
      enhed: string;
      krav: string | null;
      status: string | null;
      hoved: boolean;
    }
  | { type: 'resultat'; tekst: Tekst; vaerdi: string }
  | {
      type: 'tabel';
      kolonner: string[];
      tal: number[];
      hoved: Tekst[];
      raekker: Tekst[][];
      sum: number;
    }
  | {
      type: 'vaerditabel';
      raekker: {
        navn: string;
        symbolK: Tekst;
        vaerdiK: string;
        inddata: boolean;
        symbolD: Tekst;
        vaerdiD: string;
        enhed: string;
      }[];
    }
  | { type: 'figur'; fil: string; bredde_mm: number }
  | { type: 'tofigur'; figurer: { fil: string; tekst: string }[] }
  | {
      type: 'maalfigur';
      fil: string;
      maal: { tekst: string; symbol: Tekst; vaerdi: string; note: string | null }[];
    }
  | { type: 'symboler'; raekker: { symbol: Tekst; tekst: Tekst }[] };

export interface Afsnit {
  titel: Tekst;
  niveau: 1 | 2;
  /** Afsnittet starter på en ny side. */
  nySide: boolean;
  /** Afsnittet holdes samlet på én side. */
  samlet: boolean;
  /** Løsning med to ledninger: stilles op sammen med den anden, så begge er på én side. */
  toLedninger: boolean;
  blokke: Blok[];
}

export interface RapportModel {
  forside: {
    projekt: string;
    forfatter: string;
    venstre: { navn: string; vaerdi: string }[];
    hoejre: { navn: string; vaerdi: string }[];
    beskrivelse: string[];
  };
  afsnit: Afsnit[];
  afslutning: { by_og_dato: string; personer: string[][] } | null;
}

export interface RapportDokument {
  model: RapportModel;
  /** Figurerne som SVG; filnavnene står i blokkene. */
  figurer: Record<string, string>;
}

const tekst = (s: string): Blok => ({ type: 'tekst', tekst: dele(s) });
const lille = (s: string): Blok => ({ type: 'lille', tekst: dele(s) });
const h3 = (s: string): Blok => ({ type: 'h3', tekst: dele(s) });

/** Værdi og enhed hver for sig, fx »54,00 kN/m« og »30,26°«. */
function delResultat(resultat: string) {
  const grad = resultat.endsWith('°');
  if (grad) return { vaerdi: resultat.slice(0, -1), enhed: '°' };
  const mellemrum = resultat.indexOf(' ');
  return mellemrum < 0
    ? { vaerdi: resultat, enhed: '' }
    : { vaerdi: resultat.slice(0, mellemrum), enhed: resultat.slice(mellemrum + 1) };
}

/** Skærmens række som formelopstilling: symbolerne på første linje og tallene på næste. */
export function regning(m: Mellemregning, visForklaring = true): Blok {
  const kravMatch = /\s*\(krav ([^)]*)\)$/.exec(m.formel);
  const formel = kravMatch ? m.formel.slice(0, kravMatch.index) : m.formel;
  const led = formel.split(' = ');
  const symbolsk = led.length >= 3 ? `${led[0]} = ${led[1]}` : formel;
  const medTal = led.length >= 3 ? `= ${led.slice(2).join(' = ')}` : null;
  const res = m.resultat === undefined ? null : delResultat(m.resultat);
  return {
    type: 'regning',
    forklaring: visForklaring ? dele(m.forklaring) : null,
    detalje: visForklaring && m.detalje ? dele(m.detalje) : null,
    formel: dele(symbolsk),
    tal: medTal ? dele(medTal) : null,
    vaerdi: res?.vaerdi ?? null,
    enhed: res?.enhed ?? '',
    krav: kravMatch?.[1] ?? null,
    status: m.status ?? null,
    hoved: Boolean(m.hoved),
  };
}

/** Figurerne skrives med rapportens skrift, så de ligner resten af siden. */
const medRapportskrift = (svg: string) =>
  svg.replace(/font-family="[^"]*"/, 'font-family="Carlito"');

const omslagIkkeMuligtTekst = (r: OpdriftResultat) =>
  `Omslag kræver, at rørmidten ligger mere end ${talKort(r.omslagAfstand)} m under terræn.`;

export function datoTilVisning(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : iso;
}

/** Filnavn uden tegn, der ikke må stå i et filnavn. */
export function rapportFilnavn(projekt: string, dato: string): string {
  const navn = projekt
    .replace(/[\\/:*?"<>|]/g, '-')
    .trim()
    .slice(0, 60);
  return `${['Opdriftssikring', navn, dato].filter(Boolean).join(' - ')}.pdf`;
}

function personLinjer(p: RapportOplysninger['sagsbehandler']): string[] {
  return [p.navn, p.telefon ? formatPhone(p.telefon) : '', p.mail].filter(Boolean);
}

/** Dybere forankring kan medtages som sidste afsnit, når kortet er slået til, kan regnes og
 * opdriftssikring er nødvendig. Med reduktion regnes med K_s (beslutning 9. november 2026). */
export function rapportTilvalg(
  session: Session,
  input: OpdriftInput,
  r: OpdriftResultat,
): {
  dyb: {
    grundlag: OpdriftResultat;
    /** Nummeret på afsnittet for forankring, som K kommer fra. */
    kort: number;
    resultat: Exclude<DybForankring, { tilstand: 'ikke relevant' | 'omslag ikke muligt' }>;
  } | null;
} {
  const i = session.inddata;
  const { aktiv, rv } = medReduktion(session, input, r);
  const dyb =
    session.avanceret && i.dybForankringAktiv && rv && rv.S1Status !== 'OK'
      ? beregnDybForankring(rv, input, i.dybForankringL)
      : null;
  const res = dyb?.ok ? dyb.resultat : null;
  return {
    dyb:
      rv && res && (res.tilstand === 'tilstraekkelig' || res.tilstand === 'dybere')
        ? { grundlag: rv, kort: kortNr(aktiv, 7), resultat: res }
        : null,
  };
}

export function rapportDokument(
  session: Session,
  input: OpdriftInput,
  r: OpdriftResultat,
  by: string,
  idag: string,
): RapportDokument {
  const o = session.rapport;
  const dato = datoTilVisning(o.dato || idag);
  const avanceret = session.avanceret;
  const i = session.inddata;
  const klasse = session.konsekvensklasse;
  const pk = r.partialkoefficienter;
  const zone = r.gvsZone;
  // Med reduktion (fund K-29) er afsnit 4 længde, ender og gennemføringer, de følgende afsnit rykker
  // et nummer, og afsnittene for opdrift og ballast, geonet og forankring regner pr. meter sikret
  // længde (beslutning 9. november 2026).
  const reduktion = medReduktion(session, input, r);
  if (!reduktion.rv)
    throw new Error('Rapporten kræver gyldige værdier for længde, ender og gennemføringer.');
  const rv = reduktion.rv;
  const red = reduktion.res;
  const nr = (n: number) => kortNr(reduktion.aktiv, n);
  const sym = reduktion.aktiv ? symbolerSikret : symbolerPrMeter;
  const figurer: Record<string, string> = {};
  const fil = (navn: string, svg: string) => {
    const sti = `figures/${navn}.svg`;
    figurer[sti] = medRapportskrift(svg);
    return sti;
  };
  const gvsTekst = input.gvs === 0 ? 'GVS i terræn' : `GVS ${tal(input.gvs)} m under terræn`;
  const afsnit: Afsnit[] = [];
  const nyt = (
    titel: string,
    blokke: Blok[],
    valg: { niveau?: 1 | 2; nySide?: boolean; samlet?: boolean; toLedninger?: boolean } = {},
  ) =>
    afsnit.push({
      titel: dele(titel),
      niveau: valg.niveau ?? 1,
      nySide: valg.nySide ?? false,
      samlet: valg.samlet ?? false,
      toLedninger: valg.toLedninger ?? false,
      blokke,
    });

  /** Løsningerne i samme rækkefølge som på skærmen; kun de valgte og mulige medtages. Med reduktion
   * regnes pr. meter sikret længde, og netarealet vises. */
  const losningAfsnit = (
    rr: OpdriftResultat,
    afsnitNr: number,
    ekstra: { symboler?: Symboler; Lsikret?: number } = {},
  ) => {
    const raekkefoelge: Losning[] = ['A', 'C', 'B', 'D'];
    const valgte = raekkefoelge.filter((l) => o.losninger[l] && rr.losninger[l]);
    const sidsteToLedninger = [...valgte].reverse().find((l) => l === 'B' || l === 'D');
    valgte.forEach((l, n) => {
      const indhold = losningIndhold(rr, input, l, ekstra)!;
      const v = rr.losninger[l]!;
      const to = l === 'B' || l === 'D';
      const omslag = l === 'C' || l === 'D';
      const blokke: Blok[] = [lille(losningNote(rr.omslagAfstand)[l])];
      blokke.push(...indhold.beregning.filter((m) => !m.rolle).map((m) => regning(m)));
      if ('toLMellem' in v)
        blokke.push({
          type: 'resultat',
          tekst: dele('L_{mellem}: der armeres med mindst'),
          vaerdi: `${tal(v.toLMellem)} m mellem ledningerne`,
        });
      blokke.push({
        type: 'resultat',
        tekst: dele('L_{geonet}: der armeres med mindst'),
        vaerdi: `${tal(v.L)} m ${to ? 'yderst på hver side' : omslag ? 'på hver side (med omslag)' : 'på hver side'}`,
      });
      const mindst = indhold.beregning.find((m) => m.rolle === 'forankring')?.detalje;
      if (mindst?.startsWith('mindstelængden')) blokke.push(lille(`L_{geonet}: ${mindst}.`));
      const areal = indhold.beregning.find((m) => m.rolle === 'netareal');
      blokke.push({
        type: 'maalfigur',
        fil: fil(`losning-${l}`, losningSvg(rr, input, l)),
        maal: [
          {
            tekst: 'Vandret bredde fra ende til ende',
            symbol: dele('L_{a}'),
            vaerdi: `${tal(v.La)} m`,
            note: null,
          },
          {
            tekst: 'Samlet længde geonet på tværs',
            symbol: dele('L_{geonet,tot}'),
            vaerdi: `${tal(v.Ltot)} m`,
            note: omslag
              ? `inkl. ${tal(l === 'C' ? standarder.netTillaegOmslag * 4 - standarder.omslagAfstand * 2 : standarder.netTillaegOmslag * 4 - standarder.omslagAfstand * 4, 1)} m tillæg til omslag og overlæg`
              : null,
          },
          ...(areal?.resultat
            ? [
                {
                  tekst: areal.forklaring,
                  symbol: dele('A_{geonet}'),
                  vaerdi: areal.resultat,
                  note: null,
                },
              ]
            : []),
        ],
      });
      const kontrolRaekke = indhold.beregning.find((m) => m.rolle === 'kontrol');
      if (kontrolRaekke) blokke.push(regning(kontrolRaekke));
      if (l === sidsteToLedninger) blokke.push(lille(toLedningerNote));
      nyt(`${afsnitNr}.${n + 1} ${losningTitel[l]}`, blokke, {
        niveau: 2,
        nySide: n === 0,
        samlet: true,
        toLedninger: to,
      });
    });
  };

  nyt(
    '1. Generelle beregningsforudsætninger',
    [
      lille('Grønne værdier og tekster er inputværdier fra dimensioneringen.'),
      h3('Betingelser'),
      { type: 'punkter', punkter: betingelser(klasse).map(dele) },
      h3('Projekteringsansvar'),
      ...projekteringsansvar.map(tekst),
    ],
    { nySide: true },
  );

  nyt('2. Partialkoefficienter', [
    tekst(
      'Partialkoefficienterne følger DS/EN 1997-1 DK NA:2021 (Eurocode 7), tabel A.4-1 NA for løftning (UPL) med trækelementer.',
    ),
    {
      type: 'inddata',
      felter: [
        {
          tekst: dele('Konsekvensklasse:'),
          vaerdi: klasse,
          enhed: dele(`K_{FI} = ${tal(pk.KFI, 1)}`),
        },
      ],
    },
    {
      type: 'tabel',
      kolonner: ['1fr', 'auto', '1fr'],
      tal: [1],
      hoved: [dele('Partialkoefficient (tabel A.4-1 NA)'), dele(klasse), dele('Bruges på')],
      raekker: [
        [
          dele(`γ_{G;dst} = ${tal(standarder.gammaGdst, 1)} · K_{FI}, ugunstig`),
          dele(tal(pk.gammaF)),
          dele('Opdriften (γ_{f})'),
        ],
        [dele('γ_{G;stb}, gunstig'), dele(tal(pk.gammaGstb)), dele('Fyld og egenvægt')],
        [dele('γ_{φ}'), dele(tal(pk.gammaPhi)), dele('tan φ')],
      ],
      sum: -1,
    },
    lille(gammaFNote),
  ]);

  const geometri: Blok[] = [
    {
      type: 'inddata',
      felter: [
        { tekst: dele('Rørdiameter d ='), vaerdi: tal(input.d), enhed: dele('m') },
        { tekst: dele('Jorddækning h₁ ='), vaerdi: tal(input.h1), enhed: dele('m') },
        input.gvs === 0
          ? { tekst: dele('GVS'), vaerdi: 'i terræn', enhed: [] }
          : { tekst: dele('GVS under terræn T₂ ='), vaerdi: tal(input.gvs), enhed: dele('m') },
      ],
    },
    { type: 'figur', fil: fil('tvaersnit', tvaersnitSvg(r, input)), bredde_mm: 118 },
    lille(
      `T₁: terrænoverfladens kote. T₂: grundvandsspejlets kote. T₃: rørmidtens kote, T₃ = h₁ + d/2 = ${tal(r.T3)} m. Koterne regnes med positivt fortegn nedad fra T₁ = 0.`,
    ),
  ];
  if (klasse === 'CC3')
    geometri.push(
      lille(
        'Ved konsekvensklasse CC3 regnes altid med GVS i terræn, da der skal tages højde for ekstremhændelser: 100-års hændelser for skybrud og oversvømmelse, stigning i havvands- og grundvandsspejl og risiko for svigt af drænsystemer.',
      ),
    );
  if (avanceret && input.gvs > 0)
    geometri.push({
      type: 'advarsel',
      tekst: dele(
        'GVS skal være den højeste vandstand i ledningens levetid, også under anlæg og ved skybrud. Værste tilfælde er GVS i terræn. Hvis GVS sættes herunder skal der sikres tilstrækkelige drænforanstaltninger eller på anden vis dokumenteres at vandstanden ikke kan blive højere. Beregninger på eget ansvar.',
      ),
    });
  nyt('3. Geometri og grundvand', geometri, { nySide: true });

  if (red)
    nyt(
      '4. Længde, ender og gennemføringer',
      [
        tekst(reduktionIndledning),
        // Længde og ender på én linje og hver gennemføring på sin egen, så felterne ikke bliver trange.
        {
          type: 'inddata',
          felter: [
            {
              tekst: dele('Rørets samlede længde L_{rør} ='),
              vaerdi: tal(red.Lroer),
              enhed: dele('m'),
            },
            ...red.ender.map((e, n) => ({
              tekst: dele(`Ende ${n + 1}, L_{ende,${n + 1}} =`),
              vaerdi: tal(e),
              enhed: dele('m'),
            })),
          ],
        },
        ...red.gennemfoeringer.map((g, n): Blok => ({
          type: 'inddata',
          felter:
            g.b === null
              ? [
                  {
                    tekst: dele(`Gennemføring ${n + 1}, cirkulær, diameter d_{g,${n + 1}} =`),
                    vaerdi: tal(g.d),
                    enhed: dele('m'),
                  },
                ]
              : [
                  {
                    tekst: dele(`Gennemføring ${n + 1}, rektangulær, langs røret d_{g,${n + 1}} =`),
                    vaerdi: tal(g.d),
                    enhed: dele('m'),
                  },
                  {
                    tekst: dele(`på tværs af røret b_{g,${n + 1}} =`),
                    vaerdi: tal(g.b),
                    enhed: dele('m'),
                  },
                ],
        })),
        // Figuren og forudsætningerne er mindre, så afsnit 4 og 5 kan stå på samme side.
        { type: 'figur', fil: fil('laengdesnit', laengdesnitSvg(input, red)), bredde_mm: 110 },
        { type: 'punkter', punkter: reduktionForudsaetninger.map(dele), lille: true },
        h3('Sikret længde'),
        ...sikretLaengdeRaekker(red).map((m) => regning(m)),
      ],
      { nySide: true },
    );

  // Afsnittet holdes samlet, så tabellen ikke deles fra overskriften.
  nyt(
    `${nr(4)}. Egenvægt og fyldmateriale`,
    [
      tekst(
        'Parametre for fyldmaterialet i de armerede jordzoner. Fyldet skal være friktionsfyld.',
      ),
      {
        type: 'vaerditabel',
        raekker: [
          {
            navn: 'Rumvægt, våd',
            symbolK: dele('γ_{våd}'),
            vaerdiK: tal(i.gamma),
            inddata: true,
            symbolD: dele('γ_{våd,d}'),
            vaerdiD: tal(r.gammaD),
            enhed: 'kN/m³',
          },
          {
            navn: 'Rumvægt, tør',
            symbolK: dele('γ_{tør}'),
            vaerdiK: tal(i.gammaTor),
            inddata: true,
            symbolD: dele('γ_{tør,d}'),
            vaerdiD: tal(r.gammaTorD),
            enhed: 'kN/m³',
          },
          {
            navn: 'Effektiv rumvægt under vand',
            symbolK: dele('γ′ = γ_{våd} − γ_{w}'),
            vaerdiK: tal(i.gamma - standarder.gammaW),
            inddata: false,
            symbolD: dele('γ′_{d} = γ_{våd,d} − γ_{w}'),
            vaerdiD: tal(r.gammaEffD),
            enhed: 'kN/m³',
          },
          {
            navn: 'Friktionsvinkel',
            symbolK: dele('φ_{k}'),
            vaerdiK: tal(i.phi),
            inddata: true,
            symbolD: dele('φ_{d}'),
            vaerdiD: tal(r.phiD),
            enhed: '°',
          },
          {
            navn: 'Rørets egenvægt',
            symbolK: dele('E_{k}'),
            vaerdiK: tal(i.roervaegt),
            inddata: true,
            symbolD: dele('E_{d}'),
            vaerdiD: tal(r.roervaegtD),
            enhed: 'kg/m',
          },
        ],
      },
    ],
    { samlet: true },
  );

  const arealfigur = opdriftsarealSvg(r, input);
  nyt(
    `${nr(5)}. Opdrift og stabiliserende ballast`,
    [
      h3(red ? 'Opdrift pr. meter rør' : 'Opdrift'),
      tekst(opdriftNote(avanceret)),
      ...(arealfigur
        ? [{ type: 'figur', fil: fil('areal', arealfigur), bredde_mm: 90 } as Blok]
        : []),
      ...opdriftGrundlag(r, input, zone).map((m) => regning(m)),
      h3(red ? 'Stabiliserende ballast pr. meter rør' : 'Stabiliserende ballast'),
      tekst(ballastNote),
      ...ballastRaekker(r, input, zone).map((m) => regning(m)),
      lille(egenvaegtNote),
      ...(red
        ? [
            ...heleRoeretGrupper(r, input, red).flatMap(({ titel, raekker }) => [
              h3(titel),
              ...raekker.map((m) => regning(m)),
            ]),
            lille(reduktionOpdriftNote),
          ]
        : []),
      h3('Sikkerhed mod opdrift uden geonet'),
      regning(red ? kontrolUdenGeonetHeleRoeret(red) : kontrolUdenGeonet(r)),
      tekst(rv.konklusion.join(' ')),
    ],
    { nySide: true },
  );

  const noedvendig = rv.S1Status !== 'OK';
  if (noedvendig) {
    const g = rv.geonet;
    const lagtManuelt = input.overstyring && input.overstyring.lag > 1 ? input.overstyring : null;
    const utsFormel = lagtManuelt
      ? `${lagtManuelt.lag} lag X-GRID ${lagtManuelt.uts} = ${lagtManuelt.lag} · ${lagtManuelt.uts}`
      : `1 lag X-GRID ${g.navn}`;
    const geonetBlokke: Blok[] = [
      tekst(
        'Da sikkerheden mod opdrift S₁ ikke opfylder kravet, skal ballastbidraget øges svarende til geonettets regningsmæssige trækstyrke.',
      ),
      regning(restopdriftRaekke(rv, sym)),
    ];
    if (g.uts === null) {
      geonetBlokke.push(regning(designRaekke(rv, sym)), {
        type: 'resultat',
        tekst: dele('Der produceres ikke geonet med den nødvendige styrke.'),
        vaerdi: 'Kontakt leverandør',
      });
    } else {
      geonetBlokke.push(
        h3(`Regningsmæssig designtrækstyrke P_{d} for X-GRID ${g.navn}`),
        {
          type: 'regning',
          forklaring: dele('Ultimal styrke UTS'),
          detalje: null,
          formel: dele(utsFormel),
          tal: null,
          vaerdi: tal(g.uts, 0),
          enhed: 'kN/m',
          krav: null,
          status: null,
          hoved: false,
        },
        {
          type: 'tabel',
          kolonner: ['1fr', 'auto', 'auto'],
          tal: [2],
          hoved: [dele('Reduktionsfaktor'), dele('Symbol'), dele('Værdi')],
          raekker: [
            ...rfFaktorer.map(([navn, detalje, symbol, v]) => [
              dele(`${navn} (${detalje})`),
              dele(symbol),
              dele(tal(v)),
            ]),
            [
              dele('Samlet reduktionsfaktor RF = f_{kryb} · f_{m} · f_{d} · f_{e}'),
              dele('RF'),
              dele(tal(g.RF)),
            ],
          ],
          sum: 4,
        },
        lille(bbaNote),
        regning(designRaekke(rv, sym)),
        h3('Eftervisning af det valgte geonet'),
        regning({
          forklaring: 'Geonettets styrke i forhold til restopdriften',
          formel: `P_{d}/${sym.F} = ${tal(g.Ptill)}/${tal(rv.Fopdrift)} (krav > ${tal(standarder.krav.geonet)})`,
          resultat: tal(g.sikkerhed),
          status: g.status,
          hoved: true,
        }),
        { type: 'resultat', tekst: dele('Der anvendes geonet som'), vaerdi: `X-GRID ${g.navn}` },
      );
    }
    geonetBlokke.push(
      lille(
        'Geonettet rulles ud på tværs af ledningen, så nettets styrke på langs af rullen udnyttes.',
      ),
      lille(tovkraftNote.styrke),
    );
    nyt(`${nr(6)}. Geonet`, geonetBlokke, { nySide: true });

    const C = rv.losninger.C;
    const symbolfigurer = [
      {
        fil: fil('symboler-uden-omslag', losningSvg(rv, input, 'A', 'symboler')),
        tekst: `Figur ${nr(7)}.1 Uden omslag`,
      },
      ...(C
        ? [
            {
              fil: fil('symboler-med-omslag', losningSvg(rv, input, 'C', 'symboler')),
              tekst: `Figur ${nr(7)}.2 Med omslag`,
            },
          ]
        : []),
    ];
    const fs = rv.forankringsspaending;
    // Med GVS i terræn vises kraftoverførslen som i standardberegningen (beslutning 9. november 2026).
    const torFyld = avanceret && input.gvs > 0;
    const kraftTabel: Blok = {
      type: 'tabel',
      kolonner: ['62', '30', '30'],
      tal: [1, 2],
      hoved: [[], dele('F_{bund}'), dele('F_{top}')],
      raekker: [
        [dele('h (m)'), dele(tal(rv.hBund)), dele(tal(rv.hTop))],
        torFyld
          ? [dele('σ′_{v} (kN/m²)'), dele(tal(fs.bund)), dele(tal(fs.top))]
          : [dele('γ′_{d} (kN/m³)'), dele(tal(rv.gammaEffD)), dele(tal(rv.gammaEffD))],
        [dele('μ'), dele(tal(standarder.mu)), dele(tal(standarder.mu))],
        [dele('φ_{d} (°)'), dele(tal(rv.phiD)), dele(tal(rv.phiD))],
        [dele('F (kN/m pr. m net)'), dele(tal(rv.Fbund)), dele(tal(rv.Ftop))],
      ],
      sum: 4,
    };
    nyt(
      `${nr(7)}. Forankring`,
      [
        h3('Kraftoverførsel'),
        tekst(
          torFyld
            ? 'F = σ′_{v} · μ · tan φ_{d} pr. meter forankringslængde.'
            : 'F = h · γ′_{d} · μ · tan φ_{d} pr. meter forankringslængde.',
        ),
        {
          type: 'symboler',
          raekker: [
            {
              symbol: dele('h'),
              tekst: dele(
                'Afstand fra geonettet til terræn: h_{bund} til det nederste netlag og h_{top} til det øverste',
              ),
            },
            torFyld
              ? {
                  symbol: dele('σ′_{v}'),
                  tekst: dele(
                    'Effektiv lodret spænding i nettets niveau: tør fyld over GVS og effektiv rumvægt under',
                  ),
                }
              : {
                  symbol: dele('γ′_{d}'),
                  tekst: dele('Effektiv regningsmæssig rumvægt af fyldet'),
                },
            {
              symbol: dele('μ'),
              tekst: dele(
                `Interaktionskoefficient for X-GRID geonet, μ = ${tal(standarder.mu, 1)} i sand`,
              ),
            },
            {
              symbol: dele('φ_{d}'),
              tekst: dele(
                `Regningsmæssig friktionsvinkel, φ_{d} = arctan(tan φ_{k}/γ_{φ}) = arctan(tan ${tal(i.phi)}°/${tal(pk.gammaPhi)}) = ${tal(rv.phiD)}°`,
              ),
            },
            { symbol: dele('L_{geonet}'), tekst: dele('Forankringslængde pr. side') },
            {
              symbol: dele('L_{a}'),
              tekst: dele('Samlet bredde fra nettets ene ende til den anden'),
            },
          ],
        },
        { type: 'tofigur', figurer: symbolfigurer },
        // Figur 7.2 og noten følger hinanden; afstanden er den, der er regnet med i kort 7.
        ...(C
          ? [
              tekst(
                `Ved indbygning af geonet til opdriftssikring kan geonettet slås tilbage (omslag). Slås geonettet tilbage, som vist på figur ${nr(7)}.2, skal der være ${talKort(rv.omslagAfstand)} m mellem det nederste og det øverste geonet.`,
              ),
            ]
          : []),
        kraftTabel,
        lille(kraftNote(torFyld, sym)),
        h3('Nødvendig kraftoptagelse'),
        {
          type: 'inddata',
          felter: [
            {
              tekst: dele('S₂ ='),
              vaerdi: tal(rv.S2),
              enhed: dele(
                'Partialkoefficient for kraftoptagelse, fastlagt beregningsteknisk ved skøn (1,05–1,20).',
              ),
            },
          ],
        },
        regning(kraftoptagelseRaekke(rv, sym)),
        lille(tovkraftNote.forankring),
        ...(C ? [] : [lille(omslagIkkeMuligtTekst(rv))]),
      ],
      { nySide: true },
    );

    losningAfsnit(rv, nr(7), red ? { symboler: sym, Lsikret: red.Lsikret } : {});
  }

  // Dybere forankring medtages kun, når den er valgt på rapportsiden (beslutning 5. november 2026).
  const tilvalg = rapportTilvalg(session, input, r);
  const dyb = o.dybForankring ? tilvalg.dyb : null;
  if (dyb) {
    const { grundlag: rg, kort, resultat: res } = dyb;
    const C = rg.losninger.C;
    const blokke: Blok[] = [tekst(dybIndledning), { type: 'advarsel', tekst: dele(dybAdvarsel) }];
    if (res.tilstand === 'tilstraekkelig' && C)
      blokke.push(
        tekst(
          `Løsningen »Med omslag, én ledning« giver L_{geonet} = ${tal(C.L)} m pr. side med forankring ved rørmidten. Den angivne længde på ${tal(res.L)} m er tilstrækkelig, så dybere forankring er ikke nødvendig.`,
        ),
      );
    if (res.tilstand === 'dybere') {
      blokke.push(
        {
          type: 'figur',
          fil: fil('dybere-forankring', dybForankringSvg(rg, input, res)),
          bredde_mm: 118,
        },
        {
          type: 'resultat',
          tekst: dele('L_{geonet}: der armeres med ønsket længde'),
          vaerdi: `${tal(res.L)} m på hver side (med omslag)`,
        },
        {
          type: 'resultat',
          tekst: dele('Nødvendig dybde til nederste netlag h_{bund}'),
          vaerdi: `${tal(res.hBund)} m`,
        },
      );
      if (res.underRoerbund > 0)
        blokke.push({ type: 'advarsel', tekst: dele(dybUnderRoerbund(res.underRoerbund)) });
      for (const { titel, raekker } of dybGrupper(rg, input, res, kort, sym))
        blokke.push(
          h3(titel),
          ...raekker.map((m) =>
            regning({ ...m, detalje: m.detalje?.replace(/^fra kort (\d)$/, 'fra afsnit $1') }),
          ),
        );
    }
    nyt(`${nr(8)}. Dybere forankring ved begrænset plads`, blokke, { nySide: true });
  }

  const personer = [o.sagsbehandler, o.kontrollant].map(personLinjer).filter((p) => p.length > 0);
  return {
    model: {
      forside: {
        projekt: o.projekt,
        forfatter: o.sagsbehandler.navn,
        venstre: [
          { navn: 'Projektnavn', vaerdi: o.projekt },
          { navn: 'Udføres for', vaerdi: o.udfoeresFor },
          { navn: 'Dato', vaerdi: dato },
        ],
        hoejre: [
          { navn: 'Udført af', vaerdi: o.sagsbehandler.navn },
          { navn: 'Kvalitetssikring', vaerdi: o.kontrollant.navn },
          {
            navn: 'Beregning',
            vaerdi: `${avanceret ? 'Avanceret beregning' : 'Standardberegning'}, ${klasse}`,
          },
        ],
        beskrivelse: [
          `Ø${tal(input.d * 1000, 0).replace('.', '')} mm, regnet tom`,
          `Jorddækning ${tal(input.h1)} m`,
          gvsTekst,
          ...(red
            ? [`Længde ${tal(red.Lroer)} m, regnet med reduktion for ender og gennemføringer`]
            : []),
          ...o.beskrivelse
            .split('\n')
            .map((l) => l.trim())
            .filter(Boolean),
        ],
      },
      afsnit,
      afslutning: personer.length ? { by_og_dato: `${by} d. ${dato}`, personer } : null,
    },
    figurer,
  };
}
