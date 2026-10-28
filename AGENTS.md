# Arbejdsregler for Opdriftssikring

## Funktionalitet og kontrol

- Arbejd i `C:\Opdriftssikring`. React, TypeScript, Vite og shadcn/ui er valgt som i MSL Dimensionering (`C:\MSL-dimensionering`).
- Appen skal ligne MSL Dimensionering, så det er tydeligt, at de to værktøjer kommer fra samme firma. Designændringer i den ene app skal overvejes i den anden.
- Første version regner præcis som regnearket, jf. `docs/EXCEL_KORTLAEGNING.md`. Afvigelser fra arket står i `docs/FUND.md` og indføres kun efter brugerens udtrykkelige beslutning.
- Godkendte kontrolcases i `tests/cases/` er appens kontrolgrundlag. Input og forventninger må ikke omskrives for at få ændringer til at bestå.
- Valgt geonet, OK/EJ OK, tekster og viste resultater skal stemme præcist. Nye tolerancer og ændret virkemåde kræver brugerens udtrykkelige godkendelse.
- Designændringer afklares med brugeren. Brugeren foretager selv visuel kontrol i appen. Automatiske browsertests indgår i kontrollen.
- Samme opbygning skal stemme på skærm og i rapport.
- Registrer nye faglige og funktionelle aftaler i `docs/BESLUTNINGER.md` med dato, omfang og brugerens svar. Manglende svar er ikke godkendelse.

## Arbejdsgang

- Udvikling sker på kortlivede `codex/`-grene. Ændringer samles på `main` efter kodegennemgang og relevante automatiske kontroller. Afsluttede hjælpegrene og worktrees ryddes op.
- Kør typekontrol, formatkontrol, enhedstests, bygning og relevante browserkontroller. GitHub-kvoter må ikke erstatte lokal kvalitetssikring.
- Appen bruges lokalt. Hosting sættes først op efter særskilt godkendelse. Beregninger, lokal brug og normale tests må ikke kræve hostingnøgler, loginendepunkter eller udbyderspecifik serverkode.
- Stil spørgsmål ved valg, der påvirker faglighed, funktionalitet, arbejdsgang eller visning. Fortsæt uafhængigt arbejde imens.

## Kodesøgning

Brug Semble først til at lokalisere implementeringer, og læs direkte ved det returnerede sted. Brug `content="docs"`, `"config"` eller `"all"` ved søgning ud over kode. Brug Serena til symboler og referencer. Grep er til alle forekomster af en konkret streng.

## Sprog og private data

Dialog og projektdokumentation er på dansk. Brugervendt fagtekst er upersonlig og konstaterende med præcise symboler og enheder.

`Data og dokumentation/` indeholder DS/EN-standarder, e-mails med personoplysninger og kundesager. Mappen og indhold herfra må aldrig komme i Git. Kundenavne, personnavne og kundedata må ikke stå i kode, tests eller dokumenter. Brug syntetiske testdata. `.local/`, `reference-private/`, brugerdefinerede JSON-filer og miljøfiler forbliver ignoreret. Sletning af aktuelle filer renser ikke Git-historik eller GitHub-logs.
