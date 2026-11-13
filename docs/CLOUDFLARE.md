# Hosting i Cloudflare

Cloudflare leverer to statiske udgaver uden serverkode og uden login, som i MSL Dimensionering:

- Intern: https://opdriftssikring-intern.byggros.workers.dev (Worker `opdriftssikring-intern`) med avanceret beregning og rapport.
- Offentlig: https://opdriftssikring.byggros.workers.dev (Worker `opdriftssikring`) med standardberegning uden rapport.

Adressen er `<Worker-navn>.<kontoens underdomæne>.workers.dev`. Ændres et Worker-navn eller kontoens underdomæne i Cloudflare, skal navnene i de to wrangler-filer ændres tilsvarende. Ellers opretter udrulningen en ny Worker.

Den offentlige udgave har kun standardberegningen og viser ingen valgmuligheder for avanceret beregning, heller ikke GVS under terræn eller CC3. Det er en visningsindstilling, ikke en sikkerhedsgrænse.

Opsætningen ligger i `hosting/cloudflare/wrangler.jsonc` og `wrangler-offentlig.jsonc`. `.github/workflows/cloudflare.yml` bygger begge udgaver, kontrollerer hostingens filgrænse og udruller med fast wrangler-version. Appkontrollen kalder den kun fra main efter beståede tests, så hver ændring på main, der består kontrollen, går online. Uden API-nøgle springes hosting over. Forhåndsvisningsadresser er slået fra.

Den første udrulning af en ny Worker kan fejle med kode 10007 (»This Worker does not exist on your account«), selv om filerne er lagt op. Det skete 4. november 2026, og en ny kørsel af det fejlede job gik igennem uden ændringer.

GitHub Secrets bruges til `CLOUDFLARE_API_TOKEN` og `CLOUDFLARE_ACCOUNT_ID`. API-nøglen hedder »Opdriftssikring GitHub-udrulning« i Cloudflare, er begrænset til kontoen og har rettighederne Workers Scripts: Edit, Account Settings: Read, User Details: Read og Memberships: Read. Den er uafhængig af nøglen til MSL Dimensionering og må aldrig gemmes i kode, logs eller den byggede app. Den tidligere hemmelighed `MEDARBEJDERE_JSON` bruges ikke længere og kan slettes af brugeren.

Rapporten bruger appens faste standardprofil og standardlogo i den lokale, interne og offentlige udgave. Navn, initialer, mail og telefon for »Udført af« og »Kvalitetssikring« skrives manuelt i rapportfelterne. Tidligere gemte firmaprofiler og logoer, medarbejderkartoteker samt ældre browserdata bliver ikke slettet, men appen læser dem ikke længere.

Beregninger og gemte værdier forbliver i browseren. En ny webadresse har et nyt browserlager, så værdier gemt i den lokale app ses ikke på hostingadresserne.

PDF-motoren leveres gzip-pakket, og hostingkontrollen afviser filer over 25 MiB.

## Afkobling af Cloudflare

1. Fjern `cloudflare`-jobbet fra `.github/workflows/kontrol.yml`, den separate `cloudflare.yml` og `hosting/cloudflare/`.
2. Fjern Cloudflare-hemmelighederne fra GitHub, spær nøglen, og slet de to Workers.

Appkode, beregningstests og lokal startfil ændres ikke ved afkoblingen.
