# Beregningsmotor

Motoren ligger i `src/engine/` og kører i TypeScript i browseren. Brugerflade, browserlagring og rapport er adskilt fra beregningen. Første version regner præcis som regnearket. Hver formel har en kommentar med arkets celle, så den kan genfindes i [kortlægningen](EXCEL_KORTLAEGNING.md).

| Fil | Indhold |
|---|---|
| `defaults.json` | Arkets faste værdier: partialkoefficienter, K_FI for konsekvensklasserne, γ_w, g = 9,82, π = 3,14, S₂, mindstelængder, krav og X-GRID-produkterne med reduktionsfaktorer |
| `geonet.ts` | Reduktionsfaktor RF, valggrænser, automatisk valg af geonet og manuel overstyring |
| `opdrift.ts` | `beregnOpdrift(input)`: validering, opdrift, ballast, S₁, geonet, kraftoverførsel, de fire løsninger og kontrolpunkter |

## Inddata

`OpdriftInput` består af:
- diameter d, jorddækning h₁ og GVS-dybde, alle i m;
- karakteristisk rørvægt i kg/m;
- γ, γ_tør og φ_k;
- konsekvensklasse;
- eventuel overstyring af geonettet med produkt og antal lag.

Felterne afviser kun værdier uden fysisk mening. Hver fejl er knyttet til sit felt, så siden kan vise den ved feltet:
- d skal være > 0;
- h₁, GVS og rørvægt skal være ≥ 0;
- γ_tør skal være > 0, og φ_k skal ligge mellem 0° og 90° (begge udelukket);
- γ · 0,9 skal være > γ_w, da den effektive rumvægt under vand ellers ikke er positiv;
- en overstyring skal være et produkt fra listen med et helt antal lag på mindst 1.

## Resultat

Resultatet indeholder alle mellemværdier, så skærm og rapport kan vise dem uden at regne selv:
- T₃, de regningsmæssige parametre og partialkoefficienterne med γ_f = 1,1 · K_FI;
- O, B, S₁ og arkets konklusion;
- F_opdrift og geonettets UTS, navn, P_till, udnyttelse og status;
- F_bund, F_top og K;
- løsningerne `losninger.A`–`D` (afsnit 9–12 i arket) med længder og kontrol.

Hvor arket viser `#VALUE!`, fx P_till, når intet produkt kan vælges, er værdien `null`.

`kontrolpunkter` angiver de fund fra [FUND.md](FUND.md), der er aktive for beregningen. De ændrer ikke tallene.

| Kontrolpunkt | Betingelse |
|---|---|
| K-02 | Automatisk valgt produkt med den indtastede grænse 78,9, og F_opdrift ≥ P_till |
| K-03 | Automatisk valg, 0 < F_opdrift < P_till, og P_till/F_opdrift ≤ 1,01 |
| K-05 | GVS-dybden er større end h₁ (GVS under rørtoppen) |
| K-12 | S₁ ≥ 1 |
| K-13 | Den viste 2L (G312) er forskellig fra 2 · L (C315) |

## Særheder bevaret fra arket

- π = 3,14 og g = 9,82 (K-06, K-07).
- Valggrænsen for X-GRID 150 er 78,9 (K-02). De øvrige grænser er UTS/RF uden afrunding.
- Netvalget og kontrollen bruger forskellige krav (K-03).
- Der regnes videre med negativ F_opdrift, når S₁ ≥ 1 (K-12).
- Tillægget på 0,4 m i netlængden med omslag (K-09) står som `netTillaegOmslag`.

En ændring af disse kræver en beslutning i [BESLUTNINGER.md](BESLUTNINGER.md).

## Kontrol

Motoren kontrolleres mod 42 cases udtrukket fra regnearket, se [TEST.md](TEST.md). Motoren indlæser ikke casene.
