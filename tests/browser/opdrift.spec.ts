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

test('case 1 er standard og vises som i regnearket', async ({ page }) => {
  await start(page);
  await expect(page.getByRole('status').filter({ hasText: 'Standarddata' })).toBeVisible();
  await expect(flise(page, 'Opdrift O').locator('strong')).toHaveText('53,97');
  await expect(flise(page, 'Opdrift O').locator('p')).toHaveText('γf = 1,10');
  await expect(flise(page, 'Ballast B').locator('strong')).toHaveText('26,44');
  await expect(flise(page, 'Sikkerhed S₁').locator('strong')).toHaveText('0,49');
  await expect(flise(page, 'Sikkerhed S₁').locator('.m9-badge')).toHaveText('EJ OK');
  await expect(flise(page, 'Valgt geonet').locator('strong')).toHaveText('X-GRID 80');
  await expect(flise(page, 'Krav til geonettets trækstyrke').locator('strong')).toHaveText('27,53');
  await expect(flise(page, 'Sikkerhed Ptill').locator('strong')).toHaveText('1,38');
  await expect(flise(page, 'Sikkerhed Ptill').locator('p')).toHaveText(
    'Udnyttelse af Ptill: 72 % · krav > 1,01',
  );
  await expect(flise(page, 'Kraftoverførsel Fbund').locator('strong')).toHaveText('8,50');
  await expect(
    losning(page, 'Uden omslag').getByRole('row', { name: /Forankring pr. side/ }),
  ).toContainText('1,70 m');
  await expect(
    losning(page, 'Med omslag').getByRole('row', { name: /Forankring pr. side/ }),
  ).toContainText('1,36 m');
  await expect(page.getByRole('heading', { name: 'Kontrolpunkter' })).toHaveCount(0);
});

test('ændring, feltfejl, nulstilling og genindlæsning', async ({ page }) => {
  await start(page);
  await saet(page, 'Rørdiameter d (m)', '3');
  await expect(flise(page, 'Opdrift O').locator('strong')).toHaveText('77,72');
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
  await expect(kort.filter({ has: page.getByRole('heading', { name: '4 Geonet' }) })).toHaveClass(
    /is-dimmed/,
  );
  await expect(
    kort.filter({ has: page.getByRole('heading', { name: '5 Forankring' }) }),
  ).toHaveClass(/is-dimmed/);
  await page.getByRole('checkbox', { name: 'GVS i terræn' }).click();
  await saet(page, 'Rørdiameter d (m)', '2.601');
  await saet(page, 'Jorddækning h₁ (m)', '1');
  await expect(page.getByText(/1,005 er under kravet 1,01/)).toBeVisible();
  await expect(flise(page, 'Sikkerhed Ptill').locator('.m9-badge')).toHaveText('EJ OK');
});

test('to ledninger og liggende tank skifter løsninger og tekster', async ({ page }) => {
  await start(page);
  await page.getByRole('radio', { name: '2', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Uden omslag, to ledninger' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Med omslag, to ledninger' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Uden omslag', exact: true })).toHaveCount(0);
  await page.getByRole('radio', { name: 'Liggende tank' }).click();
  await expect(page.getByRole('spinbutton', { name: 'Tankdiameter d (m)' })).toBeVisible();
  await expect(page.getByRole('spinbutton', { name: /Tankens egenvægt/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Uden omslag, to tanke' })).toBeVisible();
  await expect(page.getByText(/Ved to tanke angives den største diameter/)).toBeVisible();
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
    losning(page, 'Uden omslag').getByRole('row', { name: /Forankring pr. side/ }),
  ).toContainText('7,40 m');
  // Der regnes altid med 2 lag; antallet kan ikke vælges.
  await expect(page.getByRole('spinbutton', { name: /lag/ })).toHaveCount(0);
});

test('konsekvensklasse CC3 på Indstillinger bruges på beregningssiden', async ({ page }) => {
  await start(page);
  await page.goto('/#indstillinger');
  await page.getByRole('radio', { name: 'CC3' }).click();
  await expect(page.getByRole('row', { name: /Opdrift O/ })).toContainText('59,37 kN/m');
  await page.goto('/#opdriftssikring');
  await expect(flise(page, 'Opdrift O').locator('strong')).toHaveText('59,37');
  await expect(flise(page, 'Opdrift O').locator('p')).toHaveText('γf = 1,21');
  await page.goto('/#indstillinger');
  await page.getByRole('button', { name: 'Nulstil indstillinger' }).click();
  await expect(page.getByRole('radio', { name: 'CC2' })).toBeChecked();
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
