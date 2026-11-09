/** Forklaringer, formler og resultater til mellemregningerne. Modulet bruger ikke React, så
 * skærm og rapport viser det samme, og det kan afprøves med node --test. */
import type { DybForankring } from '../engine/dybforankring.ts';
import type { ReduktionResultat } from '../engine/reduktion.ts';
import type { Losning } from '../engine/figurer.ts';
import type { GvsZone, OpdriftInput, OpdriftResultat, Status } from '../engine/opdrift.ts';
import standarder from '../engine/defaults.json' with { type: 'json' };
import { tal, talKort } from '../engine/format.ts';

const { gammaW, g } = standarder;

/** Én mellemregning: forklaring, formel med indsatte tal og resultat. */
export interface Mellemregning {
  forklaring: string;
  /** Betingelse eller bemærkning med lille skrift under forklaringen. */
  detalje?: string;
  formel: string;
  /** Uden resultat fylder formlen også resultatkolonnen. */
  resultat?: string;
  status?: Status | null;
  /** Gruppens resultat og kontroller fremhæves. */
  hoved?: boolean;
  /** Rækkens rolle i en løsning, så rapporten kan stille resultaterne op for sig. */
  rolle?: 'forankring' | 'bredde' | 'netlaengde' | 'netareal' | 'kontrol';
}

/** Symbolerne for opdrift, ballast, restopdrift og kraftoptagelse. Kort 8 regner pr. meter sikret
 * længde med indekset s (fund K-29). */
export interface Symboler {
  O: string;
  B: string;
  F: string;
  K: string;
}
export const symbolerPrMeter: Symboler = { O: 'O_{d}', B: 'B_{d}', F: 'F_{op,d}', K: 'K' };
export const symbolerSikret: Symboler = {
  O: 'O_{d,s}',
  B: 'B_{d,s}',
  F: 'F_{op,d,s}',
  K: 'K_{s}',
};

export const kNm = (x: number | null) => `${tal(x)} kN/m`;
export const meter = (x: number | null) => `${tal(x)} m`;

export const losningTitel: Record<Losning, string> = {
  A: 'Uden omslag, én ledning',
  B: 'Uden omslag, to ledninger',
  C: 'Med omslag, én ledning',
  D: 'Med omslag, to ledninger',
};

const { mindstelaengder: mindste, omslagAfstand, netTillaegOmslag, faktorMellemRoer } = standarder;

/** Arkets forskrifter for løsningerne (Rapporten A308, A358:A362, A398:A400 og A440:A449). */
export const losningNote = (afstand: number): Record<Losning, string> => ({
  A: `Der forankres altid med mindst ${tal(mindste.udenOmslag.prSide, 1)} m på hver side.`,
  B: `Der forankres altid med mindst ${tal(mindste.udenOmslag.prSide, 1)} m yderst på hver side. Mellem ledningerne holdes nettet nede af fyldets vægt, så L_{mellem} er et opdriftsproblem og ikke et forankringsproblem. Der regnes med en partialkoefficient på ${tal(faktorMellemRoer, 1)} mellem ledningerne.`,
  C: `Omslag kan bruges ved pladsproblemer. Der forankres altid med mindst ${tal(mindste.medOmslag.prSide, 1)} m på hver side. Der armeres lige meget i top og bund med ${talKort(afstand)} m mellem lagene.`,
  D: 'Som med omslag ved én ledning. Afstanden mellem rørene L_{mellem} skal være mindst 2 · L_{geonet}.',
});

/** Arkets tillæg i netlængden med omslag ud over de lodrette stykker (fund K-09). Det er det samme
 * for alle afstande mellem netlagene (fund K-26). */
export const tillaegOmslag = {
  C: 4 * netTillaegOmslag - 2 * omslagAfstand,
  D: 4 * netTillaegOmslag - 4 * omslagAfstand,
};

/** Noter om kontrollen ved løsningerne med én ledning (fund K-11, beslutning 31. oktober 2026). */
/** Arkets note i afsnit 5 om kraftens vej (A182:A184 og A186:A191, fund K-27), gengivet ordret
 * uden »Note:« og med stavefejlen »korrrigres« rettet. */
export const tovkraftNote = {
  styrke:
    'Overførsel af den lodrette kraft til det vandrette plan i det armerede ballastlag på hver side af rør, forudsætter at det armerede ballastlag antages at opføre sig som en semirigid enhed. Det skal bemærkes at ”tovkraften” på hver side af røret kun udgør 50% af den beregnede kraft. På den sikre side anvendes den samlede opdrift til bestemmelse af type geonet, dvs. der indbygges en ekstra sikkerhed med en faktor 2 på geonettets styrke.',
  forankring:
    'Det antages at geoarmering i overgangen mellem lodret og vandret plan i den indbyggede tilstand tilegner afrundet form (trissevirkning), hvilket betyder at den lodrette kraft i geonet overføres uændret til det vandrette plan. Beregningsteknisk påføres kraften en sikkerhedsfaktor på min. 1,05 som betyder at den beregnede ”tovkraft” korrigeres før bestemmelse af den nødvendige forankringslængde. I tillæg hertil skal nævnes at trykspredning fra ballastlag afleverer en gunstig kraftkomposant, dels i forhold til overgangen, men også på den øvrige ballast, hvilket understøtter den semirigide opfattelse af ballastlaget. Baseret på vores erfaring vurderes det at ovennævnte antagelser er på den sikre side i praksis og understøttes af et stort antal udførte projekter i Danmark siden 1996.',
};

export const kontrolNoter = ({ O, B, F, K }: Symboler) => ({
  udenOmslag: `Kontrollen er eftervisningen for løftning: ${O} ≤ ${B} + F_{bund} · 2 · L_{geonet}. Den er altid opfyldt, når forankringslængden er dimensioneret efter ${K} = ${F} · S₂, og viser tillægget fra S₂.`,
  medOmslag: `Kontrollen er eftervisningen for løftning med begge netlag. Den er altid opfyldt, når forankringslængden er dimensioneret efter ${K} = ${F} · S₂.`,
});
export const kontrolNote = kontrolNoter(symbolerPrMeter);

/** Ekstra lodrette stykker i netlængden, når netlagene ligger mere end 0,2 m fra hinanden (K-26). */
export const lodretTillaegTal = (r: OpdriftResultat, antal: number) =>
  r.omslagAfstand === standarder.omslagAfstand
    ? ''
    : ` + ${antal} · (${talKort(r.omslagAfstand)} − ${talKort(standarder.omslagAfstand)})`;

/** Rækker og mellemregninger for én løsning. null, når omslag ikke er muligt. Med `Lsikret` (kort 8)
 * regnes også det samlede netareal. */
export function losningIndhold(
  r: OpdriftResultat,
  input: OpdriftInput,
  losning: Losning,
  { symboler: sym = symbolerPrMeter, Lsikret }: { symboler?: Symboler; Lsikret?: number } = {},
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
  const noter = kontrolNoter(sym);
  // Ved manuelt valg i 2 lag gælder arealet pr. lag.
  const prLag = input.overstyring && input.overstyring.lag > 1 ? ' pr. lag' : '';
  const areal: [string, string][] = [];
  const faelles = (x: { La: number; Ltot: number }, tillaeg?: number): [string, string][] => [
    ['Samlet bredde L_{a}', `${tal(x.La)} m`],
    [
      tillaeg === undefined
        ? 'Samlet netlængde L_{geonet,tot}'
        : `Samlet netlængde L_{geonet,tot} inkl. ${tal(tillaeg, 1)} m tillæg til omslag og overlæg`,
      `${tal(x.Ltot)} m`,
    ],
    ...(Lsikret === undefined
      ? areal
      : [
          [`Samlet netareal A_{geonet}${prLag}`, `${tal(x.Ltot * Lsikret)} m²`] as [string, string],
        ]),
  ];
  const netareal = (Ltot: number): Mellemregning[] =>
    Lsikret === undefined
      ? []
      : [
          {
            forklaring: `Samlet netareal i den sikrede længde${prLag}`,
            rolle: 'netareal',
            formel: `A_{geonet} = L_{geonet,tot} · L_{sikret} = ${tal(Ltot)} · ${tal(Lsikret)}`,
            resultat: `${tal(Ltot * Lsikret)} m²`,
          },
        ];
  // Den beregnede længde og den anvendte mindstelængde vises hver for sig (beslutning 30. oktober 2026).
  const forankring = (L: number, beregnet: number, mindst: number): Mellemregning => ({
    forklaring: 'Anvendt forankringslængde pr. side',
    rolle: 'forankring',
    detalje: L > beregnet / 2 ? 'mindstelængden er bestemmende' : undefined,
    formel: `L_{geonet} = max(${tal(mindst, 1)}; 2L/2) = max(${tal(mindst, 1)}; ${tal(beregnet / 2)})`,
    resultat: meter(L),
  });
  const bredde = (formel: string, La: number): Mellemregning => ({
    forklaring: 'Vandret bredde fra nettets ene ende til den anden',
    rolle: 'bredde',
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
    rolle: 'netlaengde',
    detalje,
    formel,
    resultat: meter(Ltot),
  });
  const kontrol = (
    formel: string,
    x: { kontrol: number | null; status: Status | null },
  ): Mellemregning => ({
    forklaring: 'Ballast og forankring i forhold til opdriften',
    rolle: 'kontrol',
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
        note: A.kontrol === null ? undefined : noter.udenOmslag,
        beregning: [
          {
            forklaring: `Samlet forankringslængde der skal til for at optage ${sym.K}`,
            formel: `Beregnet 2L = ${sym.K}/F_{bund} = ${tal(r.K)}/${tal(r.Fbund)}`,
            resultat: meter(A.toLBeregnet),
          },
          forankring(A.L, A.toLBeregnet, mindste.udenOmslag.prSide),
          bredde(`L_{a} = 2 · L_{geonet} + d = 2 · ${tal(A.L)} + ${tal(d)}`, A.La),
          netlaengde(
            'Samlet længde geonet på tværs af ledningen',
            'L_{geonet,tot} = 2 · L_{geonet} + π · d/2',
            A.Ltot,
          ),
          ...netareal(A.Ltot),
          kontrol(
            `Kontrol = (${sym.B} + F_{bund} · 2 · L_{geonet})/${sym.O} = (${tal(r.B)} + ${tal(r.Fbund)} · 2 · ${tal(A.L)})/${tal(r.O)}`,
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
            formel: `L_{mellem} = max(0,5; ${sym.F} · 1,2/σ′_{v}) = max(0,5; ${tal(r.Fopdrift)} · 1,2/${tal(B.sigmaV)})`,
            resultat: meter(B.toLMellem),
          },
          {
            forklaring: 'Forankringslængde yderst på hver side',
            rolle: 'forankring',
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
          ...netareal(B.Ltot),
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
          note: C.kontrol === null ? undefined : noter.medOmslag,
          beregning: [
            {
              forklaring: `Samlet forankringslængde der skal til for at optage ${sym.K}`,
              detalje: 'med omslag',
              formel: `Beregnet 2L = ${sym.K}/(F_{bund} + F_{top}/2) + 2 · ${talKort(r.omslagAfstand)} = ${tal(r.K)}/(${tal(r.Fbund)} + ${tal(r.Ftop)}/2) + ${talKort(2 * r.omslagAfstand)}`,
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
            ...netareal(C.Ltot),
            kontrol(
              `Kontrol = (${sym.B} + (F_{bund} + F_{top})/2 · 4 · L_{geonet})/${sym.O} = (${tal(r.B)} + (${tal(r.Fbund)} + ${tal(r.Ftop)})/2 · 4 · ${tal(C.L)})/${tal(r.O)}`,
              C,
            ),
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
            ...netareal(D.Ltot),
          ],
        }
      );
  }
}

/** Mellemregningerne for O_d. I avanceret beregning med GVS under rørtoppen vises arealet under GVS. */
export function opdriftRaekker(
  r: OpdriftResultat,
  input: OpdriftInput,
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
export function ballastRaekker(
  r: OpdriftResultat,
  input: OpdriftInput,
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
export function forankringRaekker(r: OpdriftResultat, input: OpdriftInput): Mellemregning[] {
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

/** Opdriften med partialkoefficient og rørmidtens dybde. */
export function opdriftGrundlag(
  r: OpdriftResultat,
  input: OpdriftInput,
  zone: GvsZone | null,
): Mellemregning[] {
  const pk = r.partialkoefficienter;
  return [
    {
      forklaring: 'Partialkoefficient på opdriften',
      formel: `γ_{f} = γ_{G;dst} = ${tal(standarder.gammaGdst, 1)} · K_{FI} = ${tal(standarder.gammaGdst, 1)} · ${tal(pk.KFI, 1)} (${input.konsekvensklasse})`,
      resultat: tal(pk.gammaF),
    },
    {
      forklaring: 'Dybde fra terræn til rørmidten',
      formel: `T₃ = h₁ + d/2 = ${tal(input.h1)} + ${tal(input.d)}/2`,
      resultat: meter(r.T3),
    },
    ...opdriftRaekker(r, input, zone),
  ];
}

export const gammaFNote =
  'γ_{f} er partialkoefficienten γ_{G;dst} for ugunstig tyngde af (grund)vand i DS/EN 1997-1 DK NA:2021, tabel A.4-1 NA, som gælder for løftning (UPL) med trækelementer som geonet.';

export const opdriftNote = (avanceret: boolean) =>
  avanceret
    ? 'Opdriften O_{d} er vægten af det vand, røret fortrænger: den del af rørets udvendige tværsnit, der ligger under GVS, gange γ_{w}. Røret regnes tomt.'
    : 'Opdriften O_{d} er vægten af det vand, røret fortrænger: rørets udvendige tværsnit π/4 · d² gange γ_{w}. Røret regnes tomt og helt under vand.';

export const ballastNote =
  'Ballasten B_{d} er fyldet i en lodret søjle med rørets bredde fra terræn til rørmidte, minus rørets øverste halvdel, plus rørets egenvægt.';

export const egenvaegtNote = `Rørets egenvægt omregnes fra kg/m til kN/m med tyngdeaccelerationen g = ${tal(g)} m/s².`;

export function kontrolUdenGeonet(r: OpdriftResultat): Mellemregning {
  return r.S1 === null
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
      };
}

export const restopdriftRaekke = (
  r: OpdriftResultat,
  { O, B, F }: Symboler = symbolerPrMeter,
): Mellemregning => ({
  forklaring: 'Resterende opdrift som skal optages af geonet',
  formel: `${F} = ${O} − ${B} = ${tal(r.O)} − ${tal(r.B)}`,
  resultat: kNm(r.Fopdrift),
  hoved: true,
});

const { fKryb, fM, fD, fE, bba } = standarder.geonet;

/** Reduktionsfaktorerne: forklaring, betingelse, symbol og værdi. */
export const rfFaktorer = [
  ['Krybningsfaktor', 'max 120 års levetid', 'f_{kryb}', fKryb],
  ['Produktions- og ekstrapolationsfaktor', 'max 120 års levetid', 'f_{m}', fM],
  ['Mekanisk beskadigelse', 'afrundede kornfraktioner, D < 35 mm', 'f_{d}', fD],
  ['Kemisk påvirkning', 'pH 4,1–8,9', 'f_{e}', fE],
] as const;

export const rfRaekker = (r: OpdriftResultat): Mellemregning[] => [
  ...rfFaktorer.map(([forklaring, detalje, formel, vaerdi]) => ({
    forklaring,
    detalje,
    formel,
    resultat: tal(vaerdi),
  })),
  {
    forklaring: 'Samlet reduktionsfaktor',
    formel: `RF = f_{kryb} · f_{m} · f_{d} · f_{e} = ${tal(fKryb)} · ${tal(fM)} · ${tal(fD)} · ${tal(fE)}`,
    resultat: tal(r.geonet.RF),
    hoved: true,
  },
];

export const bbaNote = `Reduktionsfaktorer fremgår af “British Board of Agreement” (BBA) certifikat No. ${bba}, se www.byggros.com`;

export const designRaekke = (
  r: OpdriftResultat,
  { F }: Symboler = symbolerPrMeter,
): Mellemregning =>
  r.geonet.uts === null
    ? {
        forklaring: 'Regningsmæssig trækstyrke geonettet kan levere',
        formel: `Intet produkt i ét lag opfylder P_{d}/${F} > ${tal(standarder.krav.geonet)} ved ${F} = ${tal(r.Fopdrift)} kN/m.`,
        hoved: true,
      }
    : {
        forklaring: 'Regningsmæssig trækstyrke geonettet kan levere',
        formel: `P_{d} = UTS/RF = ${tal(r.geonet.uts, 0)}/${tal(r.geonet.RF)}`,
        resultat: kNm(r.geonet.Ptill),
        hoved: true,
      };

export const friktionsvinkelRaekke = (r: OpdriftResultat, input: OpdriftInput): Mellemregning => ({
  forklaring: 'Regningsmæssig friktionsvinkel for fyldet',
  formel: `φ_{d} = arctan(tan φ_{k}/γ_{φ}) = arctan(tan ${tal(input.phi)}°/${tal(r.partialkoefficienter.gammaPhi)})`,
  resultat: `${tal(r.phiD)}°`,
});

export const kraftoptagelseRaekke = (
  r: OpdriftResultat,
  { F, K }: Symboler = symbolerPrMeter,
): Mellemregning => ({
  forklaring: 'Kraft forankringen skal dimensioneres for',
  formel: `${K} = ${F} · S₂ = ${tal(r.Fopdrift)} · ${tal(r.S2)}`,
  resultat: kNm(r.K),
  hoved: true,
});

export const kraftNote = (avanceret: boolean, { F, K }: Symboler = symbolerPrMeter) =>
  `${avanceret ? 'Kraftoverførslen regnes med den effektive lodrette spænding i nettets niveau: tør fyld over GVS og effektiv rumvægt under.' : 'Geonettet ligger under GVS, så kraftoverførslen regnes med γ′_{d}.'} Forankringen på begge sider skal tilsammen optage ${K} = ${F} · S₂.`;

export const toLedningerNote =
  'Der er ingen opdriftskontrol for to ledninger. Ved to forskellige ledninger angives den største diameter og den mindste egenvægt.';

export const dybIndledning =
  'Når der ikke er plads til forankringslængden fra løsningen med omslag for én ledning, kan nettet føres længere ned langs rørets sider og forankres dybere. Beregningen finder den dybde, hvor den angivne forankringslængde er tilstrækkelig.';

export const dybAdvarsel =
  'Dybere forankring er ikke en dokumenteret metode og skal betragtes som rent teoretisk. Forankringslængden regnes med samme friktionsmodel som løsningen med omslag. Lokal jordreaktion ved nettets retningsændringer, jordbrud, netkræfter og deformationer er ikke eftervist og skal eftervises særskilt af 3. part, hvis løsningen ønskes brugt til udførelse. Byggros frasiger sig alt ansvar for resultaterne og deres evt. anvendelse.';

export const dybUnderRoerbund = (underRoerbund: number) =>
  `Det nederste netlag ligger ${tal(underRoerbund)} m under rørbunden. Udgravning, indbygning og komprimering under røret skal vurderes særskilt.`;

/** Mellemregningerne for dybere forankring i tre grupper. `kort` er nummeret på kortet for
 * forankring, som K kommer fra; med reduktion er det K_s pr. meter sikret længde. */
export function dybGrupper(
  r: OpdriftResultat,
  input: OpdriftInput,
  dyb: Extract<DybForankring, { tilstand: 'dybere' }>,
  kort = 7,
  sym: Symboler = symbolerPrMeter,
): { titel: string; raekker: Mellemregning[] }[] {
  const { d, gvs } = input;
  const mu = tal(standarder.mu);
  const tanPhi = `tan ${tal(r.phiD)}°`;
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
  return [
    {
      titel: 'Nødvendig kraftoverførsel',
      raekker: [
        {
          forklaring: 'Mulig forankringslængde pr. side',
          formel: 'L_{geonet}, angivet',
          resultat: meter(dyb.L),
        },
        {
          forklaring: 'Kraft forankringen skal dimensioneres for',
          detalje: `fra kort ${kort}`,
          formel: `${sym.K} = ${sym.F} · S₂ = ${tal(r.Fopdrift)} · ${tal(r.S2)}`,
          resultat: kNm(r.K),
        },
        {
          forklaring: 'Nødvendig kraftoverførsel',
          formel: `F_{bund} + F_{top}/2 = ${sym.K}/(2 · L_{geonet} − 2 · ${talKort(r.omslagAfstand)}) = ${tal(r.K)}/(2 · ${tal(dyb.L)} − ${talKort(2 * r.omslagAfstand)})`,
          resultat: kNm(dyb.krav),
          hoved: true,
        },
      ],
    },
    {
      titel: 'Nødvendig dybde',
      raekker: [
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
          formel: `2L = ${sym.K}/(F_{bund} + F_{top}/2) + 2 · ${talKort(r.omslagAfstand)} = ${tal(r.K)}/(${tal(dyb.Fbund)} + ${tal(dyb.Ftop)}/2) + ${talKort(2 * r.omslagAfstand)}`,
          resultat: meter(dyb.toL),
        },
      ],
    },
    {
      titel: 'Netlængde og kontrol',
      raekker: [
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
          formel: `Kontrol = (${sym.B} + (F_{bund} + F_{top})/2 · 4 · L_{geonet})/${sym.O} = (${tal(r.B)} + (${tal(dyb.Fbund)} + ${tal(dyb.Ftop)})/2 · 4 · ${tal(dyb.L)})/${tal(r.O)} (krav > 1,0)`,
          resultat: tal(dyb.kontrol),
          status: dyb.status,
          hoved: true,
        },
      ],
    },
  ];
}

/** Teksterne til beregningen med reduktion for ender og gennemføringer (fund K-29). Kortet
 * »Længde, ender og gennemføringer« vises efter kort 3, når reduktionen er valgt. */
export const reduktionIndledning =
  'Geonettet kan ikke lægges over afrundede ender og ved gennemføringer i rørets top, men opdriften virker på hele røret. Opdrift og ballast regnes derfor for hele røret og fordeles på den længde, hvor geonettet kan lægges. Geonet og forankring regnes derefter pr. meter sikret længde.';

export const reduktionHjaelp =
  'Røret regnes med sin samlede længde, når geonettet ikke kan lægges over afrundede ender og ved gennemføringer. Længden, enderne og gennemføringerne angives i et ekstra kort.';

export const reduktionForudsaetninger = [
  'De afrundede ender regnes med fuldt tværsnit. En afrundet ende fortrænger mindre vand og har mere fyld over sig, så antagelsen er på den sikre side.',
  'Ved gennemføringerne er jorden gravet væk, så der regnes ingen ballast i deres bredde. Gennemføringen regnes tom og tæt og giver opdrift fra rørtoppen op til GVS med sit cirkulære eller rektangulære tværsnit. Gennemføringens egenvægt medregnes ikke.',
  'Røret forudsættes stift i længderetningen, så opdriften fra ender og gennemføringer føres til de sikrede stykker. Gennemføringernes placering har ingen betydning for beregningen.',
  'Rørets egenvægt angives pr. meter. Ved en tank er det den samlede vægt divideret med L_{rør}.',
];

export const reduktionOpdriftNote =
  'Opdrift og ballast pr. meter rør regnes for hele røret og fordeles på den sikrede længde L_{sikret}. Geonet og forankring regnes med O_{d,s} og B_{d,s} pr. meter sikret længde.';

const kN = (x: number) => `${tal(x)} kN`;
const plus = (xs: number[]) => xs.map((x) => tal(x)).join(' + ');

/** Mellemregningen for den sikrede længde i kortet »Længde, ender og gennemføringer«. */
export function sikretLaengdeRaekker(red: ReduktionResultat): Mellemregning[] {
  const harEnder = red.ender.length > 0;
  const harGf = red.gennemfoeringer.length > 0;
  const fra = ['L_{rør}', harEnder ? 'ΣL_{ende}' : '', harGf ? 'Σd_{g}' : '']
    .filter(Boolean)
    .join(' − ');
  const fraTal = [red.Lroer, harEnder ? red.sumEnder : null, harGf ? red.sumGennemfoeringer : null]
    .filter((x): x is number => x !== null)
    .map((x) => tal(x))
    .join(' − ');
  return [
    { forklaring: 'Rørets samlede længde', formel: 'L_{rør}, angivet', resultat: meter(red.Lroer) },
    ...(harEnder
      ? [
          {
            forklaring: 'Afrundede ender',
            detalje: 'vandret udstrækning',
            formel: `ΣL_{ende} = ${plus(red.ender)}`,
            resultat: meter(red.sumEnder),
          },
        ]
      : []),
    ...(harGf
      ? [
          {
            forklaring: 'Gennemføringer',
            detalje: 'bredde langs røret',
            formel: `Σd_{g} = ${plus(red.gennemfoeringer.map((g) => g.d))}`,
            resultat: meter(red.sumGennemfoeringer),
          },
        ]
      : []),
    {
      forklaring: 'Længde, hvor geonettet kan lægges',
      formel: harEnder || harGf ? `L_{sikret} = ${fra} = ${fraTal}` : 'L_{sikret} = L_{rør}',
      resultat: meter(red.Lsikret),
      hoved: true,
    },
  ];
}

/** Opdrift og ballast for hele røret og pr. meter sikret længde i kortet for opdrift og ballast.
 * `r` er resultatet pr. meter rør. */
export function heleRoeretGrupper(
  r: OpdriftResultat,
  input: OpdriftInput,
  red: ReduktionResultat,
): { titel: string; raekker: Mellemregning[] }[] {
  const s = symbolerSikret;
  const harGf = red.gennemfoeringer.length > 0;
  const T2 = r.gvsZone === null ? 0 : input.gvs;
  const pk = r.partialkoefficienter;
  return [
    {
      titel: 'Hele røret',
      raekker: [
        {
          forklaring: 'Rørets opdrift i hele længden',
          detalje: 'fuldt tværsnit, også ved enderne',
          formel: `O_{d} · L_{rør} = ${tal(r.O)} · ${tal(red.Lroer)}`,
          resultat: kN(red.Oroer),
        },
        ...(harGf
          ? [
              {
                forklaring: 'Højde af gennemføringens hulrum under GVS',
                formel: `h_{g} = max(0; h₁ − T₂) = max(0; ${tal(input.h1)} − ${tal(T2)})`,
                resultat: meter(red.gennemfoeringer[0].h),
              },
              ...red.gennemfoeringer.map((g, n) => ({
                forklaring: 'Opdrift af gennemføringens hulrum',
                detalje: `gennemføring ${n + 1}, ${g.b === null ? 'cirkulær' : 'rektangulær'}`,
                formel:
                  g.b === null
                    ? `ΔO_{g,${n + 1}} = π/4 · d_{g,${n + 1}}² · h_{g} · γ_{w} · γ_{f} = π/4 · ${tal(g.d)}² · ${tal(g.h)} · ${tal(standarder.gammaW, 0)} · ${tal(pk.gammaF)}`
                    : `ΔO_{g,${n + 1}} = d_{g,${n + 1}} · b_{g,${n + 1}} · h_{g} · γ_{w} · γ_{f} = ${tal(g.d)} · ${tal(g.b)} · ${tal(g.h)} · ${tal(standarder.gammaW, 0)} · ${tal(pk.gammaF)}`,
                resultat: kN(g.O),
              })),
            ]
          : []),
        {
          forklaring: 'Samlet opdrift',
          formel: harGf
            ? `O_{d,tot} = O_{d} · L_{rør} + ΣΔO_{g} = ${plus([red.Oroer, ...red.gennemfoeringer.map((g) => g.O)])}`
            : `O_{d,tot} = O_{d} · L_{rør} = ${tal(red.Oroer)}`,
          resultat: kN(red.Otot),
          hoved: true,
        },
        ...(harGf
          ? [
              {
                forklaring: 'Længde med jorddække',
                detalje: 'ingen ballast ved gennemføringerne',
                formel: `L_{ballast} = L_{rør} − Σd_{g} = ${tal(red.Lroer)} − ${tal(red.sumGennemfoeringer)}`,
                resultat: meter(red.Lballast),
              },
            ]
          : []),
        {
          forklaring: 'Samlet ballast',
          formel: harGf
            ? `B_{d,tot} = B_{d} · L_{ballast} = ${tal(r.B)} · ${tal(red.Lballast)}`
            : `B_{d,tot} = B_{d} · L_{rør} = ${tal(r.B)} · ${tal(red.Lroer)}`,
          resultat: kN(red.Btot),
          hoved: true,
        },
      ],
    },
    {
      titel: 'Pr. meter sikret længde',
      raekker: [
        {
          forklaring: 'Opdrift pr. meter sikret længde',
          formel: `${s.O} = O_{d,tot}/L_{sikret} = ${tal(red.Otot)}/${tal(red.Lsikret)}`,
          resultat: kNm(red.Os),
          hoved: true,
        },
        {
          forklaring: 'Ballast pr. meter sikret længde',
          formel: `${s.B} = B_{d,tot}/L_{sikret} = ${tal(red.Btot)}/${tal(red.Lsikret)}`,
          resultat: kNm(red.Bs),
          hoved: true,
        },
      ],
    },
  ];
}

/** Kontrollen uden geonet for hele røret. */
export function kontrolUdenGeonetHeleRoeret(red: ReduktionResultat): Mellemregning {
  return red.S1 === null
    ? {
        forklaring: 'Ballast i forhold til opdrift',
        formel: 'S₁ kan ikke regnes, da røret ikke påvirkes af opdrift.',
        hoved: true,
      }
    : {
        forklaring: 'Ballast i forhold til opdrift for hele røret',
        formel: `S₁ = B_{d,tot}/O_{d,tot} = ${tal(red.Btot)}/${tal(red.Otot)} (krav ≥ ${tal(standarder.krav.S1, 1)})`,
        resultat: tal(red.S1),
        status: red.S1Status,
        hoved: true,
      };
}
