import { useState, type ReactNode } from 'react';
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
import { aflaesning, eksempel, s2Interval } from '../engine/kraftensvej';
import { tal } from '../engine/format';
import { Fmt } from './Fmt';
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

const kNm = (x: number) => `${tal(x)} kN/m`;
const vinkel = (x: number) => `${tal(x, 1)}°`;

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

function Ligevaegt() {
  const [alfa, setAlfa] = useState(30);
  const a = aflaesning(alfa);
  return (
    <figure className="kv-figur">
      <Tegning svg={figurLigevaegt(alfa)} />
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
      <dl className="kv-aflaesning">
        <dt>Træk pr. side</dt>
        <dd>
          {T} = {tal(a.andel)} · {F}
        </dd>
        <dt>I forhold til {ALFA} = 0</dt>
        <dd>× {tal(a.forhold)}</dd>
        <dt>Eksempel: træk pr. side</dt>
        <dd>{kNm(a.T)}</dd>
        <dt>
          Eksempel: lodret del {T} · cos {ALFA}
        </dt>
        <dd>{kNm(a.lodret)}</dd>
        <dt>
          Eksempel: vandret del {T} · sin {ALFA}
        </dt>
        <dd>{kNm(a.vandret)}</dd>
        <dt>
          Trækkets udnyttelse af geonettets trækstyrke → {eksempel.netNavn} med <V t="P_{d}" /> ={' '}
          {kNm(eksempel.Pd)} ({tal(a.T)} / {tal(eksempel.Pd)})
        </dt>
        <dd>
          <Udnyttelse forhold={a.netUdnyttelse} ok="Holder" ikkeOk="Holder ikke" />
        </dd>
        <dt>
          Trækket i forhold til forankringen, dimensioneret for {S2} · {F}/2 ={' '}
          {kNm(eksempel.forankring)} ({tal(a.T)} / {tal(eksempel.forankring)})
        </dt>
        <dd>
          <Udnyttelse forhold={a.forankringUdnyttelse} ok="Dækket" ikkeOk="Ikke dækket" />
        </dd>
      </dl>
      <figcaption>
        <strong>Figur 2.</strong> Rørets ligevægt. Pilene er tegnet i samme målestok: de stiplede
        lodrette dele er tilsammen lige så lange som {F}. Eksemplet er regnet i appen for Ø2500 med
        1,5 m jorddække og GVS i terræn. Procenterne viser trækket pr. side i forhold til den værdi,
        der er regnet med. Over 100&nbsp;% er trækket større end værdien.
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
        <Ligevaegt />
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
            ['Eksempel, træk pr. side', kNm(eksempel.T45), kNm(eksempel.T)],
            ['Eksempel, jordreaktion pr. side', kNm(eksempel.R45), kNm(eksempel.R)],
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
                styrke. I eksemplet rækker {eksempel.netNavn} op til {vinkel(eksempel.alfaNet)}.
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
                {vinkel(eksempel.alfaS2Min)} (cos {ALFA} = 1/{tal(s2Interval.min)}), og {S2} ={' '}
                {tal(s2Interval.max)} til {ALFA} = {vinkel(eksempel.alfaS2Max)}. Forankringen regnes
                altså ud fra trissevirkningen.
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
              kNm(eksempel.F),
            ],
            [
              'Træk pr. side',
              <>
                {T} = {F}/2
              </>,
              kNm(eksempel.T),
            ],
            [
              'Forankringen pr. side',
              <>
                {S2} · {T} = {tal(eksempel.S2)} · {tal(eksempel.T)}
              </>,
              kNm(eksempel.forankring),
            ],
            [
              'Jordreaktion i knækket',
              <>
                {R} = {T} · √2
              </>,
              kNm(eksempel.R),
            ],
            ['Træk ved skrå netføring', <>{F}/(2 · cos 45°)</>, kNm(eksempel.T45)],
            [
              `Nettets styrke, ${eksempel.netNavn}`,
              <>
                <V t="P_{d}" /> &gt; 1,01 · {F}
              </>,
              kNm(eksempel.Pd),
            ],
          ]}
        />
        <p className="kv-note">
          Eksemplet er regnet med udvendig diameter 2,50 m, jorddække 1,50 m, GVS i terræn, rørets
          egenvægt 340 kg/m, <V t="γ" /> = 17 kN/m³, <V t="φ" /> = 35° og konsekvensklasse CC2.
        </p>
        <p className="kv-note">Grundlag for den skrå netføring: DANVA's figur 2.15.</p>
      </section>
    </div>
  );
}
