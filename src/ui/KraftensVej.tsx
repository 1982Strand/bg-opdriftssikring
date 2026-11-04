import { useMemo, useState, type ReactNode } from 'react';
import { Button } from '../components/ui/button';
import { Slider } from '../components/ui/slider';
import {
  figurKnaek,
  figurKnaekket,
  figurLigevaegt,
  figurOverblik,
  figurSkraa,
  figurTrisse,
} from '../engine/kraftensvej-figurer';
import {
  aflaesning,
  beregnEksempel,
  eksempelS2,
  fasteVaerdier,
  s2Interval,
  standardEksempel,
  traekPrSide,
  vinkelVedS2,
  type Eksempel,
  type EksempelInput,
} from '../engine/kraftensvej';
import { tal } from '../engine/format';
import { Fmt } from './Fmt';
import { ikkeNoedvendigTekst } from './kontrolpunkter';
import { Notice } from './Notice';
import { SettingField } from './SettingField';
import { TabelRamme } from './TabelRamme';

/** Symbol i kursiv matematikskrift, med sænket skrift skrevet som `F_{op,d}`. */
const V = ({ t }: { t: string }) => (
  <i className="kv-v">
    <Fmt text={t} />
  </i>
);
const F = <V t="F_{op,d}" />;
const T = <V t="T" />;
const R = <V t="R" />;
const ALFA = <V t="α" />;
const THETA = <V t="θ" />;
const S2 = <V t="S₂" />;

const kNm = (x: number | null | undefined) => (x == null ? '–' : `${tal(x)} kN/m`);
const vinkel = (x: number) => `${tal(x, 1)}°`;
const heltEllerDecimaler = (x: number) => tal(x, Number.isInteger(x) ? 0 : 2);

function Formel({ children }: { children: ReactNode }) {
  return <div className="kv-formel">{children}</div>;
}

function Tegning({ svg }: { svg: string }) {
  return <div className="kv-svg" dangerouslySetInnerHTML={{ __html: svg }} />;
}

function Figur({ nr, tekst, children }: { nr: number; tekst: ReactNode; children: ReactNode }) {
  return (
    <figure className="kv-figur">
      {children}
      <figcaption>
        <strong>Figur {nr}.</strong> {tekst}
      </figcaption>
    </figure>
  );
}

/** Farvet mærke og procent for trækket i forhold til den værdi, der er regnet med. */
function Udnyttelse({ forhold, ok, ikkeOk }: { forhold: number; ok: string; ikkeOk: string }) {
  const erOk = forhold <= 1 + 1e-9;
  return (
    <>
      <span className={`kv-maerke ${erOk ? 'is-ok' : 'is-nej'}`}>{erOk ? ok : ikkeOk}</span>{' '}
      {tal(forhold * 100, 0)} %
    </>
  );
}

const kendteVinkler = [
  { alfa: 0, tekst: '0° · som i beregningen' },
  { alfa: 45, tekst: '45° · DANVA fig. 2.15' },
  { alfa: 60, tekst: '60° · grænsen for faktor 2' },
];

/** Boksen ved figur 2, hvor eksemplet kan ændres. Værdierne gemmes ikke og påvirker ikke beregningen
 * på siden Opdriftssikring (beslutning 4. november 2026). */
function EksempelBoks({
  input,
  e,
  saet,
  refresh,
  nulstil,
}: {
  input: EksempelInput;
  e: Eksempel;
  saet: (input: EksempelInput) => void;
  refresh: number;
  nulstil: () => void;
}) {
  const b = e.tilstand === 'beregnet' ? e : null;
  const felt = (
    key: keyof EksempelInput,
    label: string,
    help: string,
    min: number,
    step: number,
  ) => (
    <SettingField
      live
      refresh={refresh}
      field={{ key: `eksempel-${key}`, label, kind: 'number', help, min, step }}
      value={input[key]}
      change={(v) => saet({ ...input, [key]: Number(v) })}
    />
  );
  return (
    <div className="kv-eksempel" role="group" aria-labelledby="kv-eksempel-titel">
      <h5 id="kv-eksempel-titel">Eksempel</h5>
      <div className="kv-eksempel-felter">
        {felt('d', 'Rørdiameter d (m)', 'Udvendig diameter.', 0.01, 0.01)}
        {felt(
          'h1',
          'Jorddækning h₁ (m)',
          'Fra terræn til rørets top. Midten ligger i T₃ = h₁ + d/2.',
          0,
          0.01,
        )}
        {felt(
          'roervaegt',
          'Rørets egenvægt E_{k} (kg/m)',
          'Karakteristisk egenvægt pr. meter. Den regnes til gunst med faktoren 0,9. Med 0 kg/m ses der bort fra rørets egenvægt, hvilket er på den sikre side.',
          0,
          1,
        )}
      </div>
      <p className="kv-note">GVS i terræn</p>
      <dl className="kv-eksempel-resultat">
        <dt>
          <V t="S₁" />
        </dt>
        <dd>{tal(e.tilstand === 'ugyldig' ? null : e.S1)}</dd>
        <dt>{F}</dt>
        <dd>{kNm(b?.F)}</dd>
        <dt>Geonet</dt>
        <dd>{b ? (b.net?.navn ?? 'Kontakt leverandør') : '–'}</dd>
        <dt>
          <V t="P_{d}" />
        </dt>
        <dd>{kNm(b?.net?.Pd)}</dd>
        <dt>
          {S2} · {F}/2
        </dt>
        <dd>{kNm(b?.forankring)}</dd>
      </dl>
      <Button type="button" variant="outline" size="sm" onClick={nulstil}>
        Nulstil
      </Button>
    </div>
  );
}

function Ligevaegt({ e, d, boks }: { e: Eksempel; d: number; boks: ReactNode }) {
  const [alfa, setAlfa] = useState(30);
  const b = e.tilstand === 'beregnet' ? e : null;
  const a = b && aflaesning(alfa, b);
  const andel = traekPrSide(1, alfa);
  return (
    <figure className="kv-figur kv-figur-bred">
      {boks}
      <div className="kv-figur-indhold">
        <Tegning
          svg={figurLigevaegt(
            alfa,
            d,
            b && a && { F: b.F, T: a.T, lodret: a.lodret, vandret: a.vandret },
          )}
        />
        <div className="kv-styring">
          <div className="kv-styring-etiket" id="kv-alfa">
            Vinklen {ALFA}, hvor nettet slipper røret <span className="kv-alfa">{alfa}°</span>
          </div>
          <Slider
            min={0}
            max={70}
            step={1}
            value={[alfa]}
            onValueChange={([ny]) => setAlfa(ny)}
            thumbProps={{ 'aria-labelledby': 'kv-alfa', 'aria-valuetext': `${alfa} grader` }}
          />
          <div className="kv-knapper" role="group" aria-label="Kendte vinkler">
            {kendteVinkler.map(({ alfa: kendt, tekst }) => (
              <Button
                key={kendt}
                type="button"
                size="sm"
                variant={alfa === kendt ? 'default' : 'outline'}
                aria-pressed={alfa === kendt}
                onClick={() => setAlfa(kendt)}
              >
                {tekst}
              </Button>
            ))}
          </div>
        </div>
        {e.tilstand === 'ikkeNoedvendig' && <Notice>{ikkeNoedvendigTekst}</Notice>}
        {b && !b.net && (
          <Notice>Der produceres ikke geonet med den nødvendige styrke. Kontakt leverandør.</Notice>
        )}
        <dl className="kv-aflaesning">
          <dt>Træk pr. side</dt>
          <dd>
            {T} = {tal(andel)} · {F}
          </dd>
          <dt>I forhold til {ALFA} = 0</dt>
          <dd>× {tal(2 * andel)}</dd>
          <dt>Eksempel: træk pr. side</dt>
          <dd>{kNm(a?.T)}</dd>
          <dt>
            Trækkets udnyttelse af geonettets trækstyrke
            {a && b?.net && (
              <>
                {' '}
                → {b.net.navn} med <V t="P_{d}" /> = {kNm(b.net.Pd)} ({tal(a.T)} / {tal(b.net.Pd)})
              </>
            )}
          </dt>
          <dd>
            {a?.netUdnyttelse == null ? (
              '–'
            ) : (
              <Udnyttelse forhold={a.netUdnyttelse} ok="Holder" ikkeOk="Holder ikke" />
            )}
          </dd>
          <dt>
            Trækket i forhold til forankringen
            {a && b && (
              <>
                , dimensioneret for {S2} · {F}/2 = {kNm(b.forankring)} ({tal(a.T)} /{' '}
                {tal(b.forankring)})
              </>
            )}
          </dt>
          <dd>
            {a ? (
              <Udnyttelse forhold={a.forankringUdnyttelse} ok="Dækket" ikkeOk="Ikke dækket" />
            ) : (
              '–'
            )}
          </dd>
        </dl>
      </div>
      <figcaption>
        <strong>Figur 2.</strong> Rørets ligevægt. Pilene er tegnet i samme målestok: de stiplede
        lodrette dele er tilsammen lige så lange som {F}. Røret har samme størrelse i figuren uanset
        diameteren. Tallene er regnet i appen ud fra felterne i eksemplet, med GVS i terræn.
        Procenterne viser trækket pr. side i forhold til den værdi, der er regnet med. Over
        100&nbsp;% er trækket større end værdien.
      </figcaption>
    </figure>
  );
}

function EnkelTabel({
  label,
  hoved,
  raekker,
  talKolonner,
}: {
  label: string;
  hoved: ReactNode[];
  raekker: ReactNode[][];
  /** Kolonner med højrestillede tal. */
  talKolonner: number[];
}) {
  const klasse = (i: number) => (talKolonner.includes(i) ? 'num' : undefined);
  return (
    <TabelRamme label={label}>
      <table className="data-table">
        <thead>
          <tr>
            {hoved.map((celle, i) => (
              <th key={i} scope="col" className={klasse(i)}>
                {celle}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {raekker.map((raekke, r) => (
            <tr key={r}>
              {raekke.map((celle, i) => (
                <td key={i} className={klasse(i)}>
                  {celle}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </TabelRamme>
  );
}

/** Kapitlet »Kraftens vej i geonettet« på hjælpesiden. Teksten er neutral og selvstændig
 * (beslutning 4. november 2026); eksemplets tal kommer fra beregningen. */
export function KraftensVej() {
  const [input, setInput] = useState(standardEksempel);
  const [refresh, setRefresh] = useState(0);
  const e = useMemo(() => beregnEksempel(input), [input]);
  const b = e.tilstand === 'beregnet' ? e : null;
  return (
    <div className="kraftens-vej">
      <div className="kv-indledning">
        <p className="kv-lede">
          Hvordan opdriften går fra røret gennem nettet og ud i jorden, hvorfor trækket pr. side er{' '}
          {F}/2, og hvorfor jorden i knækket skal presse imod med {T} · √2.
        </p>
        <ul className="kv-noegle" aria-label="Farver i figurerne">
          <li>
            <b className="is-f" aria-hidden="true" />
            Opdrift {F}
          </li>
          <li>
            <b className="is-t" aria-hidden="true" />
            Træk i nettet {T}
          </li>
          <li>
            <b className="is-r" aria-hidden="true" />
            Jordreaktion {R}
          </li>
          <li>
            <b className="is-net" aria-hidden="true" />
            Geonet
          </li>
        </ul>
      </div>

      <section>
        <h4>Kraftens vej</h4>
        <p>
          Opdriften løfter røret. Ballasten over røret holder kun en del af det nede, og nettet
          optager resten. Det er restopdriften {F} = <V t="O_{d}" /> − <V t="B_{d}" />. Kraften går
          gennem fire led, før den er afleveret til jorden.
        </p>
        <Figur
          nr={1}
          tekst="Løsning uden omslag: nettet ligger over røret og går vandret ud i rørmidtens niveau."
        >
          <Tegning svg={figurOverblik()} />
        </Figur>
        <ol className="kv-trin">
          <li>Opdriften {F} løfter røret.</li>
          <li>
            Nettet over røret holder røret nede. Det strammes, og der opstår et træk {T} i hver
            side.
          </li>
          <li>
            Ved rørets side skifter nettet retning fra lodret til vandret. Jorden i hjørnet presser
            imod med {R}, så nettet ikke retter sig ud.
          </li>
          <li>
            Langs forankringen afleverer nettet trækket til jorden ved friktion. Det er den, der
            bestemmer forankringslængden.
          </li>
        </ol>
      </section>

      <section>
        <h4>Et net kan kun trække</h4>
        <p>
          Et geonet opfører sig som et tov. Det kan overføre træk langs sig selv, men ikke tryk
          eller bøjning. Trækket er det samme hele vejen langs et stykke net, der ikke afleverer
          kraft til jorden undervejs. Først langs forankringen aftager det, fordi friktionen tager
          en del for hver meter.
        </p>
        <p>
          En kraft, der virker skråt, kan deles i en lodret og en vandret del. Danner trækket {T}{' '}
          vinklen {ALFA} med lodret, er de to dele siderne i en retvinklet trekant med {T} som den
          lange side:
        </p>
        <Formel>
          lodret del = {T} · cos {ALFA} &nbsp;&nbsp;&nbsp; vandret del = {T} · sin {ALFA}
        </Formel>
        <p>
          Den lodrette del ligger op ad vinklen {ALFA}, og derfor er det cosinus. Ved {ALFA} = 0 er
          hele trækket lodret. Jo større vinklen er, jo mindre af trækket virker lodret.
        </p>
      </section>

      <section>
        <h4>
          Rørets ligevægt: {T} = {F}/(2 · cos {ALFA})
        </h4>
        <p>
          Røret står stille, når kræfterne på det går lige op. Nettet slipper røret i begge sider
          med vinklen {ALFA} fra lodret.
        </p>
        <ul className="kv-trin">
          <li>Opad virker {F}.</li>
          <li>
            Nedad trækker nettet i begge sider. Kun den lodrette del {T} · cos {ALFA} holder røret
            nede.
          </li>
          <li>
            De vandrette dele {T} · sin {ALFA} er lige store og modsat rettede. De ophæver hinanden.
          </li>
        </ul>
        <Formel>
          2 · {T} · cos {ALFA} = {F} &nbsp;&nbsp;⇒&nbsp;&nbsp; {T} = {F} / (2 · cos {ALFA})
        </Formel>
        <p>
          Tallet 2 er de to sider. Cos {ALFA} er den del af trækket, der virker lodret. Den står
          under brøkstregen, fordi nettet skal trækkes hårdere, jo mere det skrår, for at give den
          samme lodrette kraft. Den lodrette del er altid {F}/2 pr. side. Kun den vandrette del
          vokser med vinklen.
        </p>
        <Ligevaegt
          e={e}
          d={input.d}
          boks={
            <EksempelBoks
              input={input}
              e={e}
              saet={setInput}
              refresh={refresh}
              nulstil={() => {
                setInput(standardEksempel);
                setRefresh((r) => r + 1);
              }}
            />
          }
        />
      </section>

      <section>
        <h4>Knækket: hvorfor {T} · √2</h4>
        <p>
          I løsningen uden omslag følger nettet røret ned til rørmidten. Her går det lodret, og så
          knækker det 90° ud i vandret. I knækket skifter nettet retning, men trækket er det samme
          før og efter. Netstykket i knækket bliver derfor trukket op mod røret med {T} og ud mod
          forankringen med {T}. De to træk peger ikke samme vej, så noget skal holde netstykket på
          plads. Det er jorden i hjørnet.
        </p>
        <Figur
          nr={3}
          tekst={
            <>
              Til venstre netstykket i knækket med de to træk og jordens modhold {R}. Til højre de
              samme tre kræfter sat i forlængelse af hinanden. Trekanten lukker, fordi netstykket er
              i ligevægt.
            </>
          }
        >
          <Tegning svg={figurKnaek()} />
        </Figur>
        <p>
          De to træk står vinkelret på hinanden og er lige store. Sat i forlængelse danner de de to
          korte sider i en retvinklet trekant. Den lange side er den kraft, jorden skal levere.
          Pythagoras giver:
        </p>
        <Formel>
          {R}² = {T}² + {T}² = 2 · {T}² &nbsp;&nbsp;⇒&nbsp;&nbsp; {R} = √2 · {T} ≈ 1,41 · {T}
        </Formel>
        <p>
          Kraften peger skråt med 45°, midt mellem de to netretninger, fordi de to træk er lige
          store. Med {T} = {F}/2 bliver jordreaktionen {R} = √2/2 · {F} = 0,71 · {F} pr. side.
        </p>
        <p>
          Det samme kan skrives {F}/2 · 1/cos 45°. Diagonalen i et kvadrat med siden {T} er {T}/cos
          45°, og 1/cos 45° = √2 = 1,41.
        </p>
      </section>

      <section>
        <h4>Trissevirkning</h4>
        <p>
          Et tov lagt over en trisse har samme træk på begge sider, når trissen drejer frit. Trissen
          ændrer kun retningen. Til gengæld skal trissens aksel og holderen bære resultanten af de
          to træk, og ved 90° er den {T} · √2.
        </p>
        <Figur
          nr={4}
          tekst={
            <>
              Trissen vendt som knækket i figur 3: tovet går op mod røret og ud til forankringen.
              Trækket {T} er det samme på begge sider. Akslen og holderen bærer {T} · √2.
            </>
          }
        >
          <Tegning svg={figurTrisse()} />
        </Figur>
        <p>
          Beregningen antager, at nettet virker sådan i knækket: den lodrette kraft i geonettet
          overføres uændret til det vandrette plan. Derfor regnes forankringen for det samme {T} ={' '}
          {F}/2 som nettet over røret.
        </p>
        <p>
          I jorden er der ingen aksel. Jorden i hjørnet virker både som trisse og holder og optager{' '}
          {T} · √2. Antagelsen bygger på, at det armerede ballastlag virker som en semirigid enhed,
          og at trykspredningen fra ballasten giver en gunstig kraftkomposant i overgangen.
        </p>
      </section>

      <section>
        <h4>
          Den generelle regel: 2 · {T} · sin({THETA}/2)
        </h4>
        <p>
          Skifter et strammet net retning med vinklen {THETA}, skal det, nettet bøjer om, presse
          imod med
        </p>
        <Formel>
          {R} = 2 · {T} · sin({THETA}/2)
        </Formel>
        <p>
          Resultanten ligger på midterlinjen mellem de to netretninger. Hvert træk bidrager med {T}{' '}
          · sin({THETA}/2) langs midterlinjen, og delene på tværs ophæver hinanden. Ved {THETA} =
          90° er 2 · sin 45° = 2 · 0,707 = √2, som i knækket.
        </p>
        <EnkelTabel
          label="Jordreaktion ved forskellige retningsskift"
          hoved={[
            <>Retningsskift {THETA}</>,
            <>
              {R}/{T} = 2 · sin({THETA}/2)
            </>,
            'Hvor',
          ]}
          talKolonner={[1]}
          raekker={[
            ['0°', '0,00', 'Lige net. Ingen jordreaktion.'],
            ['45°', '0,77', 'Skrå netføring, der bøjer fra 45° til vandret.'],
            ['90°', '1,41', 'Knækket fra lodret til vandret.'],
            [
              <>180° − 2{ALFA}</>,
              <>2 · cos {ALFA}</>,
              <>Nettet over røret, der slipper ved {ALFA}.</>,
            ],
            ['180°', '2,00', <>Nettet over røret med {ALFA} = 0.</>],
          ]}
        />
        <p>
          Reglen gælder også for røret, for røret er selv en trisse for nettet. Over røret skifter
          nettet retning med {THETA} = 180° − 2{ALFA}, og rørets tryk på nettet bliver 2 · {T} ·
          sin(90° − {ALFA}) = 2 · {T} · cos {ALFA}. Det skal være lig med {F}, og det er præcis
          rørets ligevægt fra før. Ved {ALFA} = 0 vender nettet 180° over røret, og 2 · {T} = {F}.
        </p>
      </section>

      <section>
        <h4>To måder at føre nettet på</h4>
        <p>
          Kraften 0,71 · {F} optræder i begge principper, blot forskellige steder. Ved skrå
          netføring går den gennem nettet og ud i forankringen. Ved trissevirkning optager jorden i
          knækket den, og nettet og forankringen optager halvdelen af {F}.
        </p>
        <Figur
          nr={5}
          tekst={
            <>
              Til venstre nettet som i DANVA's figur 2.15, der slipper røret med 45° og bøjer jævnt
              ud i vandret. Til højre trissevirkning med knæk ved rørmidten, som beregningen regner
              med. <V t="F" /> står for {F}.
            </>
          }
        >
          <div className="kv-to-felter">
            <div>
              <Tegning svg={figurSkraa()} />
              <h5>Skrå netføring, {ALFA} = 45°</h5>
            </div>
            <div>
              <Tegning svg={figurKnaekket()} />
              <h5>Trissevirkning, {ALFA} = 0</h5>
            </div>
          </div>
        </Figur>
        <EnkelTabel
          label="Sammenligning af de to netføringer"
          hoved={['Størrelse', <>Skrå, {ALFA} = 45°</>, <>Trisse, {ALFA} = 0</>]}
          talKolonner={[1, 2]}
          raekker={[
            [
              <>Træk i nettet {T}</>,
              <>
                0,71 · <V t="F" />
              </>,
              <>
                0,50 · <V t="F" />
              </>,
            ],
            [
              'Forankringen skal optage pr. side',
              <>
                0,71 · <V t="F" />
              </>,
              <>
                0,50 · <V t="F" />
              </>,
            ],
            [
              'Jordreaktion ved overgangen til vandret',
              <>
                0,54 · <V t="F" />, fordelt
              </>,
              <>
                0,71 · <V t="F" />, i knækket
              </>,
            ],
            ['Eksempel, træk pr. side', kNm(b?.T45), kNm(b?.T)],
            ['Eksempel, jordreaktion pr. side', kNm(b?.R45), kNm(b?.R)],
          ]}
        />
        <p>
          Bøjningen fra 45° til vandret giver 2 · {T} · sin 22,5° = 2 · 0,71 · 0,38 · <V t="F" /> =
          0,54 · <V t="F" />, fordelt over hele bøjningen.
        </p>
      </section>

      <section>
        <h4>Sådan indgår det i beregningen</h4>
        <div className="kv-regler">
          <div>
            <h5>Nettets styrke</h5>
            <div>
              <p>
                Nettet vælges efter hele {F} (krav <V t="P_{d}" />/{F} &gt; 1,01), selv om det kun
                bærer {T} = {F}/2. Det er faktor 2 på styrken. Trækket når {F}, når cos {ALFA} =
                0,5, altså ved {ALFA} = 60°. Skrå netføring op til 60° er derfor inden for nettets
                styrke.
                {b?.net && (
                  <>
                    {' '}
                    I eksemplet rækker {b.net.navn} op til {vinkel(b.net.alfa)}.
                  </>
                )}
              </p>
            </div>
          </div>
          <div>
            <h5>Forankringen</h5>
            <div>
              <p>
                Begge sider tilsammen skal optage <V t="K" /> = {S2} · {F}, altså {S2} · {T} pr.
                side. I løsning A bestemmes længden af 2 · <V t="L_{geonet}" /> = <V t="K" />/
                <V t="F_{bund}" />, som kan skrives
              </p>
              <Formel>
                <V t="L_{geonet}" /> · <V t="F_{bund}" /> = {S2} · {F}/2
                <span className="kv-formel-note">
                  friktion pr. m² gange længden = trækket med tillæg
                </span>
              </Formel>
              <p>
                {S2} = {tal(s2Interval.min)} svarer til et skråt træk op til {ALFA} ={' '}
                {vinkel(vinkelVedS2(s2Interval.min))} (cos {ALFA} = 1/{tal(s2Interval.min)}), og{' '}
                {S2} = {tal(s2Interval.max)} til {ALFA} = {vinkel(vinkelVedS2(s2Interval.max))}.
                Forankringen regnes altså ud fra trissevirkningen.
              </p>
            </div>
          </div>
          <div>
            <h5>Knækket</h5>
            <div>
              <p>
                Jordreaktionen {T} · √2 kontrolleres hverken i DANVA's metode eller i appen.
                Antagelsen bygger på trissevirkningen, den semirigide opfattelse af ballastlaget,
                trykspredningen fra ballasten og erfaring fra udførte projekter i Danmark siden
                1996.
              </p>
            </div>
          </div>
          <div>
            <h5>Løftet</h5>
            <div>
              <p>
                Nettet virker først, når det er strammet. Løftet afhænger af nettets tøjning, slæk
                ved udlægningen og jordens sammentrykning i knækket. Det beregnes hverken i DANVA's
                metode eller i appen.
              </p>
            </div>
          </div>
        </div>
        {e.tilstand === 'ikkeNoedvendig' && <Notice>{ikkeNoedvendigTekst}</Notice>}
        {b && (
          <EnkelTabel
            label="Eksempel"
            hoved={['Eksempel', 'Formel', 'Værdi']}
            talKolonner={[2]}
            raekker={[
              [
                'Restopdrift',
                <>
                  {F} = <V t="O_{d}" /> − <V t="B_{d}" />
                </>,
                kNm(b.F),
              ],
              [
                'Træk pr. side',
                <>
                  {T} = {F}/2
                </>,
                kNm(b.T),
              ],
              [
                'Forankringen pr. side',
                <>
                  {S2} · {T} = {tal(b.S2)} · {tal(b.T)}
                </>,
                kNm(b.forankring),
              ],
              [
                'Jordreaktion i knækket',
                <>
                  {R} = {T} · √2
                </>,
                kNm(b.R),
              ],
              ['Træk ved skrå netføring', <>{F}/(2 · cos 45°)</>, kNm(b.T45)],
              [
                b.net ? `Nettets styrke, ${b.net.navn}` : 'Nettets styrke',
                <>
                  <V t="P_{d}" /> &gt; 1,01 · {F}
                </>,
                kNm(b.net?.Pd),
              ],
            ]}
          />
        )}
        <p className="kv-note">
          Eksemplet er regnet med udvendig diameter {tal(input.d)} m, jorddække {tal(input.h1)} m,
          GVS i terræn, rørets egenvægt {heltEllerDecimaler(input.roervaegt)} kg/m, <V t="γ" /> ={' '}
          {fasteVaerdier.gamma} kN/m³, <V t="φ" /> = {fasteVaerdier.phi}°, konsekvensklasse{' '}
          {fasteVaerdier.konsekvensklasse} og {S2} = {tal(eksempelS2)}.
        </p>
        <p className="kv-note">Grundlag for den skrå netføring: DANVA's figur 2.15.</p>
      </section>
    </div>
  );
}
