# Beslutninger

## 28. oktober 2026 — opgaven

Regnearket til opdriftssikring med X-GRID skal gøres til en app. Den skal have samme stil og design som MSL Dimensionering og kunne danne en PDF-rapport efter beregningerne. Koden skal ligge i et offentligt GitHub-repo med navnet `bg-opdriftssikring`. Før bygningen skal arket kortlægges fuldstændigt, og appens opbygning skal planlægges.

Brugerens ord: »Pointen er, de to værktøjer skal ligne hinanden for brugeren, så det er tydeligt det er fra samme firma.« og »Det kan godt være der skal optimeres på noget henad vejen, men i første omgang skal vi finde ud af hvordan appen skal opbygges og fungere.«

## 28. oktober 2026 — svar på planens spørgsmål

Brugerens svar: »1,2 og 3: I første omgang skal appen regne præcist som excel-arket. Alle fund skal dog noteres ligesom her med eksempler, så jeg kan tage stilling til mulighederne for ændring senere. 4:b. 5: OPDRIFT | Sikring med geonet 6:b. 7:b«

1. **Beregning.** Første version regner præcist som arket, også netvalget med grænsen 78,9 og kravet 1,01, π = 3,14 og g = 9,82. Fundene er beskrevet med eksempler og muligheder i `docs/FUND.md` (K-01 til K-19). De ændres kun efter særskilt beslutning.
2. **GVS.** Som arket. GVS under rørtoppen og rørmidten afvises ikke (K-05).
3. **Geonet.** Det automatiske valg er som i arket med ét lag og »kontakt leverandør for råd« over grænsen (K-04).
4. **Løsninger i rapporten.** Antallet af ledninger (1 eller 2) vælges på beregningssiden. Rapporten tager de to relevante løsninger med, uden og med omslag. Den ene kan fravælges på rapportsiden. Ændret 28. oktober 2026: alle fire løsninger vises, se nedenfor.
5. **Navn.** Topbjælken viser **OPDRIFT** | Sikring med geonet.
6. **Hosting.** Kun lokal brug i første omgang. Den delte udgave forberedes, og Cloudflare sættes først op efter godkendelse.
7. **Rør og tanke.** Der vælges mellem rør og liggende tank. Formlerne er de samme, og teksterne tilpasses. Mængdeberegning samt stående tanke og brønde er senere udvidelser. Ændret 28. oktober 2026: kun rør, se nedenfor.

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
- **Lagring.** Konstruktion, antal, inddata og konsekvensklasse gemmes samlet i browseren. Konstruktion og antal er udgået 28. oktober 2026.

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

## 28. oktober 2026 — tydeligere omslag i figurerne

Brugerens ønske: »du må gerne gøre afstanden imellem geonet lidt større, og så afkorte det øverste, omslåede lag en smule, så det på den måde er tydeligt at nettet lægges ud forneden først, og så ombukkes.«

- Afstanden mellem netlagene tegnes mindst 16 px. Målene står fortsat med de beregnede værdier, og h_top-målet går til det tegnede toplag.
- Ombukket tegnes som en rund vending ved enden af bundlaget, og toplaget er tegnet som 75 % af forankringslængden.
- Ved to rør med omslag tegnes ét net pr. rør, og de to net vender mod hinanden i midten. Regnearkets figur viser et fælles omslag.

Figurerne er illustrationer; beregningen er uændret. Længden af toplaget (75 %) og afstanden (16 px) er valgt af Claude og kan ændres.

## 28. oktober 2026 — kantet omslag i figurerne

Brugerens ønske: »du må gerne gøre bukket mere 'kantet' så det ikke ligner geonettet buer så meget. Lidt mere i stil med billedet, taget fra regnearket«

- Vendingen ved enden tegnes nu som et lodret stykke med skarpe hjørner, som i regnearkets figur. Den runde vending fra forrige ændring er erstattet.
- Ved to rør står de to lodrette vendinger i midten oven i hinanden.

Brugerens præcisering: »omslaget ved to ledninger skal lige justeres, da nettene i teorien ligger helt opad hinanden i midten. Igen ligesom det ses på billedet fra regnearket.« Mellemrummet på 10 px i midten er derfor fjernet. Det fælles lodrette stykke tegnes én gang, så to stiplede linjer ikke ligger oven i hinanden.

## 28. oktober 2026 — alle løsninger vises, og der regnes kun på rør

Brugerens ønske: »Istedet for at man skal vælge antal ledninger i toppen, vil jeg egentlig hellere, at de bare alle vises i afsnit 5 i appen. Og fjern også 'Rør/Tank' vælgeren i toppen, det skal bare være rør hele vejen igennem.«

Beslutning 4 og 7 fra 26. oktober er ændret:
- Valget af antal ledninger er fjernet. Afsnit 5 viser alle fire løsninger: uden og med omslag for én ledning (A og C) og derefter for to ledninger (B og D).
- Valget mellem rør og liggende tank er fjernet. Alle tekster og figurer gælder rør.
- Arkets forudsætning for to ledninger, største diameter og mindste egenvægt, står nu i kortene for B og D i stedet for i afsnit 1.
- Indstillingernes konsekvensboks viser L_geonet for alle fire løsninger.
- Gemte data med de gamle valg indlæses fortsat. Valgene ignoreres.

Valgt af Claude og kan ændres: rækkefølgen A, C, B, D, så løsningerne for én ledning står først, og titlerne »Uden omslag, én ledning« og »Med omslag, én ledning«.

Åbent til fase 4: hvilke af de fire løsninger rapporten tager med, og om nogle kan fravælges på rapportsiden.

Under arbejdet er en fejl rettet: et gemt manuelt valg af X-GRID 130 eller 200 blev ved genindlæsning sat tilbage til X-GRID 150. Gyldige produkter læses nu fra produktlisten.

## 28. oktober 2026 — forudsætninger og partialkoefficienter først på beregningssiden

Brugerens ønske: »jeg vil gerne have indsat afsnittet med generelle beregningsforudsætninger fra regnearket, hvor det med betingelser og projekteringsansvar altså skal stå som første afsnit. derefter vil jeg gerne have et afsnit med partialkoefficienter ind lige efter, hvor de ting omkring konsekvensklasse flyttes fra indstillingerne og ind på dimensioneringssiden«. Undervejs: »indstillinger-siden skal ikke fjernes, der kommer noget senere«.

- Kort 1 **Generelle beregningsforudsætninger** viser arkets Betingelser og Projekteringsansvar (Rapporten A39:A69). Teksterne står i `src/ui/forudsaetninger.ts`, så rapporten kan bruge dem.
- Kort 2 **Partialkoefficienter** har valget af konsekvensklasse, koefficienterne fra tabel A.4-1 NA og i et udfoldeligt felt sammenligningen med standarden CC2. Det svarer til det, der stod på Indstillinger.
- De øvrige kort er rykket to numre: Geometri og grundvand er nu 3, Forankring 7.
- Siden Indstillinger bliver i menuen som pladsholder til senere indstillinger og henviser til kort 2.

Valgt af Claude og kan ændres:
- Betingelserne vises som punktliste, og projekteringsansvaret som to afsnit.
- Teksterne er rettet for stavning og tegnsætning: »konsekvenssklasse«, »indgåes«, »verificereret«, »Såfremt der indgået«, »med mindre« og »Partial koefficienter«. »British Board of Agreement« er rettet til det officielle navn British Board of Agrément. Standarden skrives DS/EN 1997-1 DK NA:2021 (Eurocode 7) som i resten af appen.
- Linjen om konsekvensklasse nævner den valgte klasse, fx »konsekvensklasse CC2 (middel konsekvensklasse)«, i stedet for arkets faste »middel konsekvenssklasse«. Det er besluttet for rapporten i planen.
- Opsummeringen i kort 1 er »DS/EN 1997-1 DK NA:2021 · levetid 120 år«. Kort 2 viser klasse, K_FI og γ_f.
- »Nulstil beregning« sætter nu også konsekvensklassen tilbage til CC2, fordi klassen står på beregningssiden. Knappen »Nulstil indstillinger« er udgået.

## 29. oktober 2026 — navne på rumvægtene

Brugerens ønske: »'rumvægt, våd γ' skal hedde 'rumvægt, mættet γ_m'. 'Rumvægt, tør γtør' skal hedde 'Rumvægt, tør γ_d'.« Claude påpegede, at indekset d allerede betyder regningsmæssig. Brugerens endelige svar: »jeg tror hellere jeg vil ændre den våde rumvægt til γ_våd og den tørre til γ_tør. og så d'et kommer på for de regningsmæssige værdier«.

- Den våde rumvægt hedder γ_våd og den tørre γ_tør. Regningsmæssige værdier får indekset d: γ_våd,d, γ_tør,d, γ′_d, φ_d og E_d.
- Den effektive rumvægt er γ′ = γ_våd − γ_w. Tabellen i kort 4 viser nu også den karakteristiske værdi, fx 17 − 10 = 7,00 kN/m³ i case 1.
- Den regningsmæssige værdi er som i arket γ′_d = γ_våd,d − γ_w = 0,9 · γ_våd − γ_w, fx 15,30 − 10 = 5,30 kN/m³. Faktoren 0,9 ganges altså kun på γ_våd, ikke på γ′. Tabellen viser formlen ved den regningsmæssige værdi.

Valgt af Claude og kan ændres: feltteksterne i motorens fejlbeskeder bruger samme navne og vises med sænket skrift, fx »γ_våd skal opfylde γ_våd · 0,9 > γ_w«. Motorens interne navne (`gamma`, `gammaTor`) er uændrede.

## 29. oktober 2026 — symboler i tabellen over fyldparametre

Brugerens ønske: »du må gerne lige indsætte parameterangivelsen i en kolonne foran 'karakteristisk' og 'regningsmæssig' - bare så man ikke er i tvivl om hvilken parameter der er tale om. Altså fx så der foran den våde rumvægt, karakteristisk står 'γvåd' og foran den regningsmæssige værdi står 'γvåd,d'«.

- Tabellen i kort 4 har nu et symbol foran hver værdi: γ_våd/γ_våd,d, γ_tør/γ_tør,d, γ′ = γ_våd − γ_w/γ′_d = γ_våd,d − γ_w, φ_k/φ_d og E_k/E_d.
- Parameterkolonnen har kun navnet, fx »Rumvægt, våd«.
- Rettet samme dag efter brugerens svar: »nej, flyt tallene tilbage under kolonneoverskrifterne, og lad parameterangivielsen stå foran. Lav evt. lidt mere mellemrum imellem kolonnerne, så det er tydeligt hvor parameterangivelsen hører til«. Tallene står igen under »Karakteristisk« og »Regningsmæssig«, og symbolerne har deres egen kolonne foran. Symbolet står tæt på sin værdi, med god afstand til den foregående værdi.

Valgt af Claude og kan ændres: afstanden (72 px før symbolet, 16 px mellem symbol og værdi), og »Egenvægt E« hedder nu »Rørets egenvægt« som i feltet.

## 29. oktober 2026 — kortere note under tabellen over fyldparametre

Brugerens ønske: »fjern følgende fra den forklarende tekst under tabellen: 'Faktoren ganges på γvåd, og vandet trækkes fra bagefter: γ′d = γvåd,d − γw = 15,30 − 10,00 = 5,30 kN/m³. Konsekvensklassen vælges i afsnit 2.'«

Noten under tabellen i kort 4 nævner nu kun konsekvensklassen og partialkoefficienterne γ_G;stb, γ_φ og γ_f. Formlen for γ′_d står fortsat i tabellens symbolkolonne.

## 29. oktober 2026 — kortere note i mellemregningerne for opdrift

Brugerens ønske: »fjerne teksten 'Konsekvensfaktoren KFI er 1,0 i CC1 og CC2 og 1,1 i CC3 (afsnit A.1). Konsekvensklassen vælges i afsnit 2.' fra den forklarende tekst i mellemregningerne i sektion 5.«

Noten i mellemregningerne i kort 5 forklarer nu kun, at γ_f er γ_G;dst fra tabel A.4-1 NA for UPL med trækelementer. K_FI og valget af klasse står i kort 2.

## 29. oktober 2026 — fund K-06 og K-07: π og g

Brugerens svar: »K-06: brug π (mulighed a). K-07: behold g = 9,82 (mulighed c), men forklar at det er tyngdeaccelerationen i Danmark.«

- **K-06.** Appen regner med π i O, i den halve rørflade i B og i netlængderne. Case 1 giver O = 54,00 i stedet for 53,97 kN/m og F_opdrift = 27,56 i stedet for 27,53 kN/m. I de 42 cases skifter hverken netvalg eller OK/EJ OK.
- Kontrollen mod regnearket regner fortsat med 3,14, så alle 42 cases stadig sammenlignes med arket ved 1e-9. Udtrækket i `tests/cases/` er uændret.
- Mellemregningen for O skriver π/4 i stedet for 3,14/4.
- **K-07.** g = 9,82 bevares. Mellemregningerne i kort 5 forklarer, at rørets egenvægt omregnes med g = 9,82 m/s², som er tyngdeaccelerationen i Danmark.

Browsertestene bruger nu appens tal med π, fx O = 54,00 og udnyttelsen 73 % i case 1. K-03-eksemplet i browsertesten er flyttet fra d = 2,601 til d = 2,600 m, så det stadig viser P_till/F_opdrift = 1,005.

## 29. oktober 2026 — princippet for O og B i mellemregningerne

Brugerens svar på Claudes forslag: »Ja, indsæt noten om både O og B som første note i mellemregningerne i kort 5.«

Første note i mellemregningerne i kort 5 forklarer nu princippet: O er vægten af det fortrængte vand for et tomt rør helt under vand (også ved GVS under rørtoppen, K-05), og B er fyldet i en lodret søjle med rørets bredde fra terræn til rørmidte, minus rørets øverste halvdel, plus egenvægten. Fyld under GVS regnes med γ′_d, så vandets opdrift på jorden indgår i B og ikke i O.

Rettet samme dag efter brugerens ønske: »flyt noten om γf øverst, da den står først i mellemregningerne. Flyt 'Ballasten B er fyldet i en lodret søjle med rørets bredde fra terræn til rørmidte, minus rørets øverste halvdel, plus rørets egenvægt.' ned som en note for sig selv og ikke som en del af opdrift-noten. fjern teksten 'Fyld under GVS regnes med γ′d, så vandets opdrift på jorden indgår i B og ikke i O.'« Noterne står nu i rækkefølgen γ_f, O, B og til sidst T₃ og g.

## 29. oktober 2026 — avanceret beregning (K-05 mulighed c)

Brugerens svar: »Først og fremmest, så vil jeg gerne lave dette, som en helt ny udgave af beregningerne. Dvs. vi har vores nuværende standard-beregning og så nu denne avancerede beregning. Jeg tænker, at det netop skal kunne opdeles fuldt ud, så vi bibeholder vores nuværende beregning der er tro mod regnearket og så udvikler denne avancerede beregning sideløbende. Man kunne Fx lave en toggle, eller knap 'Avanceret beregning' som så ændrer beregningen, tilhørende formler, forklaringer, visninger mv, således vi ikke ændrer noget hvis vi stadig gerne vil beholde vores nuværende beregningsmetode. Svar på P1-P8: P1: ok. P2: ok til forslaget. P3: ok til forslaget. P4: lad os tage det når du når til det, så kan vi finde ud af hvad vi gør her. P5: Note når GVS sættes under terræn: 'GVS skal være den højeste vandstand i ledningens levetid, også under anlæg og ved skybrud. Værste tilfælde er GVS i terræn. Hvis GVS sættes herunder skal der sikres tilstrækkelige drænforanstaltninger. Beregninger på eget ansvar.'. P6: undlad blå farve på rør. P7: ok til teksters ordlyd. P8: ok. HUSK! ændringerne skal kun gælde, hvis man har togglet/afkrydset 'Avanceret beregning'«

- Standardberegningen er uændret og regner som regnearket, inklusive kontrolpunkt K-05.
- Afkrydsningen »Avanceret beregning« øverst på beregningssiden skifter til den avancerede beregning. Den ændrer opdrift, ballast, σ′_v for to ledninger, mellemregninger, forklaringer og noter efter [FORSLAG_K-05.md](FORSLAG_K-05.md). Uden afkrydsning er alt som før.
- I den avancerede beregning vises noten fra P5 i kort 3, når GVS ligger under terræn, og kontrolpunkt K-05 udgår.
- Valget gemmes sammen med beregningen. »Nulstil beregning« vælger standardberegningen.
- P8 er tilpasset: Arkets cases får ingen afvigelser, fordi standardberegningen er uændret. Den avancerede beregning har sine egne tests.
- P4 (K-19) tages op som næste punkt for den avancerede beregning.

Valgt af Claude og kan ændres:
- Afkrydsningen står ved »Nulstil beregning« øverst på siden. Når den er valgt, vises en kort oplysning: »Avanceret beregning er valgt. Opdrift og ballast regnes for den del af røret, der står under GVS, og afviger fra regnearket, når GVS ligger under rørtoppen.«
- Når der ikke er opdrift, siger noten i kort 6: »Røret påvirkes ikke af opdrift, så opdriftssikring er ikke nødvendig. Tallene nedenfor vises til orientering.« Mellemregningerne siger, at S₁ og kontrollerne ikke kan regnes.
- Under udviklingen viste den numeriske kontrol en afrundingsfejl lige over rørbunden, hvor A_våd = π/4 · d² − A_tør kunne blive en anelse negativ. Under rørmidten regnes A_våd derfor direkte.

## 29. oktober 2026 — fund K-19 i den avancerede beregning

Brugerens svar: »K-19: vælg mulighed a) i den avancerede beregning, så F_bund og F_top regnes med den faktiske effektive spænding i nettets niveau. Standardberegningen er uændret.«

- I den avancerede beregning regnes F_bund og F_top med σ′_v(z) = min(T₂, z) · γ_tør,d + max(0, z − T₂) · γ′_d i h_bund og h_top. Det er samme spænding, som afstanden mellem to ledninger bruger i rørmidten.
- Ved GVS i terræn er resultatet det samme som i standardberegningen. Ved GVS under terræn bliver forankringslængderne kortere, fx L uden omslag 1,60 m i stedet for 3,30 m i case 2 med GVS i 1,6 m.
- Mellemregningerne for kraftoverførsel viser σ′_v med indsatte tal. Noten siger i den avancerede beregning: »Kraftoverførslen regnes med den effektive lodrette spænding i nettets niveau: tør fyld over GVS og effektiv rumvægt under.«
- Standardberegningen er uændret og regner som arket med γ′_d uanset GVS.

## 29. oktober 2026 — konsekvensklasser og advarsel om lav GVS

Brugerens ønske: »ændr advarslen i kort 3, sætningen skal ændres fra 'Hvis GVS sættes herunder skal der sikres tilstrækkelige drænforanstaltninger.' til 'Hvis GVS sættes herunder skal der sikres tilstrækkelige drænforanstaltninger eller på anden vis dokumenteres at vandstanden ikke kan blive højere.'. Derudover, så fjern mulighed for at vælge CC1 i kort 2 og de tilhørende tekster omkring CC1. Man kan pr definition ikke regne opdrift i CC1, jf. EC7. Hvis man vælger CC3, skal der tilføjes en note om, at der kræves særskilt kontrol fra certificeret statiker, godkendt til KK3/CC3. Desuden, hvis man vælger CC3, uanset om det er i standard eller avanceret, skal det kun være muligt at beregne med GVS i terræn, da der skal tages højde for ekstremhændelser, altså 100-års hændelser for skybrud/oversvømmelse, stigning i havvands- og grundvandsspejl, eller risiko for svigt af drænsystemer.«

- Advarslen i kort 3 (avanceret beregning, GVS under terræn) har den nye sætning.
- CC1 er fjernet. Kort 2 har kun CC2 og CC3, og teksterne om CC1 er slettet. Motoren afviser CC1 med teksten »Opdrift kan ikke regnes i konsekvensklasse CC1. Vælg CC2 eller CC3.« En gemt beregning med CC1 indlæses som CC2.
- Ved CC3 vises i kort 2: »Ved konsekvensklasse CC3 kræves særskilt kontrol fra certificeret statiker, godkendt til KK3/CC3. Der regnes altid med GVS i terræn.«
- Ved CC3 regnes altid med GVS i terræn, i både standard og avanceret beregning:
  - »GVS i terræn« er afkrydset og låst, og feltet for GVS under terræn er låst.
  - Kort 3 forklarer: »Ved konsekvensklasse CC3 regnes altid med GVS i terræn, da der skal tages højde for ekstremhændelser: 100-års hændelser for skybrud og oversvømmelse, stigning i havvands- og grundvandsspejl og risiko for svigt af drænsystemer.«
  - Motoren afviser GVS under terræn i CC3.
  - En indtastet GVS gemmes og gælder igen, hvis der skiftes tilbage til CC2.
- Regnearkets kontrolcase »CC1: case 1« kontrolleres nu ved, at motoren afviser CC1. Samme input i CC2 er »Case 1«, som fortsat sammenlignes med arket. De øvrige 41 cases er uændrede.

Valgt af Claude og kan ændres: noten om statikerkontrol står i kort 2 ved valget, og forklaringen om GVS står i kort 3 ved felterne. Rapporten i fase 4 skal have noten om statikerkontrol med, når CC3 er valgt.

## 29. oktober 2026 — tekst om partialkoefficienterne i kort 2

Brugerens ønske: »Ordlyden skal lige ændres lidt. Partial koefficienten regnes altid 1,1 * KFI, hvor det bare er KFI der ændrer sig ift konsekvensklassen. Kom lige med et forslag til omskrivning. Fjern i øvrigt teksten 'Regnearket svarer til CC2'«. Brugerens valg: forslag 2.

Teksten i kort 2 lyder nu: »Partialkoefficienterne følger DS/EN 1997-1 DK NA:2021 (Eurocode 7), tabel A.4-1 NA for løftning (UPL) med trækelementer. Opdriften regnes med γ_G;dst = 1,1 · K_FI, hvor kun konsekvensfaktoren K_FI afhænger af konsekvensklassen: 1,0 i CC2 og 1,1 i CC3 (afsnit A.1).«

## 29. oktober 2026 — figur over A_tør og A_våd i mellemregningerne

Brugerens ønske: »du må gerne sætte din visualisering ind i mellemregningerne, din tegning forklarer det rigtig fint. Den skal bare ind til højre i boksen, så teksten bliver stående og boksen ikke ændres ellers, udover at denne figur indsættes«.

- Mellemregningerne i kort 5 viser rørets tværsnit delt af GVS til højre for teksten: den tørre del A_tør, den våde del A_våd, a, θ = arccos(a/r) og r med de aktuelle tal.
- Figuren vises kun i den avancerede beregning, når GVS ligger mellem rørtop og rørbund, dvs. når linjerne for a, A_tør og A_våd står i mellemregningerne. Teksten og resten af boksen er uændret.
- På smalle skærme står figuren under teksten.

Valgt af Claude og kan ændres: cirklen har fast størrelse, og GVS' placering følger forholdet a/r. Farverne er figurpalettens grundvandsblå for den våde del og en lys jordfarve for den tørre del.

Tilføjet samme dag efter brugerens ønske: »Du må gerne tilføje T2 og T3 på figuren, altså fx 'T2 GVS' ligesom oppe i figuren på kort 3.« Figuren har nu koterne »T₂ GVS« og »T₃ rørmidte« med dybder til venstre for røret, som i tværsnittet i kort 3. Rørmidtens niveau er vist med en stiplet linje.

Rettet samme dag efter brugerens ønske: »ændr 'a = 0,80 m' til ' a = T3 - T2 = 0,80 m' og 'r = 2,00 m' til 'r = d/2 = 2,00 m' der skal ikke tilføjes noget til arealerne«. Figuren skriver nu »a = T₃ − T₂ = …« og »r = d/2 = …«. Teksterne for arealerne er uændrede.

## 29. oktober 2026 — reduktionsfaktoren i mellemregningerne for geonet

Brugerens ønske: »kan du ikke fjerne tabellen i mellemregningerne, så man ikke ser tallene for alle de andre net? Tilføj gerne beregningen for RF også, se inspiration i billedet her.«

- Tabellen med alle produkter, deres P_till og P_till/F_opdrift er fjernet fra mellemregningerne i kort 6.
- I stedet står »Reduktionsfaktor (RF)« med de fire faktorer fra BBA 16/H253, hver med en kort forklaring, og summen »Samlet reduktionsfaktor (RF)« fremhævet med formlen RF = f_kryb · f_m · f_d · f_e. Derefter følger P_till for det valgte net og noten om valget.

Valgt af Claude og kan ændres:
- Forklaringerne er arkets tekster (Rapporten A209:A216): »max 120 års levetid« for f_kryb og f_m og »afrundede kornfraktioner, D < 35 mm« for f_d.
- For f_e står »pH 4,1–8,9« som i betingelserne i stedet for arkets »angiv pH-værdi i hele tal«, fordi appen ikke har et felt til pH.
- Arkets »extrapolation« er skrevet med dansk stavning: »ekstrapolationsfaktor«.
- Linjen RF = 1,43 · 1,05 · 1,15 · 1,22 er fjernet, fordi opstillingen viser det samme.
- Infoikonerne fra forlægget er ikke med.

## 29. oktober 2026 — RF med 2 decimaler, F_opdrift og tekst i flisen Valgt geonet

Brugerens ønske: »Afrund RF til max 2 decimaler. Tilføj også lige Fopdrift mellemregningen. ændr teksten i boksen med valgt geonet fra 'Valgt manuelt · UTS = 300 kN/m' til 'Ultimal styrke UTS = 300 kN/m'«. På spørgsmålet, om afrundingen også skal gælde beregningen, svarede brugeren: »Kun visningen«.

- RF vises med 2 decimaler (2,11) i opstillingen og i linjen for P_till. Beregningen bruger fortsat RF = 2,1066 som regnearket, så fx »P_till = UTS/RF = 80/2,11 = 37,98 kN/m«.
- Mellemregningerne for geonet starter med F_opdrift = O − B med indsatte tal.
- Flisen »Valgt geonet« skriver »Ultimal styrke UTS = … kN/m«. Det gælder både automatisk og manuelt valg; det manuelle valg ses fortsat af »(2 lag)« i produktnavnet.

## 29. oktober 2026 — tekst i flisen Sikkerhed P_till/F_opdrift

Brugerens ønske: »ændr' teksten i kortet med sikkerhed fra 'Udnyttelse af Ptill: 80 % · krav > 1,01' til 'Krav: Ptill/Fopdrift > 1,0 (Ptill udnyttet 80%)'«. På spørgsmålet, om kravet skal skrives som 1,01, der bruges i beregningen, eller ændres til 1,0, svarede brugeren: »Skriv 1,01«.

Flisen skriver nu »Krav: P_till/F_opdrift > 1,01 (P_till udnyttet 80%)«. Uden positiv F_opdrift står kun »Krav: P_till/F_opdrift > 1,01«. Kravet hentes fra `krav.geonet`, og beregningen er uændret.

## 29. oktober 2026 — rækkefølge og note i mellemregningerne for geonet

Brugerens ønske: »Flyt mellemregning for Ptill op under Fopdrift. slet teksten 'X-GRID 130 og 200 er tilføjet fra databladet, og regnearkets valggrænse på 78,9 kN/m for X-GRID 150 er udgået (fund K-21 og K-02).'«

Mellemregningerne i kort 6 starter nu med F_opdrift og derefter P_till, før opstillingen af RF. Noten under opstillingen siger kun, at reduktionsfaktorerne er fra BBA-certifikatet, og hvordan det automatiske valg sker. Fund K-21 og K-02 er fortsat beskrevet i FUND.md.

## 29. oktober 2026 — kildehenvisning til BBA-certifikatet i mellemregningerne for geonet

Brugerens ønske: »ændr teksten 'RF beregnes som produktet af følgende faktorer (BBA 16/H253):' til 'RF beregnes som produktet af følgende faktorer:' teksten i bunden skal ændres til: 'Reduktionsfaktorer fremgår af “British Board of Agreement” (BBA) certifikat No. 16/H253, se [www.byggros.com](https://www.byggros.com)'«

- Indledningen til opstillingen af RF nævner ikke længere certifikatet.
- Noten under mellemregningerne er erstattet af kildehenvisningen med link til https://www.byggros.com, som åbnes i en ny fane. Sætningen om, at det automatiske valg tager det mindste produkt, hvor F_opdrift er under P_till, er dermed udgået af noten.
  På spørgsmålet, om sætningen skal tilbage, svarede brugeren: »Nej, sætningen om det automatiske valg skal ikke tilbage.«
- Links i noter understreges som i MSL Dimensionering.

## 30. oktober 2026 — noten om tovkraften i kort 7 bevares

Claude påpegede ved gennemgangen af arkets afsnit 8, at noten i kort 7 »Hele opdriften bruges til forankringen, selv om tovkraften på hver side er halvdelen.« kan læses, som om forankringen har en ekstrasikkerhed med faktor 2. Ifølge arkets note (A184) gælder faktor 2 kun valget af geonet; ved forankringen optager hver side K/2 = F_opdrift/2 · S₂. Claude foreslog en ny ordlyd.

Brugerens svar: »Nej, lad den stå«.

- Noten i kort 7 er uændret.

## 30. oktober 2026 — rettelser efter gennemgang af appens syv kort

Grundlag: en teknisk gennemgang af appen, som brugeren lagde i projektmappen (ikke i Git). Claude vurderede hvert fund mod koden, regnearket og DS/EN 1997-1 DK NA:2021, og brugeren valgte kort for kort. Brugerens svar står i citat. Den samlede oversigt blev godkendt med »ok«.

**Kort 1.**
- Ny betingelse: »Beregningen gælder pr. løbende meter for et tomt, cirkulært rør i homogent friktionsfyld med geonettet ført symmetrisk om røret.« (»Tilføj hele linjen«).
- Linjen om BBA og partialkoefficienter er uændret (»Uændret som arket«). Der kommer ingen linje om modellens begrænsninger (»Ingen tilføjelse«).

**Kort 2.**
- DK NA:2021 har slettet teksten om, at CC1 ikke gælder for geotekniske konstruktioner, og angiver CC1 med K_FI = 1,0. Begrundelsen fra 29. oktober (»pr. definition, jf. EC7«) holder derfor ikke. CC1 forbliver ude som appens eget valg (»Behold CC2/CC3, ret tekst«). Motorens fejltekst er nu »Appen regner kun i konsekvensklasse CC2 og CC3.«
- Statikerteksten (»Uændret«), teksten om CC3 og GVS (»Uændret«) og sammenligningstabellen (»Ingen note«) er uændrede.

**Kort 3.**
- Standardberegningen er låst til GVS i terræn (»Lås til GVS i terræn«) med besked og låste felter (»Besked og låste felter«): »Standardberegningen regner altid med GVS i terræn. GVS under terræn kan regnes med avanceret beregning.« Låsen er kun i brugerfladen. Motoren regner fortsat arkets kontrolcases med GVS under terræn, og den indtastede GVS gemmes til den avancerede beregning.
- Beskeden og hjælpeteksten for avanceret beregning nævner nu forankringen (»Ret som foreslået, men udelad reference til regnearket«). Hjælpeteksten for GVS i standardberegningen er »Dybden fra terræn til grundvandsspejlet. Bruges kun i den avancerede beregning.« (»ret som foreslået, men udelad referencer ril regnearket« og låsen).
- h₁, T₂ og T₃ beholdes (»Behold h₁, T₂, T₃«).

**Kort 4.**
- Hjælpeteksten for egenvægten: »… Med 0 kg/m ses der bort fra rørets egenvægt, hvilket er på den sikre side.« (»Ret hjælpetekst«). γ_tør: »… Bruges kun i den avancerede beregning ved GVS under terræn.« (»Hjælpetekst«).
- Omslag er ikke muligt, når rørmidten ligger 0,2 m eller mindre under terræn (»Omslag ikke muligt«), fund K-23.

**Kort 5.**
- S₁ ≥ 1 er OK som i EC7 (»Følg EC7: ≥ 1 er OK«), fund K-12.
- Gennemgangens navne (»Gennemgangens navne«) overalt (»Overalt«): kortet hedder »Opdrift og stabiliserende ballast«, O og B hedder O_d og B_d, og fliserne hedder »Regningsmæssig opdrift O_d«, »Stabiliserende ballast B_d« og »Kontrol uden geonet S₁ = B_d/O_d« med »Krav ≥ 1,0«.
- Sætningsdelen om K-05 er fjernet fra noten om O (»Fjern sætningsdelen«). Der kommer ingen note om hydrostatisk grundvand (»Nej«).

**Kort 6.**
- Når F_op,d ≤ 0, viser styrkekontrollen »Ikke relevant« (»»Ikke relevant««), og noten lyder »S₁ ≥ 1,0: opdriftssikring er ikke nødvendig. Tallene nedenfor vises til orientering.« Kun i visningen.
- Det automatiske netvalg bruger kravet P_d/F_op,d > 1,01 (»Valg med krav 1,01«), fund K-03.
- Teksten ved manglende produkt (»Uændret«) og hjælpeteksten om 2 lag (»Behold«) er uændrede.
- Gennemgangens navne (»Gennemgangens navne«): »Restopdrift F_op,d«, »Designtrækstyrke P_d«, »Styrkekontrol P_d/F_op,d« og »Medregnet korttidstrækstyrke UTS«, også i kort 2 og 7.
- Ny note: »Geonettet rulles ud på tværs af ledningen, så nettets styrke på langs af rullen udnyttes.« (»Tilføj note«).

**Kort 7.** Brugeren bad om en gennemgang fra bunden: »Som udgangspunkt antager jeg at regnearket regner rigtigt, så jeg skal være helt sikker på hvad der skal ændres og hvorfor«. Gennemgangen viste, at appen regner som arket i alle fire løsninger, og at punkterne kun gælder visning og tekst. Svar: »1b, 2b, 3a, 4a«.
- 1b: Mellemregningerne viser den beregnede længde og den anvendte mindstelængde hver for sig, og kontrolpunktet K-13 er udgået.
- 2b: Kontrollen ved omslag regnes som arket med kontrolpunktet K-08.
- 3a: Arkets forskrifter står som noter på løsningskortene (mindstelængder, omslag ved pladsproblemer, lige meget i top og bund med 0,2 m mellem lagene, midterstykket som opdriftsproblem med faktoren 1,2, afstanden mindst 2 · L_geonet mellem rør med omslag).
- 4a: Netlængden nævner tillægget: »inkl. 1,2 m tillæg til omslag og overlæg« for én ledning og 0,8 m for to ledninger (K-09).
- Noten om tovkraften er nu »Forankringen på begge sider skal tilsammen optage K = F_op,d · S₂.« (»Ny tekst«), og noten om γ′_d er forenklet til »Geonettet ligger under GVS, så kraftoverførslen regnes med γ′_d.«
- Navne og enheder for F_bund og F_top (»lad det være«), »Opdriftskontrol« (»Behold«) og netlængden ved 2 lag (»Uændret«) er uændrede.

**Tværgående.** Indledningen er »Opdrift og ballast for rør, nødvendigt geonet og forankringslængder for X-GRID.« (»Uden regnearket«). Noten om to ledninger nævner ikke regnearket. Til fase 4: kritiske kontrolpunkter som K-08 bør følge resultatet i rapporten.

Valgt af Claude og kan ændres:
- K-08 vises kun, når sikring er nødvendig (S₁ < 1).
- Opsummeringen af kort 6 og sammenligningstabellen i kort 2 viser »Ikke relevant« ved F_op,d ≤ 0, og tabellen viser »Omslag ikke muligt« for løsningerne med omslag, når de ikke kan regnes.
- Mellemregningen ved manglende produkt lyder »Intet produkt i ét lag opfylder P_d/F_op,d > 1,01 ved F_op,d = … kN/m.«
- Tillægget står i rækkenavnet for netlængden, og værdierne i løsningstabellerne står på én linje.

## 30. oktober 2026 — K_FI ved valget af konsekvensklasse og sammenligning af CC2 og CC3

Brugerens ønske: »Slet følgende fra den indledende tekst-del: 'Opdriften regnes med γG;dst = 1,1 · KFI, hvor kun konsekvensfaktoren KFI afhænger af konsekvensklassen: 1,0 i CC2 og 1,1 i CC3 (afsnit A.1).'. Vis bare hvad Kfi er, til højre for den lille knap hvor man vælger konsekvensklasse, så det vises hvad værdien er, alt efter jvilken klasse man har valgt. Når nu vi har valgt kun at have cc2 og cc3, så vis bare de to nede i 'konsekvens for den aktuelle beregning'.«

- Indledningen i kort 2 er nu kun første sætning om DS/EN 1997-1 DK NA:2021, tabel A.4-1 NA.
- K_FI for den valgte klasse står til højre for knaprækken, fx »K_FI = 1,0« ved CC2 og »K_FI = 1,1« ved CC3.
- »Konsekvens for den aktuelle beregning« har kolonnerne CC2 og CC3 i stedet for »Standard (CC2)« og »Valgt«.

Valgt af Claude og kan ændres:
- Hver kolonne regnes med klassens egne regler. CC3 regnes derfor altid med GVS i terræn, mens CC2 bruger den indtastede GVS i den avancerede beregning.

## 30. oktober 2026 — hjælpeteksten ved »Avanceret beregning«

Brugerens ønske: »oppe ved afkrydsningsfeltet 'avanceret beregning', skal teksten i tooltippet ændres fra 'Regner med den faktiske vandstand: tør fyld over GVS i forankringen og opdrift kun af den del af røret, der står under vand.' til 'I avanceret beregning kan der regnes med vandspejl under terræn, samt konsekvensklasse 3.'«

- Hjælpeteksten er ændret ordret.

Claude påpegede, at CC3 hidtil kunne vælges i begge beregningsmetoder. Brugerens svar: »Det skal ikke være muligt at vælge CC3 i standard beregningen«.

- CC3 kan kun vælges i avanceret beregning. I standardberegningen er knappen CC3 låst, og hjælpeteksten ved »Konsekvensklasse« siger »CC3 kan kun vælges i avanceret beregning.«
- Slås avanceret beregning fra, skifter klassen til CC2. En gemt standardberegning i CC3 indlæses som CC2.
- Låsen er kun i brugerfladen. Motoren regner fortsat arkets kontrolcases i CC3.

Valgt af Claude og kan ændres:
- Sammenligningstabellen i kort 2 viser fortsat både CC2 og CC3 i standardberegningen. CC3 regnes altid med GVS i terræn, hvor de to metoder giver samme tal.

## 30. oktober 2026 — noten i bunden af kort 4 fjernet

Brugerens ønske: »i kort 4, fjern den forklarende teskt i bunden: 'Konsekvensklasse CC2: γG;stb = 0,90 på fyld og egenvægt, γφ = 1,20 på tan φ og γf = 1,10 på opdriften.'«

- Noten under tabellen med fyldparametre er fjernet. Partialkoefficienterne står fortsat i kort 2.

## 30. oktober 2026 — T₃ og g i mellemregningerne i kort 5

Brugerens ønske: »omskriv dette i kort 5 fra ' Rørets egenvægt omregnes fra kg/m til kN/m med g = 9,82 m/s², som er tyngdeaccelerationen i Danmark.' til ' Rørets egenvægt omregnes fra kg/m til kN/m med tyngdeaccelerationen g = 9,82 m/s²'. Flyt T3 beregningen til en linje for sig selv med forklaring på hvad det er.«

- Noten lyder nu »Rørets egenvægt omregnes fra kg/m til kN/m med tyngdeaccelerationen g = 9,82 m/s².«
- T₃ har sin egen linje i mellemregningerne: »T₃ = h₁ + d/2 = 1,50 + 2,50/2 = 2,75 m, dybden fra terræn til rørmidten«.

Valgt af Claude og kan ændres:
- T₃-linjen står i listen over mellemregninger lige efter γ_f, før opdriften, fordi T₃ bruges i både O_d (avanceret beregning) og B_d. Noten har fået punktum til sidst som de øvrige noter.

## 31. oktober 2026 — kort 6, når opdriftssikring ikke er nødvendig

Brugerens ønske: »når opdriftssikring ikke er nødvendig, ændr teksten i infoboksen til: 'S₁ ≥ 1,0: opdriftssikring er ikke nødvendig da ballasten er tilstrækkelig til at modvirke opdriften.'. Boksene nedenunder skal bare vise 'Ikke relevant', ligesom der står ved styrkekontrollen, og man skal ikke kunne vælge geonet manuelt eller folde 'mellemregninger' ud«

- Noten lyder »S₁ ≥ 1,0: opdriftssikring er ikke nødvendig da ballasten er tilstrækkelig til at modvirke opdriften.«
- Fliserne »Restopdrift F_op,d«, »Valgt geonet«, »Designtrækstyrke P_d« og »Styrkekontrol P_d/F_op,d« viser »Ikke relevant« uden enhed.
- »Vælg geonet manuelt i 2 lag« og produktlisten er låst, og »Mellemregninger« i kort 6 kan ikke foldes ud.
- Ændringen er kun i visningen. Motoren regner fortsat videre som arket (fund K-12).

Valgt af Claude og kan ændres:
- Formlerne under fliserne for F_op,d og P_d og kravet under styrkekontrollen står fortsat. Noten om medregnet UTS under »Valgt geonet« udgår.
- Når røret ikke påvirkes af opdrift, så S₁ ikke kan regnes, lyder noten »Røret påvirkes ikke af opdrift, så opdriftssikring er ikke nødvendig.« Sætningen »Tallene nedenfor vises til orientering.« er fjernet, fordi kortet ikke længere viser tal.
- Et gemt manuelt netvalg bevares. Mens kortet er låst, vises afkrydsningen tom, og valget vises igen, når sikring bliver nødvendig.

Claude spurgte, om kort 7 også skal vise »Ikke relevant«, når sikring ikke er nødvendig. Brugerens svar: »Nej, lad kort 7 være«.

- Kort 7 er uændret og viser fortsat forankringen nedtonet til orientering.

## 31. oktober 2026 — kort 7, når opdriftssikring ikke er nødvendig

Brugerens ønske: »jo, ret også kort 7 på samme vis når opdriftssikring ikke er relevant«. Det erstatter svaret »Nej, lad kort 7 være« i afsnittet ovenfor.

- Kort 7 har samme note som kort 6, og opsummeringen viser »Ikke relevant«.
- Fliserne »Kraftoverførsel F_bund«, »Kraftoverførsel F_top« og »Kraftoptagelse K« viser »Ikke relevant« uden enhed.
- Rækkerne på de fire løsningskort viser »Ikke relevant«.
- »Mellemregninger for kraftoverførsel« og løsningernes »Mellemregninger« kan ikke foldes ud.
- Ændringen er kun i visningen. Motoren regner fortsat videre som arket (fund K-12).

Valgt af Claude og kan ændres:
- Løsningernes figurer udelades, fordi de er målsat med de beregnede længder. Forskrifterne på løsningskortene står fortsat.
- Noterne med h_bund og h_top under F_bund og F_top udgår. Formlen under K står fortsat.
- Løsningerne med omslag viser fortsat »Omslag kræver, at rørmidten ligger mere end 0,2 m under terræn.«, når omslag ikke er muligt.

## 31. oktober 2026 — rødt mærke ved EJ OK

Brugerens ønske: »du må gerne gør farven for 'ej ok' mere rød, så det er mere tydeligt at der er noget galt«

- Mærket »EJ OK« har nu appens røde farve (`--destructive`, #b42318) i stedet for den brune advarselsfarve. Det gælder fliserne og opdriftskontrollen på løsningskortene.

Valgt af Claude og kan ændres:
- Den hvide tekst på rødt har en kontrast på ca. 6,6:1 og opfylder WCAG AA.
- MSL Dimensionering har intet EJ OK-mærke, så der er intet at overføre dertil.

## 31. oktober 2026 — beskrivelser i mellemregningerne i kort 6

Brugerens ønske: »tilføj lige en kort beskrivelse til de to linjer med mellemregninger for Fop,d og Pd. fx for Fop,d, så der står: 'Fop,d = Od − Bd = 138,23 − 24,82 = 113,41 kN/m, den resterende opdrift som skal optages af geonet' og ligeledes for Pd«

- Linjen for F_op,d slutter med »…, den resterende opdrift som skal optages af geonet«.

Valgt af Claude og kan ændres:
- Linjen for P_d sluttede først med »…, den trækstyrke geonettet kan regnes med i hele levetiden«.

Brugerens rettelse: »ændr den supplerende tekst for Pd fra 'den trækstyrke geonettet kan regnes med i hele levetiden' til 'den regningsmæssige trækstyrke geonettet kan levere.'«

- Linjen for P_d slutter nu med »…, den regningsmæssige trækstyrke geonettet kan levere«. Punktummet er udeladt som i de øvrige linjer med mellemregninger.

## 31. oktober 2026 — forklaringer i mellemregningerne i kort 7

Brugerens ønske: »lav tilsvarende supplerende forklarende tekster til mellemregningslinjerne i kort 8«. Der er intet kort 8, og brugeren bekræftede »hov, min fejl, fortsæt bare«, så ændringen gælder kort 7.

Valgt af Claude og kan ændres. Hver linje slutter med en kort forklaring efter resultatet:
- φ_d: »den regningsmæssige friktionsvinkel for fyldet«.
- F_bund: »kraftoverførslen pr. meter forankringslængde i nettets niveau ved rørmidten«. F_top: »kraftoverførslen pr. meter forankringslængde i det øverste netlags niveau ved omslag«.
- σ′_v,bund og σ′_v,top i avanceret beregning: »den effektive lodrette spænding i nettets niveau ved rørmidten« og »… i det øverste netlags niveau«.
- K: »den kraft forankringen skal dimensioneres for«.
- Beregnet 2L: »den samlede forankringslængde der skal til for at optage K«, ved omslag tilføjet »med omslag«.
- L_geonet: »den anvendte forankringslængde«. Når mindstelængden er bestemmende, står der »…, da mindstelængden er bestemmende« i stedet for »…, mindstelængden er bestemmende«.
- L_a: »den vandrette bredde fra nettets ene ende til den anden«.
- L_geonet,tot: »den samlede længde geonet på tværs af ledningen« (to ledninger: »ledningerne«), ved omslag tilføjet »inkl. omslag og overlæg«.
- Kontrol: »ballast og forankring i forhold til opdriften«.
- To ledninger: σ′_v »den effektive lodrette spænding i nettets niveau mellem ledningerne«, 2 · L_geonet mellem »nettets længde mellem ledningerne, hvor fyldets vægt holder nettet nede« og ved omslag »nettets længde mellem ledningerne, som med omslag«, L_geonet yderst »forankringslængden yderst på hver side, som uden omslag«.

## 31. oktober 2026 — mellemregningerne på løsningskortene i fuld bredde

Brugerens ønske: »du må gerne gør mellemregninger-boksen bredere, så teksten for hver linje ikke ombrydes til 2 linjer. Måske bare lav mellemregninger boksene i fuld bredde? Det skal bare se pænt ud visuelt«

- Mellemregningerne på de fire løsningskort i kort 7 står nu nederst i kortets fulde bredde under figur og tal.
- Ved en skærmbredde på 1440 px og derover brydes ingen linjer. På smallere skærme kan de længste linjer stadig brydes, også i de mellemregninger, der i forvejen har fuld bredde.

Valgt af Claude og kan ændres:
- Figuren og tallene står fortsat side om side over mellemregningerne.

## 31. oktober 2026 — forklaringer i mellemregningerne i kort 5

Brugerens ønske: »Du må i øvrigt gerne tilføje de manglende supplerende forklarende tekster til mellemregningerne i kort 5 også. Men, vis lige forslaget til ændring af tekster først, så jeg lige kan nå at rette noget hvis det er.« Claude viste forslaget i chatten. Brugerens svar: »Ja, indfør det«.

Hver linje slutter med en kort forklaring efter resultatet:
- γ_f: »partialkoefficienten på opdriften«.
- O_d: »den regningsmæssige opdrift pr. meter rør«.
- Formellinjen for B_d nævner leddene i formlens rækkefølge: »fyld over GVS + fyld under GVS − rørets øverste halvdel + rørets egenvægt«. Med GVS mellem rørtop og rørmidte: »fyld over GVS + fyld under GVS − rørets del over GVS − resten af rørets øverste halvdel + rørets egenvægt«. Med GVS under rørmidten: »tørt fyld til rørmidten − rørets øverste halvdel + rørets egenvægt, da GVS ligger under rørmidten«.
- Linjen med tallene for B_d: »den regningsmæssige stabiliserende ballast pr. meter rør«.
- S₁: »(krav ≥ 1,0), ballast i forhold til opdrift uden geonet«.
- I avanceret beregning med GVS mellem rørtop og rørbund: r og a »rørets radius og GVS' højde over rørmidten«, A_tør »den del af rørets tværsnit der ligger over GVS« og A_våd »den del af rørets tværsnit der ligger under GVS«.
- Linjerne for T₃, »O_d = 0, da GVS ligger ved eller under rørbunden …« og »S₁ kan ikke regnes …« er uændrede.

Claude påpegede, at linjerne i avanceret beregning brydes over 2–3 linjer, når arealfiguren står ved siden af mellemregningerne, og spurgte, om figuren skal stå under dem. Brugerens svar: »Nej, lad den stå«.

- Arealfiguren står fortsat til højre for mellemregningerne i kort 5.

## 31. oktober 2026 — noterne i kort 5 i fuld bredde

Brugerens ønske: »kan de sidste 4 linjer i mellemregningerne ikke stå i fuld bredde, så de to med partialkoefficienten og opdriften ikke ombrydes til 2 linjer?«

- De fire noter i mellemregningerne i kort 5 (γ_f, opdriften, ballasten og g) står nu under formler og figur i fuld bredde. Formlerne står fortsat ved siden af arealfiguren i avanceret beregning.
- Ved 1440 px står hver note på én linje.

## 31. oktober 2026 — mellemregninger som tabel (forslag A)

Brugerens ønske: »kan du ikke lave et designforslag, der gør mellemregningerne lidt pænere at se på? altså, lige nu står formler, resultater og forklaringer bare ud i 1. Kan man justere lidt på det, så det er nemmere at overskue? Lav et designforslag. Der må ikke 'gemmes' information i tooltips i mellemregningerne.« Claude viste to skitser: forslag A (tabel) og forslag B (forklaring over formlen) og skrev, at forslaget gælder alle mellemregninger i kort 5–7. Brugerens svar: »jeg vil gerne gå med forslag A« og om de øvrige kort: »det er fint«.

- Alle mellemregninger i kort 5, 6 og 7, også på løsningskortene, står som tabeller med tre kolonner: forklaring, formel med indsatte tal og resultat med enhed.
- Gruppens resultat og kontroller står med lysegrøn baggrund. S₁ og kontrollerne har OK/EJ OK-mærke ved resultatet.
- Kort 5 har grupperne »Opdrift«, »Stabiliserende ballast« og »Kontrol uden geonet«. Noterne står under den gruppe, de forklarer. Ballasten vises led for led med γ_tør,d, γ′_d og E_d, og r og a har hver sin række.
- Kort 6 har grupperne »Restopdrift«, »Reduktionsfaktor (RF)« og »Designtrækstyrke«.
- Intet står kun i tooltips.

Valgt af Claude og kan ændres:
- Forklaringerne fra tidligere i dag er gjort til rækkenavne, fx »Resterende opdrift som skal optages af geonet«. Betingelser står med lille skrift under rækkenavnet, fx »mindstelængden er bestemmende«, »GVS ligger under rørmidten« og »pr. meter forankringslængde«.
- Partialkoefficienten viser »(CC2)« i formlen i stedet for »(konsekvensklasse CC2)«, som i skitsen.
- I kort 6 står P_d efter RF, fordi P_d bruger RF. Summen af RF viser produktet af faktorerne med tal.
- Nye indsatte tal i formlerne: σ′_v for to ledninger, når GVS ligger over rørmidten, og L_a for én ledning med omslag.
- I standardberegningen vises rækken »Fyld over GVS« med 0,00 kN/m, så alle led står.
- Figuren i kort 5 står til højre for gruppen »Opdrift«. Tabellen beholder mindst 640 px, og figuren krymper ned til 300 px, før den flytter ned under tabellen. Ved 1440 px er figuren ca. 330 px bred, ved 1920 px har den fuld størrelse.
- På smalle skærme står rækkenavnet over formel og resultat.
- MSL Dimensionering er ikke ændret. Mellemregningerne dér bør overvejes i samme stil.

## 31. oktober 2026 — resultaterne i kort 5 i samme kolonne

Brugerens ønske: »i dette kort må du gerne rykke resultaterne for stabilisrende ballast og ned, til venstre så de står i samme kolonne som resultater ovenover, for opdriften. Der er ret langt over til højre for at se resultaterne.«

- Når arealfiguren vises i kort 5, står tabellerne for »Opdrift«, »Stabiliserende ballast« og »Kontrol uden geonet« alle i venstre kolonne, så resultaterne flugter. Noterne står fortsat i fuld bredde.

Valgt af Claude og kan ændres:
- Forklaringskolonnen er 220 px i stedet for 240 px, når figuren vises, og formlen for »Resten af rørets øverste halvdel« skrives igen (π · r²/2 − A_tør) · γ′_d, så ingen formler brydes ved 1440 px.
