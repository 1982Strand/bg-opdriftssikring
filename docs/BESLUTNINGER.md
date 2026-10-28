# Beslutninger

## 28. oktober 2026 — opgaven

Regnearket til opdriftssikring med X-GRID skal gøres til en app. Den skal have samme stil og design som MSL Dimensionering og kunne danne en PDF-rapport efter beregningerne. Koden skal ligge i et offentligt GitHub-repo med navnet `bg-opdriftssikring`. Før bygningen skal arket kortlægges fuldstændigt, og appens opbygning skal planlægges.

Brugerens ord: »Pointen er, de to værktøjer skal ligne hinanden for brugeren, så det er tydeligt det er fra samme firma.« og »Det kan godt være der skal optimeres på noget henad vejen, men i første omgang skal vi finde ud af hvordan appen skal opbygges og fungere.«

## 28. oktober 2026 — svar på planens spørgsmål

Brugerens svar: »1,2 og 3: I første omgang skal appen regne præcist som excel-arket. Alle fund skal dog noteres ligesom her med eksempler, så jeg kan tage stilling til mulighederne for ændring senere. 4:b. 5: OPDRIFT | Sikring med geonet 6:b. 7:b«

1. **Beregning.** Første version regner præcist som arket, også netvalget med grænsen 78,9 og kravet 1,01, π = 3,14 og g = 9,82. Fundene er beskrevet med eksempler og muligheder i `docs/FUND.md` (K-01 til K-19). De ændres kun efter særskilt beslutning.
2. **GVS.** Som arket. GVS under rørtoppen og rørmidten afvises ikke (K-05).
3. **Geonet.** Det automatiske valg er som i arket med ét lag og »kontakt leverandør for råd« over grænsen (K-04).
4. **Løsninger i rapporten.** Antallet af ledninger (1 eller 2) vælges på beregningssiden. Rapporten tager de to relevante løsninger med, uden og med omslag. Den ene kan fravælges på rapportsiden.
5. **Navn.** Topbjælken viser **OPDRIFT** | Sikring med geonet.
6. **Hosting.** Kun lokal brug i første omgang. Den delte udgave forberedes, og Cloudflare sættes først op efter godkendelse.
7. **Rør og tanke.** Der vælges mellem rør og liggende tank. Formlerne er de samme, og teksterne tilpasses. Mængdeberegning samt stående tanke og brønde er senere udvidelser.

Følgende er valgt af Claude og kan ændres:
- Ikonet i topbjælken er `Waves`.
- Produkt og antal lag kan overstyres manuelt, sådan som case 2 er regnet i arket. Ændret samme dag: altid 2 lag, se nedenfor.
- Under Kontrolpunkter vises en oplysning, når fund K-02, K-03, K-05, K-12 eller K-13 er aktivt. Beregningen påvirkes ikke, og oplysningen kommer ikke med i rapporten.
- Rapporten viser γ_f som den anvendte værdi i stedet for arkets tekst 1,05 (K-01).
- T₁ = 0 er fast (K-18).
- Felterne afviser kun værdier uden fysisk mening.
- Ved S₁ > 1 tones kortene om geonet og forankring ned på beregningssiden. Tallene vises som i arket.

## 28. oktober 2026 — side med indstillinger

Brugerens ønske: »Der skal også laves en 'indstillinger' side, hvor man bl.a kan indstille konsekvensklasse og kontrolklasse, der påvirker partialkoefficienterne.« og »kig i pdf'en med det danske anneks til EC7, der kan du se det«.

Appen får siden Indstillinger under menugruppen Opsætning.

**Konsekvensklasse.** Klassen vælges blandt CC1, CC2 og CC3 med CC2 som standard. Standarden giver arkets resultater. Efter DS/EN 1997-1 DK NA:2021, A.1 (side 13) er K_FI = 1,0 i CC1 og CC2 og 1,1 i CC3. I tabel A.4-1 NA (UPL, side 22) indgår K_FI kun i den ugunstige last: γ_G;dst = 1,1 · K_FI. Opdriften regnes derfor med γ_f = 1,1 · K_FI, dvs. 1,1 eller 1,21. γ_G;stb = 0,9 og γ_φ = 1,2 er uafhængige af klassen. Beslutningen afgør K-01 i `docs/FUND.md`.

**Kontrolklasse afventer afklaring.** Ordet »kontrolklasse« forekommer ikke i DS/EN 1997-1 DK NA:2021. Annekset regulerer partialkoefficienterne med:
- konsekvensklasse (K_FI, A.1);
- geoteknisk kategori: i kategori 1 ganges partialkoefficienterne for jordparametre og modstandsevne med modelfaktoren γ_s = 1,25 (A.3.1(6)P, side 15). Bestemmelsen står under STR/GEO (A.3), ikke under UPL (A.4);
- faktoren α for midlertidige konstruktioner under udførelse (A.3.1(7)–(9)).

Brugerens svar: »Med kontrolklasse mente jeg geoteknisk kategori. Tag den med på indstillingssiden, så kategori 1 ganger partialkoefficienterne for jordparametre med 1,25.« Kort efter: »nej vent. Drop i første omgang dette og tag bare den del med konsekvensklassen med«.

Indstillingssiden får derfor kun konsekvensklassen i første omgang. Geoteknisk kategori er noteret som senere udvidelse i `docs/PLAN.md`.

## 28. oktober 2026 — beregningsmotor og kontrolcases (fase 2)

Brugerens ord: »Start fase 2: udtræk kontrolcases fra Excel og byg beregningsmotoren med tests.«

Kontrolcasene udtrækkes fra selve regnearket med `tools/excel-cases.ps1`. Der er 42 cases i `tests/cases/excel-cases.json`. Motoren regner præcis som arket, jf. beslutningen om første version.

Følgende er valgt af Claude og kan ændres:
- **Tolerance.** Tal sammenlignes med en relativ tolerance på 1e-9 og en absolut nedre grænse på 1e-12. Den dækker kun afrundingsstøj i kommatal. Valgt geonet, OK/EJ OK og tekster skal stemme præcist. Brugeren godkendte tolerancen: »Tolerancen 1e-9 er godkendt.«
- **Fysisk mening.** γ · 0,9 skal være større end γ_w = 10 kN/m³. Ellers er den effektive rumvægt under vand ikke positiv, og arket ville dividere med 0 eller give negative forankringslængder.
- **Kontrolpunkter.** De følger betingelserne i `docs/BEREGNINGSMOTOR.md`. K-02 gælder produktet med den indtastede grænse 78,9, når F_opdrift ≥ P_till.

## 28. oktober 2026 — siderne Opdriftssikring og Indstillinger (fase 3)

Brugerens ord: »Start fase 3: siden Opdriftssikring med figurer og kontrolpunkter samt Indstillinger med konsekvensklasse.«

Siderne er bygget efter planens afsnit 4 og »Indstillinger« med MSL's komponenter, tema, resultatfliser og udfoldelige kort.

Følgende er valgt af Claude og kan ændres:
- **Løsninger.** De to løsninger står under hinanden med figuren til venstre i fuld størrelse og tal og mellemregninger til højre. Ved siden af hinanden blev figurernes tekst for lille.
- **Kontrolpunkter.** De står åbent i et eget kort under kort 5, når der er aktive fund. De er ikke foldet sammen.
- **Nedtoning.** Ved S₁ > 1 tones kort 4–5 ned med gråtoner i stedet for gennemsigtighed, så tekstens kontrast overholder WCAG.
- **Figurer.** Figurerne er i rigtig skala. Gravens hældning og bundlaget er illustration. Grundvand vises med en dæmpet blå, som ikke findes i MSL's palet.
- **Notation.** Sænket skrift bruges i felter, fliser, formler og figurer, fx L_geonet. Negative tal vises med rigtigt minustegn, fx −6,60.
- **Felter.** Hjælpeteksterne bygger på arkets noter, fx at 0 kg/m egenvægt giver den største sikkerhed (A150).
- **Konsekvensboks.** Indstillinger sammenligner den valgte klasse med standarden CC2 for den aktuelle beregning.
- **Lagring.** Konstruktion, antal, inddata og konsekvensklasse gemmes samlet i browseren.

Under arbejdet er fund K-20 tilføjet: arket bruger h₁ og h₂ i tre forskellige betydninger.

## 28. oktober 2026 — manuelt valg af geonet er altid 2 lag

Brugerens ord: »Først og fremmest, så skal man ikke kunne vælge hvor mange lag geonet i den manuelle funktion, det er ALTID 2 lag der tages udgangspunkt i, hvis ikke den automatiske beregning giver tilstrækkelig resultat. Det giver ikke mening med 3 eller flere lag, da nettet i midten ikke kan udnyttes.«

- Feltet »Antal lag« er fjernet. Ved manuelt valg vælges produktet, og der regnes med 2 lag. Valget hedder »Vælg geonet manuelt i 2 lag«, og produktlisten viser den samlede UTS for 2 lag.
- Motoren afviser mere end 2 lag. Antallet står som `lagVedManueltValg` i `defaults.json`.
- Motoren tillader stadig 1 lag i en overstyring, fordi en af kontrolcasene fra regnearket er overstyret til 1 lag X-GRID 110. Siden bruger det ikke.
- Det automatiske valg er fortsat som i arket: ét lag, og over grænsen »kontakt leverandør for råd« (K-04).

Opfølgende spørgsmål: Skal den automatiske beregning selv vælge 2 lag, når ét lag ikke er nok? Brugerens svar: »Nej, det automatiske valg skal blive som i regnearket. 2 lag vælges kun manuelt.« Fund K-04 er dermed afgjort.

## 28. oktober 2026 — X-GRID 130 og 200 og valggrænsen UTS/RF (K-21 og K-02)

Anledning: Brugeren bad om en sammenligning af databladet for X-GRID med regnearket. Databladet har også X-GRID 130 og 200, som mangler i arket (fund K-21).

Brugerens ord: »Ja, tilføj X-GRID 130 og 200 til både det automatiske og det manuelle valg med valggrænsen UTS/RF (K-21 mulighed a). Det løser også K-02.«

- Produktlisten er X-GRID 35, 55, 80, 110, 130, 150 og 200.
- Valggrænsen er P_till = UTS/RF for alle produkter. Regnearkets grænse 78,9 for X-GRID 150 udgår, og kontrolpunktet K-02 er fjernet.
- Det automatiske valg tager fortsat ét lag og det mindste produkt med F_opdrift < P_till. Over X-GRID 200 (94,94 kN/m) står der »kontakt leverandør for råd«, og 2 lag vælges manuelt.
- Dette er den første bevidste afvigelse fra regnearket i beregningen. Tre kontrolcases får et andet net:
  - d = 3,0 m, h₁ = 1,0 m: X-GRID 130 i stedet for 150;
  - K-02-casen: X-GRID 200 med OK i stedet for 150 med EJ OK;
  - casen over grænsen: X-GRID 200 i stedet for »kontakt leverandør«.
- De nye forventninger er regnet uden motoren ud fra arkets F_opdrift og står i `tests/cases/afvigelser.json`. Arkets udtrukne værdier i `excel-cases.json` er uændrede.

Følgende er valgt af Claude og kan ændres:
- Afvigelser fra arket føres i en særskilt fil i stedet for at rette i det udtrukne facit, så et nyt udtræk ikke sletter dem.
- Mellemregningerne for geonet viser nu P_till og P_till/F_opdrift for alle produkter, med det automatisk valgte markeret.

## 28. oktober 2026 — kilde og konsekvensklasse ved γ_f

Brugerens spørgsmål: »koefficienten der står under opdriften (gamma_f = 1,1) hvor kommer den fra og hvad afhænger den af?« Svaret var γ_G;dst = 1,1 · K_FI fra DS/EN 1997-1 DK NA:2021, tabel A.4-1 NA, som kun afhænger af konsekvensklassen. Brugerens ønske: »skriv kilden og konsekvensklassen ind ved γ_f på siden, fx i flisen og i mellemregningerne.«

- Flisen for opdriften viser kun γ_f, fx »γf = 1,10«. Brugeren ønskede efterfølgende: »bare skriv det som før oppe i flisen (gamma_f = 1,1), men behold beregningen og forklaringen nede i mellemregninger-boksen«.
- Mellemregningerne har linjen γ_f = γ_G;dst = 1,1 · K_FI med den valgte klasse og en note om tabel A.4-1 NA, afsnit A.1 og valget under Indstillinger.

## 28. oktober 2026 — ét fælles sæt reduktionsfaktorer (K-22)

Spørgsmål: Skal appen gemme reduktionsfaktorerne pr. net, da Navne tabel har en kolonne pr. net, som arket ikke bruger? Brugerens svar: »Nej, behold ét fælles sæt faktorer som i regnearket.« Appen bruger fortsat f_kryb = 1,43, f_m = 1,05, f_d = 1,15 og f_e = 1,22 for alle net, både i valggrænserne og i P_till.

## 28. oktober 2026 — navne på fliserne under Geonet

Brugerens ønske: »'Kraft til geonet Fopdrift' Skal omdøbes til 'Krav til geonettets trækstyrke Fopdrift' og 'Tilladelig last Ptill' omdøbes til 'Tilladelig træklast i geonet Ptill'«. Fliserne har fået de nye navne.

## 28. oktober 2026 — sikkerhed i stedet for udnyttelse for geonettet

Brugerens spørgsmål: »i boksen med 'Udnyttelse Ptill/Fopdrift' - hvad betyder de 1,26? Er det at den maksimale trækstyrke i det valgte net er udnyttet kun 26%, eller omvendt, at der er 26% "tilbage" af den fulde trækstyrke?« Svaret var, at 1,26 er forholdet P_till/F_opdrift, dvs. en sikkerhed. Udnyttelsen af P_till er 1/1,26 = 80 %, og navnet »Udnyttelse« var misvisende. Brugerens ønske: »omdøb flisen til »Sikkerhed P_till/F_opdrift« og vis udnyttelsen af P_till i procent under tallet.«

- Flisen hedder »Sikkerhed P_till/F_opdrift«. Under tallet står fx »Udnyttelse af P_till: 80 % · krav > 1,01«. Udnyttelsen vises kun ved positiv F_opdrift.
- Motorens felt `geonet.udnyttelse` hedder nu `geonet.sikkerhed`, og kravet i `defaults.json` hedder `krav.geonet`. Det er valgt af Claude, så rapporten i fase 4 ikke arver den misvisende betegnelse.
