# Kontrol af appen

Enhedstests ligger i `tests/*.test.ts` og kører med `node --test` uden Excel, browser eller netværk. Browsertests ligger i `tests/browser/` og kører med Playwright på port 5186, adskilt fra den lokale app.

```powershell
npm run typecheck
npm run format:check
npm test
npm run build
npm run test:browser
```

## Kontrolcases fra regnearket

`tests/cases/excel-cases.json` er facit for beregningsmotoren. Filen er udtrukket fra selve regnearket og indeholder for hver case:
- inddata;
- arkets værdi i alle resultatceller fra [kortlægningen](EXCEL_KORTLAEGNING.md), også tekster som »EJ OK« og fejlværdier som `#VALUE!`.

`tests/opdrift-excel.test.ts` regner hver case med motoren og sammenligner celle for celle.

Casene dækker:
- arkets gemte værdier og den udskrevne Ø4000-sag med 2 lag X-GRID 150;
- et gitter af diametre og jorddækninger;
- båndene i K-02 og K-03 og »kontakt leverandør«;
- GVS fra terræn til under røret;
- rørvægt, fyldparametre og konsekvensklasse;
- manuel overstyring af geonettet.

Kontrollen mod arket regner med arkets π = 3,14 (`arketsKonstanter`), mens appen regner med π (K-06). Det samme gælder testene af kontrolpunkterne, som bruger arkets tal. En særskilt test kontrollerer, at appen bruger π.

CC1 er udgået, fordi appen kun regner i CC2 og CC3 (beslutninger 29. og 30. oktober 2026). Casen »CC1: case 1« sammenlignes derfor ikke med arket, men kontrolleres ved, at motoren afviser CC1. Samme input i CC2 er »Case 1«, som sammenlignes med arket.

Bevidste afvigelser fra arket står i `tests/cases/afvigelser.json` med beslutning og en forventning, der er beregnet uden motoren. Excels facit ændres ikke. Afvigelserne er K-21 (produktlisten) og K-03 (netvalget med kravet 1,01, 7 cases).

Tal sammenlignes med en relativ tolerance på 1e-9 og en absolut nedre grænse på 1e-12. Tolerancen dækker kun afrundingsstøj i kommatal, fordi motoren og Excel kan udføre de samme regneoperationer i lidt forskellig rækkefølge. Valgt geonet, OK/EJ OK og tekster skal stemme præcist.

Den avancerede beregning (`tests/avanceret.test.ts`) kontrolleres ved, at:
- den giver præcis samme resultat som standardberegningen for de 34 cases i CC2 og CC3 med GVS i terræn, og at standardberegningen er uændret, når metoden angives;
- opdrift, ballast og netvalg er som standardberegningen for alle 37 cases i CC2 og CC3 med GVS ned til rørtoppen;
- håndregningerne i [FORSLAG_K-05.md](FORSLAG_K-05.md), afsnit 7.1 og 7.2, genfindes;
- O og B stemmer med en uafhængig numerisk integration over rørets vinkel for 960 kombinationer med GVS i alle zoner, ved 1e-9;
- arealet over GVS har de rigtige grænser og er symmetrisk om rørmidten, og O og B springer ikke ved zonegrænserne;
- O og F_opdrift aftager, og B vokser eller er konstant, når GVS sænkes;
- GVS ved eller under rørbunden giver O = 0 og ingen S₁ eller kontrol;
- σ′_v følger GVS, og K-05 kun forekommer i standardberegningen;
- forankringen bruger samme spænding i rørmidten som afstanden mellem to ledninger, og håndregningen for case 2 med GVS i 1,6 m genfindes (F_bund = 16,54 kN/m);
- F_bund og F_top aldrig er mindre, og L aldrig større, end i standardberegningen;
- F_opdrift aldrig er større end i standardberegningen, når der skal bruges net;
- figurerne er gyldige, og valget gemmes i sessionen.

Øvrige enhedstests dækker:
- validering og kontrolpunkter i motoren;
- at det automatiske netvalg altid opfylder kravet 1,01 (K-03);
- at S₁-status og konklusionen er enige, også tæt på S₁ = 1;
- at omslag ikke er muligt ved h_top ≤ 0 (K-23);
- at mindstelængderne svarer til max(mindstelængde; beregnet 2L/2);
- figurerne for de 41 cases i CC2 og CC3;
- at CC1 afvises, at CC3 kræver GVS i terræn i begge beregningsmetoder, at standardberegningen på siden altid regner med GVS i terræn, og at en gemt standardberegning i CC3 indlæses som CC2;
- teksterne til kontrolpunkterne og forudsætningerne;
- talformatet;
- lagringen i browseren.

Browsertestene dækker:
- standardresultatet for case 1 med de nye navne, noterne på løsningskortene, tillægget i netlængden og kontrolpunktet K-08;
- feltfejl, nulstilling og genindlæsning;
- låsen af GVS i standardberegningen og GVS under terræn i den avancerede beregning med »Ikke relevant« og nedtoning;
- at det automatiske netvalg opfylder kravet 1,01;
- at omslag ikke er muligt ved lav rørmidte;
- alle fire løsninger uden valg af antal eller konstruktion;
- manuelt valg af 2 lag X-GRID 150;
- forudsætningerne og konsekvensklasse CC3 i kort 1–2, herunder at CC3 kun kan vælges i avanceret beregning;
- CC3 med note om statikerkontrol og låst GVS i terræn;
- avanceret beregning til og fra med GVS under rørtoppen og ved rørbunden;
- navigationen;
- tilgængelighed med axe ved 1440 og 390 px, også med avanceret beregning.

Input og forventninger må ikke ændres for at få en ændring til at bestå. En bevidst afvigelse fra arket kræver en beslutning i [BESLUTNINGER.md](BESLUTNINGER.md).

### Besluttede afvigelser

Den udtrukne fil `excel-cases.json` er altid arkets egne værdier og ændres kun ved et nyt udtræk. Besluttede afvigelser står i `tests/cases/afvigelser.json`. Hver afvigelse har sit fundnummer, dato, beslutning og en beskrivelse af, hvordan de nye forventninger er beregnet. De nye forventninger regnes uden motoren ud fra arkets egne værdier og kun for de celler, der ændres. Testen lægger dem oven på arkets værdier og kontrollerer, at hver afvigelse gælder en kendt case og celle og faktisk afviger fra arket.

### Nyt udtræk

Udtrækket kræver Windows med Microsoft Excel og regnearket i den lokale mappe `Data og dokumentation/`, som ikke er i Git.

```powershell
pwsh tools/excel-cases.ps1 -Regneark "Data og dokumentation/Opdriftsikring rør - X-GRID 1026 - WIP.xlsx"
```

Sådan arbejder værktøjet:
- Det kopierer regnearket til en midlertidig fil og åbner kopien skrivebeskyttet i en separat Excel-instans.
- Originalen og en allerede åben Excel røres ikke. Får værktøjet forbindelse til en Excel med åbne projektmapper, stopper det uden at ændre noget.
- Det sætter inddatacellerne og γ_f (E92 = 1,1 · K_FI) for hver case. Ved overstyring skrives UTS og navn ind over G207 og G199, som i den udskrevne sag.
- Det genberegner og aflæser cellerne.

Casene er defineret i værktøjet. Udtrækket skal kun køres igen, hvis regnearket ændres, eller hvis der skal tilføjes cases.
