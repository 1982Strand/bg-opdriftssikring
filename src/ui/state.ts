import type { Konsekvensklasse, OpdriftInput } from '../engine/opdrift.ts';
import standarder from '../engine/defaults.json' with { type: 'json' };

export interface Session {
  inddata: {
    d: number;
    h1: number;
    gvs: number;
    gvsITerraen: boolean;
    roervaegt: number;
    gamma: number;
    gammaTor: number;
    phi: number;
    overstyringAktiv: boolean;
    /** UTS pr. lag ved manuelt valg; der regnes altid med 2 lag. */
    produkt: number;
  };
  konsekvensklasse: Konsekvensklasse;
  /** Avanceret beregning (docs/FORSLAG_K-05.md); ellers regnes som regnearket. */
  avanceret: boolean;
}
export const STORAGE_KEY = 'opdrift.session';
export const standardSession = (): Session => ({
  inddata: {
    d: 2.5,
    h1: 1.5,
    gvs: 0,
    gvsITerraen: true,
    roervaegt: 340,
    gamma: 17,
    gammaTor: 16,
    phi: 35,
    overstyringAktiv: false,
    produkt: 150,
  },
  konsekvensklasse: 'CC2',
  avanceret: false,
});
export function tilMotorInput(s: Session): OpdriftInput {
  const i = s.inddata;
  return {
    d: i.d,
    h1: i.h1,
    // Standardberegningen og CC3 regnes altid med GVS i terræn; den indtastede GVS gemmes til den
    // avancerede beregning i CC2.
    gvs: i.gvsITerraen || s.konsekvensklasse === 'CC3' || !s.avanceret ? 0 : i.gvs,
    roervaegt: i.roervaegt,
    gamma: i.gamma,
    gammaTor: i.gammaTor,
    phi: i.phi,
    konsekvensklasse: s.konsekvensklasse,
    overstyring: i.overstyringAktiv
      ? { uts: i.produkt, lag: standarder.geonet.lagVedManueltValg }
      : null,
    metode: s.avanceret ? 'avanceret' : 'standard',
  };
}
const num = (v: unknown, d: number, min = -Infinity, max = Infinity) =>
  typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max ? v : d;
export function parseSession(raw: string): { session: Session; error: boolean; message?: string } {
  const standard = standardSession();
  try {
    const x = JSON.parse(raw);
    if (!x || typeof x !== 'object' || !x.inddata || typeof x.inddata !== 'object')
      return {
        session: standard,
        error: true,
        message: 'Gemte data kunne ikke indlæses. Standardværdier er indlæst.',
      };
    const i = x.inddata;
    return {
      session: {
        inddata: {
          d: typeof i.d === 'number' && Number.isFinite(i.d) && i.d > 0 ? i.d : 2.5,
          h1: num(i.h1, 1.5, 0),
          gvs: num(i.gvs, 0, 0),
          gvsITerraen: typeof i.gvsITerraen === 'boolean' ? i.gvsITerraen : true,
          roervaegt: num(i.roervaegt, 340, 0),
          gamma:
            typeof i.gamma === 'number' && Number.isFinite(i.gamma) && i.gamma * 0.9 > 10
              ? i.gamma
              : 17,
          gammaTor:
            typeof i.gammaTor === 'number' && Number.isFinite(i.gammaTor) && i.gammaTor > 0
              ? i.gammaTor
              : 16,
          phi:
            typeof i.phi === 'number' && Number.isFinite(i.phi) && i.phi > 0 && i.phi < 90
              ? i.phi
              : 35,
          overstyringAktiv: typeof i.overstyringAktiv === 'boolean' ? i.overstyringAktiv : false,
          produkt: standarder.geonet.produkter.some((p) => p.uts === i.produkt) ? i.produkt : 150,
        },
        konsekvensklasse: ['CC2', 'CC3'].includes(x.konsekvensklasse) ? x.konsekvensklasse : 'CC2',
        avanceret: x.avanceret === true,
      },
      error: false,
    };
  } catch {
    return {
      session: standard,
      error: true,
      message: 'Gemte data kunne ikke indlæses. Standardværdier er indlæst.',
    };
  }
}
export function loadSession(storage: Pick<Storage, 'getItem'>): {
  session: Session;
  error: boolean;
  message?: string;
} {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return raw ? parseSession(raw) : { session: standardSession(), error: false };
  } catch {
    return { session: standardSession(), error: true, message: 'Lageret er ikke tilgængeligt.' };
  }
}
export function saveSession(storage: Pick<Storage, 'setItem'>, session: Session): boolean {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, ...session }));
    return true;
  } catch {
    return false;
  }
}
