import { expect, test, type Page } from '@playwright/test';

async function start(page: Page) {
  await page.goto('/#opdriftssikring');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Opdriftssikring' })).toBeVisible();
}
async function saet(page: Page, label: string, value: string) {
  const felt = page.getByRole('spinbutton', { name: label });
  await felt.fill(value);
  await felt.press('Enter');
}
const flise = (page: Page, label: string) =>
  page.locator('.m9-result-cards > div', { hasText: label }).first();
const losning = (page: Page, titel: string) =>
  page.locator('.solution-card', { has: page.getByRole('heading', { name: titel, exact: true }) });

test('case 1 er standard og regnes med π (K-06)', async ({ page }) => {
  await start(page);
  await expect(page.getByRole('status').filter({ hasText: 'Standarddata' })).toBeVisible();
  await expect(flise(page, 'Opdrift O').locator('strong')).toHaveText('54,00');
  await expect(flise(page, 'Opdrift O').locator('p')).toHaveText('γf = 1,10');
  await expect(flise(page, 'Ballast B').locator('strong')).toHaveText('26,43');
  await expect(flise(page, 'Sikkerhed S₁').locator('strong')).toHaveText('0,49');
  await expect(flise(page, 'Sikkerhed S₁').locator('.m9-badge')).toHaveText('EJ OK');
  await expect(flise(page, 'Valgt geonet').locator('strong')).toHaveText('X-GRID 80');
  await expect(flise(page, 'Krav til geonettets trækstyrke').locator('strong')).toHaveText('27,56');
  await expect(flise(page, 'Sikkerhed Ptill').locator('strong')).toHaveText('1,38');
  await expect(flise(page, 'Sikkerhed Ptill').locator('p')).toHaveText(
    'Udnyttelse af Ptill: 73 % · krav > 1,01',
  );
  await expect(flise(page, 'Kraftoverførsel Fbund').locator('strong')).toHaveText('8,50');
  await expect(
    losning(page, 'Uden omslag, én ledning').getByRole('row', { name: /Forankring pr. side/ }),
  ).toContainText('1,70 m');
  await expect(
    losning(page, 'Med omslag, én ledning').getByRole('row', { name: /Forankring pr. side/ }),
  ).toContainText('1,36 m');
  await expect(page.getByRole('heading', { name: 'Kontrolpunkter' })).toHaveCount(0);
});

test('ændring, feltfejl, nulstilling og genindlæsning', async ({ page }) => {
  await start(page);
  await saet(page, 'Rørdiameter d (m)', '3');
  await expect(flise(page, 'Opdrift O').locator('strong')).toHaveText('77,75');
  await saet(page, 'Rørdiameter d (m)', '0');
  const d = page.getByRole('spinbutton', { name: 'Rørdiameter d (m)' });
  await expect(d).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByText('Diameteren d skal være større end 0 m.')).toBeVisible();
  await expect(page.getByText('Beregningen vises, når inddata er rettet.')).toBeVisible();
  await page.getByRole('button', { name: 'Nulstil beregning' }).click();
  await expect(flise(page, 'Sikkerhed S₁').locator('strong')).toHaveText('0,49');
  await saet(page, 'Jorddækning h₁ (m)', '1');
  await expect(page.getByRole('status').filter({ hasText: 'Gemt i denne browser' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('spinbutton', { name: 'Jorddækning h₁ (m)' })).toHaveValue('1');
  await expect(page.getByRole('status').filter({ hasText: 'Gemt i denne browser' })).toBeVisible();
});

test('GVS under terræn, kontrolpunkter og S₁ over 1,0', async ({ page }) => {
  await start(page);
  const gvsFelt = page.getByRole('spinbutton', { name: 'GVS under terræn (m)' });
  await expect(gvsFelt).toBeDisabled();
  await page.getByRole('checkbox', { name: 'GVS i terræn' }).click();
  await expect(gvsFelt).toBeEnabled();
  await saet(page, 'GVS under terræn (m)', '2');
  await expect(page.getByText(/GVS ligger under toppen af røret/)).toBeVisible();
  await expect(
    page.getByText(
      'S₁ > 1,0: opdriftssikring er ikke nødvendig. Tallene nedenfor vises som i regnearket.',
    ),
  ).toBeVisible();
  const kort = page.locator('section.calc-card');
  await expect(kort.filter({ has: page.getByRole('heading', { name: '6 Geonet' }) })).toHaveClass(
    /is-dimmed/,
  );
  await expect(
    kort.filter({ has: page.getByRole('heading', { name: '7 Forankring' }) }),
  ).toHaveClass(/is-dimmed/);
  await page.getByRole('checkbox', { name: 'GVS i terræn' }).click();
  await saet(page, 'Rørdiameter d (m)', '2.6');
  await saet(page, 'Jorddækning h₁ (m)', '1');
  await expect(page.getByText(/1,005 er under kravet 1,01/)).toBeVisible();
  await expect(flise(page, 'Sikkerhed Ptill').locator('.m9-badge')).toHaveText('EJ OK');
});

test('alle fire løsninger vises, og der er ingen valg af antal eller konstruktion', async ({
  page,
}) => {
  await start(page);
  await expect(page.locator('.solution-card > h3')).toHaveText([
    'Uden omslag, én ledning',
    'Med omslag, én ledning',
    'Uden omslag, to ledninger',
    'Med omslag, to ledninger',
  ]);
  await expect(
    losning(page, 'Uden omslag, to ledninger').getByRole('row', { name: /Mellem ledningerne/ }),
  ).toBeVisible();
  await expect(
    losning(page, 'Med omslag, to ledninger').getByText(/den største diameter/),
  ).toBeVisible();
  await expect(page.getByRole('radio')).toHaveText(['CC1', 'CC2', 'CC3']);
  await expect(page.getByText(/tank/i)).toHaveCount(0);
});

test('case 2 med 2 lag X-GRID 150 valgt manuelt', async ({ page }) => {
  await start(page);
  await saet(page, 'Rørdiameter d (m)', '4');
  await saet(page, 'Jorddækning h₁ (m)', '0.6');
  await expect(flise(page, 'Valgt geonet').locator('strong')).toHaveText('Kontakt leverandør');
  await page.getByRole('checkbox', { name: 'Vælg geonet manuelt i 2 lag' }).click();
  await page.getByRole('combobox', { name: 'Produkt i 2 lag' }).click();
  await page.getByRole('option', { name: 'X-GRID 150 · UTS 300 kN/m' }).click();
  await expect(flise(page, 'Valgt geonet').locator('strong')).toHaveText('X-GRID 150 (2 lag)');
  await expect(flise(page, 'Tilladelig træklast i geonet').locator('strong')).toHaveText('142,41');
  await expect(flise(page, 'Sikkerhed Ptill').locator('strong')).toHaveText('1,26');
  await expect(flise(page, 'Sikkerhed Ptill').locator('p')).toHaveText(
    'Udnyttelse af Ptill: 80 % · krav > 1,01',
  );
  await expect(
    losning(page, 'Uden omslag, én ledning').getByRole('row', { name: /Forankring pr. side/ }),
  ).toContainText('7,40 m');
  // Der regnes altid med 2 lag; antallet kan ikke vælges.
  await expect(page.getByRole('spinbutton', { name: /lag/ })).toHaveCount(0);
});

test('forudsætninger og konsekvensklasse står først på beregningssiden', async ({ page }) => {
  await start(page);
  await expect(page.locator('section.calc-card h2')).toHaveText([
    '1 Generelle beregningsforudsætninger',
    '2 Partialkoefficienter',
    '3 Geometri og grundvand',
    '4 Egenvægt og fyldmateriale',
    '5 Opdrift uden geonet',
    '6 Geonet',
    '7 Forankring',
  ]);
  await expect(page.getByRole('heading', { name: 'Projekteringsansvar' })).toBeVisible();
  await expect(page.getByText('Analysen sker i konsekvensklasse CC2 (middel')).toBeVisible();
  await page.getByRole('radio', { name: 'CC3' }).click();
  await expect(page.getByText('Analysen sker i konsekvensklasse CC3 (høj')).toBeVisible();
  await expect(flise(page, 'Opdrift O').locator('strong')).toHaveText('59,40');
  await expect(flise(page, 'Opdrift O').locator('p')).toHaveText('γf = 1,21');
  await page.getByRole('button', { name: 'Konsekvens for den aktuelle beregning' }).click();
  await expect(page.getByRole('row', { name: /Opdrift O/ })).toContainText('59,40 kN/m');
  await page.getByRole('button', { name: 'Nulstil beregning' }).click();
  await expect(page.getByRole('radio', { name: 'CC2' })).toBeChecked();
  await page.goto('/#indstillinger');
  await expect(page.getByText(/Konsekvensklassen vælges i afsnit 2/)).toBeVisible();
  await expect(page.getByRole('radio')).toHaveCount(0);
});

test('X-GRID 200 vælges automatisk over X-GRID 150 (K-21)', async ({ page }) => {
  await start(page);
  await saet(page, 'Rørdiameter d (m)', '3.4');
  await saet(page, 'Jorddækning h₁ (m)', '1');
  await expect(flise(page, 'Valgt geonet').locator('strong')).toHaveText('X-GRID 200');
  await expect(flise(page, 'Sikkerhed Ptill').locator('strong')).toHaveText('1,31');
  await expect(flise(page, 'Sikkerhed Ptill').locator('.m9-badge')).toHaveText('OK');
  await expect(page.getByRole('heading', { name: 'Kontrolpunkter' })).toHaveCount(0);
});

test('avanceret beregning gælder kun, når den er valgt', async ({ page }) => {
  await start(page);
  await saet(page, 'Rørdiameter d (m)', '4');
  await saet(page, 'Jorddækning h₁ (m)', '0.6');
  await page.getByRole('checkbox', { name: 'GVS i terræn' }).click();
  await saet(page, 'GVS under terræn (m)', '1.6');
  // Standardberegningen regner som regnearket og viser kontrolpunkt K-05.
  await expect(flise(page, 'Opdrift O').locator('strong')).toHaveText('138,23');
  await expect(page.getByText(/GVS ligger under toppen af røret/)).toBeVisible();
  await expect(page.getByText(/Beregninger på eget ansvar/)).toHaveCount(0);
  await expect(page.getByText(/Avanceret beregning er valgt/)).toHaveCount(0);

  await page.getByRole('checkbox', { name: 'Avanceret beregning' }).click();
  await expect(page.getByText(/Avanceret beregning er valgt/)).toBeVisible();
  await expect(flise(page, 'Opdrift O').locator('strong')).toHaveText('111,21');
  await expect(flise(page, 'Ballast B').locator('strong')).toHaveText('60,71');
  await expect(flise(page, 'Valgt geonet').locator('strong')).toHaveText('X-GRID 110');
  await expect(page.getByText(/Beregninger på eget ansvar/)).toBeVisible();
  await expect(page.getByText(/GVS ligger under toppen af røret/)).toHaveCount(0);
  await page.getByRole('button', { name: 'Mellemregninger', exact: true }).first().click();
  await expect(page.getByText(/arccos\(a\/r\).* = 2,4567 m²/)).toBeVisible();
  await expect(
    page.getByText(/del af rørets udvendige tværsnit, der ligger under GVS/),
  ).toBeVisible();

  // Valget gemmes sammen med beregningen.
  await page.reload();
  await expect(page.getByRole('checkbox', { name: 'Avanceret beregning' })).toBeChecked();

  // GVS ved rørbunden: ingen opdrift.
  await saet(page, 'GVS under terræn (m)', '4.6');
  await expect(
    page.getByText('GVS ligger ved eller under rørbunden', { exact: false }),
  ).toBeVisible();
  await expect(flise(page, 'Sikkerhed S₁').locator('strong')).toHaveText('–');
  await expect(flise(page, 'Sikkerhed S₁').locator('p')).toHaveText('Ingen opdrift');

  // Uden afkrydsning regnes igen som regnearket.
  await page.getByRole('checkbox', { name: 'Avanceret beregning' }).click();
  await expect(flise(page, 'Opdrift O').locator('strong')).toHaveText('138,23');
  await expect(page.getByText(/GVS ligger under toppen af røret/)).toBeVisible();
  await expect(page.getByText(/Beregninger på eget ansvar/)).toHaveCount(0);
});
