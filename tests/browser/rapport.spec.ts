import { expect, test } from '@playwright/test';

test('rapporten dannes som PDF med projektoplysningerne', async ({ page }) => {
  await page.goto('/#rapport');
  await expect(page.getByRole('heading', { name: 'Rapport', level: 1 })).toBeVisible();
  await page.getByLabel('Projektnavn').fill('Eksempelprojekt');
  const navn = page.locator('#sagsbehandler-navn');
  await navn.fill('Navn Navnesen');
  const hent = page.getByRole('button', { name: 'Hent PDF' });
  await expect(hent).toBeDisabled();

  await page.getByRole('button', { name: 'Generér rapport' }).click();
  await expect(page.getByTestId('compile-state')).toHaveAttribute('data-state', 'ready', {
    timeout: 60_000,
  });
  // Headless Chromium kan hente PDF-forhåndsvisningen som download; vent på rapportfilen.
  const download = page.waitForEvent('download', {
    predicate: (d) => d.suggestedFilename().startsWith('Opdriftssikring'),
  });
  await page.getByRole('link', { name: 'Hent PDF' }).click();
  const fil = await download;
  expect(fil.suggestedFilename()).toMatch(/^Opdriftssikring - Eksempelprojekt - .*\.pdf$/);
  const chunks: Buffer[] = [];
  for await (const chunk of await fil.createReadStream()) chunks.push(chunk as Buffer);
  expect(Buffer.concat(chunks).subarray(0, 5).toString()).toBe('%PDF-');

  // En ændring gør forhåndsvisningen forældet, indtil rapporten er dannet igen.
  await page.getByLabel('Uden omslag, to ledninger').click();
  await expect(page.getByTestId('compile-state')).toHaveAttribute('data-state', 'ready', {
    timeout: 60_000,
  });
  await expect(page.getByText('Rapporten er dannet.')).toBeVisible();

  // Oplysningerne gemmes sammen med beregningen, men nulstilles ikke med den.
  await page.goto('/#opdriftssikring');
  await page.getByRole('button', { name: 'Nulstil beregning' }).click();
  await page.goto('/#rapport');
  await expect(page.getByLabel('Projektnavn')).toHaveValue('Eksempelprojekt');
});

test('firmaprofilen vises på en fane, og medarbejdere kan vælges', async ({ page }) => {
  await page.goto('/#rapport');
  await page.getByRole('tab', { name: 'Firmaprofil' }).click();
  await page.getByRole('button', { name: 'Tilføj medarbejder' }).click();
  await page.getByLabel('Navn').fill('Navn Navnesen');
  await page.getByLabel('Telefon').fill('12345678');
  await page.getByRole('button', { name: 'Tilføj', exact: true }).click();
  await page.getByRole('tab', { name: 'Rapport' }).click();
  await page.locator('#sagsbehandler-kartotek').click();
  await page.getByRole('option', { name: 'Navn Navnesen' }).click();
  await expect(page.locator('#sagsbehandler-navn')).toHaveValue('Navn Navnesen');
  await expect(page.locator('#sagsbehandler-telefon')).toHaveValue('12 34 56 78');
});

test('kartoteket kan eksporteres og importeres for sig', async ({ page }) => {
  await page.goto('/#rapport');
  await page.getByRole('tab', { name: 'Firmaprofil', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Eksportér kartotek' })).toBeDisabled();
  const fil = page.getByLabel('Kartoteksfil');
  await fil.setInputFiles({
    name: 'liste.json',
    mimeType: 'application/json',
    buffer: Buffer.from(
      JSON.stringify([{ navn: 'Ada Eksempel', initialer: 'AE', mail: '', telefon: '' }]),
    ),
  });
  await expect(page.getByRole('button', { name: 'Åbn kartotek (1)' })).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Eksportér kartotek' }).click();
  expect((await download).suggestedFilename()).toBe('medarbejderkartotek.json');
  // Firmaprofilen og kartoteket er adskilt: nulstilling af profilen bevarer kartoteket.
  page.once('dialog', (d) => void d.accept());
  await page.getByRole('button', { name: 'Nulstil firmaprofil til standard' }).click();
  await expect(page.getByRole('button', { name: 'Åbn kartotek (1)' })).toBeVisible();
  const profil = page.waitForEvent('download', {
    predicate: (d) => d.suggestedFilename() === 'firmaprofil.json',
  });
  await page.getByRole('button', { name: 'Eksportér profil' }).click();
  const profilfil = await profil;
  const dele: Buffer[] = [];
  for await (const del of await profilfil.createReadStream()) dele.push(del as Buffer);
  expect(JSON.parse(Buffer.concat(dele).toString()).profile).not.toHaveProperty('medarbejdere');
  await fil.setInputFiles({
    name: 'x.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{'),
  });
  await expect(page.getByText('Filen kunne ikke læses som JSON.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Åbn kartotek (1)' })).toBeVisible();
});

test('dybere forankring kan vælges til rapporten, når beregningen er valgt', async ({ page }) => {
  await page.goto('/#rapport');
  const valg = page.getByRole('checkbox', { name: /som afsnit 8/ });
  await expect(valg).toHaveCount(0);
  await page.goto('/#opdriftssikring');
  await page.getByRole('checkbox', { name: 'Avanceret beregning' }).click();
  await page.getByRole('checkbox', { name: 'Beregn nødvendig forankringsdybde' }).click();
  await page.locator('a[href="#rapport"]').first().click();
  await expect(valg).toBeVisible();
  await expect(valg).not.toBeChecked();
  await valg.click();
  await expect(valg).toBeChecked();
  await page.getByRole('button', { name: 'Generér rapport' }).click();
  await expect(page.getByTestId('compile-state')).toHaveAttribute('data-state', 'ready', {
    timeout: 60_000,
  });
});
