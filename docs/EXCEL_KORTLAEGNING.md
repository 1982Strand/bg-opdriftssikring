# Kortlægning af regnearket

Kilde: `Opdriftsikring rør - X-GRID 1026 - WIP.xlsx` i den lokale mappe `Data og dokumentation/`. Mappen kommer ikke i Git. Kortlagt 28. oktober 2026 fra formler og gemte værdier i alle celler.

Dokumentet er grundlaget for appens beregningsmotor. Cellehenvisninger gælder arket »Rapporten«, medmindre andet er angivet. π skrives som 3,14 de steder, hvor arket bruger 3,14.

## 1. Arkets opbygning

| Ark | Indhold |
|---|---|
| Rapporten (A4:I470) | Inddata, beregning og rapporttekst i ét ark. Udskrives som 10 sider med Byggros-logo øverst på hver side og sidefoden »Udarbejdet af Bruger ‹dato› Side ‹n›«. |
| Navne tabel (A3:N53) | Produktliste for X-GRID, reduktionsfaktorer og grænseværdier for det automatiske valg af geonet. |
| Ark3 | Tomt. |

Arket har ingen navngivne områder, datavalideringer, betinget formatering eller makroer. Indholdsfortegnelsens sidetal (G17:G28) er skrevet ind som tekst.

## 2. Inddata

Afstande er dybder under terræn i meter med positivt fortegn. Terræn er T1 = 0.

| Celle | Symbol | Betydning | Enhed | Værdi i arket |
|---|---|---|---|---|
| F121 | h₁ | Jorddækning over rørtop | m | 1,5 |
| F122 | T₂ | Grundvandsspejl (GVS) under terræn; 0 = GVS i terræn | m | 0 |
| F123 | d | Udvendig rørdiameter | m | 2,5 |
| D148 | E_rør,k | Rørvægt, karakteristisk | kg/m | 340 |
| C157 | γ_k | Rumvægt, våd (γ_tot) | kN/m³ | 17 |
| C158 | γ_tør,k | Rumvægt, tør | kN/m³ | 16 |
| C159 | φ_k | Friktionsvinkel | ° | 35 |
| C160 | c | Forskydningsstyrke (indgår ikke i beregningen) | kPa | 0 |
| B6, B7 | – | Projektnavn og dato | – | »xx«, 25-08-2026 |
| B122 | T₁ | Terræn; skal være 0, da T₃ i B123 ikke medtager T₁ | m | 0 |

»Udført af« og »Kontrolleret af« (E6, E7) er ledetekster uden tilhørende værdier.

## 3. Faste værdier

| Celle | Symbol | Værdi | Brug |
|---|---|---|---|
| B87 | γ_G,stb | 0,9 | Egenvægt til gunst på fyld og rør |
| E92 | γ_f | 1,1 | Partialkoefficient på opdrift |
| B137 | γ_w | 10 kN/m³ | Rumvægt af vand |
| G145 | g | 9,82 m/s² | Omregning af rørvægt fra kg/m til kN/m |
| F159 | γ_φ | 1,2 | Partialkoefficient på tan φ (skrevet direkte i formlen) |
| G209–G212 | f_kryb, f_m, f_d, f_e | 1,43; 1,05; 1,15; 1,22 | Reduktionsfaktorer for geonet (BBA 16/H253) |
| C287, E287 | μ | 1,0 | Interaktionskoefficient geonet/sand |
| D299 | S₂ | 1,05 | Partialkoefficient for kraftoptagelse |
| C363 | – | 1,2 | Partialkoefficient mellem to ledninger |
| E285 m.fl. | – | 0,2 m | Lodret afstand mellem netlag ved omslag |
| G238 | – | 1,01 | Krav til P_till/F_opdrift |
| G312, C315, C369 | – | 1,0 m | Mindste forankring pr. side uden omslag |
| C366 | – | 0,5 m | Mindste afstand mellem to ledninger uden omslag |
| C407, G404 | – | 0,6 m / 1,2 m | Mindste forankring pr. side / i alt med omslag |

Tabel 2.1 (A83:E88) viser også 1,1 (egenvægt til ugunst), 1,5 (variabel last) og 1,8 (c_u). De indgår ikke i nogen formel.

### Navne tabel

| | 35 | 55 | 80 | 110 | 150 |
|---|---|---|---|---|---|
| Produktnavn (C7:C11) | 35 | 55 | 80 | 110 | 150 |
| UTS i grænsetabel (G22:K22) | 35 | 55 | 80 | 110 | **200** |
| Reduktionsfaktorer (G24:K27) | 1,43 · 1,05 · 1,15 · 1,22 for alle | | | | |
| Grænse = UTS/RF (G44:K44), kN/m | 16,61 | 26,11 | 37,98 | 52,22 | **78,9 (indtastet)** |

Rapporten bruger kun grænseværdierne og produktnavnene herfra. Reduktionsfaktorerne i G209:G212 er skrevet ind igen i »Rapporten«.

## 4. Beregningsgang

Følgende symboler bruges: d = F123, h₁ = F121, T₂ = F122 og T₃ = h₁ + d/2 (rørmidtens dybde, B123).

### 4.1 Regningsmæssige parametre (afsnit 4)

| Celle | Størrelse | Formel |
|---|---|---|
| F157 | γ_d | γ_k · 0,9 |
| F158 | γ_tør,d | γ_tør,k · 0,9 |
| F159 | φ_d | arctan(tan φ_k / 1,2) |
| C286 | γ′_d | γ_d − γ_w (effektiv rumvægt under vand) |
| D149 | E_rør,d | E_rør,k · 0,9 (kg/m) |

### 4.2 Opdrift, ballast og S₁ (afsnit 3–5)

| Celle | Størrelse | Formel |
|---|---|---|
| G133 | O | 3,14/4 · d² · γ_w · γ_f |
| G145 | B | T₂ · d · γ_tør,d + (T₃ − T₂) · d · γ′_d − (3,14/4 · d² · γ′_d)/2 + E_rør,d · 9,82/1000 |
| E167 | S₁ | B/O; »OK« hvis S₁ > 1 (H167) |
| A169:A170 | Konklusion | Tekst om, at opdriftssikring er nødvendig, hvis S₁ < 1 |
| G177 | F_opdrift | O − B |

Ballasten er fyldet i en lodret stribe med rørets bredde fra terræn til rørmidte. Fra den trækkes den øverste halvdel af røret. Fyld over GVS regnes med γ_tør,d og fyld under GVS med γ′_d.

### 4.3 Geonet (afsnit 6–7)

| Celle | Størrelse | Formel |
|---|---|---|
| G207 | UTS | Mindste UTS i {35, 55, 80, 110, 150}, hvor F_opdrift < grænsen i Navne tabel G44:K44. Ellers teksten »kontakt leverandør for råd«. |
| G199 | Produkt | Produktnavn til den valgte UTS |
| G213 | RF | f_kryb · f_m · f_d · f_e = 2,1066045 |
| G229 | P_till | UTS / RF |
| E238 | Udnyttelse | P_till / F_opdrift; »OK« hvis > 1,01 (H238) |

### 4.4 Kraftoverførsel i sand (afsnit 8)

| Celle | Størrelse | Formel |
|---|---|---|
| C285 | h_bund | T₃ (geonettet ligger i niveau med rørmidten) |
| E285 | h_top | T₃ − 0,2 |
| C289 | F_bund | h_bund · γ′_d · μ · tan φ_d |
| E289 | F_top | h_top · γ′_d · μ · tan φ_d |
| F299 | K | F_opdrift · S₂ (kraftoptagelse) |

Forankringen regnes altid med γ′_d, uanset hvor GVS ligger. Arket begrunder det med, at nettet antages forankret i våd jord.

### 4.5 Løsning A: ét rør uden omslag (afsnit 9)

| Celle | Størrelse | Formel |
|---|---|---|
| G312 | 2L (vist) | max(1; K / F_bund) |
| C315 | L | max(1; G312/2) pr. side |
| B319 | L_a | 2L + d |
| B320 | L_geonet,tot | 2L + 3,14 · d/2 |
| E333 | Kontrol | (B + F_bund · 2L) / O; »OK« hvis > 1 |

### 4.6 Løsning B: to rør uden omslag (afsnit 10)

| Celle | Størrelse | Formel |
|---|---|---|
| E363 | σ′_v | T₂ · γ_tør,d + (T₃ − T₂) · γ′_d |
| G363 | 2L_mellem (beregnet) | 0,5 · F_opdrift · 2 · 1,2 / σ′_v |
| C366 | 2L_mellem | max(0,5; G363) |
| C369 | L yderst | Som løsning A (max(1; G312/2)) |
| B384 | L_a | 2L + 2L_mellem + 2d |
| B385 | L_geonet,tot | 2L + 2L_mellem + 3,14 · d |

Afsnittet har ingen opdriftskontrol.

### 4.7 Løsning C: ét rør med omslag (afsnit 11)

| Celle | Størrelse | Formel |
|---|---|---|
| G404 | 2L | x = K / (F_bund + F_top/2) + 0,2 · 2; 2L = 1,2 hvis x < 1, ellers x |
| C407 | L | max(0,6; G404/2) pr. side |
| B411 | L_a | 2L + d |
| B412 | L_geonet,tot | 4 · (L + 0,4) + 3,14 · d/2 |
| E427 | Kontrol | (B + (F_bund + F_top)/2 · L · 4) / O; »OK« hvis > 1 |

### 4.8 Løsning D: to rør med omslag (afsnit 12)

| Celle | Størrelse | Formel |
|---|---|---|
| C455 | L | = L fra løsning C |
| C452 | 2L_mellem | 2 · L |
| B469 | L_a | 2 · (2L + d) |
| B470 | L_geonet,tot | 4 · (2L + 0,4) + 3,14 · d |

Afsnittet har ingen egen beregning og ingen opdriftskontrol.

### 4.9 Forudsætninger for to rør (A346:A359)

Den indtastede diameter skal være den største, og rørvægten skal være den mindste af ledningerne. Forankringslængden skal overholdes ved hver ledning. »2·L_geonet er et opdriftsproblem og ikke et forankringsproblem.«

## 5. Kontrolværdier

### Case 1: arkets gemte værdier

Inddata: d = 2,5 m, h₁ = 1,5 m, GVS i terræn, E_rør,k = 340 kg/m, γ = 17, γ_tør = 16, φ_k = 35°.

| Størrelse | Værdi | Størrelse | Værdi |
|---|---|---|---|
| T₃ | 2,75 | φ_d | 30,263830° |
| O | 53,96875 | B | 26,4408575 |
| S₁ | 0,489929 (EJ OK) | F_opdrift | 27,5278925 |
| UTS | 80 | P_till | 37,975804 |
| P_till/F_opdrift | 1,379539 (OK) | F_bund / F_top | 8,504604 / 7,886087 |
| K | 28,904287 | | |
| A: 2L / L / L_a / L_tot | 3,398663 / 1,699332 / 5,898663 / 7,323663 | A: kontrol | 1,025504 (OK) |
| B: σ′_v / 2L_mellem | 14,575 / 2,266447 | B: L_a / L_tot | 10,665111 / 13,515111 |
| C: 2L / L / L_a / L_tot | 2,722068 / 1,361034 / 5,222068 / 10,969136 | C: kontrol | 1,316640 (OK) |
| D: 2L_mellem / L_a / L_tot | 2,722068 / 10,444136 / 20,338273 | | |

### Case 2: udskrevet sag med Ø4000 mm (PDF i den lokale mappe)

Inddata: d = 4,0 m, h₁ = 0,6 m (T₃ = 2,6 m), GVS i terræn, E_rør,k = 340 kg/m og samme fyld som case 1. Geonettet er overstyret med hånden til »150 (2 lag)«, dvs. UTS = 300 kN/m. Uden overstyringen giver arket »kontakt leverandør for råd«, og P_till bliver en fejlværdi.

O = 138,16; B = 24,84; S₁ = 0,18; F_opdrift = 113,32; P_till = 142,41; udnyttelse 1,26; F_bund = 8,04; F_top = 7,42; K = 118,99.
A: 2L = 14,80; L = 7,40; L_a = 18,80; L_tot = 21,08; kontrol 1,04.
B: 2L_mellem = 9,87; L_a = 32,67; L_tot = 37,23.
C: 2L = 10,52; L = 5,26; L_a = 14,52; L_tot = 28,93; kontrol 1,36.
D: 2L_mellem = 10,52; L_a = 29,05; L_tot = 56,26.

Alle værdier er genberegnet med formlerne ovenfor og stemmer med udskriften på 2 decimaler.

## 6. Rapporttekster

Teksterne i arket bliver appens standardtekster. Ordlyden overføres fra cellerne, og stavefejl rettes.

| Afsnit | Celler | Indhold |
|---|---|---|
| Forside | A6:D11, B15:G28 | Projektoplysninger, projektbeskrivelse (d, jorddækning, GVS) og indholdsfortegnelse |
| 1. Betingelser | A39:A57 | Kundens oplysninger, 120 års levetid, < 35 mm fyld, pH 4,1–8,9, BBA, EN 1997-1 DK NA 2021, middel konsekvensklasse |
| Projekteringsansvar | A59:A69 | Ansvarsfraskrivelse og begrænsning til 5 × honoraret |
| 2. Partialkoefficienter | A79:E93 | Tabel 2.1 og γ_f |
| 3. Den aktuelle situation | A97:G150 | Forklaring af h₁, T₁–T₃, figur, opdrift, ballast og rørvægt |
| 4. Geotekniske parametre | A153:A170 | Tabel 4.1, krav om friktionsfyld, S₁ og konklusion |
| 5. Nødvendig trækstyrke | A172:A191 | F_opdrift og noten om tovkraft og trissevirkning |
| 6. Designtrækstyrke | A199:H229 | X-GRID, BBA 16/H253 og reduktionsfaktorer |
| 7. Eftervisning | A232:D241 | Udrulning på tværs af ledningen i ét lag og valgt geonet |
| 8. Kraftoverførsel | A251:A300 | Formel, symboler, figurer, OBS om omslag (0,2 m) og S₂ |
| 9.–12. Løsninger | A307:C470 | Mindstelængder, længder, kontrol og forudsætninger for to rør |

## 7. Figurer i arket

| Billede | Placering | Viser |
|---|---|---|
| image4 | A100 | Tværsnit med T₁, T₂/GVS, T₃, h₁, h₂, d og B |
| image3 | A263 | Figur 5.1: uden omslag, h_bund, L_geonet, L_a, B_a |
| image6 | D263 | Figur 5.2: med omslag, h_top |
| image2 | D318 | Uden omslag (afsnit 9) |
| image7 | A372 | To rør uden omslag (afsnit 10) |
| image5 | D411 | Med omslag (afsnit 11) |
| image8 | A458 | To rør med omslag, med fælles omslag i midten (afsnit 12) |
| image1 | Hver side | Byggros-logo |

## 8. Supplerende grundlag

- **DANVA-vejledning nr. 54 (2006), s. 62–64.** Metoden blev beskrevet her første gang, og arkets formler for O, B og F_opdrift kommer herfra. Den gamle model krævede S₂ ≥ 1,5 på forankring og S₃ ≥ 1,3 på den samlede sikkerhed. Transskriptionen har tre uafklarede formeludtryk (K1–K3).
- **DS/EN 1997-1 DK NA:2021, tabel A.4-1 NA (UPL med trækelementer).** Tabellen angiver γ_G;dst = 1,1·K_FI, γ_G;stb = 0,9 og γ_φ = 1,2. Ved middel konsekvensklasse (K_FI = 1,0) svarer det til arkets γ_f = 1,1 og 0,9. Tabel A.4-2 NA (1,0/1,05) gælder ikke, når der indgår trækelementer. Ifølge A.4(5)P dimensioneres trækelementet for den kraft, der mangler for ligevægt, hvilket svarer til F_opdrift = O − B.
- **Firmaets nuværende praksis (e-mail, oktober 2026).** Sikkerheden på trækstyrke er reduceret fra 1,5 til 1,0 og på forankringslængde fra 1,3 til 1,05 (S₂). Begge er selvvalgte og ikke normhjemlede. Reduktionsfaktorerne kommer fra BBA-certifikatet.
- **Tovkraft.** Tovkraften er 50 % af opdriften på hver side af røret, men hele F_opdrift bruges ved valg af net og forankring. Det svarer til en faktor 2 eller 1/cos 60°. Det armerede fyld opfattes som en semirigid blok. Noten står i A182:A191. Spørgsmålet er rejst af en statiker, og en forsøgsopstilling er nævnt.
- **Udførelse.** Den lodrette afstand mellem netlagene ved omslag er i praksis 0,2–0,4 m, så sandet kan komprimeres.

## 9. Fund

Uoverensstemmelser og forhold, der kan ændres senere, er beskrevet med eksempler og muligheder i [FUND.md](FUND.md), nr. K-01 til K-19. Første version af appen regner præcis som arket.
