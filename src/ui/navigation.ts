/** Menuens grupper og sider. Modulet bruger ikke React, så det kan afprøves med node --test. */
export const navigationGroups = [
  {
    label: 'Beregning',
    items: [
      { key: 'opdriftssikring', name: 'Opdriftssikring' },
      { key: 'rapport', name: 'Rapport' },
    ],
  },
  {
    label: 'Opslag',
    items: [
      { key: 'geonet', name: 'Geonet og faste værdier' },
      { key: 'hjaelp', name: 'Hjælp og dokumentation' },
    ],
  },
  { label: 'Opsætning', items: [{ key: 'indstillinger', name: 'Indstillinger' }] },
] as const;

export type PageKey = (typeof navigationGroups)[number]['items'][number]['key'];

export const defaultPage: PageKey = 'opdriftssikring';

export function isPageKey(value: string): value is PageKey {
  return navigationGroups.some((group) => group.items.some((item) => item.key === value));
}

function find(page: PageKey) {
  for (const group of navigationGroups)
    for (const item of group.items) if (item.key === page) return { group: group.label, ...item };
  throw new Error(`Ukendt side: ${page}`);
}

export const pageName = (page: PageKey) => find(page).name;

/** Stien følger menuens grupper, fx »Opslag / Geonet og faste værdier«. */
export function breadcrumb(page: PageKey) {
  const { group, name } = find(page);
  return `${group} / ${name}`;
}

/** Fanens titel, fx »Rapport · Opdriftssikring«. */
export const documentTitle = (page: PageKey) => `${pageName(page)} · Opdriftssikring`;
