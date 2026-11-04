import { expect, test } from '@playwright/test';

test('kraftens vej: vinklen styrer figuren og aflæsningen, og teksten står for sig selv', async ({
  page,
}) => {
  await page.goto('/#hjaelp');
  const kapitel = page.locator('.kraftens-vej');
  await expect(kapitel.getByRole('heading', { name: 'Et net kan kun trække' })).toBeVisible();
  await expect(kapitel.locator('.kv-svg svg')).toHaveCount(6);

  const raekke = (nr: number) => kapitel.locator('.kv-aflaesning dd').nth(nr);
  const figur = kapitel.getByRole('img', { name: /Rør med geonet/ });
  await expect(raekke(0)).toContainText('0,58');
  await expect(raekke(1)).toHaveText('× 1,15');
  await expect(raekke(2)).toHaveText('15,91 kN/m');
  await expect(raekke(3)).toHaveText('Holder 42 %');
  await expect(raekke(4)).toHaveText('Ikke dækket 110 %');
  await expect(kapitel.locator('.kv-aflaesning dt').nth(4)).toContainText('(15,91 / 14,47)');
  await expect(figur).toContainText('T = 15,91 kN/m');
  await expect(figur).toContainText('T · cos α = 13,78');
  await expect(figur).toContainText('T · sin α = 7,96');

  await kapitel.getByRole('button', { name: '45° · DANVA fig. 2.15' }).click();
  await expect(raekke(2)).toHaveText('19,49 kN/m');
  await expect(figur).toHaveAccessibleName(/vinklen 45 grader/);

  await kapitel.getByRole('button', { name: /^0°/ }).click();
  await expect(raekke(2)).toHaveText('13,78 kN/m');
  await expect(raekke(3)).toHaveText('Holder 36 %');
  await expect(raekke(4)).toHaveText('Dækket 95 %');

  await kapitel.getByRole('slider').press('ArrowRight');
  await expect(kapitel.locator('.kv-alfa')).toHaveText('1°');
  await expect(figur).toHaveAccessibleName(/vinklen 1 grader/);
  await kapitel.getByRole('slider').press('End');
  await expect(raekke(3)).toHaveText('Holder ikke 106 %');

  // DANVA er sammenligningsgrundlaget; ingen henvisninger til regneark, fund eller interne dokumenter.
  await expect(
    kapitel.getByText(/nettet som i figur 2.15 i DANVA Vejledning nr. 54/),
  ).toBeVisible();
  await expect(
    kapitel.getByText('DANVA Vejledning nr. 54, 2. udgave, juli 2006, figur 2.15'),
  ).toBeVisible();
  expect(await kapitel.innerHTML()).not.toMatch(
    /[Rr]egneark|\b[Aa]rket|K-\d\d|Case \d|docs\/|[Ss]tatiker/,
  );

  await page.getByRole('button', { name: /Kraftens vej i geonettet/ }).click();
  await expect(kapitel).toBeHidden();
});

test('kraftens vej: eget eksempel slår igennem med det samme og rører ikke beregningen', async ({
  page,
}) => {
  await page.goto('/#hjaelp');
  const kapitel = page.locator('.kraftens-vej');
  const boks = kapitel.locator('.kv-eksempel');
  const d = boks.locator('#eksempel-d');
  const h1 = boks.locator('#eksempel-h1');
  const egenvaegt = boks.locator('#eksempel-roervaegt');
  const raekke = (nr: number) => kapitel.locator('.kv-aflaesning dd').nth(nr);
  const figur = kapitel.getByRole('img', { name: /Rør med geonet/ });
  await expect(boks).toContainText('GVS i terræn');
  await expect(egenvaegt).toHaveValue('340');

  // Tallene skifter uden Enter eller Tab, og det skrevne bevares undervejs.
  await d.fill('');
  await d.pressSequentially('2.05');
  await expect(d).toHaveValue('2.05');
  await d.fill('3');
  await h1.fill('1');
  await expect(boks).toContainText('X-GRID 130');
  await expect(boks).toContainText('53,73 kN/m');
  await expect(figur).toContainText('Ø3000');
  await expect(figur).toContainText('T = 31,02 kN/m');
  await expect(raekke(2)).toHaveText('31,02 kN/m');
  await expect(raekke(3)).toHaveText('Holder 50 %');
  await expect(kapitel.locator('.kv-aflaesning dt').nth(3)).toContainText('(31,02 / 61,71)');
  await expect(kapitel.getByRole('region', { name: 'Eksempel' })).toContainText('53,73 kN/m');
  await expect(kapitel.getByText(/I eksemplet rækker X-GRID 130/)).toBeVisible();
  await expect(kapitel.getByText(/udvendig diameter 3,00 m, jorddække 1,00 m/)).toBeVisible();

  // Ingen sikring nødvendig: ingen kræfter, og de to eksempeltabeller følger med.
  await d.fill('1');
  await h1.fill('1.5');
  await expect(kapitel.getByText(/opdriftssikring er ikke nødvendig/)).toHaveCount(2);
  await expect(boks).toContainText('1,33');
  await expect(raekke(2)).toHaveText('–');
  await expect(raekke(3)).toHaveText('–');
  await expect(raekke(4)).toHaveText('–');
  await expect(figur).not.toContainText('kN/m');
  await expect(kapitel.getByRole('region', { name: 'Eksempel' })).toHaveCount(0);

  // Egenvægten afgør det ved små rør.
  await h1.fill('1');
  await egenvaegt.fill('0');
  await expect(boks).toContainText('2,77 kN/m');
  await egenvaegt.fill('340');

  // Intet geonet er stærkt nok: trækket og forankringen vises stadig.
  await d.fill('4');
  await expect(kapitel.getByText(/Der produceres ikke geonet/)).toBeVisible();
  await expect(boks).toContainText('Kontakt leverandør');
  await expect(raekke(2)).toHaveText('60,58 kN/m');
  await expect(raekke(3)).toHaveText('–');
  await expect(raekke(4)).toHaveText('Ikke dækket 110 %');

  // Et ugyldigt tal afvises, og sidste regning står.
  await d.fill('0');
  await d.blur();
  await expect(boks.locator('.setting-error')).toBeVisible();
  await expect(raekke(2)).toHaveText('60,58 kN/m');

  await boks.getByRole('button', { name: 'Nulstil' }).click();
  await expect(d).toHaveValue('2.5');
  await expect(h1).toHaveValue('1.5');
  await expect(boks.locator('.setting-error')).toHaveCount(0);
  await expect(boks).toContainText('27,56 kN/m');

  // Eksemplet gemmes ikke og ændrer ikke beregningen.
  await d.fill('3');
  await page.getByRole('link', { name: 'Opdriftssikring', exact: true }).click();
  await expect(page.locator('#input-d')).toHaveValue('2.5');
  await page.getByRole('link', { name: 'Hjælp og dokumentation', exact: true }).click();
  await expect(d).toHaveValue('2.5');
});
