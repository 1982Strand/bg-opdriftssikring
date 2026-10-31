import { expect, test, type Locator, type Page } from '@playwright/test';

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
/** Tjekker en række i mellemregningerne: forklaringen, formlen med indsatte tal og resultatet. */
const mellemregning = (omraade: Locator, forklaring: string, celler: string[]) =>
  expect(
    omraade
      .getByRole('row', { name: new RegExp(`^${forklaring.replace(/[.()]/g, '\\$&')}`) })
      .getByRole('cell'),
  ).toHaveText(celler);
const laasTekst =
  'Standardberegningen regner altid med GVS i terræn. GVS under terræn kan regnes med avanceret beregning.';

test('case 1 er standard og regnes med π (K-06)', async ({ page }) => {
  await start(page);
  await expect(page.getByRole('status').filter({ hasText: 'Standarddata' })).toBeVisible();
  await expect(
    page.getByText(
      'Opdrift og ballast for rør, nødvendigt geonet og forankringslængder for X-GRID.',
    ),
  ).toBeVisible();
  await expect(
    page.getByText(
      'Beregningen gælder pr. løbende meter for et tomt, cirkulært rør i homogent friktionsfyld med geonettet ført symmetrisk om røret.',
    ),
  ).toBeVisible();
  await expect(flise(page, 'Regningsmæssig opdrift').locator('strong')).toHaveText('54,00');
  await expect(flise(page, 'Regningsmæssig opdrift').locator('p')).toHaveText('γf = 1,10');
  await expect(flise(page, 'Stabiliserende ballast').locator('strong')).toHaveText('26,43');
  await expect(flise(page, 'Kontrol uden geonet').locator('strong')).toHaveText('0,49');
  await expect(flise(page, 'Kontrol uden geonet').locator('.m9-badge')).toHaveText('EJ OK');
  // EJ OK står med rødt (--destructive).
  await expect(flise(page, 'Kontrol uden geonet').locator('.m9-badge')).toHaveCSS(
    'background-color',
    'rgb(180, 35, 24)',
  );
  await expect(flise(page, 'Kontrol uden geonet').locator('p')).toHaveText('Krav ≥ 1,0');
  await expect(flise(page, 'Valgt geonet').locator('strong')).toHaveText('X-GRID 80');
  await expect(flise(page, 'Restopdrift').locator('strong')).toHaveText('27,56');
  await expect(flise(page, 'Styrkekontrol').locator('strong')).toHaveText('1,38');
  await expect(flise(page, 'Styrkekontrol').locator('p')).toHaveText(
    'Krav: Pd/Fop,d > 1,01 (Pd udnyttet 73%)',
  );
  await expect(
    page.getByText(
      'Geonettet rulles ud på tværs af ledningen, så nettets styrke på langs af rullen udnyttes.',
    ),
  ).toBeVisible();
  await expect(flise(page, 'Kraftoverførsel Fbund').locator('strong')).toHaveText('8,50');
  const opdrift = page.locator('section.calc-card', {
    has: page.getByRole('heading', { name: '5 Opdrift og stabiliserende ballast' }),
  });
  await opdrift.getByRole('button', { name: 'Mellemregninger', exact: true }).click();
  // Mellemregningerne står i grupper med forklaring, formel og resultat.
  await expect(opdrift.locator('.beregning-titel')).toHaveText([
    'Opdrift',
    'Stabiliserende ballast',
    'Kontrol uden geonet',
  ]);
  for (const [forklaring, celler] of [
    ['Partialkoefficient på opdriften', ['γf = γG;dst = 1,1 · KFI = 1,1 · 1,0 (CC2)', '1,10']],
    ['Dybde fra terræn til rørmidten', ['T₃ = h₁ + d/2 = 1,50 + 2,50/2', '2,75 m']],
    [
      'Regningsmæssig opdrift',
      ['Od = π/4 · d² · γw · γf = π/4 · 2,50² · 10,00 · 1,10', '54,00 kN/m'],
    ],
    ['Fyld over GVS', ['T₂ · d · γtør,d = 0,00 · 2,50 · 14,40', '0,00 kN/m']],
    ['Fyld under GVS', ['(T₃ − T₂) · d · γ′d = 2,75 · 2,50 · 5,30', '36,44 kN/m']],
    ['Rørets øverste halvdel', ['(π/4 · d² · γ′d)/2 = (π/4 · 2,50² · 5,30)/2', '−13,01 kN/m']],
    ['Rørets egenvægt', ['Ed · g/1000 = 306,00 · 9,82/1000', '3,00 kN/m']],
    ['Stabiliserende ballast', ['Bd = 0,00 + 36,44 − 13,01 + 3,00', '26,43 kN/m']],
    ['Ballast i forhold til opdrift', ['S₁ = Bd/Od = 26,43/54,00 (krav ≥ 1,0)', '0,49 EJ OK']],
  ] as const)
    await mellemregning(opdrift, forklaring, [...celler]);
  await expect(
    opdrift.getByText(
      'Rørets egenvægt omregnes fra kg/m til kN/m med tyngdeaccelerationen g = 9,82 m/s².',
    ),
  ).toBeVisible();
  const udenOmslag = losning(page, 'Uden omslag, én ledning');
  // Mellemregningerne står i løsningskortets fulde bredde, ikke i kolonnen med tal.
  await expect(udenOmslag.locator(':scope > .dim-expander-card')).toHaveCount(1);
  await expect(udenOmslag.locator('.solution-details .dim-expander-card')).toHaveCount(0);
  await expect(udenOmslag.getByRole('row', { name: /Forankring pr. side/ })).toContainText(
    '1,70 m',
  );
  await expect(
    udenOmslag.getByText('Der forankres altid med mindst 1,0 m på hver side.'),
  ).toBeVisible();
  await udenOmslag.getByRole('button', { name: 'Mellemregninger' }).click();
  await mellemregning(udenOmslag, 'Samlet forankringslængde der skal til for at optage K', [
    'Beregnet 2L = K/Fbund = 28,94/8,50',
    '3,40 m',
  ]);
  await mellemregning(udenOmslag, 'Anvendt forankringslængde pr. side', [
    'Lgeonet = max(1,0; 2L/2) = max(1,0; 1,70)',
    '1,70 m',
  ]);
  await mellemregning(udenOmslag, 'Ballast og forankring i forhold til opdriften', [
    'Kontrol = (Bd + Fbund · 2 · Lgeonet)/Od = (26,43 + 8,50 · 2 · 1,70)/54,00 (krav > 1,0)',
    '1,03 OK',
  ]);
  const medOmslag = losning(page, 'Med omslag, én ledning');
  await expect(medOmslag.getByRole('row', { name: /Forankring pr. side/ })).toContainText('1,36 m');
  await expect(
    medOmslag.getByRole('row', { name: /inkl. 1,2 m tillæg til omslag og overlæg/ }),
  ).toContainText('10,98 m');
  await expect(
    losning(page, 'Med omslag, to ledninger').getByRole('row', { name: /inkl. 0,8 m tillæg/ }),
  ).toContainText('20,35 m');
  // Kontrollen ved omslag regnes som arket med en forklaring (K-08).
  await expect(page.getByRole('heading', { name: 'Kontrolpunkter' })).toBeVisible();
  await expect(page.getByText(/større margin end dimensioneringen \(fund K-08\)/)).toBeVisible();
  const forankring = page.locator('section.calc-card', {
    has: page.getByRole('heading', { name: '7 Forankring' }),
  });
  await forankring.getByRole('button', { name: 'Mellemregninger for kraftoverførsel' }).click();
  await mellemregning(forankring, 'Kraftoverførsel i nettets niveau ved rørmidten', [
    'Fbund = hbund · γ′d · μ · tan φd = 2,75 · 5,30 · 1,00 · tan 30,26°',
    '8,50 kN/m',
  ]);
  await mellemregning(forankring, 'Kraft forankringen skal dimensioneres for', [
    'K = Fop,d · S₂ = 27,56 · 1,05',
    '28,94 kN/m',
  ]);
  await expect(
    forankring.getByText(
      'Geonettet ligger under GVS, så kraftoverførslen regnes med γ′d. Forankringen på begge sider skal tilsammen optage K = Fop,d · S₂.',
    ),
  ).toBeVisible();
  // Mellemregningerne for geonet viser RF og P_d for det valgte net, ikke de øvrige net.
  const geonet = page.locator('section.calc-card', {
    has: page.getByRole('heading', { name: '6 Geonet' }),
  });
  await geonet.getByRole('button', { name: 'Mellemregninger', exact: true }).click();
  await expect(geonet.getByRole('row', { name: /Samlet reduktionsfaktor/ })).toContainText('2,11');
  await expect(geonet.getByRole('row', { name: /Kemisk påvirkning/ })).toContainText('1,22');
  // Forklaringerne står på én linje.
  await expect(
    geonet.getByRole('rowheader', { name: 'Resterende opdrift som skal optages af geonet' }),
  ).toHaveCSS('white-space', 'nowrap');
  await mellemregning(geonet, 'Resterende opdrift som skal optages af geonet', [
    'Fop,d = Od − Bd = 54,00 − 26,43',
    '27,56 kN/m',
  ]);
  await mellemregning(geonet, 'Samlet reduktionsfaktor', [
    'RF = fkryb · fm · fd · fe = 1,43 · 1,05 · 1,15 · 1,22',
    '2,11',
  ]);
  await mellemregning(geonet, 'Regningsmæssig trækstyrke geonettet kan levere', [
    'Pd = UTS/RF = 80/2,11',
    '37,98 kN/m',
  ]);
  await expect(geonet.getByText('RF beregnes som produktet af følgende faktorer:')).toBeVisible();
  await expect(
    geonet.getByText(
      'Reduktionsfaktorer fremgår af “British Board of Agreement” (BBA) certifikat No. 16/H253, se www.byggros.com',
    ),
  ).toBeVisible();
  await expect(geonet.getByRole('link', { name: 'www.byggros.com' })).toHaveAttribute(
    'href',
    'https://www.byggros.com',
  );
  await expect(flise(page, 'Valgt geonet').locator('p')).toHaveText(
    'Medregnet korttidstrækstyrke UTS = 80 kN/m',
  );
  await expect(geonet.getByRole('row', { name: /X-GRID/ })).toHaveCount(0);
});

test('ændring, feltfejl, nulstilling og genindlæsning', async ({ page }) => {
  await start(page);
  await saet(page, 'Rørdiameter d (m)', '3');
  await expect(flise(page, 'Regningsmæssig opdrift').locator('strong')).toHaveText('77,75');
  await saet(page, 'Rørdiameter d (m)', '0');
  const d = page.getByRole('spinbutton', { name: 'Rørdiameter d (m)' });
  await expect(d).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByText('Diameteren d skal være større end 0 m.')).toBeVisible();
  await expect(page.getByText('Beregningen vises, når inddata er rettet.')).toBeVisible();
  await page.getByRole('button', { name: 'Nulstil beregning' }).click();
  await expect(flise(page, 'Kontrol uden geonet').locator('strong')).toHaveText('0,49');
  await saet(page, 'Jorddækning h₁ (m)', '1');
  await expect(page.getByRole('status').filter({ hasText: 'Gemt i denne browser' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('spinbutton', { name: 'Jorddækning h₁ (m)' })).toHaveValue('1');
  await expect(page.getByRole('status').filter({ hasText: 'Gemt i denne browser' })).toBeVisible();
});

test('standardberegningen er låst til GVS i terræn, og S₁ ≥ 1,0 giver »Ikke relevant« i kort 6–7', async ({
  page,
}) => {
  await start(page);
  const geonet = page.locator('section.calc-card', {
    has: page.getByRole('heading', { name: '6 Geonet' }),
  });
  const manuelt = page.getByRole('checkbox', { name: 'Vælg geonet manuelt i 2 lag' });
  const mellemregninger = geonet.getByRole('button', { name: 'Mellemregninger', exact: true });
  // Et manuelt valg og åbne mellemregninger låses, når sikring ikke er nødvendig.
  await manuelt.click();
  await mellemregninger.click();
  await expect(geonet.getByText('RF beregnes som produktet af følgende faktorer:')).toBeVisible();
  const gvsFelt = page.getByRole('spinbutton', { name: 'GVS under terræn (m)' });
  const iTerraen = page.getByRole('checkbox', { name: 'GVS i terræn' });
  await expect(page.getByText(laasTekst)).toBeVisible();
  await expect(iTerraen).toBeChecked();
  await expect(iTerraen).toBeDisabled();
  await expect(gvsFelt).toBeDisabled();

  await page.getByRole('checkbox', { name: 'Avanceret beregning' }).click();
  await expect(page.getByText(laasTekst)).toHaveCount(0);
  await iTerraen.click();
  await expect(gvsFelt).toBeEnabled();
  await saet(page, 'GVS under terræn (m)', '2');
  // Kort 6 og 7 har samme note.
  await expect(
    page.getByText(
      'S₁ ≥ 1,0: opdriftssikring er ikke nødvendig da ballasten er tilstrækkelig til at modvirke opdriften.',
    ),
  ).toHaveCount(2);
  for (const label of [
    'Restopdrift',
    'Valgt geonet',
    'Designtrækstyrke',
    'Styrkekontrol',
    'Kraftoverførsel Fbund',
    'Kraftoverførsel Ftop',
    'Kraftoptagelse K',
  ])
    await expect(flise(page, label).locator('strong')).toHaveText('Ikke relevant');
  await expect(flise(page, 'Kraftoverførsel Fbund').locator('p')).toHaveCount(0);
  await expect(flise(page, 'Restopdrift').locator('.m9-result-value span')).toHaveCount(0);
  await expect(flise(page, 'Designtrækstyrke').locator('.m9-result-value span')).toHaveCount(0);
  await expect(flise(page, 'Styrkekontrol').locator('.m9-badge')).toHaveCount(0);
  await expect(manuelt).toBeDisabled();
  await expect(manuelt).not.toBeChecked();
  await expect(page.getByRole('combobox', { name: 'Produkt i 2 lag' })).toBeDisabled();
  await expect(mellemregninger).toBeDisabled();
  await expect(geonet.getByText('RF beregnes som produktet af følgende faktorer:')).toHaveCount(0);
  const forankring = page.locator('section.calc-card', {
    has: page.getByRole('heading', { name: '7 Forankring' }),
  });
  await expect(
    forankring.getByRole('button', { name: 'Mellemregninger for kraftoverførsel' }),
  ).toBeDisabled();
  await expect(forankring.locator('.calc-figure')).toHaveCount(0);
  await expect(
    losning(page, 'Uden omslag, én ledning').getByRole('row', { name: /Forankring pr. side/ }),
  ).toContainText('Ikke relevant');
  await expect(
    losning(page, 'Uden omslag, én ledning').getByRole('row', { name: /Opdriftskontrol/ }),
  ).toContainText('Ikke relevant');
  await expect(
    losning(page, 'Uden omslag, én ledning').getByRole('row', { name: /Opdriftskontrol/ }),
  ).not.toContainText(/OK/);
  for (const knap of await forankring
    .locator('.solution-card')
    .getByRole('button', { name: 'Mellemregninger' })
    .all())
    await expect(knap).toBeDisabled();
  await expect(page.getByText(/fund K-12/)).toBeVisible();
  const kort = page.locator('section.calc-card');
  await expect(kort.filter({ has: page.getByRole('heading', { name: '6 Geonet' }) })).toHaveClass(
    /is-dimmed/,
  );
  await expect(
    kort.filter({ has: page.getByRole('heading', { name: '7 Forankring' }) }),
  ).toHaveClass(/is-dimmed/);

  // Tilbage i standardberegningen regnes igen med GVS i terræn.
  await page.getByRole('checkbox', { name: 'Avanceret beregning' }).click();
  await expect(iTerraen).toBeChecked();
  await expect(gvsFelt).toBeDisabled();
  await expect(flise(page, 'Kontrol uden geonet').locator('strong')).toHaveText('0,49');
  // Det gemte manuelle valg vises igen, når sikring er nødvendig.
  await expect(manuelt).toBeEnabled();
  await expect(manuelt).toBeChecked();
  await expect(flise(page, 'Valgt geonet').locator('strong')).toHaveText('X-GRID 150 (2 lag)');
  await expect(mellemregninger).toBeEnabled();
  await expect(forankring.locator('.calc-figure')).toHaveCount(4);
});

test('det automatiske netvalg opfylder kravet 1,01 (K-03)', async ({ page }) => {
  await start(page);
  await saet(page, 'Rørdiameter d (m)', '2.6');
  await saet(page, 'Jorddækning h₁ (m)', '1');
  await expect(flise(page, 'Styrkekontrol').locator('.m9-badge')).toHaveText('OK');
  await expect(page.getByText(/er under kravet 1,01/)).toHaveCount(0);
});

test('alle fire løsninger vises, og der er ingen valg af antal eller konstruktion', async ({
  page,
}) => {
  await start(page);
  await expect(page.locator('.solution-card > h3')).toHaveText([
    'Uden omslag, én ledning',
    'Med omslag, én ledning',
    'Uden omslag, to ledninger',
    'Med omslag, to ledninger',
  ]);
  await expect(
    losning(page, 'Uden omslag, to ledninger').getByRole('row', { name: /Mellem ledningerne/ }),
  ).toBeVisible();
  await expect(
    losning(page, 'Med omslag, to ledninger').getByText(
      'Der er ingen opdriftskontrol for to ledninger. Ved to forskellige ledninger angives den største diameter og den mindste egenvægt.',
    ),
  ).toBeVisible();
  await expect(
    losning(page, 'Med omslag, to ledninger').getByText(
      'Afstanden mellem rørene skal være mindst 2 · Lgeonet.',
      { exact: false },
    ),
  ).toBeVisible();
  await expect(page.getByRole('radio')).toHaveText(['CC2', 'CC3']);
  await expect(page.getByText(/tank/i)).toHaveCount(0);

  // Omslag er ikke muligt, når rørmidten ligger højst 0,2 m under terræn.
  await saet(page, 'Rørdiameter d (m)', '0.1');
  await saet(page, 'Jorddækning h₁ (m)', '0');
  await expect(
    page.getByText('Omslag kræver, at rørmidten ligger mere end 0,2 m under terræn.'),
  ).toHaveCount(2);
  await expect(
    losning(page, 'Uden omslag, én ledning').getByRole('row', { name: /Forankring pr. side/ }),
  ).toBeVisible();
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
  await expect(flise(page, 'Designtrækstyrke').locator('strong')).toHaveText('142,41');
  await expect(flise(page, 'Styrkekontrol').locator('strong')).toHaveText('1,26');
  await expect(flise(page, 'Styrkekontrol').locator('p')).toHaveText(
    'Krav: Pd/Fop,d > 1,01 (Pd udnyttet 80%)',
  );
  await expect(
    losning(page, 'Uden omslag, én ledning').getByRole('row', { name: /Forankring pr. side/ }),
  ).toContainText('7,40 m');
  // Der regnes altid med 2 lag; antallet kan ikke vælges.
  await expect(page.getByRole('spinbutton', { name: /lag/ })).toHaveCount(0);
});

test('forudsætninger og konsekvensklasse står først på beregningssiden', async ({ page }) => {
  await start(page);
  await expect(page.locator('section.calc-card h2')).toHaveText([
    '1 Generelle beregningsforudsætninger',
    '2 Partialkoefficienter',
    '3 Geometri og grundvand',
    '4 Egenvægt og fyldmateriale',
    '5 Opdrift og stabiliserende ballast',
    '6 Geonet',
    '7 Forankring',
    'Kontrolpunkter',
  ]);
  await expect(page.getByRole('heading', { name: 'Projekteringsansvar' })).toBeVisible();
  await expect(page.getByText(/Opdriften regnes med/)).toHaveCount(0);
  await expect(page.locator('.klasse-kfi')).toHaveText('KFI = 1,0');
  await expect(page.getByText(/Regnearket svarer til CC2/)).toHaveCount(0);
  await expect(page.getByText('Analysen sker i konsekvensklasse CC2 (middel')).toBeVisible();
  // CC3 kan kun vælges i avanceret beregning.
  await expect(page.getByRole('radio', { name: 'CC3' })).toBeDisabled();
  await page.getByRole('checkbox', { name: 'Avanceret beregning' }).click();
  await page.getByRole('radio', { name: 'CC3' }).click();
  await expect(page.getByText('Analysen sker i konsekvensklasse CC3 (høj')).toBeVisible();
  await expect(page.locator('.klasse-kfi')).toHaveText('KFI = 1,1');
  await expect(flise(page, 'Regningsmæssig opdrift').locator('strong')).toHaveText('59,40');
  await expect(flise(page, 'Regningsmæssig opdrift').locator('p')).toHaveText('γf = 1,21');
  await page.getByRole('button', { name: 'Konsekvens for den aktuelle beregning' }).click();
  const sammenligning = page.locator('table.class-compare').last();
  await expect(sammenligning.locator('thead th')).toHaveText(['Størrelse', 'CC2', 'CC3']);
  await expect(sammenligning.getByRole('row', { name: /Regningsmæssig opdrift/ })).toHaveText(
    /54,00 kN\/m\s*59,40 kN\/m/,
  );
  // Tilbage i standardberegningen gælder CC2 igen.
  await page.getByRole('checkbox', { name: 'Avanceret beregning' }).click();
  await expect(page.getByRole('radio', { name: 'CC2' })).toBeChecked();
  await expect(page.getByRole('radio', { name: 'CC3' })).toBeDisabled();
  await expect(page.locator('.klasse-kfi')).toHaveText('KFI = 1,0');
  await page.getByRole('button', { name: 'Nulstil beregning' }).click();
  await expect(page.getByRole('radio', { name: 'CC2' })).toBeChecked();
  await page.goto('/#indstillinger');
  await expect(page.getByText(/Konsekvensklassen vælges i afsnit 2/)).toBeVisible();
  await expect(page.getByRole('radio')).toHaveCount(0);
});

test('X-GRID 200 vælges automatisk over X-GRID 150 (K-21)', async ({ page }) => {
  await start(page);
  await saet(page, 'Rørdiameter d (m)', '3.4');
  await saet(page, 'Jorddækning h₁ (m)', '1');
  await expect(flise(page, 'Valgt geonet').locator('strong')).toHaveText('X-GRID 200');
  await expect(flise(page, 'Styrkekontrol').locator('strong')).toHaveText('1,31');
  await expect(flise(page, 'Styrkekontrol').locator('.m9-badge')).toHaveText('OK');
});

test('CC3 kræver statikerkontrol og regner altid med GVS i terræn', async ({ page }) => {
  await start(page);
  await page.getByRole('checkbox', { name: 'Avanceret beregning' }).click();
  await page.getByRole('checkbox', { name: 'GVS i terræn' }).click();
  await saet(page, 'GVS under terræn (m)', '1');
  await expect(flise(page, 'Regningsmæssig opdrift').locator('strong')).toHaveText('54,00');
  await expect(flise(page, 'Stabiliserende ballast').locator('strong')).toHaveText('49,18');
  await page.getByRole('radio', { name: 'CC3' }).click();
  await expect(page.getByText(/kræves særskilt kontrol fra certificeret statiker/)).toBeVisible();
  await expect(page.getByText(/100-års hændelser for skybrud og oversvømmelse/)).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'GVS i terræn' })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'GVS i terræn' })).toBeDisabled();
  await expect(page.getByRole('spinbutton', { name: 'GVS under terræn (m)' })).toBeDisabled();
  await expect(flise(page, 'Stabiliserende ballast').locator('strong')).toHaveText('26,43');
  // Tilbage i CC2 gælder den indtastede GVS igen i den avancerede beregning.
  await page.getByRole('radio', { name: 'CC2' }).click();
  await expect(page.getByText(/kræves særskilt kontrol fra certificeret statiker/)).toHaveCount(0);
  await expect(flise(page, 'Stabiliserende ballast').locator('strong')).toHaveText('49,18');
});

test('avanceret beregning gælder kun, når den er valgt', async ({ page }) => {
  await start(page);
  await saet(page, 'Rørdiameter d (m)', '4');
  await saet(page, 'Jorddækning h₁ (m)', '0.6');
  // Standardberegningen regner med GVS i terræn.
  await expect(flise(page, 'Regningsmæssig opdrift').locator('strong')).toHaveText('138,23');
  await expect(page.getByText(/Beregninger på eget ansvar/)).toHaveCount(0);
  await expect(page.getByText(/Avanceret beregning er valgt/)).toHaveCount(0);

  await page.getByRole('checkbox', { name: 'Avanceret beregning' }).click();
  await expect(
    page.getByText(
      'Avanceret beregning er valgt. Ved GVS under terræn regnes forankringen med tør fyld over GVS.',
      { exact: false },
    ),
  ).toBeVisible();
  await page.getByRole('checkbox', { name: 'GVS i terræn' }).click();
  await saet(page, 'GVS under terræn (m)', '1.6');
  await expect(flise(page, 'Regningsmæssig opdrift').locator('strong')).toHaveText('111,21');
  await expect(flise(page, 'Stabiliserende ballast').locator('strong')).toHaveText('60,71');
  await expect(flise(page, 'Valgt geonet').locator('strong')).toHaveText('X-GRID 110');
  await expect(page.getByText(/Beregninger på eget ansvar/)).toBeVisible();
  await expect(page.getByText(/GVS ligger under toppen af røret/)).toHaveCount(0);
  await page.getByRole('button', { name: 'Mellemregninger', exact: true }).first().click();
  await expect(page.getByRole('img', { name: /Rørets tværsnit delt af GVS/ })).toBeVisible();
  // Formlerne står ved siden af figuren, og noterne står under dem i fuld bredde.
  await expect(
    page.locator('.mellemregninger-med-figur').locator('.beregning-tabel, .calc-figure'),
  ).toHaveCount(2);
  await expect(page.locator('.mellemregninger-med-figur .calc-note')).toHaveCount(0);
  await expect(
    page.locator('.mellemregninger:has(> .mellemregninger-med-figur) > p.calc-note'),
  ).toHaveCount(4);
  await mellemregning(page.locator('.mellemregninger-med-figur'), 'Rørets tværsnit over GVS', [
    'Atør = r² · arccos(a/r) − a · √(r² − a²)',
    '2,4567 m²',
  ]);
  await expect(
    page.getByText(/del af rørets udvendige tværsnit, der ligger under GVS/),
  ).toBeVisible();
  // Forankringen regnes med den faktiske spænding i nettets niveau (K-19).
  await expect(flise(page, 'Kraftoverførsel Fbund').locator('strong')).toHaveText('16,54');
  await page.getByRole('button', { name: 'Mellemregninger for kraftoverførsel' }).click();
  await expect(
    page.getByText(/σ′v,bund = T₂ · γtør,d \+ \(hbund − T₂\) · γ′d = 1,60/),
  ).toBeVisible();

  // Valget gemmes sammen med beregningen.
  await page.reload();
  await expect(page.getByRole('checkbox', { name: 'Avanceret beregning' })).toBeChecked();

  // GVS ved rørbunden: ingen opdrift.
  await saet(page, 'GVS under terræn (m)', '4.6');
  await expect(
    page.getByText('GVS ligger ved eller under rørbunden', { exact: false }),
  ).toBeVisible();
  await expect(flise(page, 'Kontrol uden geonet').locator('strong')).toHaveText('–');
  await expect(flise(page, 'Kontrol uden geonet').locator('p')).toHaveText('Ingen opdrift');

  // Uden afkrydsning regnes igen som standardberegningen med GVS i terræn.
  await page.getByRole('checkbox', { name: 'Avanceret beregning' }).click();
  await expect(page.getByText(laasTekst)).toBeVisible();
  await expect(flise(page, 'Regningsmæssig opdrift').locator('strong')).toHaveText('138,23');
  await expect(page.getByRole('img', { name: /Rørets tværsnit delt af GVS/ })).toHaveCount(0);
  await expect(flise(page, 'Kraftoverførsel Fbund').locator('strong')).toHaveText('8,04');
  await expect(page.getByText(/Beregninger på eget ansvar/)).toHaveCount(0);
});
