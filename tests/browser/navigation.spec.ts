import { expect, test } from '@playwright/test';

test('navigation, aktive sider, titel og versionsfod', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page).toHaveURL(/#opdriftssikring$/);
  await expect(page.getByRole('heading', { name: 'Opdriftssikring', level: 1 })).toBeVisible();
  const navigation = page.getByRole('navigation', { name: 'Navigation' });
  await expect(navigation.locator('[data-sidebar="group-label"]')).toHaveText([
    'Beregning',
    'Opslag',
    'Opsætning',
  ]);
  const expected = [
    [
      ['opdriftssikring', 'Opdriftssikring'],
      ['rapport', 'Rapport'],
    ],
    [
      ['geonet', 'Geonet og faste værdier'],
      ['hjaelp', 'Hjælp og dokumentation'],
    ],
    [['indstillinger', 'Indstillinger']],
  ];
  for (const [index, items] of expected.entries()) {
    const group = navigation.locator('[data-sidebar="group"]').nth(index);
    await expect(group.getByRole('link')).toHaveText(items.map((item) => item[1]));
    for (const [key, name] of items) {
      const link = group.getByRole('link', { name, exact: true });
      await link.click();
      await expect(page).toHaveURL(new RegExp(`#${key}$`));
      await expect(page.getByRole('heading', { name, exact: true, level: 1 })).toBeVisible();
      await expect(link).toHaveAttribute('aria-current', 'page');
      await expect(link).toHaveAttribute('data-active', 'true');
      await expect(page).toHaveTitle(`${name} · Opdriftssikring`);
    }
  }
  const footer = page.locator('[data-sidebar="footer"]');
  await expect(footer.getByText('BG Byggros A/S', { exact: true })).toBeVisible();
  await expect(footer.getByText('Beregningsværktøj v0.1', { exact: true })).toBeVisible();
  await expect(page.locator('.topbar .brand strong')).toHaveText('OPDRIFT');
  await page.goto('/#ukendt');
  await expect(page).toHaveURL(/#opdriftssikring$/);
  expect(errors).toEqual([]);
});

test('mobilmenuen åbner, navigerer og lukker', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const menu = page.locator('.topbar').getByRole('button', { name: 'Menu' });
  await menu.click();
  const drawer = page.getByRole('dialog');
  await expect(drawer).toBeVisible();
  await drawer.getByRole('link', { name: 'Rapport', exact: true }).click();
  await expect(page).toHaveURL(/#rapport$/);
  await expect(page.getByRole('heading', { name: 'Rapport', level: 1 })).toBeVisible();
  await expect(drawer).toHaveCount(0);
});
