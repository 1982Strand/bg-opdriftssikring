import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  breadcrumb,
  defaultPage,
  documentTitle,
  isPageKey,
  navigationGroups,
  pageName,
} from '../src/ui/navigation.ts';

test('menuens grupper, rækkefølge, nøgler og navne følger planen', () => {
  assert.deepEqual(
    navigationGroups.map((group) => [
      group.label,
      group.items.map((item) => [item.key, item.name]),
    ]),
    [
      [
        'Beregning',
        [
          ['opdriftssikring', 'Opdriftssikring'],
          ['rapport', 'Rapport'],
        ],
      ],
      [
        'Opslag',
        [
          ['geonet', 'Geonet og faste værdier'],
          ['hjaelp', 'Hjælp og dokumentation'],
        ],
      ],
      ['Opsætning', [['indstillinger', 'Indstillinger']]],
    ],
  );
});

test('standardside, ukendte nøgler, sidenavn, sti og fanetitel', () => {
  assert.equal(defaultPage, 'opdriftssikring');
  assert.equal(isPageKey('ukendt'), false);
  assert.equal(isPageKey('rapport'), true);
  assert.equal(pageName('hjaelp'), 'Hjælp og dokumentation');
  assert.equal(breadcrumb('geonet'), 'Opslag / Geonet og faste værdier');
  assert.equal(documentTitle('rapport'), 'Rapport · Opdriftssikring');
  for (const group of navigationGroups)
    for (const item of group.items) {
      assert.equal(breadcrumb(item.key), `${group.label} / ${item.name}`);
      assert.equal(documentTitle(item.key), `${item.name} · Opdriftssikring`);
    }
});
