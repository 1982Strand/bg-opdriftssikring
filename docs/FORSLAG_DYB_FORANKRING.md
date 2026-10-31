# Forslag: Dybere forankring ved begrænset plads

Status: besluttet 31. oktober 2026, ikke indført. Teksterne i afsnit 6 og kontroltallene i afsnit 8 afventer brugerens godkendelse.

## 1. Formål

Ved én ledning med omslag kan forankringslængden fra løsningen »Med omslag, én ledning« i kort 7 være længere, end der er plads til. Nettet kan da føres længere ned langs rørets sider og forankres dybere, hvor jordtrykket er større. Brugeren angiver den forankringslængde pr. side, der er plads til, og appen finder den dybde til det nederste netlag, hvor længden er tilstrækkelig.

Grundlaget er en beregningsbeskrivelse fra brugeren, der viderefører regnearkets model for løsning C (afsnit 11). Metoden er ikke i regnearket og ikke dokumenteret. Lokal jordreaktion, jordbrud, netkræfter og deformationer er ikke eftervist, se fund K-25.

## 2. Beslutninger

Brugerens svar: »1a, 2b, 3a, 4a, 5a med henvisning til den pågældende tilstrækkelige beregning. 6a, 7a«.

| Nr. | Beslutning |
|---|---|
| 1 | Kortet hedder »Dybere forankring ved begrænset plads«. |
| 2 | Kortet findes kun i avanceret beregning. |
| 3 | Ingen fast grænse for dybden. Der vises en ekstra advarsel, når det nederste netlag ligger under rørbunden. |
| 4 | Den samlede netlængde medregner 2 · (h_bund − T₃) for nettets sider ned langs røret. |
| 5 | Er den angivne længde tilstrækkelig ved rørmidten, viser kortet en besked med henvisning til løsningen »Med omslag, én ledning« i kort 7 og ingen dybde. |
| 6 | Kortet har en figur af løsningen med omslag, hvor nettet er ført ned langs rørets sider. |
| 7 | Kortet har en fast advarsel, og kontrolpunktet K-25 vises, når der regnes en dybere forankring. |

Brugeren fravalgte at kunne vælge selve forankringsdybden. Kun én ledning med omslag er med; to ledninger kræver en særskilt model for jorden mellem rørene.

## 3. Beregningsmodel

Opdrift O_d, ballast B_d, restopdrift F_op,d og kraftoptagelse K = F_op,d · S₂ er uændrede fra kort 5–7. Jorden over forankringen lægges ikke til B_d.

Løsning C i kort 7 regner med det nederste netlag i rørmidtens niveau:

    2L = K/(F_bund + F_top/2) + 2 · 0,2,   L_geonet = max(0,6; 2L/2)

Med en angivet længde L_geonet ≥ 0,6 m pr. side kræves derfor:

    F_bund + F_top/2 = K/(2 · L_geonet − 2 · 0,2)

Kraftoverførslen regnes som i den avancerede beregning (K-19) i dybden h_bund til det nederste netlag og h_top = h_bund − 0,2 til det øverste:

    σ′_v(z) = min(z; T₂) · γ_tør,d + max(0; z − T₂) · γ′_d
    F_bund = σ′_v(h_bund) · μ · tan φ_d,   F_top = σ′_v(h_top) · μ · tan φ_d

F_bund + F_top/2 vokser lineært med dybden i hvert af højst tre intervaller, afgrænset af T₂ og T₂ + 0,2. Ligningen har derfor præcis én løsning h_bund > T₃, når den angivne længde er kortere end løsningen ved rørmidten. Den findes eksakt interval for interval.

Desuden regnes:

    Δh = h_bund − T₃   (sænkning under rørmidten)
    L_geonet,tot = 4 · (L_geonet + 0,4) + π · d/2 + 2 · Δh
    Kontrol = (B_d + (F_bund + F_top)/2 · 4 · L_geonet)/O_d   (krav > 1,0)

Kontrollen har samme forskel mellem dimensionering og kontrol som K-08. Den er ikke en eftervisning af den dybere løsning.

## 4. Tilstande

| Tilstand | Visning |
|---|---|
| Standardberegning | Kortet vises ikke. |
| Sikring ikke nødvendig (F_op,d ≤ 0) | »Ikke relevant« og låst som kort 6–7. |
| Omslag ikke muligt (h_top ≤ 0 i kort 7) | Samme besked som løsningen med omslag i kort 7. |
| Beregning ikke slået til | Kun indledning, afkrydsning og felt. |
| L_geonet < 0,6 m | Feltfejl. |
| L_geonet ≥ løsning C's længde | Besked om, at forankring ved rørmidten er tilstrækkelig, med henvisning til kort 7. |
| L_geonet < løsning C's længde | Dybde, fliser, mellemregninger, figur, advarsler og K-25. |

## 5. Indhold

**Inddata.** Afkrydsningen »Beregn nødvendig forankringsdybde« og feltet »Mulig forankringslængde pr. side L_geonet (m)«. Valget gemmes med beregningen.

**Fliser.**
- »Nødvendig dybde h_bund« med noten »h_top = h_bund − 0,2 = … m«.
- »Sænkning under rørmidten Δh« med noten »… m under rørbunden« eller »… m over rørbunden«.
- »Samlet netlængde L_geonet,tot« med noten »inkl. 2 · Δh for siderne«.
- »Opdriftskontrol« med OK/EJ OK og noten »Krav > 1,0«.

**Mellemregninger** i samme tabelform som kort 5–7:
- Gruppen »Nødvendig kraftoverførsel«: K fra kort 7, den angivne længde og F_bund + F_top/2 = K/(2 · L_geonet − 2 · 0,2).
- Gruppen »Nødvendig dybde«: σ′_v og F i begge netlag ved den fundne dybde, h_bund med F_bund + F_top/2 indsat og løsning C's formel med dybden indsat igen, der giver den angivne længde.
- Gruppen »Netlængde og kontrol«: Δh, L_geonet,tot og kontrollen.

**Figur.** Løsningen med omslag for én ledning, hvor nettet går over røret, ned langs rørets sider til h_bund, ud med L_geonet pr. side og tilbage i h_top. Koterne T₂, T₃, h_top og h_bund vises. Lodrette sidestykker og skarpe hjørner er en idealisering.

## 6. Tekster til godkendelse

1. Indledning: »Når der ikke er plads til forankringslængden fra løsningen med omslag for én ledning, kan nettet føres længere ned langs rørets sider og forankres dybere. Beregningen finder den dybde, hvor den angivne forankringslængde er tilstrækkelig.«
2. Afkrydsning: »Beregn nødvendig forankringsdybde«. Hjælpetekst: »Angiv den forankringslængde pr. side, der er plads til. Gælder én ledning med omslag.«
3. Felt: »Mulig forankringslængde pr. side L_geonet (m)«. Feltfejl: »Forankringslængden skal være mindst 0,6 m pr. side, som er mindstelængden med omslag.«
4. Tilstrækkelig ved rørmidten: »Løsningen »Med omslag, én ledning« i kort 7 giver L_geonet = 5,27 m pr. side med forankring ved rørmidten. Den angivne længde på 6,00 m er tilstrækkelig, så dybere forankring er ikke nødvendig.«
5. Fast advarsel: »Dybere forankring er ikke en dokumenteret metode og indgår ikke i regnearket. Længden regnes med samme friktionsmodel som løsningen med omslag. Lokal jordreaktion ved nettets retningsændringer, jordbrud, netkræfter og deformationer er ikke eftervist og skal eftervises særskilt, før løsningen bruges til udførelse.«
6. Under rørbunden: »Det nederste netlag ligger 1,05 m under rørbunden. Udgravning, indbygning og komprimering under røret skal vurderes særskilt.«
7. Kontrolpunkt K-25: »Dybere forankring ved begrænset plads giver h_bund = 5,65 m for L_geonet = 2,50 m pr. side. Metoden er ikke i regnearket og kræver særskilt statisk og geoteknisk eftervisning (fund K-25).«
8. Hjælpeteksten ved »Avanceret beregning«: »I avanceret beregning kan der regnes med vandspejl under terræn, samt konsekvensklasse 3 og dybere forankring ved begrænset plads.«

## 7. Implementering

1. **Motor.** En ny, ren funktion i `src/engine/dybforankring.ts`, der ud fra resultatet af `beregnOpdrift`, inddata og den angivne længde giver tilstand, h_bund, h_top, Δh, F_bund, F_top, L_geonet,tot og kontrol. `beregnOpdrift` ændres ikke, så alle kontrolcases er uberørte.
2. **Tilstand.** `Session` får `dybForankring: { aktiv: boolean; L: number }`. Ældre gemte beregninger indlæses med beregningen slået fra.
3. **Side.** Kort 8 efter kort 7 i avanceret beregning, kontrolpunktet K-25 og den nye hjælpetekst.
4. **Figur.** En variant af løsningsfiguren for løsning C i `src/engine/figurer.ts`.
5. **Tests.** Enhedstests med kontroltallene i afsnit 8, test af tilstandene i afsnit 4, browsertests og tilgængelighedstjek.
6. **Rapport.** Kortet medtages i fase 4, når beregningen er slået til.

## 8. Kontroltal til godkendelse

Regnet uafhængigt af appens motor med regnearkets formler og den avancerede spændingsmodel. CC2, γ = 17 kN/m³, γ_tør = 16 kN/m³, φ = 35° og rørvægt 340 kg/m. Appens π, medmindre andet er nævnt.

| Nr. | d, h₁, GVS | L_geonet | Løsning C | h_bund | h_top | Under rørbund | L_geonet,tot | Kontrol |
|---|---|---|---|---|---|---|---|---|
| 1 | 4,00; 0,60; i terræn, π = 3,14 | 2,50 | 5,2624 | 5,642655 | 5,442655 | 1,042655 | 23,965310 | 1,420470 |
| 2 | 4,00; 0,60; i terræn | 2,50 | 5,2663 | 5,646934 | 5,446934 | 1,046934 | 23,977053 | 1,420585 |
| 3 | 4,00; 0,60; 0,80 | 2,50 | 2,6286 | 2,818506 | 2,618506 | −1,781494 | 18,320198 | 1,314875 |
| 4 | 2,50; 1,50; i terræn | 1,00 | 1,3625 | 3,965774 | 3,765774 | −0,034226 | 11,958539 | 1,375195 |
| 5 | 2,50; 1,50; i terræn | 1,50 | 1,3625 | tilstrækkelig ved rørmidten | | | | |
| 6 | 4,00; 0,60; i terræn | 0,60 | 5,2663 | 32,153202 | 31,953202 | 27,553202 | 69,389590 | 1,900667 |
| 7 | 4,00; 0,60; i terræn | 0,50 | 5,2663 | feltfejl | | | | |
| 8 | 4,00; 0,00; 2,10 | 0,95 | 0,9970 | 2,136370 | 1,936370 | −1,863630 | 11,955926 | 1,427454 |

Nr. 1 genskaber beregningsbeskrivelsens eksempel (5,64 m). Nr. 8 har GVS mellem de to netlag. Nr. 6 viser, at modellen giver meget store dybder ved korte længder.
