# Hosting i Cloudflare

Cloudflare leverer appen som statiske filer uden serverkode og uden login:

- https://opdriftssikring.byggros.workers.dev (Worker `opdriftssikring`).

Adressen er `<Worker-navn>.<kontoens underdomæne>.workers.dev`. Ændres Worker-navnet eller kontoens underdomæne i Cloudflare, skal navnet i `hosting/cloudflare/wrangler.jsonc` ændres tilsvarende. Ellers opretter udrulningen en ny Worker.

`.github/workflows/cloudflare.yml` bygger appen med `VITE_UDGAVE=delt` og udruller med fast wrangler-version. Appkontrollen kalder den kun fra main efter beståede tests, så hver ændring på main, der består kontrollen, går online. Uden API-nøgle springes hosting over. Forhåndsvisningsadresser er slået fra.

GitHub Secrets indeholder `CLOUDFLARE_API_TOKEN` og `CLOUDFLARE_ACCOUNT_ID`. Nøglen hedder »Opdriftssikring GitHub-udrulning« i Cloudflare, er begrænset til kontoen og har rettighederne Workers Scripts: Edit, Account Settings: Read, User Details: Read og Memberships: Read. Den er uafhængig af nøglen til MSL Dimensionering og må aldrig gemmes i kode, logs eller den byggede app.

Alle med adressen kan bruge appen. `noindex` er en anmodning til søgemaskiner, ikke adgangskontrol. HTTP-overskrifter ligger i `public/_headers`.

Beregninger og gemte værdier forbliver i browseren. En ny webadresse har et nyt browserlager, så værdier gemt i den lokale app ses ikke på hostingadressen.

## Afkobling af Cloudflare

1. Fjern `cloudflare`-jobbet fra `.github/workflows/kontrol.yml`, den separate `cloudflare.yml` og `hosting/cloudflare/`.
2. Fjern Cloudflare-hemmelighederne fra GitHub, spær nøglen, og slet Workeren.

Appkode, beregningstests og lokal startfil ændres ikke ved afkoblingen.
