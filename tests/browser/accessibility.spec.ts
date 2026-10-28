import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const pages = ['opdriftssikring', 'rapport', 'geonet', 'hjaelp', 'indstillinger'];

for (const width of [1440, 390]) {
  test(`ingen axe-fund på pladsholdersider ved ${width} px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const route of pages) {
      await page.goto(`/#${route}`);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      const result = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      expect(
        result.violations.map((violation) => violation.id),
        route,
      ).toEqual([]);
    }
  });
}
