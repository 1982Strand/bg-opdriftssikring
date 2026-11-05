# Hosting i Cloudflare

Cloudflare leverer to statiske udgaver uden serverkode og uden login, som i MSL Dimensionering:

- Intern: https://opdriftssikring-intern.byggros.workers.dev (Worker `opdriftssikring-intern`) med rapport og indbygget kartotek.
- Offentlig: https://opdriftssikring.byggros.workers.dev (Worker `opdriftssikring`) uden rapport og kartotek.

Adressen er `<Worker-navn>.<kontoens underdomæne>.workers.dev`. Ændres et Worker-navn eller kontoens underdomæne i Cloudflare, skal navnene i de to wrangler-filer ændres tilsvarende. Ellers opretter udrulningen en ny Worker.

Den offentlige udgave har kun standardberegningen og viser ingen valgmuligheder for avanceret beregning, heller ikke GVS under terræn eller CC3. Det er en visningsindstilling, ikke en sikkerhedsgrænse.

Opsætningen ligger i `hosting/cloudflare/wrangler.jsonc` og `wrangler-offentlig.jsonc`. `.github/workflows/cloudflare.yml` bygger begge udgaver, kontrollerer hostingens filgrænse og udruller med fast wrangler-version. Appkontrollen kalder den kun fra main efter beståede tests, så hver ændring på main, der består kontrollen, går online. Uden API-nøgle springes hosting over. Forhåndsvisningsadresser er slået fra.

Den første udrulning af en ny Worker kan fejle med kode 10007 (»This Worker does not exist on your account«), selv om filerne er lagt op. Det skete 4. november 2026, og en ny kørsel af det fejlede job gik igennem uden ændringer.

GitHub Secrets indeholder `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` og `MEDARBEJDERE_JSON`. API-nøglen hedder »Opdriftssikring GitHub-udrulning« i Cloudflare, er begrænset til kontoen og har rettighederne Workers Scripts: Edit, Account Settings: Read, User Details: Read og Memberships: Read. Den er uafhængig af nøglen til MSL Dimensionering og må aldrig gemmes i kode, logs eller den byggede app.

Kartoteket redigeres i den lokale udgave under Firmaprofil, hvor det også eksporteres og importeres med »Eksportér kartotek« og »Importér kartotek«. Filen kan bruges i begge apps. Den sendes til GitHub som hemmeligheden `MEDARBEJDERE_JSON` med `npm run kartotek -- <fil>`. En ældre firmaprofil med medarbejdere kan også bruges. Den interne udgave viser listen uden at kunne redigere den. Hemmeligheden bruges kun i trinnet, der bygger den interne udgave, og kommer med ved næste udrulning. Listen ligger ikke i Git, og uden hemmeligheden bygges den interne udgave med tomt kartotek. Listen er uafhængig af hemmeligheden i MSL Dimensionering, så en ændring skal lægges ind begge steder.

Ingen af adresserne har login. Kartoteket er bygget ind i den interne udgaves filer, så navne, mails og telefonnumre kan læses af alle, der har eller gætter adressen. Brugeren har valgt dette, se beslutningen af 5. november 2026 i [Beslutninger](BESLUTNINGER.md). Kartoteket fjernes ved at slette hemmeligheden `MEDARBEJDERE_JSON` og udrulle igen. `noindex` er en anmodning til søgemaskiner, ikke adgangskontrol. HTTP-overskrifter ligger i `public/_headers`.

Beregninger og gemte værdier forbliver i browseren. En ny webadresse har et nyt browserlager, så værdier gemt i den lokale app ses ikke på hostingadresserne.

PDF-motoren leveres gzip-pakket, og hostingkontrollen afviser filer over 25 MiB.

## Afkobling af Cloudflare

1. Fjern `cloudflare`-jobbet fra `.github/workflows/kontrol.yml`, den separate `cloudflare.yml` og `hosting/cloudflare/`.
2. Fjern Cloudflare-hemmelighederne og `MEDARBEJDERE_JSON` fra GitHub, spær nøglen, og slet de to Workers.

Appkode, beregningstests og lokal startfil ændres ikke ved afkoblingen.
