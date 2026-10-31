/** Målsatte figurer som SVG-tekst til skærm og rapport, med regnearkets figurer som forlæg
 * (docs/EXCEL_KORTLAEGNING.md, afsnit 7). Geometrien tegnes i rigtig skala ud fra de beregnede
 * mål; tekst og stregtykkelser er i skærmpixel, så de er lige tydelige i alle figurer. Gravens
 * hældning og bundlaget under røret er kun illustration og indgår ikke i beregningen. */
import type { OpdriftInput, OpdriftResultat } from './opdrift.ts';
import { tal } from './format.ts';

export type Losning = 'A' | 'B' | 'C' | 'D';

// MSL's figurpalet (construction-svg.ts) plus én dæmpet blå til grundvand.
const farve = {
  ink: '#15211A',
  muted: '#7A857D',
  net: '#B42318',
  jord: '#D9DDD9',
  fyld: '#EDEFED',
  bund: '#8B7355',
  vand: '#3B7DB0',
};
const BREDDE = 640;
const MAX_HOEJDE = 300;
const MARGEN = { venstre: 24, hoejre: 150, top: 52, bund: 74 };
const HAELDNING = 0.6; // gravens sider, vandret pr. lodret
const BUNDLAG = 0.15; // m under røret
const TOPLAG = 0.75; // det omslåede lag tegnes som 75 % af forankringslængden

const esc = (t: string) =>
  t.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
const m = (x: number) => `${tal(x)} m`;
/** Sænket skrift skrives som `L_{geonet}` og vises som tspan. */
const medIndeks = (t: string) =>
  esc(t).replace(/_\{([^}]*)\}/g, '<tspan baseline-shift="sub" font-size="9">$1</tspan>');
/** Omtrentlig tekstbredde i pixel ved 12 px, uden indeksmarkering. */
const bredde = (t: string) => t.replace(/_\{([^}]*)\}/g, '$1').length * 6.4;

/** Afviser ugyldige tal i stedet for at tegne dem; motoren leverer kun endelige værdier. */
function px(x: number) {
  if (!Number.isFinite(x)) throw new Error('Figuren kan ikke tegnes: ugyldigt tal.');
  return Math.round(x * 10) / 10;
}

interface Opsaetning {
  /** Største vandrette udstrækning i rørmidtens niveau, målt fra figurens midte (m). */
  indreHalv: number;
  /** Ydre kant af rørene, som gravens bund skal rumme (m). */
  bundHalv: number;
  T3: number;
  d: number;
  /** Dybden til det nederste netlag, når det ligger under rørmidten (fund K-25). */
  netDybde?: number;
}

function tegning({ indreHalv, bundHalv, T3, d, netDybde = T3 }: Opsaetning) {
  const bund = Math.max(T3 + d / 2, netDybde) + BUNDLAG;
  const hwBund = Math.max(bundHalv + 0.3, indreHalv + 0.2 - (bund - netDybde) * HAELDNING);
  const hw = (y: number) => hwBund + (bund - y) * HAELDNING;
  const xHalv = hw(0) + 0.4;
  const dybde = bund + 0.3;
  const s = Math.min((BREDDE - MARGEN.venstre - MARGEN.hoejre) / (2 * xHalv), MAX_HOEJDE / dybde);
  const X = (x: number) => px(MARGEN.venstre + (x + xHalv) * s);
  const Y = (y: number) => px(MARGEN.top + y * s);
  const dele: string[] = [];
  const hoejde = px(MARGEN.top + dybde * s + MARGEN.bund);

  const polygon = (punkter: [number, number][], fyld: string, ekstra = '') =>
    dele.push(
      `<polygon points="${punkter.map(([x, y]) => `${X(x)},${Y(y)}`).join(' ')}" fill="${fyld}"${ekstra}/>`,
    );
  // Uberørt jord, graven over og under rørmidten, og terræn.
  dele.push(
    `<rect x="${X(-xHalv)}" y="${Y(0)}" width="${px(2 * xHalv * s)}" height="${px(dybde * s)}" fill="${farve.jord}"/>`,
  );
  polygon(
    [
      [-hw(0), 0],
      [hw(0), 0],
      [hw(T3), T3],
      [-hw(T3), T3],
    ],
    farve.fyld,
  );
  polygon(
    [
      [-hw(T3), T3],
      [hw(T3), T3],
      [hw(bund), bund],
      [-hw(bund), bund],
    ],
    farve.bund,
    ' fill-opacity="0.45"',
  );
  dele.push(linje(X(-xHalv), Y(0), X(xHalv), Y(0), farve.ink, 1.5));

  return { X, Y, s, xHalv, dybde, bund, hoejde, dele };
}
type Tegning = ReturnType<typeof tegning>;

function linje(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  stroke: string,
  w: number,
  ekstra = '',
) {
  return `<line x1="${px(x1)}" y1="${px(y1)}" x2="${px(x2)}" y2="${px(y2)}" stroke="${stroke}" stroke-width="${w}"${ekstra}/>`;
}
/** Tekst med hvid kant, så den kan læses på fyldfarverne. */
function tekst(
  x: number,
  y: number,
  t: string,
  anker: 'start' | 'middle' | 'end' = 'middle',
  fyld = farve.ink,
) {
  return `<text x="${px(x)}" y="${px(y)}" text-anchor="${anker}" fill="${fyld}" stroke="#ffffff" stroke-width="3" paint-order="stroke">${medIndeks(t)}</text>`;
}
function pilespids(x: number, y: number, retning: 'v' | 'h' | 'o' | 'n') {
  const p = {
    v: [
      [x, y],
      [x + 7, y - 3.5],
      [x + 7, y + 3.5],
    ],
    h: [
      [x, y],
      [x - 7, y - 3.5],
      [x - 7, y + 3.5],
    ],
    o: [
      [x, y],
      [x - 3.5, y + 7],
      [x + 3.5, y + 7],
    ],
    n: [
      [x, y],
      [x - 3.5, y - 7],
      [x + 3.5, y - 7],
    ],
  }[retning];
  return `<polygon points="${p.map(([a, b]) => `${px(a)},${px(b)}`).join(' ')}" fill="${farve.ink}"/>`;
}
/** Vandret mål mellem x1 og x2 (pixel) i højden y, med teksten over eller under linjen. */
function vandretMaal(x1: number, x2: number, y: number, t: string, under = false, ty = 0) {
  return [
    linje(x1, y - 5, x1, y + 5, farve.ink, 1),
    linje(x2, y - 5, x2, y + 5, farve.ink, 1),
    linje(x1, y, x2, y, farve.ink, 1),
    pilespids(x1, y, 'v'),
    pilespids(x2, y, 'h'),
    tekst((x1 + x2) / 2, (under ? y + 16 : y - 6) + ty, t),
  ].join('');
}
/** Lodret mål mellem y1 og y2 (pixel) ved x, med teksten til højre. */
function lodretMaal(x: number, y1: number, y2: number, t: string) {
  return [
    linje(x - 5, y1, x + 5, y1, farve.ink, 1),
    linje(x - 5, y2, x + 5, y2, farve.ink, 1),
    linje(x, y1, x, y2, farve.ink, 1),
    pilespids(x, y1, 'o'),
    pilespids(x, y2, 'n'),
    t ? tekst(x + 8, (y1 + y2) / 2 + 4, t, 'start') : '',
  ].join('');
}
function roerKant(radius: number) {
  return Math.min(8, Math.max(2.5, radius * 0.12));
}
function roer(t: Tegning, cx: number, T3: number, d: number) {
  const r = (d / 2) * t.s;
  return `<circle cx="${t.X(cx)}" cy="${t.Y(T3)}" r="${px(r)}" fill="#ffffff" stroke="${farve.ink}" stroke-width="${px(roerKant(r))}"/>`;
}
function gvs(t: Tegning, dybde: number) {
  if (dybde > t.dybde)
    return tekst(
      BREDDE - MARGEN.hoejre - 4,
      t.Y(t.dybde) - 6,
      `GVS i ${m(dybde)} (under figuren)`,
      'end',
      farve.vand,
    );
  const y = t.Y(dybde);
  const x = BREDDE - MARGEN.hoejre - 24;
  return [
    linje(t.X(-t.xHalv), y, t.X(t.xHalv), y, farve.vand, 1.5, ' stroke-dasharray="7 5"'),
    `<polygon points="${px(x - 5)},${px(y - 9)} ${px(x + 5)},${px(y - 9)} ${px(x)},${px(y - 1)}" fill="${farve.vand}"/>`,
    tekst(x - 9, y - 4, 'GVS', 'end', farve.vand),
  ].join('');
}
function svg(t: Tegning, label: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${BREDDE} ${t.hoejde}" width="${BREDDE}" height="${t.hoejde}" aria-hidden="true" font-family="'Segoe UI', system-ui, sans-serif" font-size="12"><title>${esc(label)}</title>${t.dele.join('')}</svg>`;
}

/** Tværsnit med terræn, GVS, rør og koterne T₁–T₃ (regnearkets image4). */
export function tvaersnitSvg(r: OpdriftResultat, i: OpdriftInput, navn = 'rør'): string {
  const { d, h1 } = i;
  const T3 = r.T3;
  const t = tegning({ indreHalv: d / 2, bundHalv: d / 2, T3, d });
  // Feltet B: fyldet over rørmidten i rørets bredde.
  for (const x of [-d / 2, d / 2])
    t.dele.push(linje(t.X(x), t.Y(0), t.X(x), t.Y(T3), farve.muted, 1, ' stroke-dasharray="4 4"'));
  if (h1 * t.s > 22) t.dele.push(tekst(t.X(0), t.Y(h1 / 2) + 4, 'B'));
  t.dele.push(roer(t, 0, T3, d));
  t.dele.push(gvs(t, i.gvs));
  // Mål til venstre for røret: jorddækning og halv diameter.
  const xm = t.X(-d / 2) - 18;
  if (h1 > 0)
    t.dele.push(
      lodretMaal(xm, t.Y(0), t.Y(h1), ''),
      tekst(xm - 8, t.Y(h1 / 2) + 4, `h₁ = ${m(h1)}`, 'end'),
    );
  t.dele.push(
    lodretMaal(xm, t.Y(h1), t.Y(T3), ''),
    tekst(xm - 8, t.Y(h1 + d / 4) + 4, `d/2 = ${m(d / 2)}`, 'end'),
  );
  t.dele.push(vandretMaal(t.X(-d / 2), t.X(d / 2), t.Y(t.bund) + 22, `d = ${m(d)}`, true));
  // Koterne til højre, skubbet fra hinanden, hvis de ligger for tæt.
  const xk = BREDDE - MARGEN.hoejre + 8;
  let sidste = -Infinity;
  for (const [koten, dybde] of [
    ['T₁ terræn', 0],
    ['T₂ GVS', i.gvs],
    ['T₃ rørmidte', T3],
  ] as [string, number][]) {
    const y = t.Y(Math.min(dybde, t.dybde));
    const yt = Math.max(y + 4, sidste + 15);
    sidste = yt;
    t.dele.push(
      linje(xk - 8, y, xk - 2, y, farve.ink, 1),
      tekst(xk, yt, `${koten}: ${m(dybde)}`, 'start'),
    );
  }
  return svg(t, `Tværsnit af ${navn} med terræn, GVS og koter`);
}

/** Løsningerne fra regnearkets afsnit 9–12 (image2, image5, image7 og image8). */
export function losningSvg(r: OpdriftResultat, i: OpdriftInput, losning: Losning): string {
  const { d } = i;
  const T3 = r.T3;
  const to = losning === 'B' || losning === 'D';
  const omslag = losning === 'C' || losning === 'D';
  const valgt = r.losninger[losning];
  // Siden tegner kun løsninger, der findes; omslag er ikke muligt ved h_top ≤ 0.
  if (!valgt) throw new Error(`Løsning ${losning} findes ikke i denne beregning.`);
  const L = valgt.L;
  const mellem = 'toLMellem' in valgt ? valgt.toLMellem : 0;
  const centre = to ? [-(mellem / 2 + d / 2), mellem / 2 + d / 2] : [0];
  const ydre = (to ? mellem / 2 + d : d / 2) + L;
  const t = tegning({ indreHalv: ydre, bundHalv: to ? mellem / 2 + d : d / 2, T3, d });
  t.dele.push(gvs(t, i.gvs));
  for (const cx of centre) t.dele.push(roer(t, cx, T3, d));

  // Geonettet ligger i rørmidtens niveau og hen over rørenes øverste halvdel. Med omslag lægges
  // nettet ud forneden først og bukkes derefter tilbage over sig selv ved enderne.
  const radius = (d / 2) * t.s + roerKant((d / 2) * t.s) / 2 + 2;
  const yBund = t.Y(T3);
  // Afstanden mellem netlagene tegnes mindst 16 px, så omslaget kan ses; målene står med de
  // beregnede værdier.
  const afstand = Math.max((r.hBund - r.hTop) * t.s, 16);
  const yTop = px(yBund - afstand);
  const over = (cx: number) =>
    ` L ${px(t.X(cx) - radius)} ${yBund} A ${px(radius)} ${px(radius)} 0 0 1 ${px(t.X(cx) + radius)} ${yBund}`;
  // Vending ved en ende: lodret fra toplaget ned til bundlaget eller omvendt, med skarpe hjørner
  // som i regnearkets figur.
  const ned = (x: number) => ` H ${px(x)} V ${yBund}`;
  const op = (x: number) => ` L ${px(x)} ${yBund} V ${yTop}`;
  const xVenstre = t.X(-ydre);
  const xHoejre = t.X(ydre);
  const tilbage = TOPLAG * L * t.s;
  let sti: string;
  if (!omslag) sti = `M ${xVenstre} ${yBund}${centre.map(over).join('')} L ${xHoejre} ${yBund}`;
  else if (!to)
    sti = `M ${px(xVenstre + tilbage)} ${yTop}${ned(xVenstre)}${over(0)}${op(xHoejre)} H ${px(xHoejre - tilbage)}`;
  else {
    // Ét net pr. rør. I midten bukkes de to net om, så de ligger op ad hinanden. Det fælles
    // lodrette stykke tegnes kun én gang, så to stiplede linjer ikke ligger oven i hinanden.
    const xMidt = t.X(0);
    const tilbageMidt = TOPLAG * (mellem / 2) * t.s;
    sti =
      `M ${px(xVenstre + tilbage)} ${yTop}${ned(xVenstre)}${over(centre[0])}` +
      `${op(xMidt)} H ${px(xMidt - tilbageMidt)}`;
    sti +=
      ` M ${px(xMidt + tilbageMidt)} ${yTop} H ${px(xMidt)} M ${px(xMidt)} ${yBund}${over(centre[1])}` +
      `${op(xHoejre)} H ${px(xHoejre - tilbage)}`;
  }
  t.dele.push(
    `<path d="${sti}" fill="none" stroke="${farve.net}" stroke-width="2.5" stroke-dasharray="6 4" stroke-linejoin="miter"/>`,
  );

  // L_a over terræn.
  t.dele.push(vandretMaal(t.X(-ydre), t.X(ydre), t.Y(0) - 22, `L_{a} = ${m(valgt.La)}`));
  // Forankringslængder under graven, med hjælpelinjer fra nettet.
  const yl = t.Y(t.bund) + 22;
  const stykker: [number, number, string][] = to
    ? [
        [-ydre, centre[0] - d / 2, `L_{geonet} = ${m(L)}`],
        [centre[0] + d / 2, centre[1] - d / 2, `L_{mellem} = ${m(mellem)}`],
        [centre[1] + d / 2, ydre, `L_{geonet} = ${m(L)}`],
      ]
    : [
        [-ydre, -d / 2, `L_{geonet} = ${m(L)}`],
        [d / 2, ydre, `L_{geonet} = ${m(L)}`],
      ];
  // Overlapper en tekst den forrige, flyttes den en linje ned.
  let forrigeHoejre = -Infinity;
  let forrigeNede = false;
  for (const [x1, x2, navn] of stykker) {
    const midt = (t.X(x1) + t.X(x2)) / 2;
    const nede: boolean = !forrigeNede && midt - bredde(navn) / 2 < forrigeHoejre + 6;
    t.dele.push(
      linje(t.X(x1), t.Y(T3), t.X(x1), yl, farve.muted, 1, ' stroke-dasharray="2 3"'),
      linje(t.X(x2), t.Y(T3), t.X(x2), yl, farve.muted, 1, ' stroke-dasharray="2 3"'),
      vandretMaal(t.X(x1), t.X(x2), yl, navn, true, nede ? 15 : 0),
    );
    forrigeHoejre = midt + bredde(navn) / 2;
    forrigeNede = nede;
  }
  // Højder til højre for graven.
  const xh = BREDDE - MARGEN.hoejre + 12;
  const midt = (t.Y(0) + t.Y(r.hBund)) / 2;
  if (omslag) {
    // To mål side om side; teksterne står over hinanden til højre.
    t.dele.push(
      lodretMaal(xh, t.Y(0), yTop, ''),
      lodretMaal(xh + 14, t.Y(0), t.Y(r.hBund), ''),
      tekst(xh + 24, midt - 5, `h_{top} = ${m(r.hTop)}`, 'start'),
      tekst(xh + 24, midt + 11, `h_{bund} = ${m(r.hBund)}`, 'start'),
    );
  } else t.dele.push(lodretMaal(xh, t.Y(0), t.Y(r.hBund), `h_{bund} = ${m(r.hBund)}`));
  // Signatur for geonettet.
  const ys = t.hoejde - 10;
  t.dele.push(
    linje(
      MARGEN.venstre,
      ys - 4,
      MARGEN.venstre + 28,
      ys - 4,
      farve.net,
      2.5,
      ' stroke-dasharray="6 4"',
    ),
    tekst(MARGEN.venstre + 34, ys, 'Geonet', 'start'),
  );
  const titel = {
    A: 'Opdriftssikring uden omslag',
    B: 'Opdriftssikring uden omslag ved to ledninger',
    C: 'Opdriftssikring med omslag',
    D: 'Opdriftssikring med omslag ved to ledninger',
  }[losning];
  return svg(t, titel);
}

/** Rørets tværsnit delt af GVS med koterne T₂ og T₃ og A_tør, A_våd, a, θ og r (avanceret
 * beregning, GVS mellem rørtop og rørbund). Cirklen har fast størrelse; GVS' placering følger
 * forholdet a/r. */
export function opdriftsarealSvg(r: OpdriftResultat, i: OpdriftInput): string | null {
  const z = r.gvsZone;
  if (!z || z.zone === 1 || z.zone === 4) return null;
  const radius = i.d / 2;
  const R = 90;
  const cx = 244; // plads til koterne til venstre
  const cy = 125;
  const xTekst = cx + R + 23;
  const s = R / radius;
  const yGvs = cy - z.a * s;
  const c = Math.sqrt(radius ** 2 - z.a ** 2) * s;
  const theta = Math.acos(z.a / radius);
  const under = z.a < 0; // GVS under rørmidten: den tørre del er størst
  const venstre = `${px(cx - c)} ${px(yGvs)}`;
  const hoejre = `${px(cx + c)} ${px(yGvs)}`;
  const leder = (x: number, y: number, ty: number) =>
    linje(x, y, xTekst - 6, ty - 4, farve.muted, 0.75, ' stroke-dasharray="3 2"');
  const bue = 24;
  const dele = [
    `<path d="M${venstre} A${R} ${R} 0 ${under ? 1 : 0} 1 ${hoejre} Z" fill="${farve.bund}" fill-opacity="0.22"/>`,
    `<path d="M${venstre} A${R} ${R} 0 ${under ? 0 : 1} 0 ${hoejre} Z" fill="${farve.vand}" fill-opacity="0.25"/>`,
    `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${farve.ink}" stroke-width="2"/>`,
    linje(cx - R - 14, yGvs, cx + R + 14, yGvs, farve.vand, 1.5, ' stroke-dasharray="7 5"'),
    // Rørmidtens niveau, som koten T₃ henviser til.
    linje(cx - R - 14, cy, cx, cy, farve.muted, 1, ' stroke-dasharray="4 3"'),
    linje(cx, cy, cx - c, yGvs, farve.muted, 1, ' stroke-dasharray="4 3"'),
    linje(cx, cy, cx + c, yGvs, farve.muted, 1, ' stroke-dasharray="4 3"'),
    linje(cx, cy, cx, yGvs, farve.ink, 1),
    `<path d="M${cx} ${cy - bue} A${bue} ${bue} 0 0 1 ${px(cx + bue * Math.sin(theta))} ${px(cy - bue * Math.cos(theta))}" fill="none" stroke="${farve.ink}" stroke-width="1"/>`,
    `<circle cx="${cx}" cy="${cy}" r="3" fill="${farve.ink}"/>`,
    leder(cx + 4, (cy - R + yGvs) / 2, 46),
    tekst(xTekst, 46, `A_{tør} = ${tal(z.Ator, 4)} m²`, 'start'),
    leder(cx + 2, (cy + yGvs) / 2, 96),
    tekst(xTekst, 96, `a = T₃ − T₂ = ${m(z.a)}`, 'start'),
    leder(cx + bue * Math.sin(theta / 2), cy - bue * Math.cos(theta / 2), 126),
    tekst(xTekst, 126, `θ = arccos(a/r) = ${tal((theta * 180) / Math.PI)}°`, 'start'),
    leder(cx + c / 2, (cy + yGvs) / 2, 156),
    tekst(xTekst, 156, `r = d/2 = ${m(radius)}`, 'start'),
    leder(cx - 4, (yGvs + cy + R) / 2, 206),
    tekst(xTekst, 206, `A_{våd} = ${tal(z.Avaad, 4)} m²`, 'start'),
  ];
  // Koterne til venstre som i tværsnittet i kort 3, skubbet fra hinanden, hvis de ligger for tæt.
  const koter: [string, number, number, string][] = [
    ['T₂ GVS', i.gvs, yGvs, farve.vand],
    ['T₃ rørmidte', r.T3, cy, farve.ink],
  ];
  koter.sort((k1, k2) => k1[2] - k2[2]);
  let sidste = -Infinity;
  for (const [koten, dybde, y, fyld] of koter) {
    const yt = Math.max(y + 4, sidste + 15);
    sidste = yt;
    dele.push(tekst(cx - R - 18, yt, `${koten}: ${m(dybde)}`, 'end', fyld));
  }
  const label = 'Rørets tværsnit delt af GVS: arealet over og under GVS';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 530 250" width="530" height="250" aria-hidden="true" font-family="'Segoe UI', system-ui, sans-serif" font-size="12"><title>${esc(label)}</title>${dele.join('')}</svg>`;
}

/** Løsningen med omslag for én ledning, hvor nettet er ført ned langs rørets sider og forankret i
 * dybden h_bund (fund K-25, docs/FORSLAG_DYB_FORANKRING.md). Lodrette sidestykker og skarpe hjørner
 * er en idealisering. */
export function dybForankringSvg(
  r: OpdriftResultat,
  i: OpdriftInput,
  dyb: { L: number; hBund: number; hTop: number; dh: number },
): string {
  const { d } = i;
  const T3 = r.T3;
  const { L, hBund, hTop, dh } = dyb;
  const ydre = d / 2 + L;
  const t = tegning({ indreHalv: ydre, bundHalv: d / 2, T3, d, netDybde: hBund });
  t.dele.push(gvs(t, i.gvs));
  t.dele.push(roer(t, 0, T3, d));

  // Nettet går over røret, lodret ned langs rørets sider til h_bund, ud til enden og tilbage i h_top.
  const radius = (d / 2) * t.s + roerKant((d / 2) * t.s) / 2 + 2;
  const yMidt = t.Y(T3);
  const yBund = t.Y(hBund);
  const yTop = px(yBund - Math.max((hBund - hTop) * t.s, 16));
  const xVenstre = t.X(-ydre);
  const xHoejre = t.X(ydre);
  const xRoerV = px(t.X(0) - radius);
  const xRoerH = px(t.X(0) + radius);
  const tilbage = TOPLAG * L * t.s;
  const sti =
    `M ${px(xVenstre + tilbage)} ${yTop} H ${xVenstre} V ${yBund} H ${xRoerV} V ${yMidt}` +
    ` A ${px(radius)} ${px(radius)} 0 0 1 ${xRoerH} ${yMidt} V ${yBund} H ${xHoejre} V ${yTop}` +
    ` H ${px(xHoejre - tilbage)}`;
  t.dele.push(
    `<path d="${sti}" fill="none" stroke="${farve.net}" stroke-width="2.5" stroke-dasharray="6 4" stroke-linejoin="miter"/>`,
  );

  // L_a over terræn og forankringslængderne under graven.
  t.dele.push(vandretMaal(xVenstre, xHoejre, t.Y(0) - 22, `L_{a} = ${m(2 * L + d)}`));
  const yl = t.Y(t.bund) + 22;
  for (const [x1, x2] of [
    [-ydre, -d / 2],
    [d / 2, ydre],
  ])
    t.dele.push(
      linje(t.X(x1), yBund, t.X(x1), yl, farve.muted, 1, ' stroke-dasharray="2 3"'),
      linje(t.X(x2), yBund, t.X(x2), yl, farve.muted, 1, ' stroke-dasharray="2 3"'),
      vandretMaal(t.X(x1), t.X(x2), yl, `L_{geonet} = ${m(L)}`, true),
    );
  // Sænkningen fra rørmidten til det nederste netlag, til venstre for røret.
  const xDh = xRoerV - 12;
  if (yBund - yMidt >= 24)
    t.dele.push(
      linje(xVenstre, yMidt, xRoerV, yMidt, farve.muted, 1, ' stroke-dasharray="4 3"'),
      lodretMaal(xDh, yMidt, yBund, ''),
      tekst(xDh - 8, (yMidt + yBund) / 2 + 4, `Δh = ${m(dh)}`, 'end'),
    );
  // Højder til højre for graven.
  const xh = BREDDE - MARGEN.hoejre + 12;
  const midt = (t.Y(0) + yBund) / 2;
  t.dele.push(
    lodretMaal(xh, t.Y(0), yTop, ''),
    lodretMaal(xh + 14, t.Y(0), yBund, ''),
    tekst(xh + 24, midt - 5, `h_{top} = ${m(hTop)}`, 'start'),
    tekst(xh + 24, midt + 11, `h_{bund} = ${m(hBund)}`, 'start'),
  );
  const ys = t.hoejde - 10;
  t.dele.push(
    linje(
      MARGEN.venstre,
      ys - 4,
      MARGEN.venstre + 28,
      ys - 4,
      farve.net,
      2.5,
      ' stroke-dasharray="6 4"',
    ),
    tekst(MARGEN.venstre + 34, ys, 'Geonet', 'start'),
  );
  return svg(t, 'Dybere forankring med omslag');
}
