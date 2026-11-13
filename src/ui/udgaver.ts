/** Hvad hver udgave må, som i MSL Dimensionering. Uden VITE_UDGAVE bygges den lokale udgave.
 * Dette er en visningsindstilling, ikke en sikkerhedsgrænse eller en hostingafhængighed. */

export type Udgave = 'lokal' | 'intern' | 'offentlig';

export interface Access {
  udgave: Udgave;
  /** Rapportsiden. */
  rapport: boolean;
  /** Avanceret beregning og dens valgmuligheder, herunder GVS under terræn og CC3. */
  avanceretBeregning: boolean;
}

export const ACCESS: Record<Udgave, Access> = {
  lokal: {
    udgave: 'lokal',
    rapport: true,
    avanceretBeregning: true,
  },
  intern: {
    udgave: 'intern',
    rapport: true,
    avanceretBeregning: true,
  },
  offentlig: {
    udgave: 'offentlig',
    rapport: false,
    avanceretBeregning: false,
  },
};

export function udgaveFraMiljoe(value: string | undefined): Udgave {
  return value === 'intern' || value === 'offentlig' ? value : 'lokal';
}
