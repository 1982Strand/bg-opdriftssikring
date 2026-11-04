/** Principfigurer til »Kraftens vej i geonettet« som SVG-tekst. Figurerne er skitser og ikke målfaste,
 * bortset fra at kraftpilene i figur 2 har samme målestok. Kræfterne har faste farver: opdrift blå,
 * træk rav, jordreaktion rød og geonet grønt. */
import { esc, px } from './figurer.ts';
import { tal } from './format.ts';

const farve = {
  ink: '#263a32',
  muted: '#637068',
  card: '#ffffff',
  net: '#25584a',
  f: '#1d63a8',
  t: '#a35c00',
  r: '#b42318',
  jord: '#f0ebdd',
  jordDyb: '#e3d8bd',
  roer: '#d5ddd8',
};
const SKRIFT_UI = `'Segoe UI', system-ui, sans-serif`;
const SKRIFT_MAT = `'Cambria Math', Cambria, 'Times New Roman', serif`;

type Stil = 'lbl' | 'lille' | 'note';
type Kraft = 'f' | 't' | 'r';
type Pil = Kraft | 'k' | 'fr';

function tekstStil(stil: Stil, kraft?: Kraft) {
  if (stil === 'note') return `font-family="${SKRIFT_UI}" font-size="13" fill="${farve.muted}"`;
  const fyld = kraft ? farve[kraft] : farve.ink;
  return `font-family="${SKRIFT_MAT}" font-style="italic" font-size="${stil === 'lille' ? 15 : 18}" fill="${fyld}"`;
}

/** Tekst med sænket skrift skrevet som F_{op,d}. */
function txt(
  x: number,
  y: number,
  t: string,
  stil: Stil = 'lbl',
  kraft?: Kraft,
  anker: 'start' | 'middle' | 'end' = 'start',
) {
  let ud = '';
  let lav = false;
  for (const del of t.split(/(_\{[^}]*\})/)) {
    if (!del) continue;
    if (del.startsWith('_{')) {
      ud += `<tspan dy="${lav ? 0 : 5}" font-size="72%" font-style="normal">${esc(del.slice(2, -1))}</tspan>`;
      lav = true;
    } else {
      ud += lav ? `<tspan dy="-5">${esc(del)}</tspan>` : esc(del);
      lav = false;
    }
  }
  return `<text x="${px(x)}" y="${px(y)}" text-anchor="${anker}" ${tekstStil(stil, kraft)}>${ud}</text>`;
}

const pilFarve: Record<Pil, string> = {
  f: farve.f,
  t: farve.t,
  r: farve.r,
  k: farve.t,
  fr: farve.r,
};
const pilBredde: Record<Pil, number> = { f: 2.8, t: 2.8, r: 2.8, k: 1.8, fr: 2 };

/** Pil fra (x1, y1) til (x2, y2) med pilespids som polygon. */
function pil(x1: number, y1: number, x2: number, y2: number, type: Pil, stiplet = false) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const L = Math.hypot(dx, dy);
  if (L < 3) return '';
  const ux = dx / L;
  const uy = dy / L;
  const h = Math.min(type === 'fr' || type === 'k' ? 9 : 12, L * 0.5);
  const b = h * 0.42;
  const bx = x2 - ux * h;
  const by = y2 - uy * h;
  const streg = stiplet ? ' stroke-dasharray="6 5"' : '';
  const dump = type === 'k' ? ' opacity="0.8"' : '';
  return (
    `<g${dump}><line x1="${px(x1)}" y1="${px(y1)}" x2="${px(bx)}" y2="${px(by)}" stroke="${pilFarve[type]}" stroke-width="${pilBredde[type]}" stroke-linecap="round"${streg}/>` +
    `<polygon fill="${pilFarve[type]}" points="${px(x2)},${px(y2)} ${px(bx - uy * b)},${px(by + ux * b)} ${px(bx + uy * b)},${px(by - ux * b)}"/></g>`
  );
}

const jordFlade = (x: number, y: number, b: number, h: number, ekstra = '') =>
  `<rect x="${x}" y="${y}" width="${b}" height="${h}" fill="${farve.jord}"${ekstra}/>`;
const roer = (cx: number, cy: number, r: number) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${farve.roer}" stroke="${farve.ink}" stroke-width="2"/>`;
const net = (d: string) =>
  `<path d="${d}" fill="none" stroke="${farve.net}" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round"/>`;
const vaeg = (x: number, y: number, b: number, h: number) =>
  `<rect x="${x}" y="${y}" width="${b}" height="${h}" fill="${farve.jordDyb}" stroke="${farve.muted}" stroke-width="1.2"/>`;
const nr = (x: number, y: number, n: number) =>
  `<g><circle cx="${x}" cy="${y}" r="11" fill="${farve.ink}"/><text x="${x}" y="${y + 4}" text-anchor="middle" font-family="${SKRIFT_UI}" font-size="12" font-weight="600" fill="${farve.card}">${n}</text></g>`;
const svg = (b: number, h: number, indhold: string, label: string, y0 = 0, x0 = 0) =>
  `<svg viewBox="${x0} ${y0} ${b} ${h}" role="img" aria-label="${esc(label)}">${indhold}</svg>`;

/** Figur 1: overblik over kraftens vej. */
export function figurOverblik() {
  let g = jordFlade(0, 40, 680, 290);
  g += `<line x1="0" y1="40" x2="680" y2="40" stroke="${farve.ink}" stroke-width="1.5"/>`;
  g += txt(12, 30, 'Terræn og grundvandsspejl', 'note');
  g += roer(340, 175, 75);
  g += net(
    'M 25 189 L 251 189 A 14 14 0 0 0 265 175 A 75 75 0 0 1 415 175 A 14 14 0 0 0 429 189 L 655 189',
  );
  g += txt(340, 84, 'geonet med trækket T i hver side', 'note', undefined, 'middle');
  g += nr(214, 80, 2);
  g += pil(340, 238, 340, 126, 'f');
  g += txt(350, 196, 'F_{op,d}', 'lbl', 'f');
  g += nr(318, 210, 1);
  g += pil(462.2, 141.8, 422.6, 181.4, 'r');
  g += pil(217.8, 141.8, 257.4, 181.4, 'r');
  g += txt(467, 138, 'R', 'lbl', 'r');
  g += txt(213, 138, 'R', 'lbl', 'r', 'end');
  g += nr(494, 132, 3);
  for (const x of [470, 510, 550, 590]) g += pil(x, 201, x + 24, 201, 'fr');
  for (const x of [210, 170, 130, 90]) g += pil(x, 201, x - 24, 201, 'fr');
  g += txt(542, 224, 'friktion', 'note', undefined, 'middle');
  g += txt(138, 224, 'friktion', 'note', undefined, 'middle');
  g += nr(600, 220, 4);
  g += txt(14, 318, 'Jord', 'note');
  return svg(
    680,
    330,
    g,
    'Tværsnit: rør i jord med geonet over røret, der går vandret ud i begge sider. Opdriften løfter røret, jorden presser imod i knækkene, og friktionen langs nettet holder det.',
  );
}

/** Tallene på figur 2, når opdriftssikring er nødvendig. */
export interface LigevaegtTal {
  F: number;
  T: number;
  lodret: number;
  vandret: number;
}

/** Figur 2: rørets ligevægt med valgfri vinkel α i grader. Røret er tegnet i fast størrelse, og
 * kraftpilene har samme målestok uanset eksemplets tal. Uden tal vises kun rør og net. */
export function figurLigevaegt(a: number, d: number, krafter: LigevaegtTal | null) {
  const C = { x: 340, y: 165 };
  const r = 80;
  const k = 140;
  const ben = 230;
  const s = Math.sin((a * Math.PI) / 180);
  const c = Math.cos((a * Math.PI) / 180);
  const R = { x: C.x + r * c, y: C.y - r * s };
  const Lp = { x: C.x - r * c, y: C.y - r * s };
  const RE = { x: R.x + ben * s, y: R.y + ben * c };
  const LE = { x: Lp.x - ben * s, y: Lp.y + ben * c };
  let g = roer(C.x, C.y, r);
  g += net(
    `M ${px(LE.x)} ${px(LE.y)} L ${px(Lp.x)} ${px(Lp.y)} A ${r} ${r} 0 0 1 ${px(R.x)} ${px(R.y)} L ${px(RE.x)} ${px(RE.y)}`,
  );
  // Hjælpelinje og vinkel.
  if (a >= 4) {
    g += `<line x1="${px(R.x)}" y1="${px(R.y)}" x2="${px(R.x)}" y2="${px(R.y + 70)}" stroke="${farve.muted}" stroke-width="1.2" stroke-dasharray="4 4"/>`;
    g += `<path d="M ${px(R.x)} ${px(R.y + 36)} A 36 36 0 0 0 ${px(R.x + 36 * s)} ${px(R.y + 36 * c)}" fill="none" stroke="${farve.muted}" stroke-width="1.4"/>`;
    const sh = Math.sin((a * Math.PI) / 360);
    const ch = Math.cos((a * Math.PI) / 360);
    g += txt(R.x + 52 * sh, R.y + 52 * ch + 6, 'α', 'lille', undefined, 'middle');
  }
  g += txt(C.x, C.y + 5, `Ø${Math.round(d * 1000)}`, 'note', undefined, 'middle');
  const label = `Rør med geonet, der slipper røret med vinklen ${a} grader fra lodret.`;
  // Bredere end tegningen, så tallene ved kraftpilene også er der ved store vinkler.
  const ramme = (indhold: string, tekst: string) => svg(760, 360, indhold, tekst, 50, -40);
  if (!krafter) return ramme(g, label);
  // Trækket i højre side med lodret og vandret del.
  const Lt = k / (2 * c);
  const S = { x: R.x + 14 * c, y: R.y - 14 * s };
  const E = { x: S.x + Lt * s, y: S.y + Lt * c };
  if (E.x - S.x > 6) g += pil(S.x, S.y, E.x, S.y, 'k', true);
  if (a > 0) g += txt(S.x, S.y - 9, `T · sin α = ${tal(krafter.vandret)}`, 'lille', 't');
  g += pil(E.x, S.y, E.x, E.y, 'k', true);
  g += txt(E.x + 10, (S.y + E.y) / 2 + 6, `T · cos α = ${tal(krafter.lodret)}`, 'lille', 't');
  g += pil(S.x, S.y, E.x, E.y, 't');
  const trekTekst = `T = ${tal(krafter.T)} kN/m`;
  g +=
    a < 10
      ? txt(E.x + 6, E.y + 22, trekTekst, 'lbl', 't')
      : txt(E.x + 16 * s - 2, E.y + 16 * c + 8, trekTekst, 'lbl', 't');
  // Trækket i venstre side.
  const S2 = { x: Lp.x - 14 * c, y: Lp.y - 14 * s };
  const E2 = { x: S2.x - Lt * s, y: S2.y + Lt * c };
  g += pil(S2.x, S2.y, E2.x, E2.y, 't');
  g +=
    a < 10
      ? txt(E2.x - 6, E2.y + 22, 'T', 'lbl', 't', 'end')
      : txt(E2.x - 16 * s + 2, E2.y + 16 * c + 8, 'T', 'lbl', 't', 'end');
  // Opdriften i samme målestok.
  g += pil(C.x, C.y + r + 143, C.x, C.y + r + 3, 'f');
  g += txt(C.x + 12, C.y + r + 80, `F_{op,d} = ${tal(krafter.F)} kN/m`, 'lbl', 'f');
  return ramme(g, `${label} Trækket i nettet er ${tal(1 / (2 * c))} gange opdriften.`);
}

/** Figur 3: knækket og kræfterne sat i forlængelse af hinanden. */
export function figurKnaek() {
  let g = jordFlade(10, 10, 340, 300, ' rx="4"');
  g += `<path d="M 116 194 L 116 84 A 110 110 0 0 1 226 194 Z" fill="${farve.jordDyb}"/>`;
  g += net('M 110 20 L 110 188 A 12 12 0 0 0 122 200 L 340 200');
  g += txt(122, 36, 'op til røret', 'note');
  g += txt(336, 190, 'ud til forankringen', 'note', undefined, 'end');
  g += txt(234, 146, 'jorden i hjørnet', 'note');
  g += pil(96, 186, 96, 70, 't');
  g += txt(84, 134, 'T', 'lbl', 't', 'end');
  g += pil(124, 214, 240, 214, 't');
  g += txt(182, 238, 'T', 'lbl', 't', 'middle');
  g += pil(187.7, 122.3, 117, 193, 'r');
  g += txt(192, 118, 'R = T · √2', 'lbl', 'r');
  // Kræfterne i forlængelse af hinanden.
  g += txt(400, 44, 'Kræfterne sat i forlængelse', 'note');
  g += pil(420, 270, 560, 270, 't');
  g += txt(490, 294, 'T', 'lbl', 't', 'middle');
  g += pil(560, 270, 560, 130, 't');
  g += txt(574, 206, 'T', 'lbl', 't');
  g += pil(560, 130, 420, 270, 'r');
  g += txt(480, 190, 'R = T · √2', 'lbl', 'r', 'end');
  g += `<path d="M 546 270 L 546 256 L 560 256" fill="none" stroke="${farve.muted}" stroke-width="1.4"/>`;
  g += txt(574, 120, '90°', 'note');
  return svg(
    680,
    320,
    g,
    'Netstykket i knækket trækkes op med T og ud med T. Jorden presser skråt imod med R lig T gange kvadratroden af 2. Til højre danner de tre kræfter en lukket retvinklet trekant.',
  );
}

/** Figur 4: tov over en trisse. */
export function figurTrisse() {
  let g = vaeg(316, 6, 96, 16);
  g += txt(418, 19, 'holder', 'note');
  g += `<line x1="260" y1="110" x2="346" y2="24" stroke="${farve.muted}" stroke-width="7" stroke-linecap="round"/>`;
  g += roer(260, 110, 46);
  g += `<circle cx="260" cy="110" r="4" fill="${farve.ink}"/>`;
  g += `<path d="M 214 18 L 214 110 A 46 46 0 0 0 260 156 L 560 156" fill="none" stroke="${farve.ink}" stroke-width="3" stroke-linejoin="round"/>`;
  g += vaeg(560, 106, 16, 100);
  g += pil(200, 96, 200, 22, 't');
  g += txt(190, 62, 'T', 'lbl', 't', 'end');
  g += txt(190, 82, 'røret løfter', 'note', undefined, 'end');
  g += pil(430, 172, 540, 172, 't');
  g += txt(485, 196, 'T', 'lbl', 't', 'middle');
  g += txt(485, 214, 'forankringen holder', 'note', undefined, 'middle');
  g += pil(275.6, 125.6, 332.2, 69, 'r');
  g += txt(340, 78, 'T · √2 på akslen', 'lbl', 'r');
  return svg(
    680,
    230,
    g,
    'Tov over en trisse: trækket T op og trækket T ud er lige store. Trissens aksel belastes skråt med T gange kvadratroden af 2.',
  );
}

const tvaersnit = () => jordFlade(0, 0, 330, 150, ' rx="4"') + roer(165, 80, 50);

/** Figur 5, venstre del: skrå netføring med α = 45°. */
export function figurSkraa() {
  let g = tvaersnit();
  g += net(
    'M 8 87 L 72.3 87 A 36 36 0 0 0 97.8 76.5 L 129.6 44.6 A 50 50 0 0 1 200.4 44.6 L 232.2 76.5 A 36 36 0 0 0 257.7 87 L 322 87',
  );
  for (const v of [125, 112.5, 100]) {
    const ux = Math.cos((v * Math.PI) / 180);
    const uy = Math.sin((v * Math.PI) / 180);
    g += pil(257.7 + 12 * ux, 51 + 12 * uy, 257.7 + 31 * ux, 51 + 31 * uy, 'fr');
    g += pil(72.3 - 12 * ux, 51 + 12 * uy, 72.3 - 31 * ux, 51 + 31 * uy, 'fr');
  }
  g += txt(270, 34, '0,54 · F', 'lille', 'r', 'middle');
  g += txt(60, 34, '0,54 · F', 'lille', 'r', 'middle');
  g += txt(322, 108, 'T = 0,71 · F', 'lille', 't', 'end');
  g += pil(165, 118, 165, 50, 'f');
  g += txt(174, 100, 'F', 'lbl', 'f');
  return svg(
    330,
    150,
    g,
    'Nettet slipper røret med 45 grader og bøjer jævnt ud i vandret. Trækket er 0,71 gange F.',
  );
}

/** Figur 5, højre del: trissevirkning med α = 0 og knæk ved rørmidten. */
export function figurKnaekket() {
  let g = tvaersnit();
  g += net(
    'M 8 106 L 105 106 A 10 10 0 0 0 115 96 L 115 80 A 50 50 0 0 1 215 80 L 215 96 A 10 10 0 0 0 225 106 L 322 106',
  );
  g += pil(254, 67, 221.5, 99.5, 'r');
  g += pil(76, 67, 108.5, 99.5, 'r');
  g += txt(260, 62, '0,71 · F', 'lille', 'r');
  g += txt(70, 62, '0,71 · F', 'lille', 'r', 'end');
  g += txt(322, 128, 'T = 0,50 · F', 'lille', 't', 'end');
  g += pil(165, 118, 165, 50, 'f');
  g += txt(174, 100, 'F', 'lbl', 'f');
  return svg(
    330,
    150,
    g,
    'Nettet slipper røret lodret og knækker 90 grader ud i vandret. Trækket er 0,50 gange F, og jorden i knækket presser imod med 0,71 gange F.',
  );
}
