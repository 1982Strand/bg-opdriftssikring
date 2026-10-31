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
    // Standardberegningen regner med GVS i terræn og viser låsebeskeden og kontrolpunktet K-08.
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
    // Avanceret beregning med GVS mellem rørtop og rørmidte: note om vandstand, nye mellemregninger,
    // nedtonede kort og »Ikke relevant«.
    await page.getByRole('checkbox', { name: 'Avanceret beregning' }).click();
    await expect(page.getByText(/Beregninger på eget ansvar/)).toBeVisible();
    await expect(page.getByText('Ikke relevant', { exact: true }).first()).toBeVisible();
    expect(await axe(page)).toEqual([]);
    // Kort 8 med dybere forankring, advarsler, figur og udfoldede mellemregninger (K-25).
    for (const [navn, vaerdi] of [
      ['GVS under terræn (m)', '0.8'],
      ['Rørdiameter d (m)', '4'],
      ['Jorddækning h₁ (m)', '0.6'],
    ]) {
      const felt = page.getByRole('spinbutton', { name: navn });
      await felt.fill(vaerdi);
      await felt.press('Enter');
    }
    await page.getByRole('checkbox', { name: 'Beregn nødvendig forankringsdybde' }).click();
    const laengde = page.getByRole('spinbutton', {
      name: 'Mulig forankringslængde pr. side Lgeonet (m)',
    });
    await laengde.fill('1');
    await laengde.press('Enter');
    const kort8 = page.locator('section.calc-card', {
      has: page.getByRole('heading', { name: '8 Dybere forankring ved begrænset plads' }),
    });
    await kort8.getByRole('button', { name: 'Mellemregninger' }).click();
    await expect(kort8.getByRole('img', { name: /Dybere forankring med omslag/ })).toBeVisible();
    expect(await axe(page)).toEqual([]);

    for (const side of pladsholdere) {
      await page.goto(`/#${side}`);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      expect(await axe(page), side).toEqual([]);
    }
  });
}
