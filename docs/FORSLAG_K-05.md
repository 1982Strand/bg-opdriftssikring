# Forslag: K-05 mulighed c – korrekt beregning ved GVS under rørtoppen

**Status 29. oktober 2026: godkendt og indført som en særskilt avanceret beregning.** Standardberegningen er uændret og regner som regnearket. Den avancerede beregning gælder kun, når »Avanceret beregning« er afkrydset øverst på beregningssiden. Beslutningerne står i afsnit 9 og i [BESLUTNINGER.md](BESLUTNINGER.md).

Forslaget beskriver, hvordan opdrift og ballast kan regnes fysisk korrekt for alle placeringer af grundvandsspejlet (GVS). Det gælder fund K-05 i [FUND.md](FUND.md). »I dag« i eksemplerne betyder standardberegningen.

## 1. Problemet i arket

Arket regner altid opdriften for et helt neddykket rør. Ballastformlen forudsætter, at GVS ligger mellem terræn og rørmidte. Ligger GVS lavere, sker der to ting:

- **O bliver for stor.** Hele tværsnittet regnes under vand, også når røret står helt eller delvis tørt.
- **B bliver for stor.** Den tørre søjle regnes ned til GVS, også under rørmidten og gennem røret. Derefter trækkes et negativt »vådt« led fra.

Arket er gennemregnet for 4.160 kombinationer. De dækker:

- d fra 0,4 til 4 m og h₁ fra 0,3 til 3 m;
- rumvægtene 17/16, 20/18, 18/18, 19/17 og 17/17 kN/m³ (γ_våd/γ_tør);
- rørvægt 0 eller 340 kg/m;
- GVS fra rørtoppen til 30 % under rørbunden.

Resultatet:

- Når der skal bruges et net, er arkets F_opdrift aldrig mindre end den korrekte værdi.
- Arket siger aldrig S₁ ≥ 1, hvor den korrekte værdi er under 1.
- Afstanden mellem to ledninger bliver aldrig for lille.

Net og forankring bliver altså ikke underdimensioneret. Men tallene i rapporten er forkerte, og arket kan overdimensionere kraftigt. I case 2 med GVS i rørmidten giver arket F_opdrift = 18,77 kN/m, mens den korrekte værdi er 6,83 kN/m.

## 2. Geometri og symboler

Dybder måles fra terræn (T₁ = 0) og nedad.

| Symbol | Betydning |
|---|---|
| d, r = d/2 | Rørets udvendige diameter og radius |
| h₁ | Dybden til rørtoppen (jorddækning) |
| T₃ = h₁ + r | Dybden til rørmidten |
| h₁ + d | Dybden til rørbunden |
| T₂ | Dybden til GVS |
| a = T₃ − T₂ | GVS' højde over rørmidten. a er negativ, når GVS ligger under midten. |
| A_tør | Den del af rørets tværsnit, der ligger over GVS |
| A_våd | Den del af rørets tværsnit, der ligger under GVS |
| γ_tør,d, γ′_d = γ_våd,d − γ_w | Regningsmæssig tør og effektiv rumvægt, som i dag |
| E_d · g/1000 | Rørets regningsmæssige egenvægt i kN/m, som i dag |

Beregningen deles i fire zoner efter, hvor GVS ligger:

| Zone | GVS | Opdrift | Ballast |
|---|---|---|---|
| 1 | T₂ ≤ h₁, i eller over rørtoppen | Som i dag | Som i dag |
| 2 | h₁ < T₂ ≤ T₃, mellem rørtop og rørmidte | Kun den neddykkede del | Den øverste rørhalvdel deles i en tør og en våd del |
| 3 | T₃ < T₂ < h₁ + d, mellem rørmidte og rørbund | Kun den neddykkede del | Hele søjlen er tør |
| 4 | T₂ ≥ h₁ + d, ved eller under rørbunden | Ingen opdrift | Hele søjlen er tør |

## 3. Areal over og under GVS

Arealet af rørets tværsnit over en vandret linje i højden a over midten er et cirkelafsnit:

- A_tør = r² · arccos(a/r) − a · √(r² − a²) for −r ≤ a ≤ r
- A_tør = 0 for a ≥ r, dvs. GVS over rørtoppen
- A_tør = π · r² for a ≤ −r, dvs. GVS under rørbunden

A_våd = π · r² − A_tør.

Formlen giver de rigtige grænser: A_tør = 0 ved rørtoppen (a = r), π · r²/2 ved rørmidten (a = 0) og π · r² ved rørbunden (a = −r).

## 4. Opdrift

**O = A_våd · γ_w · γ_f**

I zone 1 er A_våd = π · r² = π/4 · d², så O er som i dag. I zone 4 er O = 0. Røret regnes fortsat tomt, og γ_w og γ_f er uændrede.

## 5. Ballast

Modellen er uændret: fyldet i en lodret søjle med rørets bredde fra terræn til rørmidte, minus rørets øverste halvdel, plus rørets egenvægt. Der regnes ingen friktion på søjlens sider. Det nye er, at hver del regnes med den rumvægt, der passer til, om den ligger over eller under GVS.

| Zone | B |
|---|---|
| 1 | T₂ · d · γ_tør,d + (T₃ − T₂) · d · γ′_d − (π · r²/2) · γ′_d + E_d · g/1000, som i dag |
| 2 | T₂ · d · γ_tør,d + (T₃ − T₂) · d · γ′_d − A_tør · γ_tør,d − (π · r²/2 − A_tør) · γ′_d + E_d · g/1000 |
| 3 og 4 | (T₃ · d − π · r²/2) · γ_tør,d + E_d · g/1000 |

I zone 2 er A_tør den del af den øverste rørhalvdel, der ligger over GVS. Resten af halvdelen ligger under GVS og trækkes fra med γ′_d. I zone 3 og 4 ligger hele søjlen over GVS, så B ikke ændrer sig, når GVS sænkes yderligere. Jord under rørmidten regnes ikke med, ligesom i dag.

Formlerne hænger sammen ved zonegrænserne:

- **Ved rørtoppen** er A_tør = 0, så zone 2 giver det samme som zone 1.
- **Ved rørmidten** er A_tør = π · r²/2, så zone 2 giver det samme som zone 3.
- **Ved rørbunden** bliver O nul uden spring.

## 6. Afledte størrelser

- **F_opdrift = O − B** som i dag. Valg af geonet, P_till og forankringslængder bruger F_opdrift som i dag.
- **S₁ = B/O**, når O > 0. I zone 4 er der ingen opdrift, og S₁ kan ikke regnes (punkt P2).
- **Konklusion** som i dag efter S₁. I zone 4 gælder en ny tekst (punkt P2).
- **Arkets kontrol for løsning A og C** er (B + forankring)/O. Den kan heller ikke regnes i zone 4 (punkt P2).
- **σ′_v i rørmidten** bruges til afstanden mellem to ledninger i løsning B. Forslaget er σ′_v = min(T₂, T₃) · γ_tør,d + max(0, T₃ − T₂) · γ′_d.
  - I zone 1 og 2 er det samme formel som i dag.
  - I zone 3 og 4 giver dagens formel et negativt led og regner tør jord med under rørmidten. σ′_v bliver derfor for stor og afstanden for lille (punkt P3).
- **F_bund og F_top** regnes med samme spænding i nettets niveau: σ′_v(h_bund) og σ′_v(h_top). Det er besluttet under K-19 (punkt P4).
- **Kontrolpunkt K-05** udgår. K-12 (S₁ ≥ 1) gælder fortsat.

## 7. Eksempler

### 7.1 Mellemregning, case 2 med GVS i 1,6 m (zone 2)

d = 4,0 m, h₁ = 0,6 m, E = 340 kg/m, γ_våd = 17 og γ_tør = 16 kN/m³. Dermed er r = 2,0 m, T₃ = 2,6 m, γ_tør,d = 14,40 kN/m³, γ′_d = 5,30 kN/m³ og E_d · g/1000 = 306 · 9,82/1000 = 3,005 kN/m.

| Størrelse | Udregning | Resultat |
|---|---|---|
| a | T₃ − T₂ = 2,6 − 1,6 | 1,00 m |
| A_tør | 2,0² · arccos(1,0/2,0) − 1,0 · √(2,0² − 1,0²) = 4,1888 − 1,7321 | 2,4567 m² |
| A_våd | π · 2,0² − 2,4567 = 12,5664 − 2,4567 | 10,1096 m² |
| O | 10,1096 · 10 · 1,10 | 111,21 kN/m |
| B | 1,6 · 4,0 · 14,40 + 1,0 · 4,0 · 5,30 − 2,4567 · 14,40 − (6,2832 − 2,4567) · 5,30 + 3,005 = 92,160 + 21,200 − 35,377 − 20,280 + 3,005 | 60,71 kN/m |
| S₁ | 60,71/111,21 | 0,55 |
| F_opdrift | 111,21 − 60,71 | 50,50 kN/m |

I dag giver samme input O = 138,23, B = 83,06, S₁ = 0,60 og F_opdrift = 55,17 kN/m.

### 7.2 Mellemregning, case 2 med GVS i 2,9 m (zone 3)

| Størrelse | Udregning | Resultat |
|---|---|---|
| a | 2,6 − 2,9 | −0,30 m |
| A_tør | 2,0² · arccos(−0,15) + 0,3 · √(4,0 − 0,09) = 6,8852 + 0,5932 | 7,4784 m² |
| A_våd | 12,5664 − 7,4784 | 5,0880 m² |
| O | 5,0880 · 10 · 1,10 | 55,97 kN/m |
| B | (2,6 · 4,0 − 6,2832) · 14,40 + 3,005 = 59,282 + 3,005 | 62,29 kN/m |
| S₁ | 62,29/55,97 | 1,11 |

Der skal ikke bruges net. I dag giver samme input S₁ = 0,94, F_opdrift = 7,85 kN/m og X-GRID 35.

### 7.3 Case 1: d = 2,5 m, h₁ = 1,5 m

| GVS | Placering | Zone | I dag: O / B / S₁ / F_opdrift | Forslag: O / B / S₁ / F_opdrift |
|---|---|---|---|---|
| 0 | i terræn | 1 | 54,00 / 26,43 / 0,49 / 27,56 | ens |
| 1,0 m | over rørtop | 1 | 54,00 / 49,18 / 0,91 / 4,81 | ens |
| 1,5 m | rørtop | 1 | 54,00 / 60,56 / 1,12 / −6,56 | ens |
| 2,0 m | top–midte | 2 | 54,00 / 71,93 / 1,33 / −17,94 | 46,31 / 65,57 / 1,42 / −19,27 |
| 2,75 m | rørmidte | 2 | 54,00 / 89,00 / 1,65 / −35,00 | 27,00 / 66,66 / 2,47 / −39,66 |
| 3,5 m | midte–bund | 3 | 54,00 / 106,06 / 1,96 / −52,06 | 7,69 / 66,66 / 8,67 / −58,97 |
| 4,0 m | rørbund | 4 | 54,00 / 117,43 / 2,17 / −63,44 | 0 / 66,66 / – / −66,66 |
| 4,5 m | under bund | 4 | 54,00 / 128,81 / 2,39 / −74,81 | 0 / 66,66 / – / −66,66 |

Fra GVS i rørtoppen og nedefter skal der ikke bruges net, hverken i dag eller med forslaget. Ændringen gælder kun de viste tal.

### 7.4 Case 2: d = 4,0 m, h₁ = 0,6 m

| GVS | Placering | Zone | I dag: O / B / S₁ / F_opdrift | Forslag: O / B / S₁ / F_opdrift |
|---|---|---|---|---|
| 0 | i terræn | 1 | 138,23 / 24,82 / 0,18 / 113,41 | ens |
| 0,6 m | rørtop | 1 | 138,23 / 46,66 / 0,34 / 91,57 | ens |
| 1,6 m | top–midte | 2 | 138,23 / 83,06 / 0,60 / 55,17 | 111,21 / 60,71 / 0,55 / 50,50 |
| 2,6 m | rørmidte | 2 | 138,23 / 119,46 / 0,86 / 18,77 | 69,12 / 62,29 / 0,90 / 6,83 |
| 2,9 m | midte–bund | 3 | 138,23 / 130,38 / 0,94 / 7,85 | 55,96 / 62,29 / 1,11 / −6,32 |
| 3,6 m | midte–bund | 3 | 138,23 / 155,86 / 1,13 / −17,63 | 27,02 / 62,29 / 2,30 / −35,26 |
| 4,6 m | rørbund | 4 | 138,23 / 192,26 / 1,39 / −54,03 | 0 / 62,29 / – / −62,29 |

Konsekvens for net og forankring. Pilen viser i dag → forslag.

| GVS | Automatisk valgt X-GRID | L uden omslag | L med omslag | 2L mellem to ledninger |
|---|---|---|---|---|
| 0 og 0,6 m | uændret | uændret | uændret | uændret |
| 1,6 m | 130 → 110 | 3,60 → 3,30 m | 2,66 → 2,46 m | 2,34 → 2,14 m |
| 2,6 m | 55 → 35 | 1,23 → 1,00 m | 1,04 → 0,60 m | 0,60 → 0,50 m |
| 2,9 m | 35 → intet net | 1,00 → 1,00 m | 0,60 → 0,60 m | 0,50 → 0,50 m |

Ved 2,9 m viser længderne mindsteværdierne, fordi F_opdrift er negativ.

### 7.5 To ledninger med GVS under rørmidten

d = 4,0 m, h₁ = 0 m og GVS i 2,5 m, dvs. 0,5 m under rørmidten i 2,0 m.

| | F_opdrift | σ′_v | 2L mellem | Net |
|---|---|---|---|---|
| I dag | 35,13 kN/m | 33,35 kN/m² | 1,26 m | X-GRID 80 |
| Forslag med dagens σ′_v-formel | 19,62 kN/m | 33,35 kN/m² | 0,71 m | X-GRID 55 |
| Forslag med rettet σ′_v | 19,62 kN/m | 28,80 kN/m² | 0,82 m | X-GRID 55 |

Dagens σ′_v-formel regner tør jord med under rørmidten. Det har ikke betydning i dag, fordi arkets for store F_opdrift dækker over det. Med korrekt F_opdrift bliver afstanden for lille, hvis σ′_v ikke også rettes. Rettelsen af σ′_v gør altså afstanden større, og den er nødvendig, hvis mulighed c vælges.

## 8. Visning på siden

| Sted | I dag | Forslag |
|---|---|---|
| Hjælpetekst til »GVS under terræn« | »… Regnearket forudsætter GVS over midten af røret (fund K-05).« | »… Ligger GVS under rørtoppen, giver kun den del af røret, der står under vand, opdrift.« |
| Note om O i mellemregningerne i kort 5 | »… Røret regnes tomt og helt under vand, også når GVS ligger under rørtoppen (fund K-05).« | »Opdriften O er vægten af det vand, røret fortrænger: den del af rørets udvendige tværsnit, der ligger under GVS, gange γ_w. Røret regnes tomt.« |
| Mellemregninger i kort 5 | Formlen for zone 1 | Formlen for den aktuelle zone. I zone 2–4 også linjerne for a, A_tør og A_våd med indsatte tal, som i afsnit 7.1. |
| Konklusion i zone 4 | Arkets tekst for S₁ ≥ 1 | »GVS ligger ved eller under rørbunden, så røret påvirkes ikke af opdrift. Opdriftssikring er ikke nødvendig.« |
| Kontrolpunkter | K-05, når GVS ligger under rørtoppen | K-05 udgår |
| Rapport (fase 4) | – | Samme formler og tekster som på skærmen |

## 9. Punkter til beslutning

Afgjort 29. oktober 2026:
- P1, P2, P3 og P7: som foreslået.
- P4: afgjort under K-19 samme dag. Forankringen regnes med den faktiske effektive spænding i nettets niveau i den avancerede beregning.
- P5: noten vises med brugerens ordlyd: »GVS skal være den højeste vandstand i ledningens levetid, også under anlæg og ved skybrud. Værste tilfælde er GVS i terræn. Hvis GVS sættes herunder skal der sikres tilstrækkelige drænforanstaltninger eller på anden vis dokumenteres at vandstanden ikke kan blive højere. Beregninger på eget ansvar.« Sætningen om dræn er udvidet senere samme dag.
- P6: ingen blå farve på røret.
- P8: Standardberegningen er uændret, så arkets cases skal ikke have afvigelser. Den avancerede beregning har i stedet sine egne tests i `tests/avanceret.test.ts` (afsnit 10).

Punkterne, som de blev forelagt:

- **P1. Formler og model.** O og B regnes som i afsnit 3–5. Ballastmodellen (søjle til rørmidte uden sidefriktion) og alle koefficienter er uændrede.
- **P2. Ingen opdrift (zone 4).** Forslag:
  - S₁ vises som »–« med status OK og konklusionen fra afsnit 8.
  - Kort 6–7 tones ned som ved S₁ > 1.
  - Arkets kontrol for løsning A og C vises som »–«.
  - Alternativ: kort 6–7 skjules helt i zone 4.
- **P3. σ′_v for to ledninger.** σ′_v regnes med tør jord ned til rørmidten, når GVS ligger under midten (afsnit 6 og 7.5). Anbefales, fordi afstanden ellers bliver for lille.
- **P4. Forankring (K-19).** Uændret i dette forslag: F_bund og F_top regnes fortsat med γ′_d. K-19 afgøres for sig.
- **P5. Note ved GVS under terræn.** Når GVS angives under terræn, vises en note: »GVS skal være den højeste vandstand i ledningens levetid, også under anlæg og ved skybrud. I tæt jord kan ledningsgraven fyldes med vand til terræn.« Ja eller nej, og ordlyden.
- **P6. Figur.** Tværsnittet viser allerede GVS. Det kan suppleres med en blå farve på den del af røret, der står under vand. Valgfrit.
- **P7. Tekster.** Ordlyden i afsnit 8.
- **P8. Kontrolcases.** Fire af arkets 42 cases har GVS under rørtoppen og får besluttede afvigelser (afsnit 10). Casen med GVS præcis i rørtoppen er uændret.

## 10. Testplan

1. **Uændret over rørtoppen.** De 38 cases med GVS i eller over rørtoppen skal fortsat stemme med arket ved 1e-9 uden afvigelser. De regnes med arkets π = 3,14 som i dag.
2. **Kontrolcases.** Ændret efter beslutningen om en særskilt avanceret beregning: standardberegningen kontrolleres fortsat mod alle 42 cases uden afvigelser. Den avancerede beregning skal give præcis samme resultat som standarden for de 38 cases med GVS i eller over rørtoppen.
3. **Enhedstests af formlerne:**
   - A_tør er 0 ved rørtoppen, π · r²/2 ved rørmidten og π · r² ved rørbunden. A_tør(a) + A_tør(−a) = π · r².
   - O og B springer ikke ved rørtoppen, rørmidten og rørbunden.
   - Når GVS sænkes, aftager O og F_opdrift, og B vokser eller er konstant.
   - **Uafhængig kontrol:** for et gitter af d, h₁, rumvægte og GVS i alle zoner stemmer O og B med en numerisk integration over dybden. Ved udarbejdelsen af forslaget var den største relative afvigelse 6 · 10⁻⁶ for 960 kombinationer.
   - Håndregningen i afsnit 7.1 og 7.2 genfindes.
   - I zone 4 er O = 0, der vælges intet net, og S₁ og kontrollerne har ingen værdi.
   - Når der skal bruges net, er forslagets F_opdrift aldrig større end arkets. Det dokumenterer, at ændringen kun fjerner overdimensionering.
   - σ′_v følger formlen i afsnit 6 i alle zoner.
4. **Kontrolpunkter:** K-05 forekommer ikke længere. K-03, K-12 og K-13 er uændrede.
5. **Figurer:** Tværsnit og løsningsfigurer er gyldige for GVS i alle fire zoner.
6. **Browsertests:**
   - Case 2 med GVS i 1,6 m viser O = 111,21 kN/m og X-GRID 110.
   - Med GVS i 4,6 m vises konklusionen om ingen opdrift og S₁ = »–«.
   - Kontrolpunktet K-05 vises ikke.
   - axe finder intet ved 1440 og 390 px.

## 11. Det ændres ikke

- Ballastmodellen, partialkoefficienterne, γ_w = 10 kN/m³ og g = 9,82 m/s².
- Valget af geonet, P_till, kravene og mindstelængderne.
- Løsningernes formler bortset fra σ′_v i løsning B.

## 12. Arbejdsgang efter godkendelse

1. En kortlivet gren `codex/k05` med ændringerne i `src/engine/opdrift.ts`:
   - O, B og σ′_v efter zone;
   - S₁ og kontroller uden værdi i zone 4;
   - K-05 fjernet fra kontrolpunkterne.
2. Tekster og mellemregninger på siden efter afsnit 8 og de godkendte punkter.
3. Afvigelser og tests efter afsnit 10.
4. FUND (K-05 afgjort), BESLUTNINGER, BEREGNINGSMOTOR og TEST opdateres.
5. Gennemgang, alle kontroller, merge og push. Brugeren kontrollerer visningen i appen.
