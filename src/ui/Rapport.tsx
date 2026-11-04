import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Building2, Download, FileText, RotateCcw, Users } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Textarea } from '../components/ui/textarea';
import { beregnOpdrift } from '../engine/opdrift';
import type { Losning } from '../engine/figurer';
import {
  createCompileQueue,
  describeCompileError,
  type CompileState,
} from '../report/compile-queue';
import { loadPdfCompiler } from '../report/compiler';
import { employeesForRoster, logoDataUrl, logoExtension } from '../report/company-profile';
import { formatPhone } from '../report/phone-format';
import { datoTilVisning, rapportDokument, rapportFilnavn } from '../report/rapport-model';
import { loadReportAssets, reportDocument, type ReportAssets } from '../report/report-document';
import layoutSource from '../report/typst/layout.typ?raw';
import reportSource from '../report/typst/rapport.typ?raw';
import { canEditProfile, useAccess } from './access';
import { CompanyProfile, useCompanyProfile } from './CompanyProfile';
import { Fmt } from './Fmt';
import { losningTitel } from './mellemregninger';
import { Notice } from './Notice';
import { PageFooter, PageHeader } from './page';
import { SaveState } from './SaveState';
import { useSession } from './SessionContext';
import {
  standardRapport,
  tilMotorInput,
  type RapportOplysninger,
  type RapportPerson,
} from './state';
import './Rapport.css';

const statusTekst = {
  idle: 'Klar til at starte',
  loading: 'Indlæser PDF-motor og lokale skrifter',
  compiling: 'Danner PDF',
  ready: 'PDF klar',
  error: 'Fejl',
};

function idag(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function Kort({
  nr,
  titel,
  opsummering,
  children,
}: {
  nr: number;
  titel: string;
  opsummering?: string;
  children: ReactNode;
}) {
  return (
    <section className="section-card settings-card calc-card" aria-labelledby={`rapport-${nr}`}>
      <div className="bg-trin-hoved">
        <h2 id={`rapport-${nr}`}>
          <span className="bg-trin-nr">{nr}</span> <span className="bg-trin-titel">{titel}</span>
        </h2>
        {opsummering && <span className="bg-trin-opsum">{opsummering}</span>}
      </div>
      {children}
    </section>
  );
}

function Tekstfelt({
  id,
  label,
  value,
  change,
  type = 'text',
  blur,
}: {
  id: string;
  label: string;
  value: string;
  change: (value: string) => void;
  type?: 'text' | 'date';
  blur?: (value: string) => void;
}) {
  return (
    <div className="setting-field report-field">
      <label htmlFor={id}>{label}</label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => change(e.target.value)}
        onBlur={(e) => blur?.(e.target.value)}
      />
    </div>
  );
}

export function Rapport() {
  const { session, update } = useSession();
  const access = useAccess();
  const profileLocked = !canEditProfile(access);
  const embeddedEmployees = useMemo(
    () => employeesForRoster(access.kartotek, import.meta.env.VITE_MEDARBEJDERE),
    [access.kartotek],
  );
  const company = useCompanyProfile(profileLocked, embeddedEmployees);
  const [fane, setFane] = useState('rapport');
  const input = tilMotorInput(session);
  const beregning = useMemo(() => beregnOpdrift(input), [JSON.stringify(input)]);
  const r = beregning.ok ? beregning.resultat : null;
  const o = session.rapport;
  const saet = (aendring: Partial<RapportOplysninger>) =>
    update({ ...session, rapport: { ...o, ...aendring } });
  const saetPerson = (rolle: 'sagsbehandler' | 'kontrollant', p: Partial<RapportPerson>) =>
    saet({ [rolle]: { ...o[rolle], ...p } });

  const dato = idag();
  const dokument = useMemo(
    () => (r ? rapportDokument(session, input, r, company.state.profile.by, dato) : null),
    [r, JSON.stringify(session), company.state.profile.by, dato],
  );
  const filnavn = rapportFilnavn(o.projekt, datoTilVisning(o.dato || dato));
  const logoFingerprint = useMemo(
    () => (company.state.logo ? logoDataUrl(company.state.logo) : null),
    [company.state.logo],
  );
  const fingerprint = JSON.stringify({
    dokument,
    profile: company.state.profile,
    logo: logoFingerprint,
    layoutSource,
    reportSource,
  });

  const [live, setLive] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<CompileState>({ status: 'idle' });
  const [preview, setPreview] = useState<{ url: string; fingerprint: string } | null>(null);
  const previewUrl = useRef<string | null>(null);
  const queue = useRef<ReturnType<typeof createCompileQueue> | null>(null);
  const assets = useRef<Promise<ReportAssets> | null>(null);
  const submitted = useRef('');
  const hentAktiver = () =>
    (assets.current ??= loadReportAssets(import.meta.env.BASE_URL).catch((error) => {
      assets.current = null;
      throw error;
    }));

  useEffect(() => {
    let active = true;
    const currentQueue = createCompileQueue({
      loadCompiler: loadPdfCompiler,
      onState(next) {
        if (!active) return;
        setState(next);
        if (next.status === 'ready') {
          // Egen URL til den synligt forældede forhåndsvisning: køens URL frigives ved ny revision.
          const url = URL.createObjectURL(
            new Blob([new Uint8Array(next.bytes)], { type: 'application/pdf' }),
          );
          if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
          previewUrl.current = url;
          setPreview({ url, fingerprint: submitted.current });
        }
      },
    });
    queue.current = currentQueue;
    return () => {
      active = false;
      currentQueue.dispose();
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
      previewUrl.current = null;
      queue.current = null;
    };
  }, []);

  useEffect(() => {
    if (!live || !dokument || !company.ready || company.saving) return;
    let active = true;
    // Saml tastetryk, før rapporten dannes igen.
    const timer = window.setTimeout(() => {
      setState({ status: 'loading' });
      void hentAktiver()
        .then((loaded) => {
          if (!active) return;
          const logo = company.state.logo;
          const request = reportDocument(
            dokument,
            logo ? { ...loaded, logo: logo.bytes, logoExtension: logoExtension(logo) } : loaded,
            company.state.profile,
          );
          submitted.current = fingerprint;
          queue.current?.request(request);
        })
        .catch((error) => {
          if (active) setState(describeCompileError(error, 'loading'));
        });
    }, 180);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [live, fingerprint, attempt, company.ready, company.saving]);

  const current =
    !!preview &&
    preview.fingerprint === fingerprint &&
    state.status === 'ready' &&
    company.ready &&
    !company.saving;

  function pdfVisning(knap?: ReactNode) {
    return (
      <>
        <div className="report-generate-toolbar">
          {knap}
          {current ? (
            <Button asChild>
              <a href={preview!.url} download={filnavn}>
                <Download aria-hidden="true" />
                Hent PDF
              </a>
            </Button>
          ) : (
            <Button disabled>
              <Download aria-hidden="true" />
              Hent PDF
            </Button>
          )}
          <div className="report-compile-status">
            <p role="status" data-testid="compile-state" data-state={state.status}>
              {current
                ? 'Rapporten er dannet.'
                : statusTekst[state.status === 'ready' ? 'compiling' : state.status]}
            </p>
          </div>
        </div>
        {state.status === 'error' && (
          <Notice kind="error" role="alert">
            <p>{state.message}</p>
            <pre>{state.details}</pre>
          </Notice>
        )}
        {preview && (
          <div className="report-pdf">
            {!current && (
              <Notice kind="warning" role="status" className="report-stale">
                Forhåndsvisningen er forældet. Hent PDF er spærret, indtil rapporten for de aktuelle
                oplysninger er klar.
              </Notice>
            )}
            <iframe title="PDF-forhåndsvisning" src={preview.url} />
          </div>
        )}
      </>
    );
  }

  const medarbejdere = company.state.profile.medarbejdere;
  const person = (rolle: 'sagsbehandler' | 'kontrollant', titel: string) => {
    const p = o[rolle];
    return (
      <fieldset className="report-person" key={rolle}>
        <legend>{titel}</legend>
        {medarbejdere.length > 0 ? (
          <div className="setting-field report-field">
            <label htmlFor={`${rolle}-kartotek`}>Kartotek</label>
            {/* Valget udfylder felterne; listen står derefter igen på »Vælg fra kartotek …«. */}
            <Select
              value=""
              disabled={!company.ready || company.saving}
              onValueChange={(value) => {
                const valgt = medarbejdere[Number(value)];
                if (valgt)
                  saetPerson(rolle, {
                    navn: valgt.navn,
                    mail: valgt.mail,
                    telefon: formatPhone(valgt.telefon),
                  });
              }}
            >
              <SelectTrigger id={`${rolle}-kartotek`} className="setting-select">
                <SelectValue placeholder="Vælg fra kartotek …" />
              </SelectTrigger>
              <SelectContent>
                {medarbejdere.map((m, index) => (
                  <SelectItem key={index} value={String(index)}>
                    {m.initialer ? `${m.initialer} – ${m.navn}` : m.navn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <p className="report-caption">
            {access.kartotek === 'eget'
              ? `Kartoteket er tomt. Tilføj personer under ${profileLocked ? 'Medarbejdere' : 'Firmaprofil → Medarbejdere'}.`
              : 'Oplysningerne skrives i felterne.'}
          </p>
        )}
        <Tekstfelt
          id={`${rolle}-navn`}
          label="Navn"
          value={p.navn}
          change={(navn) => saetPerson(rolle, { navn })}
        />
        <Tekstfelt
          id={`${rolle}-telefon`}
          label="Telefon"
          value={p.telefon}
          change={(telefon) => saetPerson(rolle, { telefon })}
          blur={(telefon) => saetPerson(rolle, { telefon: formatPhone(telefon) })}
        />
        <Tekstfelt
          id={`${rolle}-mail`}
          label="Mail"
          value={p.mail}
          change={(mail) => saetPerson(rolle, { mail })}
        />
      </fieldset>
    );
  };

  const ikkeNoedvendig = r?.S1Status === 'OK';
  const viste: Losning[] = ['A', 'C', 'B', 'D'];
  const antalValgte = viste.filter((l) => o.losninger[l] && r?.losninger[l]).length;
  const harFaner = access.firmaprofil || access.kartotek === 'eget';
  const rapportIndhold = (
    <fieldset className="report-form">
      <Kort nr={1} titel="Projektoplysninger" opsummering={o.projekt || 'Ikke udfyldt'}>
        <div className="report-project-columns">
          <div>
            <Tekstfelt
              id="rapport-projekt"
              label="Projektnavn"
              value={o.projekt}
              change={(projekt) => saet({ projekt })}
            />
            <Tekstfelt
              id="rapport-udfoeres-for"
              label="Udføres for"
              value={o.udfoeresFor}
              change={(udfoeresFor) => saet({ udfoeresFor })}
            />
            <Tekstfelt
              id="rapport-dato"
              label="Dato"
              type="date"
              value={o.dato || dato}
              change={(value) => saet({ dato: value })}
            />
          </div>
          <div className="setting-field report-field">
            <label htmlFor="rapport-beskrivelse">Projektbeskrivelse</label>
            <Textarea
              id="rapport-beskrivelse"
              rows={5}
              value={o.beskrivelse}
              aria-describedby="rapport-beskrivelse-help"
              onChange={(e) => saet({ beskrivelse: e.target.value })}
            />
            <p id="rapport-beskrivelse-help">
              Rørdiameter, jorddækning og GVS indsættes automatisk fra beregningen. Her kan der
              tilføjes fri tekst.
            </p>
          </div>
        </div>
        <div className="report-project-columns">
          {person('sagsbehandler', 'Udført af')}
          {person('kontrollant', 'Kontrolleret af')}
        </div>
        <Button
          type="button"
          variant="outline"
          className="report-reset-content"
          onClick={() => saet(standardRapport())}
        >
          <RotateCcw aria-hidden="true" />
          Nulstil projektoplysninger
        </Button>
      </Kort>
      <Kort
        nr={2}
        titel="Indhold"
        opsummering={ikkeNoedvendig ? 'Afsnit 1–5' : `${antalValgte} løsninger`}
      >
        {ikkeNoedvendig ? (
          <Notice>
            Opdriftssikring er ikke nødvendig, så rapporten slutter efter afsnit 5 uden geonet og
            forankring.
          </Notice>
        ) : (
          <>
            <p className="calc-note">Løsninger i afsnit 7:</p>
            <div className="report-cut-choices">
              {viste.map((l) => {
                const mulig = Boolean(r?.losninger[l]);
                return (
                  <div className="setting-checkbox" key={l}>
                    <Checkbox
                      id={`rapport-losning-${l}`}
                      checked={o.losninger[l] && mulig}
                      disabled={!mulig}
                      onCheckedChange={(checked) =>
                        saet({ losninger: { ...o.losninger, [l]: checked === true } })
                      }
                    />
                    <Label htmlFor={`rapport-losning-${l}`}>{losningTitel[l]}</Label>
                  </div>
                );
              })}
            </div>
            {session.avanceret && session.inddata.dybForankringAktiv && (
              <p className="calc-note">
                <Fmt text="Dybere forankring ved begrænset plads medtages som afsnit 8 med den faste advarsel, fordi beregningen er valgt." />
              </p>
            )}
          </>
        )}
      </Kort>
      <Kort nr={3} titel="Rapport">
        {pdfVisning(
          <Button
            type="button"
            disabled={!dokument}
            onClick={() => {
              setLive(true);
              setAttempt((n) => n + 1);
            }}
          >
            <FileText aria-hidden="true" />
            Generér rapport
          </Button>,
        )}
      </Kort>
    </fieldset>
  );

  return (
    <div className="report-page">
      <PageHeader
        page="rapport"
        title="Rapport"
        intro="Dokumentation af beregningen som PDF. Rapporten dannes i browseren, og oplysningerne gemmes sammen med beregningen."
        status={<SaveState />}
      />
      {!r ? (
        <section className="section-card settings-card" aria-label="Rapport">
          <Notice kind="warning">
            Rapporten kan dannes, når inddata på siden Opdriftssikring er rettet.
          </Notice>
          <Button asChild>
            <a href="#opdriftssikring">Gå til Opdriftssikring</a>
          </Button>
        </section>
      ) : harFaner ? (
        <Tabs value={fane} onValueChange={setFane}>
          <TabsList aria-label="Rapport og firmaprofil">
            <TabsTrigger value="rapport">
              <FileText aria-hidden="true" />
              Rapport
            </TabsTrigger>
            <TabsTrigger value="profil">
              {profileLocked ? <Users aria-hidden="true" /> : <Building2 aria-hidden="true" />}
              {profileLocked ? 'Medarbejdere' : 'Firmaprofil'}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="rapport">{rapportIndhold}</TabsContent>
          <TabsContent value="profil">
            <CompanyProfile
              controller={company}
              locked={profileLocked}
              standardLogo={async () => {
                const loaded = await hentAktiver();
                return { mime: 'image/jpeg', bytes: loaded.logo };
              }}
              preview={pdfVisning()}
            />
          </TabsContent>
        </Tabs>
      ) : (
        rapportIndhold
      )}
      <PageFooter />
    </div>
  );
}
