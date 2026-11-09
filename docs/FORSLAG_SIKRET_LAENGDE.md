# Beregning med reduktion for gennemføringer (kort 8)

Status: besluttet 9. november 2026 og indført i avanceret beregning, jf. [BESLUTNINGER.md](BESLUTNINGER.md) og fund K-29 i [FUND.md](FUND.md). Kontroltallene i afsnit 3 og tolkningen af ballasten ved gennemføringerne er godkendt af brugeren 9. november 2026.

## 1. Formål

Kort 5–7 regner pr. meter rør. På et rør eller en liggende tank med afrundede ender og gennemføringer i toppen kan geonettet ikke lægges over enderne og ved gennemføringerne. Opdriften virker alligevel på hele røret. Geonettet i den sikrede længde skal derfor optage hele rørets restopdrift.

Brugerens skitse viser et rør set fra siden med afrundede ender og en gennemføring cirka i midten. Under røret er længden delt i fem stykker: runding, sikret med geonet, gennemføring, sikret med geonet og runding.

Beregningen er ikke i regnearket. Den er kort 8, og den dybere forankring er flyttet til kort 9 (brugerens ønske 9. november 2026).

## 2. Beregningsmodel

### 2.1 Inddata

| Symbol | Betydning |
|---|---|
| L_rør | Rørets samlede længde fra ende til ende, inkl. de afrundede ender, m |
| L_ende,1, L_ende,2 | Vandret udstrækning af hver afrundet ende, m. 0, 1 eller 2 ender. |
| d_g,1, d_g,2 | Bredde langs røret af hver gennemføring, m. For en cirkulær gennemføring er det diameteren. 0, 1 eller 2 gennemføringer. |
| b_g,1, b_g,2 | Bredde på tværs af røret af hver rektangulær gennemføring, m. |

Hver ende og hver gennemføring angives for sig (beslutning 5b). Hver gennemføring er cirkulær eller rektangulær (brugerens ønske 9. november 2026). Symbolet a er ikke brugt, fordi den avancerede beregning bruger a = T₃ − T₂.

### 2.2 Sikret længde

    L_sikret = L_rør − ΣL_ende − Σd_g        (krav: L_sikret > 0)

Det er stykkerne »Kan sikres med geonet« i skitsen tilsammen. Gennemføringernes placering har ingen betydning for beregningen.

### 2.3 Samlet opdrift og ballast

O_d og B_d er værdierne pr. meter fra kort 5. Ved gennemføringerne er jorden gravet væk, og der er intet jorddække, så der regnes ingen ballast i deres bredde (brugerens præcisering 9. november 2026):

    L_ballast = L_rør − Σd_g
    h_g      = max(0; h₁ − T₂)                       gennemføringens hulrum under GVS
    A_g,i    = π/4 · d_g,i²  (cirkulær)  eller  d_g,i · b_g,i  (rektangulær)
    ΔO_g,i   = A_g,i · h_g · γ_w · γ_f                opdrift af hulrummet
    O_d,tot  = O_d · L_rør + ΣΔO_g,i
    B_d,tot  = B_d · L_ballast
    S₁       = B_d,tot/O_d,tot

- Enderne regnes med fuldt tværsnit i hele længden. En afrundet ende fortrænger mindre vand og har mere fyld over sig end en cylinder med samme længde, så antagelsen er på den sikre side (beslutning 3a). Det står i kortet og i rapporten.
- Gennemføringen regnes tom og tæt, og hulrummet giver opdrift fra rørtoppen op til GVS med sit cirkulære eller rektangulære tværsnit (beslutning 4b). Ballasten fjernes i rørets fulde bredde over d_g uanset formen. Standardberegningen regner med GVS i terræn, så h_g = h₁.
- Ingen ballast i gennemføringernes bredde. B_d indeholder rørets egenvægt, så egenvægten i gennemføringernes bredde regnes heller ikke med. Det er på den sikre side.
- Gennemføringens egenvægt medregnes ikke.
- Rørets egenvægt i kort 4 er i kg/m. Ved en tank er det den samlede vægt divideret med L_rør.

### 2.4 Geonet og forankring pr. meter sikret længde

    O_d,s    = O_d,tot/L_sikret
    B_d,s    = B_d,tot/L_sikret
    F_op,d,s = O_d,s − B_d,s
    Geonet:  P_d/F_op,d,s > 1,01                      samme valg som kort 6, også ved manuelt valg
    K_s      = F_op,d,s · S₂

O_d,s og B_d,s indsættes i formlerne fra kort 6 og 7 i stedet for O_d og B_d. Alle fire løsninger regnes med figurer (beslutning 6b). F_bund, F_top, mindstelængderne og afstanden mellem netlagene er de samme som pr. meter rør. Kontrollerne bliver dermed

    Løsning A:  (B_d,s + F_bund · 2 · L_geonet)/O_d,s = (B_d,tot + F_bund · 2 · L_geonet · L_sikret)/O_d,tot
    Løsning C:  (B_d,s + (F_bund + F_top)/2 · 4 · L_geonet)/O_d,s

Ballasten virker i hele længden uden for gennemføringerne, forankringen kun i den sikrede længde.

Netarealet vises for hver løsning (beslutning 9a): A_geonet = L_geonet,tot · L_sikret. Ved manuelt valg i 2 lag gælder arealet pr. lag.

### 2.5 Kort 9

Når kort 8 er slået til, regner kort 9 med K_s, O_d,s og B_d,s og løsningen »Med omslag, én ledning« fra kort 8 (beslutning 7a). Har kort 8 fejl i inddata, er kort 9 låst med en besked.

### 2.6 Forudsætninger

- Røret er stift i længderetningen, så opdriften fra ender og gennemføringer føres til de sikrede stykker. Det gælder for en tank, men ikke nødvendigvis for en ledning med samlinger.
- Geonettet lægges i hele den sikrede længde, også tæt ved enderne og gennemføringerne. Frigang ved en gennemføring medtages i d_g.

## 3. Kontroltal

Godkendt af brugeren 9. november 2026. Regnet uden appens motor (Python) og lagt i `tests/cases/reduktion.json`. Motoren giver de samme tal. Fælles: d = 2,50 m, h₁ = 1,50 m, CC2, γ_våd = 17 kN/m³, γ_tør = 16 kN/m³, φ_k = 35°, 340 kg/m, S₂ = 1,05, 0,2 m mellem netlagene. Pr. meter er O_d = 54,00 kN/m og B_d = 26,43 kN/m; med GVS 0,50 m under terræn er B_d = 37,81 kN/m.

| | 1 Tank 10 m | 2 Tank 6 m | 3 Rør 12 m | 4 Avanceret | 5 Ingen reduktion |
|---|---|---|---|---|---|
| GVS | i terræn | i terræn | i terræn | 0,50 m u.t. | i terræn |
| L_rør; ender; gennemføringer | 10; 0,60 + 0,60; 0,80 | 6; 0,60 + 0,60; 0,80 | 12; 0,90; 0,60 + 1,00 | 10; 0,60 + 0,60; 0,80 | 8; –; – |
| L_sikret | 8,00 m | 4,00 m | 9,50 m | 8,00 m | 8,00 m |
| ΣΔO_g | 8,29 kN | 8,29 kN | 17,62 kN | 5,53 kN | – |
| O_d,tot / B_d,tot | 548,26 / 243,20 kN | 332,27 / 137,46 kN | 665,58 / 274,92 kN | 545,49 / 347,85 kN | 431,97 / 211,47 kN |
| S₁ | 0,44 | 0,41 | 0,41 | 0,64 | 0,49 |
| F_op,d,s | 38,13 kN/m | 48,70 kN/m | 41,12 kN/m | 24,71 kN/m | 27,56 kN/m |
| Geonet, P_d/F_op,d,s | X-GRID 110, 1,37 | X-GRID 110, 1,07 | X-GRID 110, 1,27 | X-GRID 55, 1,06 | X-GRID 80, 1,38 |
| K_s | 40,04 kN/m | 51,14 kN/m | 43,18 kN/m | 25,94 kN/m | 28,94 kN/m |
| A: L_geonet; L_geonet,tot; kontrol | 2,35; 8,63 m; 1,03 | 3,01; 9,94 m; 1,03 | 2,54; 9,00 m; 1,03 | 1,16; 6,25 m; 1,02 | 1,70; 7,33 m; 1,03 |
| B: L_mellem | 3,14 m | 4,01 m | 3,39 m | 1,55 m | 2,27 m |
| C: L_geonet; L_geonet,tot; kontrol | 1,81; 12,76 m; 1,31 | 2,25; 14,54 m; 1,30 | 1,93; 13,26 m; 1,32 | 0,99; 9,48 m; 1,27 | 1,36; 10,98 m; 1,32 |

Case 5 uden ender og gennemføringer giver samme tal som pr. meter rør i kort 6 og 7.

Fra 10. november 2026 er netlængden med omslag geometrisk uden arkets tillæg (fund K-09), så L_geonet,tot for løsning C i tabellen er 1,20 m mindre i appen og i `tests/cases/reduktion.json`.

Til sammenligning gav forslaget, hvor gennemføringen kun fortrængte en cylinder af fyld, F_op,d,s = 35,99 kN/m for case 1. At der ingen ballast regnes i gennemføringens bredde, hæver restopdriften med yderligere 6 %, og nettet skifter fra X-GRID 80 til X-GRID 110.

## 4. Visning i appen (kort 8)

**Erstattet 9. november 2026.** Reduktionen vælges nu i kort 3 og har sit eget kort 4 til inddata, mens kortene for opdrift og ballast, geonet og forankring regner med reduktionen. Se [FORSLAG_REDUKTION_I_BEREGNINGEN.md](FORSLAG_REDUKTION_I_BEREGNINGEN.md). Afsnit 4 og 5 nedenfor beskriver den første udgave.

Kortet hedder »Beregning med reduktion for gennemføringer« (beslutning 1) og findes kun i avanceret beregning (beslutning 2a). Opbygningen følger kort 7 og 9:

- Indledning og afkrydsningen »Beregn med reduktion for ender og gennemføringer«. Felterne er låst, indtil der er sat kryds.
- Felterne L_rør, »Antal afrundede ender« 0–2 og »Antal gennemføringer« 0–2 som knaprækker og et felt for hver valgt ende. Hver gennemføring har knaprækken »Cirkulær | Rektangulær« og feltet for diameteren d_g eller, for en rektangulær, felterne for bredden langs røret d_g og på tværs b_g. Værdier for fravalgte ender og gennemføringer gemmes, og ældre gemte beregninger har cirkulære gennemføringer.
- Et målsat længdesnit: terræn, røret med afrundede ender som halve ellipser, gennemføringerne fra rørtop til terræn og geonettet over de sikrede stykker. Målkæden viser hver ende, hver gennemføring og de sikrede stykker; L_rør står nederst. Gennemføringerne tegnes med lige store sikrede stykker imellem.
- Fliserne »Sikret længde L_sikret«, »Kontrol uden geonet S₁«, »Restopdrift F_op,d,s« og »Valgt geonet« med P_d/F_op,d,s.
- Forudsætningerne som punktliste, herunder at enderne er regnet på den sikre side.
- Mellemregninger i grupperne »Sikret længde«, »Samlet opdrift«, »Samlet ballast«, »Pr. meter sikret længde«, »Geonet« og »Kraftoptagelse«.
- De fire løsninger som i kort 7 med figurer, symbolerne K_s, O_d,s, B_d,s og F_op,d,s og rækken »Samlet netareal A_geonet«.

Tilstande:

| Tilstand | Visning |
|---|---|
| Ikke slået til | Indledning, afkrydsning og låste felter. |
| L_rør ≤ 0 eller en valgt ende eller gennemføring ≤ 0 | Feltfejl. |
| L_sikret ≤ 0 | Feltfejl ved L_rør med L_sikret = L_rør − ΣL_ende − Σd_g. |
| S₁ ≥ 1 for hele røret | »Ikke relevant«, nedtonet som kort 6–7. |
| S₁ ≥ 1 pr. meter, men under 1 for hele røret | Kort 8 regner, selv om kort 6–7 viser »Ikke relevant«, og en note forklarer hvorfor. |
| Intet net er stærkt nok | »Kontakt leverandør«. Forankringen regnes alligevel. |
| Omslag ikke muligt | Løsning C og D får samme besked som i kort 7. |

## 5. Rapport

Afsnit 8 vælges på rapportsiden (beslutning 8a) og har samme opbygning som kortet: indledning, inddata, længdesnit, forudsætninger, mellemregninger og løsningerne 8.1–8.4 efter samme valg som i afsnit 7, med netarealet ved figurerne. Den dybere forankring er afsnit 9. Er sikring kun nødvendig for hele røret, udelades afsnit 6 og 7, og afsnit 8 kan stadig vælges.

## 6. Implementering

- `src/engine/reduktion.ts`: `beregnReduktion(r, input, reduktion)`. Den genbruger beregningen af geonet, kraftoverførsel og løsninger fra `beregnOpdrift` med O_d,s og B_d,s. `beregnOpdrift` giver uændrede tal.
- `src/engine/figurer.ts`: `laengdesnitSvg`.
- `src/ui/state.ts`: felterne til kort 8 og rapportvalget. Ældre gemte beregninger indlæses med reduktionen slået fra.
- `src/ui/mellemregninger.ts`, `src/ui/Opdriftssikring.tsx`, `src/ui/Rapport.tsx` og `src/report/rapport-model.ts`: kort 8, kort 9 og afsnit 8 og 9.
- Tests: `tests/reduktion.test.ts` med kontroltallene, feltfejl og kanttilfældet, et tilstandstest i `tests/state.test.ts`, afsnit 8 og 9 i `tests/rapport-model.test.ts` og browsertests for kort 8, tilgængelighed og rapportvalget.
