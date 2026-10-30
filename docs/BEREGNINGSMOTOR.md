# Beregningsmotor

Motoren ligger i `src/engine/` og kører i TypeScript i browseren. Brugerflade, browserlagring og rapport er adskilt fra beregningen. Første version regner præcis som regnearket. Hver formel har en kommentar med arkets celle, så den kan genfindes i [kortlægningen](EXCEL_KORTLAEGNING.md).

| Fil | Indhold |
|---|---|
| `defaults.json` | Arkets faste værdier: partialkoefficienter, K_FI for konsekvensklasserne, γ_w, g = 9,82, S₂, mindstelængder, krav og X-GRID-produkterne med reduktionsfaktorer |
| `geonet.ts` | Reduktionsfaktor RF, valggrænser, automatisk valg af geonet og manuel overstyring |
| `opdrift.ts` | `beregnOpdrift(input)`: validering, opdrift, ballast, S₁, geonet, kraftoverførsel, de fire løsninger og kontrolpunkter |
| `figurer.ts` | Målsatte SVG-figurer til skærm og rapport: tværsnittet og de fire løsninger |
| `format.ts` | Tal med dansk komma, tusindtalspunktum og minustegn |

## Inddata

`OpdriftInput` består af:
- diameter d, jorddækning h₁ og GVS-dybde, alle i m;
- karakteristisk rørvægt i kg/m;
- γ_våd (`gamma`), γ_tør (`gammaTor`) og φ_k;
- konsekvensklasse, CC2 eller CC3;
- eventuel overstyring af geonettet med produkt og antal lag (1 eller 2; siden bruger altid 2);
- beregningsmetode: `standard` (som arket, også når feltet mangler) eller `avanceret`.

Felterne afviser kun værdier uden fysisk mening. Hver fejl er knyttet til sit felt, så siden kan vise den ved feltet:
- d skal være > 0;
- h₁, GVS og rørvægt skal være ≥ 0;
- γ_tør skal være > 0, og φ_k skal ligge mellem 0° og 90° (begge udelukket);
- γ_våd · 0,9 skal være > γ_w, da den effektive rumvægt under vand ellers ikke er positiv;
- en overstyring skal være et produkt fra listen i 1 eller 2 lag. Et net i midten af flere lag kan ikke udnyttes;
- konsekvensklassen skal være CC2 eller CC3, fordi appen kun regner i de to klasser;
- i CC3 skal GVS ligge i terræn, i begge beregningsmetoder.

## Resultat

Resultatet indeholder alle mellemværdier, så skærm og rapport kan vise dem uden at regne selv:
- T₃, de regningsmæssige parametre og partialkoefficienterne med γ_f = 1,1 · K_FI;
- O, B med sine fire led (`ballastLed`), S₁ og arkets konklusion;
- F_opdrift og geonettets UTS, navn, P_till, sikkerheden P_till/F_opdrift og status;
- F_bund, F_top og K;
- løsningerne `losninger.A`–`D` (afsnit 9–12 i arket) med længder og kontrol. A og C har også den beregnede 2L før mindstelængden (`toLBeregnet`). C og D er `null`, når omslag ikke er muligt (h_top ≤ 0, K-23).

Hvor arket viser `#VALUE!`, fx P_till, når intet produkt kan vælges, er værdien `null`.

`kontrolpunkter` angiver de fund fra [FUND.md](FUND.md), der er aktive for beregningen. De ændrer ikke tallene.

| Kontrolpunkt | Betingelse |
|---|---|
| K-05 | Standardberegning, og GVS-dybden er større end h₁ (GVS under rørtoppen). Siden låser standardberegningen til GVS i terræn, så K-05 opstår kun ved direkte brug af motoren |
| K-08 | Omslag er muligt, S₁ < 1, og kontrollen for løsning C kan regnes |
| K-12 | S₁ ≥ 1 |

## Særheder bevaret fra arket

- g = 9,82 for rørets egenvægt (K-07). Det er tyngdeaccelerationen i Danmark.
- Der regnes videre med negativ F_opdrift, når S₁ ≥ 1 (K-12). Siden viser »Ikke relevant« for styrkekontrollen.
- Tillægget på 0,4 m i netlængden med omslag (K-09) står som `netTillaegOmslag`. Siden nævner tillægget ved netlængden.
- Kontrollen med omslag bruger et større topbidrag end dimensioneringen (K-08).

En ændring af disse kræver en beslutning i [BESLUTNINGER.md](BESLUTNINGER.md).

## Besluttede afvigelser fra arket

- **K-21 (og K-02).** Produktlisten er X-GRID 35, 55, 80, 110, 130, 150 og 200 fra databladet. Valggrænsen er P_till = UTS/RF for alle produkter uden afrunding.
- **K-06.** Motoren regner med π (`konstanter` i `opdrift.ts`). `beregnOpdrift(input, arketsKonstanter)` regner med arkets 3,14 og bruges kun i kontrollen mod arket.
- **K-03.** Det automatiske valg tager det mindste produkt med 1,01 · F_opdrift < P_till, så P_till/F_opdrift > 1,01 som i eftervisningen.
- **K-12.** S₁ ≥ 1 er OK (arket: S₁ > 1). Konklusionen bruger S₁ < 1, så de to er enige.
- **K-23.** Omslag er ikke muligt, når h_top ≤ 0; løsning C og D er da `null`.

## Avanceret beregning

Med `metode: 'avanceret'` regnes opdrift og ballast for den del af røret, der står under GVS (fund K-05, mulighed c). Formlerne står i [FORSLAG_K-05.md](FORSLAG_K-05.md), afsnit 3–6. Standardberegningen er uændret.

- `gvsZone` angiver zonen (1 i eller over rørtoppen, 2 mellem rørtop og rørmidte, 3 mellem rørmidte og rørbund, 4 ved eller under rørbunden), a = T₃ − T₂ og rørets areal over og under GVS. Feltet er `null` i standardberegningen.
- Den mindste del af tværsnittet regnes direkte, så små arealer nær rørtop og rørbund ikke tabes ved afrunding.
- Med GVS i terræn er resultatet præcis som standardberegningen. Med GVS mellem terræn og rørtop er opdrift, ballast og netvalg som standardberegningen, men forankringen regnes med den faktiske spænding (K-19).
- I zone 2 deles rørhalvdelen i en tør og en våd del (`ballastLed.roerDele`). I zone 3 og 4 er hele søjlen til rørmidten tør.
- I zone 4 er O = 0, og S₁ og kontrollerne for løsning A og C er `null`. S₁-status er OK, og konklusionen siger, at røret ikke påvirkes af opdrift.
- Den effektive lodrette spænding regnes som σ′_v(z) = min(T₂, z) · γ_tør,d + max(0, z − T₂) · γ′_d. Den bruges til σ′_v i rørmidten for to ledninger og til forankringen (`forankringsspaending`).
- Kontrolpunkt K-05 gælder kun standardberegningen. K-12 forudsætter, at S₁ kan regnes.
- F_bund og F_top regnes med spændingen i h_bund og h_top i stedet for altid med γ′_d (K-19, mulighed a). I standardberegningen er `forankringsspaending` h · γ′_d som i arket.

## Figurer

`figurer.ts` tegner tværsnittet og de fire løsninger ud fra resultatet. I den avancerede beregning med GVS mellem rørtop og rørbund tegner `opdriftsarealSvg` desuden rørets tværsnit delt af GVS med A_tør, A_våd, a, θ og r til mellemregningerne i kort 5. Regnearkets billeder er forlæg. Geometrien er i rigtig skala, mens tekst og streger er i skærmpixel, så figurerne er lige tydelige ved alle størrelser. Gravens hældning (0,6 vandret pr. lodret) og et bundlag på 0,15 m under røret er kun illustration og indgår ikke i beregningen. Figurerne bruger MSL's farver plus en dæmpet blå til grundvand og afviser ugyldige tal i stedet for at tegne dem.

## Kontrol

Motoren kontrolleres mod 42 cases udtrukket fra regnearket. CC1-casen kontrolleres ved, at motoren afviser den, se [TEST.md](TEST.md). Motoren indlæser ikke casene.
