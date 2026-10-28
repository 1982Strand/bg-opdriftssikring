import { AxeBuilder } from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const pladsholdere = ['rapport', 'geonet', 'hjaelp', 'indstillinger'];
const axe = async (page: Page) =>
  (
    await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  ).violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);

for (const width of [1440, 390]) {
  test(`ingen axe-fund ved ${width} px med resultater, udfoldede kort og kontrolpunkter`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/#opdriftssikring');
    // GVS under rørtoppen giver kontrolpunkter og nedtonede kort.
    await page.evaluate(() =>
      localStorage.setItem(
        'opdrift.session',
        JSON.stringify({
          version: 1,
          inddata: {
            d: 2.5,
            h1: 1.5,
            gvs: 2,
            gvsITerraen: false,
            roervaegt: 340,
            gamma: 17,
            gammaTor: 16,
            phi: 35,
            overstyringAktiv: false,
            produkt: 150,
            lag: 2,
          },
          konsekvensklasse: 'CC2',
        }),
      ),
    );
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Kontrolpunkter' })).toBeVisible();
    for (const knap of await page.locator('[data-slot="accordion-trigger"]').all())
      await knap.click();
    await expect(
      page.locator('[data-slot="accordion-content"][data-state="open"]').first(),
    ).toBeVisible();
    expect(await axe(page)).toEqual([]);

    for (const side of pladsholdere) {
      await page.goto(`/#${side}`);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      expect(await axe(page), side).toEqual([]);
    }
  });
}
