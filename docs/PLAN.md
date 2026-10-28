# Plan for appen Opdriftssikring

Status 28. oktober 2026: Spørgsmålene til planen er besvaret, se [BESLUTNINGER.md](BESLUTNINGER.md). Bygningen er ikke startet, og GitHub-repoet er ikke oprettet.

## 1. Mål

- Regnearket bliver en webapp. Første version regner præcis som arket. Kortlægningen står i [EXCEL_KORTLAEGNING.md](EXCEL_KORTLAEGNING.md).
- Fundene i arket er beskrevet med eksempler og muligheder i [FUND.md](FUND.md). De ændres først efter særskilt beslutning.
- Appen skal ligne MSL Dimensionering (`C:\MSL-dimensionering`), så det er tydeligt for brugeren, at de to værktøjer kommer fra samme firma. Farver, skrift, topbjælke, menu, kort, knapper, beskeder og rapportens sidelayout er de samme.
- Efter beregningen dannes en PDF-rapport i browseren med samme sidehoved, sidefod og firmaprofil som MSL-rapporten.
- Koden ligger i et offentligt GitHub-repo, `bg-opdriftssikring`.

## 2. Teknik og genbrug fra MSL

Appen får samme stak og samme versioner som MSL: React 19, TypeScript, Vite, Tailwind 4, shadcn/ui (Radix), lucide-ikoner, Typst i browseren til PDF, `node --test`, Playwright med axe og Prettier. Den er statisk og kører lokalt eller hos en statisk webvært.

Følgende kopieres fra MSL og tilpasses:

| Del | Filer i MSL |
|---|---|
| Tema | `src/index.css` (de ti farver, seks skriftstørrelser, topbjælke, kort, felter) |
| Komponenter | `src/components/ui/*`, `Notice`, `Hint`, `InfoPopup`, `EditorFeedback`/»Gemt i denne browser«, `RestartApp`, `expander-card` |
| Skal og navigation | `App.tsx`, `page.tsx` (breadcrumb, sidehoved, sidefod, menugrupper) |
| PDF-motor | `src/report/compiler.ts`, `compile-queue.ts`, `pdf-motor.ts`, `tools/pak-pdf-motor.ts` |
| Rapportramme | `typst/layout.typ` (logo, slogan, grøn sidefod, Carlito, sidetal), `public/report/fonts`, `public/report/logo` |
| Firmaprofil og kartotek | `company-profile.ts`, `profile-storage.ts`, `profile-defaults.ts`, `CompanyProfile.tsx`, `text-format.ts`, `phone-format.ts` |
| Drift | `Start ….cmd`, `VITE_UDGAVE=delt`, GitHub-workflow til kontrol, `AGENTS.md`, `docs/BESLUTNINGER.md` |

Delene kopieres frem for at lave en fælles pakke. To små apps med hver sin udgivelse er nemmest at holde adskilt. En fælles pakke kan oprettes senere, hvis de to apps begynder at glide fra hinanden. I `AGENTS.md` skrives, at designændringer i den ene app skal overvejes i den anden.

## 3. Skal og navigation

Topbjælken er den samme mørkegrønne bjælke som i MSL, med ikonet `Waves` + **OPDRIFT** | Sikring med geonet.

| Gruppe | Side | Indhold |
|---|---|---|
| Beregning | Opdriftssikring | Hovedsiden (afsnit 4) |
| Beregning | Rapport | PDF-rapporten (afsnit 6) |
| Opslag | Geonet og faste værdier | X-GRID med UTS, reduktionsfaktorer, P_till og arkets grænser; partialkoefficienter og konstanter |
| Opslag | Hjælp og dokumentation | Beregningsgrundlag, formler, forudsætninger, tovkraft, DANVA 54 og Eurocode, udførelse |
| Opsætning | Indstillinger | Konsekvensklasse og de partialkoefficienter, den styrer (afsnit 5) |

Menuens fod viser »BG Byggros A/S« og versionsnummeret, som i MSL.

## 4. Siden Opdriftssikring

Siden er opbygget som MSL's Dimensionering: sidehoved, »Gemt i denne browser«, »Nulstil beregning« og nummererede kort. Alt regnes straks ved indtastning. Mellemregninger vises i udfoldelige felter med formel og indsatte tal.

1. **Konstruktion og grundvand.**
   - Valg mellem rør og liggende tank. Formlerne er de samme; kun tekster og figurer skifter.
   - Antal ledninger eller tanke: 1 eller 2. For 2 vises arkets forudsætninger: største diameter og mindste vægt.
   - Diameter d, jorddækning h₁ og GVS-dybde, med valget »GVS i terræn«.
   - Et levende tværsnit med T₁, T₂, T₃, h₁, h₂ og d.
   - T₁ = 0 er fast (K-18). Felterne afviser kun værdier uden fysisk mening, fx diameter ≤ 0. Ellers er der ingen grænser, som i arket.
2. **Egenvægt og fyldmateriale.** Rør- eller tankvægt i kg/m, γ, γ_tør og φ_k. En tabel viser karakteristiske og regningsmæssige værdier og de anvendte partialkoefficienter.
3. **Opdrift uden geonet.** O, B og S₁ med statusmærke og arkets konklusionstekst.
4. **Geonet.** F_opdrift, det automatisk valgte X-GRID efter arkets regel, P_till og udnyttelse. Produkt og antal lag kan overstyres manuelt, som case 2 er regnet. Over arkets grænse vises »kontakt leverandør for råd«, og forankringen regnes alligevel, som i arket.
5. **Forankring.**
   - F_bund, F_top og K vises.
   - De to løsninger for det valgte antal ledninger vises: uden og med omslag, dvs. A og C for 1 ledning eller B og D for 2.
   - Hver løsning har en målsat figur, L pr. side, afstand mellem ledninger, L_a, L_geonet,tot og arkets kontrol, hvor arket har en.

Er S₁ > 1, tones kort 4–5 ned, men tallene vises som i arket.

Under resultaterne står **Kontrolpunkter**. Her vises en oplysning, når et fund er aktivt for den aktuelle beregning (K-02, K-03, K-05, K-12, K-13). Kontrolpunkterne ændrer ikke beregningen og kommer ikke med i rapporten.

Figurerne tegnes som SVG ud fra de aktuelle mål, ligesom opbygningsfiguren i MSL. Samme figur bruges på skærmen og i rapporten. Arkets billeder bruges kun som forlæg.

## 5. Beregningsmotor og data

- `src/engine/opdrift.ts` er en ren funktion: `beregnOpdrift(input, standarder) → resultat`. Resultatet indeholder alle mellemværdier fra kortlægningen med samme navne, status OK/EJ OK, kontrolpunkter og fejl. Motoren kender ikke brugerfladen.
- `src/engine/defaults.json` indeholder partialkoefficienter, X-GRID-tabellen og konstanterne fra kortlægningens afsnit 3. Alle værdier er som i arket, også π = 3,14, g = 9,82 og grænsen 78,9. Produktdata findes kun ét sted (K-15).
- Der regnes med fuld præcision og afrundes kun i visningen: 2 decimaler som arket.
- Ændringer fra fundlisten indføres senere som afgrænsede ændringer med egne tests. Hver ændring kan sammenlignes med arkets resultater.

### Indstillinger

Siden er opbygget som MSL's Indstillinger, med nummererede afsnit, nulstilling til standard og automatisk gemning i browseren. Siden kan senere få flere afsnit, fx fra fundlisten (K-14).

**Konsekvensklasse.** Klassen vælges blandt CC1, CC2 og CC3, og standarden er CC2, som i arket. Den giver konsekvensfaktoren K_FI efter DS/EN 1997-1 DK NA:2021, A.1: CC1 og CC2 giver 1,0, CC3 giver 1,1. Partialkoefficienterne følger tabel A.4-1 NA (UPL med trækelementer):

| Partialkoefficient | Værdi | CC1/CC2 | CC3 | Bruges til |
|---|---|---|---|---|
| γ_G;dst, (grund)vand, ugunstig | 1,1 · K_FI | 1,1 | 1,21 | Opdrift (arkets γ_f) |
| γ_G;stb, gunstig | 0,9 | 0,9 | 0,9 | Fyld og egenvægt |
| γ_φ | 1,2 | 1,2 | 1,2 | tan φ |

I UPL-tabellen er det kun den ugunstige last, der afhænger af K_FI. Tabel A.3-1 NA for STR/GEO ganger også jordparametrene med K_FI, men den gælder ikke her.

| Eksempel | O | S₁ | F_opdrift | P_till/F | L pr. side, A / C |
|---|---|---|---|---|---|
| Case 1, CC2 (arket) | 53,97 | 0,49 | 27,53 | 1,38 | 1,70 / 1,36 m |
| Case 1, CC3 | 59,37 | 0,45 | 32,92 | 1,15 | 2,03 / 1,59 m |
| Case 2, CC2 (arket) | 138,16 | 0,18 | 113,32 | 1,26 | 7,40 / 5,26 m |
| Case 2, CC3 | 151,98 | 0,16 | 127,14 | 1,12 | 8,30 / 5,88 m |

Beregningssiden viser den valgte klasse i kortet med partialkoefficienterne. Rapporten skriver klassen i Betingelser og i tabellen over partialkoefficienter i stedet for arkets faste »middel konsekvensklasse«.
## 6. Rapport

Rapportsiden følger MSL's fire trin: 1 Sagsoplysninger, 2 Indhold, 3 Figurer, 4 Generér. Faner til Rapport og Medarbejdere, og i den lokale udgave også Firmaprofil. PDF'en kompileres i browseren og vises i en forhåndsvisning med »Hent PDF«.

Rapportens indhold følger arkets afsnit og tal:

1. Forside med projektoplysninger, projektbeskrivelse og automatisk indholdsfortegnelse med rigtige sidetal (K-16)
2. Betingelser og projekteringsansvar (redigerbare standardtekster), med den valgte konsekvensklasse
3. Partialkoefficienter for den valgte konsekvensklasse, med γ_f vist som den anvendte værdi (K-01)
4. Den aktuelle situation: geometri, grundvand, figur, opdrift, ballast og egenvægt
5. Geotekniske parametre og S₁ med konklusion
6. Nødvendig trækstyrke, med note om tovkraft
7. Regningsmæssig designtrækstyrke og eftervisning, med en eventuel manuel overstyring af geonettet
8. Kraftoverførsel i sand
9. Løsningerne for det valgte antal ledninger. Begge kommer med som udgangspunkt, og den ene kan fravælges på rapportsiden.

Teksterne følger valget mellem rør og liggende tank. Formlerne sættes som matematik i Typst og vises med indsatte tal. Sidefoden får sagsbehandleren fra kartoteket i stedet for »Bruger«.

## 7. Test og kontrol

- Kontrolcases udtrækkes fra selve regnearket med Excel via COM-automation. Et værktøj i `tools/` sætter inddata, genberegner og aflæser alle resultatceller. Målet er 30–50 cases, der dækker d, h₁, GVS, rørvægt og fyldparametre. Alle grænser og fundenes eksempler indgår, fx båndene i K-02 og K-03, GVS under rørtoppen og S₁ > 1.
- Regnearket kommer ikke i Git, men de udtrukne JSON-filer gør. De indeholder kun syntetiske tal.
- Case 1 og 2 fra kortlægningen indgår, case 2 med manuel overstyring af geonettet.
- CC3 kontrolleres mod arket ved at sætte E92 til 1,21 i de udtrukne cases.
- Motoren skal ramme arkets værdier inden for tolerancen for afrundingsfejl. Valgt net, OK/EJ OK og tekster som »kontakt leverandør« skal stemme præcist.
- Derudover enhedstests af motor, rapportdata og lagring, Playwright-forløb med axe og en test af PDF-dannelsen, som i MSL.

## 8. Repo, hosting og offentliggørelse

- Repoet `bg-opdriftssikring` oprettes offentligt på samme GitHub-konto som MSL, når bygningen starter. Git initialiseres i `C:\Opdriftssikring`.
- Følgende kommer ikke i Git: `Data og dokumentation/`, `.local/` og `reference-private/`. Mappen med data rummer ophavsretsbeskyttede DS/EN-standarder, e-mails med personoplysninger og en kundesag. Dokumenterne henviser til mappen uden at citere den.
- Første version bruges kun lokalt via startfilen. Den delte udgave (`VITE_UDGAVE=delt`) bygges med, så hosting kan slås til senere uden ændringer i appen. Cloudflare sættes først op efter særskilt godkendelse.
- Arbejdsgangen følger MSL: kortlivede grene, Codex som hjælper i egne worktrees, og Claude gennemgår, committer og merger. Beslutninger skrives i `docs/BESLUTNINGER.md`.

## 9. Faser

| Fase | Indhold | Codex |
|---|---|---|
| 0 | Plan, kortlægning og fundliste (afsluttet) | – |
| 1 | Repo, projektskelet, tema og skal fra MSL, startfil og kontrol i GitHub | Kopiering og tilpasning |
| 2 | Kontrolcases fra Excel (køres lokalt af Claude) og beregningsmotor med tests | Motor og tests |
| 3 | Siden Opdriftssikring med figurer og kontrolpunkter | Delvist |
| 4 | Rapport, firmaprofil og kartotek | Delvist |
| 5 | Opslag og hjælp | Tekst og tabeller |
| 6 | Hosting, efter godkendelse | – |
| 7 | Ændringer fra fundlisten og mængdeberegning for tanke, efter beslutning | – |

## 10. Senere udvidelser

- **Mængdeberegning.** Ud fra ledningens eller tankens længde: antal strimler, strimmellængde, m² geonet og antal ruller. Det kræver rulledata pr. produkt.
- **Stående tanke og brønde.** Kræver en volumenbaseret model uden for arket og eget fagligt grundlag.
- **Geoteknisk kategori.** Valg på Indstillinger, hvor kategori 1 ganger partialkoefficienterne for jordparametre med γ_s = 1,25 (DK NA:2021, A.3.1(6)P). Udskudt 28. oktober 2026.
