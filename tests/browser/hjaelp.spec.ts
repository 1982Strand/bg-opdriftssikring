import { expect, test } from '@playwright/test';

test('kraftens vej: vinklen styrer figuren og aflæsningen, og teksten står for sig selv', async ({
  page,
}) => {
  await page.goto('/#hjaelp');
  const kapitel = page.locator('.kraftens-vej');
  await expect(kapitel.getByRole('heading', { name: 'Et net kan kun trække' })).toBeVisible();
  await expect(kapitel.locator('svg')).toHaveCount(6);

  const raekke = (nr: number) => kapitel.locator('.kv-aflaesning dd').nth(nr);
  const figur = kapitel.getByRole('img', { name: /Rør med geonet/ });
  await expect(raekke(2)).toHaveText('15,91 kN/m');
  await expect(raekke(5)).toHaveText('Holder 42 %');
  await expect(raekke(6)).toHaveText('Ikke dækket 110 %');
  await expect(kapitel.locator('.kv-aflaesning dt').nth(6)).toContainText('(15,91 / 14,47)');

  await kapitel.getByRole('button', { name: '45° · DANVA fig. 2.15' }).click();
  await expect(raekke(2)).toHaveText('19,49 kN/m');
  await expect(figur).toHaveAccessibleName(/vinklen 45 grader/);

  await kapitel.getByRole('button', { name: /^0°/ }).click();
  await expect(raekke(2)).toHaveText('13,78 kN/m');
  await expect(raekke(5)).toHaveText('Holder 36 %');
  await expect(raekke(6)).toHaveText('Dækket 95 %');

  await kapitel.getByRole('slider').press('ArrowRight');
  await expect(kapitel.locator('.kv-alfa')).toHaveText('1°');
  await expect(figur).toHaveAccessibleName(/vinklen 1 grader/);
  await kapitel.getByRole('slider').press('End');
  await expect(raekke(5)).toHaveText('Holder ikke 106 %');

  // DANVA er sammenligningsgrundlaget; ingen henvisninger til regneark, fund eller interne dokumenter.
  await expect(kapitel.getByText(/nettet som i DANVA's figur 2.15/)).toBeVisible();
  expect(await kapitel.innerHTML()).not.toMatch(
    /[Rr]egneark|\b[Aa]rket|K-\d\d|Case \d|docs\/|[Ss]tatiker/,
  );

  await page.getByRole('button', { name: /Kraftens vej i geonettet/ }).click();
  await expect(kapitel).toBeHidden();
});
