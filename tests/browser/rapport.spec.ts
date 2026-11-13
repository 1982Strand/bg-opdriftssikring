import { expect, test } from '@playwright/test';

test('rapporten dannes som PDF med projektoplysningerne', async ({ page }) => {
  await page.goto('/#rapport');
  await expect(page.getByRole('heading', { name: 'Rapport', level: 1 })).toBeVisible();
  await expect(page.getByRole('tab')).toHaveCount(0);
  await expect(page.locator('#sagsbehandler-kartotek')).toHaveCount(0);
  await expect(page.getByText('Kartoteket er tomt.')).toHaveCount(0);
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

test('med reduktion følger rapporten beregningen uden særskilt valg', async ({ page }) => {
  await page.goto('/#opdriftssikring');
  await page.getByRole('checkbox', { name: 'Avanceret beregning' }).click();
  await page
    .getByRole('checkbox', { name: 'Beregning med reduktion for ender og gennemføringer' })
    .click();
  await page.locator('a[href="#rapport"]').first().click();
  await expect(page.getByText('Løsninger i afsnit 8:')).toBeVisible();
  await expect(page.getByRole('checkbox', { name: /reduktion/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'Generér rapport' }).click();
  await expect(page.getByTestId('compile-state')).toHaveAttribute('data-state', 'ready', {
    timeout: 60_000,
  });
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
