# Fund i regnearket

Fundene er gjort under kortlægningen af regnearket, se [EXCEL_KORTLAEGNING.md](EXCEL_KORTLAEGNING.md). Første version af appen regner præcis som arket (beslutning 28. oktober 2026). Hvert fund beskrives her med eksempel og muligheder, så der kan tages stilling til en ændring senere. En ændring kræver en særskilt beslutning i [BESLUTNINGER.md](BESLUTNINGER.md).

Eksemplerne er regnet med arkets formler. Hvor andet ikke står, er fyldet γ = 17 kN/m³, γ_tør = 16 kN/m³, φ_k = 35°, og rørvægten er 340 kg/m.

- **Case 1:** d = 2,5 m, h₁ = 1,5 m, GVS i terræn (arkets gemte værdier).
- **Case 2:** d = 4,0 m, h₁ = 0,6 m, GVS i terræn, geonet overstyret til 2 × X-GRID 150 (udskrevet sag).

## Oversigt

| Nr. | Fund | Påvirker | Første version |
|---|---|---|---|
| K-01 | Teksten om γ_f passer ikke med værdien | Tekst | 1,1 · K_FI, teksten viser værdien |
| K-02 | Forkert grænse for X-GRID 150 | Valg af geonet | Afgjort: grænsen er UTS/RF (K-21) |
| K-03 | Netvalg og kontrol bruger forskellige krav | Valg af geonet | Som arket |
| K-04 | Kun ét lag geonet | Valg af geonet | Afgjort: som arket, 2 lag manuelt |
| K-05 | GVS under rørtoppen | Opdrift og ballast | Afgjort: som arket, c) som avanceret beregning |
| K-06 | π = 3,14 | Alle tal (0,05 %) | Afgjort: π |
| K-07 | g = 9,82 for rørvægt | Ballast (lille) | Afgjort: som arket |
| K-08 | Omslag: kontrol passer ikke til dimensionering | Kontrol | Som arket |
| K-09 | Omslag: tillæg på 1,2 m i netlængden | Netlængde | Som arket |
| K-10 | To rør: ingen kontrol, forskellig mellemlængde | Længder, kontrol | Som arket |
| K-11 | Kontrollen uden omslag kan ikke give EJ OK | Kontrol | Som arket |
| K-12 | Arket regner videre, når sikring ikke er nødvendig | Rapport | Som arket |
| K-13 | Den viste 2L er mindre end den anvendte | Visning | Som arket |
| K-14 | S₂ og faktoren mellem rør er faste | Længder | Som arket |
| K-15 | Forældet tekst og dobbelte data i Navne tabel | Data | Data ét sted |
| K-16 | Faste sidetal og »Udarbejdet af Bruger« | Rapport | Løses i appen |
| K-17 | Friktion på én side af nettet | Længder | Som arket |
| K-18 | T₁ kan ændres, men indgår ikke i T₃ | Geometri | T₁ = 0 fast |
| K-19 | Forankring regnes altid som under vand | Længder | Som arket |
| K-20 | h₁ og h₂ har tre forskellige betydninger | Tekst | h₁ = jorddækning |
| K-21 | Produktlisten mangler X-GRID 130 og 200 | Valg af geonet | Afgjort: 130 og 200 tilføjet |
| K-22 | Reduktionsfaktorerne pr. net bruges ikke | Data, P_till | Afgjort: ét fælles sæt |

Når et fund er aktivt for den aktuelle beregning, vises en oplysning under Kontrolpunkter på beregningssiden. Det gælder K-03, K-05, K-12 og K-13. Beregningen påvirkes ikke, og kontrolpunkterne kommer ikke med i rapporten.

---

## K-01 Teksten om γ_f passer ikke med værdien

**Arket.** A92 siger »sikkerhedskoefficient mod opdrift γ_f = 1,05«, men E92 regner med 1,1. Udskriften fra august siger 1,0 med samme værdi 1,1.

**Grundlag.** DS/EN 1997-1 DK NA:2021, tabel A.4-1 NA, gælder UPL med trækelementer. Den giver γ_G;dst = 1,1 · K_FI, altså 1,1 i middel konsekvensklasse. Tabel A.4-2 NA (1,0/1,05) gælder kun uden trækelementer.

**Eksempel.** Case 1 med γ_f = 1,05 i stedet for 1,1:

| | γ_f = 1,1 (arket) | γ_f = 1,05 |
|---|---|---|
| O | 53,97 kN/m | 51,52 kN/m |
| S₁ | 0,49 | 0,51 |
| F_opdrift | 27,53 kN/m | 25,07 kN/m |

**Afgjort.** γ_f = 1,1 · K_FI følger konsekvensklassen, som vælges i kort 2 Partialkoefficienter på beregningssiden (beslutning 28. oktober 2026). CC1 og CC2 giver arkets 1,1, CC3 giver 1,21. Rapportteksten viser den anvendte værdi, så tekst og tal stemmer.

## K-02 Forkert grænse for X-GRID 150

**Arket.** Grænsen for at vælge X-GRID 150 er indtastet som 78,9 kN/m (Navne tabel K44). Med RF = 2,1066 holder 150 kN/m kun til P_till = 71,20 kN/m. Hver gang F_opdrift ligger mellem 71,20 og 78,9 kN/m, vælges X-GRID 150, og afsnit 7 viser EJ OK.

**Eksempel.** h₁ = 1,0 m, GVS i terræn:

| d | F_opdrift | Valgt | P_till/F_opdrift | Arket |
|---|---|---|---|---|
| 3,37 m | 70,73 | X-GRID 150 | 1,007 | EJ OK (K-03) |
| 3,40 m | 72,21 | X-GRID 150 | 0,986 | EJ OK |
| 3,50 m | 77,24 | X-GRID 150 | 0,922 | EJ OK |
| 3,54 m | 79,30 | Intet | – | »kontakt leverandør« |

Grænsetabellens UTS for det største produkt er 200 (K22), men produktlisten har 150. Med 200 kN/m ville grænsen være 94,94. 78,9 svarer til ingen af dem.

**Muligheder.**
- a) Grænsen sættes til P_till for X-GRID 150 (71,20). Derover gælder K-04.
- b) Findes X-GRID 200, tilføjes det som produkt med grænsen 94,94.
- c) Uændret.

**Afgjort 28. oktober 2026.** Grænsen 78,9 er udgået. Valggrænsen er UTS/RF for alle produkter, og X-GRID 200 er tilføjet (K-21). F_opdrift mellem 71,20 og 94,00 kN/m giver nu X-GRID 200 med OK. Kontrolpunktet K-02 findes ikke længere.

## K-03 Netvalg og kontrol bruger forskellige krav

**Arket.** Nettet vælges, når F_opdrift < P_till (G207). Kontrollen kræver P_till/F_opdrift > 1,01 (G238), mens teksten i E236 siger »> 1,0«. I et smalt bånd under hver grænse vælges et net, der giver EJ OK, selv om det næste net ville holde.

| Produkt | Bånd for F_opdrift med EJ OK |
|---|---|
| X-GRID 35 | 16,45–16,61 kN/m |
| X-GRID 55 | 25,85–26,11 kN/m |
| X-GRID 80 | 37,60–37,98 kN/m |
| X-GRID 110 | 51,70–52,22 kN/m |
| X-GRID 130 | 61,10–61,71 kN/m (tilføjet, K-21) |
| X-GRID 150 | 70,50–71,20 kN/m |
| X-GRID 200 | 94,00–94,94 kN/m (tilføjet, K-21) |

**Eksempel.** d = 2,60 m, h₁ = 1,0 m, GVS i terræn giver F_opdrift = 37,74 kN/m. Arket vælger X-GRID 80 med P_till = 37,98 og P_till/F_opdrift = 1,006, altså EJ OK. X-GRID 110 ville give 1,39.

**Muligheder.**
- a) Nettet vælges med samme krav som kontrollen (> 1,01).
- b) Kontrollen ændres til ≥ 1,0 som teksten, og nettet vælges ved F_opdrift ≤ P_till.
- c) Uændret.

**Første version.** Som arket. Kontrolpunkt, når P_till/F_opdrift ligger i båndet.

## K-04 Kun ét lag geonet

**Arket.** Det automatiske valg dækker kun ét lag. Over 78,9 kN/m skrives »kontakt leverandør for råd«, og P_till og kontrollen i afsnit 7 bliver fejlværdier. Afsnit 8–12 regnes stadig, fordi de kun afhænger af F_opdrift. Case 2 er løst ved at skrive »150 (2 lag)« og UTS = 300 ind med hånden. Teksten i afsnit 7 siger »udrulning … i et lag«.

**Eksempel.** Case 2 med F_opdrift = 113,32 kN/m:

| Kombination | UTS i alt | P_till | P_till/F | Holder? |
|---|---|---|---|---|
| 1 × 150 | 150 | 71,20 | 0,63 | Nej |
| 2 × 110 | 220 | 104,43 | 0,92 | Nej |
| 3 × 80 | 240 | 113,93 | 1,005 | Nej (kravet er 1,01) |
| 150 + 110 | 260 | 123,42 | 1,09 | Ja |
| 2 × 150 | 300 | 142,41 | 1,26 | Ja (valgt i sagen) |
| 3 × 110 | 330 | 156,65 | 1,38 | Ja |

Forankringslængderne afhænger af F_opdrift og ikke af nettet, så antallet af lag ændrer kun valget af net.

**Muligheder.**
- a) Automatisk valg af samme produkt i 2 lag, når ét lag ikke er nok (her 2 × 150). Flere end 2 lag udnyttes ikke (beslutning 28. oktober 2026).
- b) Automatisk valg med blandede produkter og laveste samlede UTS (her 150 + 110).
- c) Uændret, med manuelt valg.
- Teksten om ét lag tilpasses ved a og b.

**Afgjort 28. oktober 2026.** Det automatiske valg forbliver som i arket med ét lag og »kontakt leverandør for råd« over grænsen. Mulighed a og b er fravalgt. Ved manuelt valg vælges produktet, og der regnes altid med 2 lag, sådan som case 2 er regnet i arket. Overstyringen vises i rapporten.

## K-05 GVS under rørtoppen

**Arket.** Opdriften regnes altid for et helt neddykket rør. Ballastformlen forudsætter, at GVS ligger mellem terræn og rørmidte. Indtastningen kontrolleres ikke.

**Eksempel.** d = 2,5 m og h₁ = 1,5 m. Rørtoppen ligger i 1,5 m, midten i 2,75 m og bunden i 4,0 m.

| GVS-dybde | Placering | Arket O / B / S₁ | Fysisk korrekt O / B / S₁ |
|---|---|---|---|
| 0 | I terræn | 53,97 / 26,44 / 0,49 | 54,00 / 26,43 / 0,49 |
| 1,0 m | Over rørtop | 53,97 / 49,19 / 0,91 | 54,00 / 49,18 / 0,91 |
| 2,0 m | Mellem top og midte | 53,97 / 71,94 / 1,33 | 46,31 / 65,57 / 1,42 |
| 3,5 m | Under midte | 53,97 / 106,07 / 1,97 | 7,69 / 66,66 / 8,67 |
| 4,5 m | Under bund | 53,97 / 128,82 / 2,39 | 0 / 66,66 / ingen opdrift |

»Fysisk korrekt« er en skitse. Opdriften regnes af den del af røret, der står under vand, og fyld over GVS regnes med tør rumvægt.

- Ned til rørtoppen regner arket rigtigt; forskellen skyldes kun π (K-06).
- Mellem rørtop og rørmidte er arket på den sikre side.
- Under rørmidten tæller ballasten jord under rørmidten med, og opdriften regnes fuld for et rør, der står tørt. Konklusionen bliver rigtig i eksemplet, men tallene i rapporten er forkerte.

**Muligheder.**
- a) GVS tillades kun ned til rørtoppen, hvor arket er præcist.
- b) GVS tillades ned til rørmidten med en note om, at beregningen er på den sikre side.
- c) Beregningen udvides til alle placeringer af GVS (sammenhæng med K-19).

**Første version.** Som arket uden afvisning. Kontrolpunkt, når GVS ligger under rørtoppen.

**Afgjort 29. oktober 2026.** Standardberegningen regner som arket og viser kontrolpunktet. Mulighed c er indført som en særskilt avanceret beregning, der kun gælder, når »Avanceret beregning« er afkrydset. Formler, eksempler og beslutninger står i [FORSLAG_K-05.md](FORSLAG_K-05.md).

## K-06 π = 3,14

**Arket.** O, B og L_geonet,tot regnes med 3,14. Kun tan bruger PI().

**Eksempel.** O bliver 0,05 % for lille: 53,97 i stedet for 54,00 i case 1 og 138,16 i stedet for 138,23 i case 2. Leddet πd/2 i netlængden giver 3,925 i stedet for 3,927 m ved d = 2,5 m.

**Muligheder.** a) Der regnes med π. b) Uændret.

**Afgjort.** Mulighed a): appen regner med π (beslutning 29. oktober 2026). Med 3,14 lå arket en anelse på den usikre side, fordi O blev lidt for lille og B lidt for stor. Kontrollen mod arket regner fortsat med 3,14. I de 42 cases skifter hverken netvalg eller OK/EJ OK.

## K-07 g = 9,82 for rørvægt

**Arket.** Rørvægten omregnes fra kg/m til kN/m med 9,82, mens vand regnes med γ_w = 10 kN/m³.

**Eksempel.** 340 · 0,9 = 306 kg/m giver 3,005 kN/m. Med 9,81 bliver det 3,002 kN/m, og med 10 bliver det 3,060 kN/m.

**Muligheder.** a) 9,81. b) 10, som vandet. c) Uændret.

**Afgjort.** Mulighed c): g = 9,82 bevares (beslutning 29. oktober 2026). Det er tyngdeaccelerationen i Danmark, ca. 9,816 m/s², og ikke en fejl. Mellemregningerne forklarer det. 10 ville give mere ballast og dermed ligge på den usikre side.

## K-08 Omslag: kontrollen passer ikke til dimensioneringen

**Arket.** Løsning C dimensioneres med F_bund + F_top/2 (G404): toplaget regnes med halv kraft. Kontrollen (A427) bruger (F_bund + F_top)/2 · 4L = 2L · (F_bund + F_top), dvs. toplaget med fuld kraft. Desuden indgår de lodrette 2 · 0,2 m i 2L og tælles derfor med som forankring i kontrollen. Formelteksten i E402 nævner F_opdrift, men formlen bruger K = F_opdrift · S₂.

**Eksempel.**

| | Kontrol i arket | Kontrol med dimensioneringens antagelse |
|---|---|---|
| Case 1 | 1,32 | 1,03 |
| Case 2 | 1,36 | 1,04 |

Regnes dimensioneringen omvendt med fuld F_top, falder L i case 1 fra 1,36 m til 1,08 m pr. side.

**Muligheder.**
- a) Kontrollen bruger samme antagelse som dimensioneringen.
- b) Dimensioneringen bruger fuld F_top. Det giver kortere net og kræver faglig begrundelse.
- c) Uændret.
- Teksten i E402 rettes til K under alle muligheder.

**Første version.** Som arket.

## K-09 Omslag: tillæg på 1,2 m i netlængden

**Arket.** Løsning C: L_geonet,tot = 4 · (L + 0,4) + πd/2 = 4L + 1,6 + πd/2. To sider med bundlag, 0,2 m op og toplag giver geometrisk 4L + 0,4 + πd/2. Løsning D: 4 · (2L + 0,4) + πd = 8L + 1,6 + πd, mens fire sider giver 8L + 0,8 + πd. D er heller ikke det dobbelte af C.

**Eksempel.**

| | Arket | Geometrisk |
|---|---|---|
| Case 1, C | 10,97 m | 9,77 m |
| Case 1, D | 20,34 m | 19,54 m |
| Case 2, C | 28,93 m | 27,73 m |
| Case 2, D | 56,26 m | 55,46 m |

Strimlerne til sprinklertanken i e-mailene (14,86 m og 18,99 m) følger arkets formel. Tillægget er altså brugt i praksis og kan være ment som overlæg.

**Muligheder.**
- a) Tillægget bevares og navngives i rapporten, fx »inkl. 1,2 m til omslag og overlæg«.
- b) Den geometriske længde bruges.
- c) Tillægget bliver en indstilling.

**Første version.** Som arket.

## K-10 To rør: ingen kontrol og forskellig mellemlængde

**Arket.** Løsning B og D har ingen opdriftskontrol. Uden omslag (B) regnes afstanden mellem rørene af F_opdrift · 1,2 / σ′_v uden tan φ. Med omslag (D) er afstanden blot 2 · L fra løsning C. D har ingen egen beregning.

**Eksempel.**

| 2L_mellem | Uden omslag (B) | Med omslag (D) |
|---|---|---|
| Case 1 | 2,27 m | 2,72 m |
| Case 2 | 9,87 m | 10,52 m |

**Muligheder.**
- a) To rør får egen beregning og kontrol (kræver en model for to rør).
- b) Uændret.

**Første version.** Som arket.

## K-11 Kontrollen uden omslag kan ikke give EJ OK

**Arket.** Kontrollen i løsning A er (B + F_bund · 2L)/O. Når forankringen er bestemt af kraften, er F_bund · 2L = K = 1,05 · (O − B). Kontrollen bliver da 1 + 0,05 · (1 − S₁) og er altid over 1, når S₁ < 1. Den kan kun give et andet resultat, når mindstelængden på 1,0 m er bestemmende, og så bliver den højere.

**Eksempel.** Case 1: (26,44 + 28,90)/53,97 = 1,026. Case 2: 1,041. Med GVS i 1,0 m (case 1-geometri) styrer mindstelængden, og kontrollen giver 1,23.

**Muligheder.**
- a) Kontrollen erstattes af en, der kan falde ud, fx den samlede sikkerhed S₃ = B_a/O fra DANVA 54 eller forankringskapaciteten mod K.
- b) Kontrollen bevares som dokumentation.
- c) Kontrollen udgår.

**Første version.** Som arket.

## K-12 Arket regner videre, når sikring ikke er nødvendig

**Arket.** Ved S₁ ≥ 1 skriver arket, at opdriftssikring ikke er nødvendig, men regner afsnit 5–12 videre med negativ F_opdrift. Ved S₁ = 1,00 præcist står der EJ OK (kravet er > 1), mens konklusionen siger »ikke nødvendig« (kravet er < 1).

**Eksempel.** Case 1-geometri med GVS i 1,5 m (ved rørtoppen):
- S₁ = 1,12, og konklusionen er »ikke nødvendig«.
- F_opdrift = −6,60 kN/m.
- X-GRID 35 vælges, og P_till/F = −2,52, så afsnit 7 viser EJ OK.
- Løsning A giver 1,00 m pr. side, og kontrollen giver 1,44.

Rapporten viser altså EJ OK for et net, der ikke er brug for.

**Muligheder.**
- a) Ved S₁ ≥ 1 stopper beregningen efter konklusionen, og afsnittene om geonet og forankring udgår af rapporten.
- b) Uændret.

**Første version.** Tallene er som i arket. På beregningssiden tones kortene om geonet og forankring ned, og der vises et kontrolpunkt. Rapporten følger arket.

## K-13 Den viste 2L er mindre end den anvendte

**Arket.** Løsning A viser 2L = max(1; K/F_bund) i G312, men bruger L = max(1; G312/2) pr. side. Når K/F_bund < 2, er den viste værdi mindre end 2 · L.

**Eksempel.** Case 1-geometri med GVS i 1,0 m: K/F_bund = 0,59. Arket viser »2 × L_geonet = 1,00 m i alt«, men regner med 1,00 m pr. side, altså 2,00 m i alt (L_a = 4,50 m = 2 · 1,0 + 2,5).

**Muligheder.** a) Der vises 2 · L. b) Uændret.

**Første version.** Som arket. Kontrolpunkt, når de to værdier er forskellige.

## K-14 S₂ og faktoren mellem rør er faste

**Arket.** S₂ = 1,05 er skrevet ind (D299), men noten i A300 siger 1,05–1,2 »afhængig af rørdimension«. Faktoren 1,2 mellem to rør er også skrevet direkte i formlen (C363).

**Eksempel.** Case 1 med S₂ = 1,2: K stiger fra 28,90 til 33,03 kN/m. L i løsning A stiger fra 1,70 til 1,94 m, og L i løsning C fra 1,36 til 1,53 m.

**Muligheder.**
- a) S₂ bliver et felt med standarden 1,05, eventuelt med en regel efter diameter.
- b) Faktoren mellem rør bliver en indstilling.
- c) Uændret.

**Første version.** Som arket.

## K-15 Forældet tekst og dobbelte data i Navne tabel

**Arket.** Navne tabel nævner Fortrac og BBA 01/R125, mens rapporten nævner X-GRID og BBA 16/H253. Grænsetabellen har UTS 200, mens produktlisten har 150. Reduktionsfaktorerne står både i Navne tabel og i Rapporten (G209:G212). Ud over K-02 har det ingen virkning på beregningen.

**Datablad.** Ja. Databladet for X-GRID (dokument 1221-2/100) har X-GRID 200 og også X-GRID 130, se K-21. Grænsen 78,9 passer hverken til 150 (P_till = 71,20) eller 200 (P_till = 94,94). 78,9 · RF = 166,2 kN/m og 78,9 · 1,43 = 112,8 kN/m svarer heller ikke til noget produkt.

**Første version.** Produktdata står ét sted i appen med arkets værdier, inklusive grænsen 78,9. Geonet-siden viser både P_till og arkets grænse med henvisning til K-02.

## K-16 Faste sidetal og »Udarbejdet af Bruger«

**Arket.** Indholdsfortegnelsens sidetal er skrevet ind som tekst og passer ikke med udskriften fra august. Sidefoden siger »Udarbejdet af Bruger«.

**Første version.** Appen danner indholdsfortegnelsen med rigtige sidetal og henter sagsbehandleren fra medarbejderkartoteket. Beregningen påvirkes ikke, så der er ingen beslutning at tage.

## K-17 Friktion på én side af nettet

**Arket.** Kraftoverførslen er F = h · γ′_d · μ · tan φ_d pr. m net, dvs. friktion på én flade. Formlen er den samme som i DANVA 54. I mange metoder til udtræk af geonet, fx BS 8006, regnes friktionen på begge flader.

**Eksempel.**

| | Én flade (arket) | Begge flader |
|---|---|---|
| Case 1, L pr. side | 1,70 m | 1,00 m (mindstelængden styrer) |
| Case 2, L pr. side | 7,40 m | 3,70 m |
| Case 2, L_geonet,tot | 21,08 m | 13,68 m |

**Muligheder.**
- a) Begge flader regnes med, eventuelt med en anden μ. Det kræver faglig stillingtagen og kan indgå i den forsøgsopstilling, der er nævnt i e-mailene.
- b) Uændret, da det er på den sikre side og følger DANVA.

**Første version.** Som arket.

## K-18 T₁ kan ændres, men indgår ikke i T₃

**Arket.** T₁ (B122) er en værdi, der kan ændres. Ballasten bruger T₂ − T₁, men T₃ = h₁ + d/2 medtager ikke T₁. Med T₁ ≠ 0 bliver geometrien inkonsistent. Teksten siger »T₁ = 0 – som udgangspunkt«.

**Muligheder.**
- a) Inddata som koter (fx DVR90), der omregnes til dybder.
- b) Uændret med T₁ = 0.

**Første version.** T₁ = 0 fast, og alle dybder måles fra terræn. Det svarer til arket med udgangspunktet T₁ = 0.

## K-19 Forankring regnes altid som under vand

**Arket.** F_bund og F_top regnes med γ′_d = γ_d − γ_w, uanset hvor GVS ligger. Arket begrunder det med, at nettet antages forankret i våd jord. Det er på den sikre side.

**Eksempel.** Case 1-geometri med GVS i 1,0 m: med den faktiske lodrette spænding (1,0 m tør + 1,75 m våd fyld) bliver F_bund 13,81 kN/m mod 8,50 kN/m i arket, altså 62 % højere. Forankringslængderne falder tilsvarende, når kraften er bestemmende.

**Muligheder.**
- a) Forankringen regnes med den faktiske spænding ved GVS under terræn (hænger sammen med K-05 c).
- b) Uændret.

**Første version.** Som arket.

## K-20 h₁ og h₂ har tre forskellige betydninger

**Arket.** Symbolerne h₁ og h₂ bruges på tre måder:
- Indtastningen i F121 og teksten i A115 kalder h₁ jorddækningen til rørets top.
- Teksten i C114 og E114 og figuren (image4) bruger h₁ = T₁ − T₂ (terræn til GVS) og h₂ = T₃ − T₂ (GVS til rørmidte). Det er de to led i ballastformlen.
- DANVA 54 bruger h₁ om den frie højde over røret og h₂ = d/2.

Beregningen påvirkes ikke, men en læser kan misforstå rapporten.

**Muligheder.**
- a) h₁ bruges kun om jorddækningen, og ballastens led navngives efter tør og våd fyldhøjde.
- b) Uændret.

**Første version.** Appen bruger h₁ om jorddækningen til rørets top, som indtastningen i arket. Tværsnittet viser h₁ og d/2. Ballastens led står som T₂ og T₃ − T₂.

## K-21 Produktlisten mangler X-GRID 130 og 200

**Arket.** Produktlisten har X-GRID 35, 55, 80, 110 og 150. Databladet for X-GRID (dokument 1221-2/100) har også 130 og 200. Resten af databladet stemmer med arket:
- UTS (max. trækstyrke på langs) for 35–150;
- polyester med PVC-coating og BBA-certifikat 16/H253;
- krybningsfaktoren f_kryb = 1,43. Databladets karakteristiske trækstyrke ved 120 års belastning er UTS/1,43, fx 80/1,43 = 55,9 kN/m.

Trækstyrken på tværs er 20 kN/m, hvilket stemmer med arkets krav om udrulning på tværs af ledningen. f_m = 1,05, f_d = 1,15 og f_e = 1,22 står ikke i databladet og kan kun kontrolleres i BBA-certifikatet.

**Eksempel.** h₁ = 1,0 m og GVS i terræn, P_till/F_opdrift for hvert produkt:

| d | F_opdrift | Arket vælger | X-GRID 130 | X-GRID 150 | X-GRID 200 |
|---|---|---|---|---|---|
| 3,05 m | 55,86 | 150 (1,28) | 1,10 OK | 1,28 OK | 1,70 OK |
| 3,40 m | 72,21 | 150 (0,99, EJ OK) | 0,86 | 0,99 | 1,32 OK |
| 3,54 m | 79,30 | Kontakt leverandør | 0,78 | 0,90 | 1,20 OK |

Case 2 (F_opdrift = 113,32 kN/m) er løst med 2 × 150 (1,26). Med 130 på listen ville 2 × 130 også holde (1,09).

| Produkt | P_till | Holder til F_opdrift (krav 1,01) |
|---|---|---|
| X-GRID 130 | 61,71 kN/m | 61,10 kN/m |
| X-GRID 200 | 94,94 kN/m | 94,00 kN/m |

**Muligheder.**
- a) X-GRID 130 og 200 kommer på produktlisten for både automatisk og manuelt valg med valggrænsen UTS/RF. Det løser også K-02.
- b) Kun i det manuelle valg.
- c) Uændret.

**Afgjort 28. oktober 2026.** Mulighed a: X-GRID 130 og 200 er tilføjet til produktlisten for automatisk og manuelt valg med valggrænsen UTS/RF. Det løser også K-02. Tre af de 42 kontrolcases får et andet net end i arket; deres nye forventninger står i `tests/cases/afvigelser.json`.

**Bemærkning til databladet.** Rullevægten for X-GRID 200 er angivet til 350 kg. Fladevægten 760 g/m² på en rulle på 5 × 100 m giver 380 kg. For de øvrige produkter ligger den trykte rullevægt 0–20 kg over den beregnede. Det har ingen betydning for beregningen, men kan have betydning for en senere mængdeberegning.

## K-22 Reduktionsfaktorerne pr. net bruges ikke

**Arket.** Navne tabel har en kolonne med reduktionsfaktorer for hvert net (G24:K27 for 35, 55, 80, 110 og 200). Kun faktorerne for X-GRID 35 bruges:

| Brug | Celle | Faktorer |
|---|---|---|
| Valggrænserne G44:J44 = UTS/C44 for alle net | Navne tabel C44 = G24 · G25 · G26 · G27 | Kolonnen for X-GRID 35 |
| P_till = UTS/RF for det valgte net (G229) | Rapporten G209:G212, indtastet | En egen kopi uden forbindelse til Navne tabel |

Faktorerne i H24:K27 bruges ingen steder. Da alle kolonner og kopien i Rapporten i dag har de samme værdier (1,43; 1,05; 1,15; 1,22), er resultaterne rigtige. Retter man en faktor for ét net i Navne tabel, ændres hverken valget eller P_till. Retter man i Rapporten, ændres P_till, men ikke valggrænserne.

**Appen.** Appen har ét fælles sæt faktorer i `defaults.json`. Det bruges både til valggrænserne og P_till for alle syv net. Det giver samme tal som arket og kan ikke komme ud af trit med sig selv, men kan ikke rumme forskellige faktorer pr. net. Databladet bekræfter f_kryb = 1,43 for alle syv net. f_m, f_d og f_e kan kun kontrolleres i BBA-certifikat 16/H253.

**Muligheder.**
- a) Faktorerne gemmes pr. net i appen, med de samme værdier som i dag. Hvert net regnes med sine egne faktorer, både i valget og i P_till. Tallene ændres ikke, før en faktor ændres.
- b) Uændret med ét fælles sæt.

**Spørgsmål.** Angiver BBA-certifikatet forskellige faktorer for de enkelte net, fx f_d for mekanisk beskadigelse?

**Afgjort 28. oktober 2026.** Mulighed b: appen beholder ét fælles sæt faktorer som i arket.
