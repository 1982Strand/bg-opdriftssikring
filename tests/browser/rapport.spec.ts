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
  const download = page.waitForEvent('download');
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
