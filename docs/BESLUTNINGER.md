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
