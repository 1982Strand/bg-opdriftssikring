# Teknisk gennemgang af opdriftsappens syv kort

## Grundlag og afgrænsning

Gennemgået: den uploadede ZIP-fil med navnet `Opdriftssikring - Kopi.xml`.
Appens beregningsmotor, inputhåndtering, UI-tekster, kontrolpunkter og tests er læst. Den medfølgende `Data og dokumentation/Opdriftsikring rør - X-GRID 1026 - WIP.xlsx` er åbnet med formler. Den oprindelige 0824-version er supplerende sammenholdt med det tilgængelige enterprise-udtræk og tidligere gennemgang. Cellehenvisninger nedenfor gælder WIP-versionen, medmindre andet er angivet. Det er ikke en fuldstændig ny regression mod den originale 0824-binærfil.

Ingen kildefiler er ændret. Gennemgangen er en kode- og beregningsgennemgang, ikke en faglig godkendelse eller en gennemført browser-/tilgængelighedsrevision. Typekontrol, produktionsbuild og browsertests er ikke kørt; node_modules er ikke medsendt.

### Gennemførte kontroller
- `node --test tests/*.test.ts`: 101 tests bestået, 0 fejlet.
- Projektet indeholder 42 Excel-referencecases og særskilte forventninger for dokumenterede afvigelser. Beståede tests er ikke bevis for, at regnearkets metode er korrekt.
- Egne motorkørsler ved GVS = 0; 0,3; 0,6; 1,6; 2,6; 3,2; 4,6 og 5,0 m for Ø4,0 m, jorddække 0,6 m, rørmasse 340 kg/m, rumvægte 17/16 kN/m³, friktionsvinkel 35°, CC2 og to lag X-GRID150.
- Uafhængig numerisk integration af neddykket cirkelareal og ballastens jordareal i ni GVS-positioner: største afvigelse fra avanceret motor var ca. 4,8e-7 kN/m for opdrift og 3,2e-7 kN/m for ballast. Det kontrollerer geometrien inden for den valgte model, ikke normgrundlaget eller jordens brudmekanisme.
- Ekstra grænsetests: negativ restopdrift, præcis B/O = 1, utilstrækkelig dybde til ombuk, automatisk produktvalg tæt på styrkegrænsen og CC3-validering ved sænket GVS.

## Overordnet vurdering

Appens opdeling i syv kort er hensigtsmæssig. Beregningsmotoren er adskilt fra UI, og den avancerede cirkelgeometri og ballastopdeling er konsistente med de uafhængige numeriske kontroller i de testede tilfælde.

De væsentligste problemer er enheder, kontrolstatus ved intet sikringsbehov, videreført inkonsistens ved ombuk, uklart anvendelsesområde for standardmetoden samt upræcise forklaringer af metode og normkrav. De bør ikke blandes sammen med de bevidste ændringer i produktlisten og brugen af Math.PI.

## Afhængigheder og fælles kontrakter

- `src/ui/state.ts` danner `OpdriftInput` og vælger metode; CC3 tvinges her til GVS = 0.
- `src/engine/opdrift.ts` ejer `OpdriftInput`, `OpdriftResultat`, `Status`, geometri, ballast, forankring og løsninger A-D.
- `src/engine/geonet.ts` ejer `GeonetValg`, produktvalg, RF, Ptill og styrkestatus.
- `src/engine/defaults.json` leverer fælles faktorer, minimumslængder og produkter.
- `src/ui/Opdriftssikring.tsx` viser alle syv kort, mellemregninger og løsningsvarianter.
- `src/ui/Partialkoefficienter.tsx` beregner sammenligning mellem CC2 og valgt klasse.
- `src/engine/figurer.ts` anvender beregningsresultater til figurer.
- `src/ui/kontrolpunkter.ts` omsætter motorens fund til advarsler.

Ingen interfaces eller imports er ændret. Omdøbning af interne felter som Ptill, Fbund og Ftop vil berøre motor, UI og tests og skal udføres samlet. Figurerne bruger fælles input-/resultattyper; deres konkrete afhængigheder skal kontrolleres ved ændringer af disse kontrakter. UI-etiketter kan ændres først uden at ændre beregningen.

## Kort 1: Generelle beregningsforudsætninger

**Kilder:** `src/ui/forudsaetninger.ts:8-16`, `src/ui/Opdriftssikring.tsx:393-410`; regnearkets afsnit 1.

### Standard
Levetid, fyldstørrelse, pH, konsekvensklasse og projekteringsforbehold er videreført. Det er relevant information og bør bevares.

### Avanceret
Samme forudsætninger vises. Det fremgår ikke tilstrækkeligt her, at variabel GVS er en selvstændig modeludvidelse, og at forankring og ballast fortsat bygger på den samme forenklede jord/net-model.

### Forslag
- Erstat sammenblandingen af BBA og partialkoefficienter med: “Last- og jordparametre behandles efter det valgte beregningsgrundlag. Geonettets styrke reduceres med de anvendte produkt- og langtidsfaktorer.”
- Tilføj: Beregning pr. løbende meter, tomt cirkulært rør, homogent friktionsfyld og den forudsatte symmetriske netføring.
- Tilføj synligt anvendelsesområde for hver metode.
- Forklar, at lokal kraftoverførsel ved retningsændring, deformation og samlet jordbrud ikke dokumenteres særskilt af de viste længdeformler.
- Projektets generelle formuleringer om normoverensstemmelse må ikke læses som en selvstændig verifikation af alle modelantagelser.

## Kort 2: Partialkoefficienter

**Kilder:** `src/ui/Partialkoefficienter.tsx:25-31, 54-76`; `src/engine/opdrift.ts:168-176, 386-395`; `src/ui/state.ts:42-44`.

### Standard og avanceret
Faktorerne 0,90, 1,10·KFI og 1,20 på tan(phi) er gennemskueligt vist. Den oprindelige CC2-beregning er udvidet med CC3.

### Konkrete fund
1. **CC1-begrundelsen er ikke underbygget:** Koden begrunder fravalget med, at opdrift pr. definition ikke kan beregnes i CC1. Det gennemgåede DK NA:2021 angiver generelt CC1 med KFI = 1,0 og ophæver den tidligere generelle udelukkelse for geotekniske konstruktioner. Et fravalg i appen bør betegnes som appens anvendelsesområde, medmindre et specifikt relevant krav dokumenteres. Dette er ikke en anbefaling om automatisk at åbne CC1.
2. **CC3 og GVS = 0:** Dette er en implementeret appregel. Jeg har ikke fundet belæg i det gennemgåede nationale anneks for at fremstille den som et universelt krav alene som følge af CC3. Vis den som valgt konservativ projekt-/appforudsætning, indtil kildegrundlaget er fastlagt.
3. Teksten “certificeret statiker, godkendt til KK3/CC3” sammenblander betegnelser og bør underlægges særskilt dokumentation. Der er ikke foretaget en juridisk vurdering af certificeringskravene.

### Forslag
- Omdøb kortet til “Sikkerheds- og metodeparametre”.
- Adskil normfaktorer, skønsmæssigt forankringstillæg S2 og produktreduktionsfaktorer.
- Sammenligningstabellen bruger CC2 og den valgte klasse med den aktuelle sessions effektive GVS. Ved valgt CC3 er denne GVS allerede sat til 0. Det er ikke en påvist sammenligningsfejl. Forklar blot, at et skift fra en tidligere CC2-beregning med sænket GVS til CC3 også ændrer vandstanden.

## Kort 3: Geometri og grundvand

**Kilder:** `src/ui/Opdriftssikring.tsx:372-389, 420-475`; `src/engine/opdrift.ts:140-157, 179-182, 221-229`.

### Standard
Standardmetoden tillader GVS under terræn. Den fastholder fuld opdrift og regnearkets ballastformel og anvender effektiv våd rumvægt over hele forankringsdybden. Ved GVS under rørtoppen bliver den gamle ballastformel også geometrisk forkert, fordi den øvre rørhalvdel ikke opdeles efter GVS. Dette er en videreført begrænsning, ikke en ny fejl i overførslen.

Hjælpeteksten “GVS over midten” er for upræcis. At GVS ligger over midten er ikke tilstrækkeligt til, at hele røret er neddykket eller den øvre halvdel kan trækkes fra med én rumvægt.

### Avanceret
Motoren opdeler cirklen i fire GVS-zoner og beregner neddykket areal. Ballastens øvre rørhalvdel opdeles tilsvarende. Forankringen anvender tør/ikke-neddykket fyld over GVS og effektiv rumvægt under.

**Vigtig tekstfejl:** Modebeskeden siger, at afvigelsen opstår, når GVS ligger under rørtoppen. Forankringen ændres allerede ved GVS > 0, også når hele røret stadig er under vand.

### Eksempel
Ø4,0 m, 0,6 m jorddække, GVS 0,3 m under terræn:
- Begge metoder: O = 138,23 kN/m og B = 35,74 kN/m.
- Standard: q_b = 8,04 kN/m² og L med ombuk = 4,78 m.
- Avanceret: q_b = 9,63 kN/m² og L med ombuk = 4,00 m.

### Forslag
- Brug “Grundvandsdybde z_GVS” og “Jorddække h_dæk” frem for h1, der har en anden betydning i ældre formeltekster.
- Vis afledt dybde til rørtop, rørmidte og rørbund samt dybder til begge vandrette netstykker.
- Skeln mellem grundvandsdybde og kote. Appen bruger positive dybder nedad, ikke absolutte koter.
- Forklar, at forankringen stadig er ved rørmidten; “avanceret” betyder ikke forankring under rørbunden.
- GVS over terræn er ikke understøttet; input afviser negative dybder. Angiv dette som begrænsning.
- Overvej senere at låse standard til GVS i terræn. Det vil være en bevidst funktionsændring og er ikke gennemført her.

## Kort 4: Egenvægt og fyldmateriale

**Kilder:** `src/ui/Opdriftssikring.tsx:477-578`; `src/engine/opdrift.ts:170-178, 351-395`.

### Standard
Følger arkets reduktioner og omregner rørmasse til kraft. Tør rumvægt har ingen indflydelse ved GVS = 0, men vises stadig som input.

### Avanceret
Samme materialeparametre. Den tørre/ikke-neddykkede rumvægt anvendes nu også i forankringens spændingsberegning.

### Fund og forslag
- **“Egenvægt E_k (kg/m)” er dimensionsmæssigt upræcist.** Brug “Rørmasse pr. meter m_rør,k (kg/m)”. Vis omregnet kraft som “Regningsmæssig røregenlast G_rør,d (kN/m)”.
- Erstat “0 kg/m giver den største sikkerhed” med “0 kg/m betyder, at rørets stabiliserende egenvægt ikke medregnes”.
- Brug “Mættet totalrumvægt gamma_sat,k” for input under GVS og “Rumvægt over GVS gamma_over,k” for input over GVS. Sidstnævnte er ikke nødvendigvis ovntør jord; navnet bør følge den faktiske parameterdefinition.
- Forklar eksplicit den videreførte behandling: gamma'_ark = 0,90·gamma_sat,k - gamma_w. Den er ikke lig 0,90·(gamma_sat,k - gamma_w). Gennemgangen fastslår ikke alene, at denne metode er normmæssigt rigtig eller forkert.
- Manglende validering af ombukgeometri: Ved d = 0,10 m og h_dæk = 0 accepterer motoren h_top = -0,15 m og negativ q_top. Det er en konkret input-/anvendelsesfejl. Ombuksløsninger skal afvises, hvis øverste netstykke ligger over terræn; nødvendige indbygningskrav skal desuden fastlægges.
- Vis “ikke aktiv i dette tilfælde” ved parametre uden betydning frem for at lade brugeren tro, at alle input påvirker resultatet.

## Kort 5: Opdrift uden geonet

**Kilder:** `src/ui/Opdriftssikring.tsx:591-655`; `src/engine/opdrift.ts:182-218, 271-279`.

### Standard
Opdrift fra hele cirklen og ballast efter regnearkets udtryk. Det er en korrekt gengivelse af den gamle model med de dokumenterede afvigelser, ikke en generelt korrekt delvist neddykket beregning.

### Avanceret
O = A_neddykket·gamma_w·gamma_f. Ballasten omfatter både jord over og under GVS og rørets egenlast. UI-formuleringen “opdrift og ballast for den del af røret under GVS” er derfor misvisende for ballast.

Den avancerede areal-/ballastgeometri er kontrolleret uafhængigt i de testede tilfælde. Når GVS er under rørmidten, er hele det medregnede jordareal over rørmidten over GVS; derfor bliver B konstant, mens O fortsat falder. Det er forventeligt inden for denne ballastmodel.

### Konkrete fund
- **Præcis B/O = 1:** Motoren giver “EJ OK” via streng >-kontrol, men konklusionsteksten siger, at sikring ikke er nødvendig via en <1-betingelse. Dette er reproduceret. Grænse og tekst skal afstemmes som en eksplicit beslutning.
- Ved O = 0 undgår motoren division med nul og viser “ingen opdrift”. Det er hensigtsmæssigt. Resultatet gælder den valgte vandstand, ikke alle fremtidige vandstande.

### Forslag
- Korttitel: “Opdrift og stabiliserende ballast”.
- O_d: “Regningsmæssig opdrift”.
- B_d: “Regningsmæssig stabiliserende ballast”.
- S1: “Kontrol uden geonet B_d/O_d”, ikke samlet sikkerhedsfaktor.
- Forklar hydrostatisk, sammenhængende grundvand som modelgrundlag; strømning, kapillære forhold og trykvand er ikke særskilt modelleret.

## Kort 6: Geonet

**Kilder:** `src/ui/Opdriftssikring.tsx:658-793`; `src/engine/geonet.ts:20-65`; `src/engine/opdrift.ts:218-219`.

### Standard og avanceret
Samme styrkemodel, RF og produktvalg. Avanceret tilstand ændrer kraftbehovet gennem O og B, men ikke materialereduktionsfaktorerne.

### Konkrete fund
1. **Negativ restopdrift giver misvisende netstatus:** Ved GVS = 3,2 m i den avancerede eksempelberegning fås F = -19,17 kN/m. Kort 5 siger, at sikring ikke er nødvendig, men to lag 150 får netforhold -7,43 og “EJ OK”. Kortet dæmpes og har en note, men status er stadig misvisende. Ved GVS ved/under rørbund gentages problemet. Samme problem kan opstå i standard ved tilstrækkelig ballast.
2. **Automatisk valg og kontrol bruger forskellige kriterier:** Valget kræver F < P_d, men kontrollen kræver P_d/F > 1,01. En konstrueret test med forhold 1,005 vælger X-GRID150 og viser derefter “EJ OK”, selv om næste produkt kunne bestå. Dette er en videreført logikuoverensstemmelse. Appen har en advarsel K-03, men den løser ikke selve valget.
3. **“Der produceres ikke ...” er for kategorisk:** Automatisk valg søger kun i den indbyggede produktliste og kun ét lag. Skriv “Intet produkt i automatisk étlagsvalg opfylder valgkriteriet”. Bevar manuelt to-lagsvalg som særskilt funktion.
4. Hjælpetekstens generelle påstand om, at flere end to lag ikke kan udnyttes, er ikke dokumenteret ved en særskilt analyse i koden. Skriv som appbegrænsning: “Appen understøtter højst to medregnede lag”. To lag forudsætter dokumenteret lastdeling og udførelse.

### Navngivning
- “Krav til geonettets trækstyrke F_opdrift” -> “Restopdrift F_op,d”. O-B er ikke automatisk den lokale trækkraft i hver netside.
- “Tilladelig træklast P_till” -> “Designtrækstyrke af geonet P_d”.
- “Sikkerhed” -> “Styrkekontrol P_d/F_op,d”.
- “Ultimal styrke” -> “Medregnet korttidstrækstyrke UTS_samlet”.
- Behold udnyttelsesgrad som F_op,d/P_d; skeln fra kontrolforholdets inverse.
- Ved F <= 0: vis “Ikke relevant - intet beregnet sikringsbehov”. Bevar eventuelt signed O-B i beregningssporet. Dette er et forslag til statusændring, ikke en allerede gennemført ændring.
- Tilføj udrulnings-/styrkeretning. Det oprindelige ark angiver, at længderetningens styrke udnyttes, og at udrulning skal ske på tværs af røret. Den oplysning mangler i de gennemgåede UI-tekster.

## Kort 7: Forankring

**Kilder:** `src/ui/Opdriftssikring.tsx:146-239, 799-862`; `src/engine/opdrift.ts:221-251, 287-323`; WIP-celler C289/E289, G312/C315, E404/G404/C407 og A427.

### Standard
q = h·gamma'_ark·mu·tan(phi_d), også ved GVS under terræn. Det følger regnearkets forudsætning om våd forankring.

### Avanceret
Motoren bruger:

sigma'_v(z) = min(z_GVS,z)·gamma_over,d + max(0,z-z_GVS)·gamma'_ark

q(z) = sigma'_v(z)·mu·tan(phi_d)

Dette giver et sammenhængende skift, når GVS passerer netniveauerne. Formlen er geometrisk konsistent for ikke-negative netdybder inden for det homogene jordprofil, men er ikke en særskilt eftervisning af ombøjningsreaktion eller jordbrud.

### Konkrete fund
1. **Forkert enhed:** F_bund og F_top vises som kN/m. De er q_b/q_t i kN/m². Det gælder fliser, opsummering og mellemregninger i begge tilstande.
2. **Ombukskontrol er inkonsistent:** Dimensionering bruger q_b + q_t/2; slutkontrol bruger q_b + q_t. Det er en videreført fejl fra regnearket og findes i begge tilstande. Den indgår ikke i appens aktuelle liste af kontrolpunkter K-03/K-05/K-12/K-13.
3. **Lokal OK kan misforstås:** Forankringskontrol kan være OK, selv om netstyrken er EJ OK eller produkt ikke findes. Angiv “Delkontrol: forankring” og undgå samlet godkendelse.
4. **Forkert/for kategorisk kraftforklaring:** Teksten siger, at hele opdriften bruges, selv om tovkraften på hver side er halvdelen. Motoren bruger restopdrift F = O-B, ikke hele O. Halveret tovkraft forudsætter symmetri og lodrette netstrækninger. Erstat med: “Det samlede forankringskrav er K = S2·F_op,d og fordeles på begge sider i denne model. Lokal netkraft og jordreaktion ved retningsændring eftervises ikke særskilt.”
5. **Netforbrug ved to lag:** Ltot er en geometrisk længde for én netføring og ganges ikke med antal lag. I eksemplet med to lag 150 og GVS = 0 viser løsning C Ltot = 28,95 m, ikke 57,90 m. Navngiv “Netlængde pr. lag i tværsnittet”. Vis separat teoretisk materialeforbrug n·Ltot m² pr. løbende meter rør, uden overlap/spild.
6. **Minimumsformel vises forkert i et interval:** UI siger “2L ... mindst 1,2 m”, men motorens x-værdi sættes kun til 1,2, hvis x < 1,0. For 1,0 <= x < 1,2 vises derfor 2L < 1,2, mens den efterfølgende længde pr. side sættes til 0,6. Det er en arvet visnings-/mellemresultatuoverensstemmelse, ikke nødvendigvis forkert endelig minimumslængde.
7. **Minimum uden ombuk:** 2L-mellemresultatet kan være 1,0 m, mens slutresultatet er mindst 1,0 m pr. side. Appen advarer K-13. Vis i stedet tydeligt beregnet længde og anvendt minimum som to forskellige størrelser, hvis dette besluttes.
8. **To rør:** UI mangler de oprindelige forudsætninger om største diameter og mindste rørvægt, hvis samme input skal repræsentere forskellige rør. Vis afgrænsningen eller begræns modellen til ens rør. Ingen ny model for forskellige rør er eftervist her.
9. **Advarsler og rapport:** UI oplyser, at kontrolpunkter ikke indgår i rapporten. Kritiske anvendelsesbegrænsninger bør følge resultatet i enhver rapport/eksport. Der er ikke udført en fuld rapportrevision.

### Foreslåede navne
- F_bund -> q_b,d: “Udtræksmodstand pr. areal, nederste netstykke”, kN/m².
- F_top -> q_t,d: “Udtræksmodstand pr. areal, øverste netstykke”, kN/m².
- K -> R_forank,krav: “Samlet nødvendigt forankringsbidrag”, kN/m.
- h_bund/h_top -> z_net,b/z_net,t: netstykkernes dybde under terræn. “Bund” må ikke forveksles med rørbund.
- L_geonet -> L_forank,side: rapporteret forankringslængde pr. side.
- La -> B_udstrækning: vandret udstrækning, ikke automatisk udgravningsbredde.
- “Opdriftskontrol” -> “Delkontrol: ballast og forankringsmodstand”.

## Sammenligning med regnearket

### Bevarede beregninger
Standard følger hovedsageligt de samme formler for ballast, jordparametre, restopdrift, RF, minimumslængder, løsninger A-D og de afsluttende kontroller. Dermed videreføres også kendte uoverensstemmelser.

### Bevidste afvigelser, som ikke skal registreres som nye fejl
- Appen bruger Math.PI; regnearket bruger 3,14 til tværsnit og netgeometri. Det forklarer bl.a. 138,23 i appen mod 138,16 kN/m i kundens Ø4000-PDF.
- Produktlisten indeholder også X-GRID130 og 200, og valggrænserne er UTS/RF. Den gamle faste værdi 78,9 for 150 er fjernet. Det fremgår af motoren og afvigelsesdata.
- Konsekvensklasse kan vælges mellem CC2 og CC3; originalen var fast CC2.
- Avanceret tilstand tilføjer neddykket areal, ballastopdeling og effektivt overlejringstryk ved variabel GVS.

Appens generelle tekst “beregningen følger regnearket” bør derfor præciseres til “Standardmetoden bygger på regnearkets beregningsmodel med dokumenterede ændringer”.

## Taleksempel: Ét rør med ombuk

Alle tal nedenfor er kørt direkte gennem appens motor, ikke hentet fra den gamle PDF. Input: Ø4,0 m, jorddække 0,6 m, rørmasse 340 kg/m, gamma 17/16, phi 35°, CC2, to lag 150.

| GVS under terræn | Metode | O kN/m | B kN/m | F kN/m | q_b kN/m² | L pr. side m |
|---|---|---:|---:|---:|---:|---:|
| 0,00 | Begge | 138,23 | 24,82 | 113,41 | 8,04 | 5,27 |
| 0,30 | Standard | 138,23 | 35,74 | 102,49 | 8,04 | 4,78 |
| 0,30 | Avanceret | 138,23 | 35,74 | 102,49 | 9,63 | 4,00 |
| 1,60 | Standard | 138,23 | 83,06 | 55,17 | 8,04 | 2,66 |
| 1,60 | Avanceret | 111,21 | 60,71 | 50,50 | 16,54 | 1,28 |
| 2,60 | Avanceret | 69,12 | 62,29 | 6,83 | 21,85 | 0,60 |
| 3,20 | Avanceret | 43,12 | 62,29 | -19,17 | 21,85 | 0,60* |
| 4,60 | Avanceret | 0,00 | 62,29 | -62,29 | 21,85 | 0,60* |

*Motoren returnerer minimumslængde, selv om der ikke er et beregnet behov for geonet. Det bør vises som “ikke relevant”, ikke som en nødvendig forankringsdimension. Ved GVS = 3,20 m viser netkortet samtidig EJ OK pga. negativt kontrolforhold.

## Foreslået fælles parameterordbog

| Nuværende | Foreslået | Enhed |
|---|---|---|
| O | O_d, regningsmæssig opdrift | kN/m |
| B | B_d, stabiliserende ballast | kN/m |
| F_opdrift | F_op,d, restopdrift | kN/m |
| P_till | P_d, designtrækstyrke af geonet | kN/m |
| Sikkerhed P_till/F | Styrkekontrol P_d/F_op,d | - |
| E_k i kg/m | m_rør,k, rørmasse pr. meter | kg/m |
| E_d i kg/m | Reduceret rørmasse; vis separat G_rør,d | kg/m; kN/m |
| F_bund/F_top | q_b,d/q_t,d | kN/m² |
| K | R_forank,krav | kN/m |
| h1 | h_dæk | m |
| T2/GVS | z_GVS | m under terræn |
| T3 | z_midte | m under terræn |
| h_bund/h_top | z_net,b/z_net,t | m under terræn |
| f_d for beskadigelse | f_inst | - |

Notation er et forslag til intern konsistens, ikke en påstand om obligatorisk Eurocode-symbolik. “d” i P_d angiver designværdi og må ikke forveksles med diameter d eller den gamle skadesfaktor f_d.

## Forslag til korte hjælpetekster

**Standardmetode:** “Beregner efter den oprindelige model med fuldt neddykket rør. Ved sænket GVS anvendes fortsat den oprindelige ballast- og forankringsmodel; begrænsninger fremgår af advarslerne.”

**Avanceret metode:** “Beregner opdrift ud fra det neddykkede rørvolumen, opdeler ballastens jordareal ved GVS og beregner effektivt overlejringstryk i netniveauerne. Forankringsgeometri, ombuk og øvrige modelantagelser er uændrede.”

**Forankringsmodstand:** “q er den beregnede udtræksmodstand pr. areal. Ved konstant q giver længden L en modstand R = q·L pr. løbende meter rør. Jordreaktionen ved nettets retningsændring eftervises ikke særskilt her.”

**To lag:** “Den samlede medregnede designstyrke forudsætter, at begge netlag kan mobiliseres og forankres som antaget. Appen understøtter højst to medregnede lag.”

## Prioriteret ændringsplan uden implementering

### Først: Tydelighed uden ændring af beregning
1. Ret q-enheder og navne, P_till -> P_d i UI og restopdriftsbetegnelsen.
2. Ret metodebeskrivelsen og adskil normkrav fra appforudsætninger.
3. Vis netlængde pr. lag og tilføj styrkeretning samt relevante montageforudsætninger.
4. Tilføj advarsel om forskelligt topbidrag i dimensionering og slutkontrol.
5. Forklar alle længdetillæg, minimumsgrænser og delkontroller.

### Derefter: Beslut eksplicit før ændring af adfærd
6. Ret status ved F <= 0 og O = 0 uden at skjule signed kraftbalance.
7. Afstem kontrol og konklusion ved B/O = 1.
8. Dokumentér CC3-vandstandsreglen og adskil den fra normfaktorerne.
9. Valider ombukgeometri og standardmetodens anvendelsesområde.
10. Beslut om automatisk netvalg skal opfylde selve kontrolgrænsen 1,01.
11. Faglig afklaring af ombuksmodellen, jordvolumen, lokal kraftoverførsel og deformation før beregningsændringer.

## Kilder

- Uploadet apparkiv: direkte læsning af de ovenfor angivne kildefiler og kørsel af tests.
- Medfølgende WIP-regneark: direkte læsning af celleformler med openpyxl.
- Oprindeligt 0824-regneark: tilgængeligt enterprise-udtræk til sammenligning af metode og forudsætninger.
- DS/EN 1997-1 DK NA:2021: medfølgende PDF samt officiel publicering, især A.1, A.4 og nationalt valg ved 2.4.7.4(2).
- Officiel normkilde: [DK NA:2021 på Bygningsreglementets hjemmeside](https://www.bygningsreglementet.dk/media/clddubwv/ds-en-1997-1-dk-na-2021_2024-07-01-a.pdf).

**Ingen kode eller beregningslogik er ændret i forbindelse med denne gennemgang.**
