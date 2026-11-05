/** Hvad hver udgave må, som i MSL Dimensionering. Uden VITE_UDGAVE bygges den lokale udgave.
 * Dette er en visningsindstilling, ikke en sikkerhedsgrænse eller en hostingafhængighed. */

export type Udgave = 'lokal' | 'intern' | 'offentlig';

export interface Access {
  udgave: Udgave;
  /** Rapportsiden. */
  rapport: boolean;
  /** Firmaprofilen kan ses og redigeres. */
  firmaprofil: boolean;
  /** Medarbejderkartoteket: eget i browseren, den indbyggede liste eller intet. */
  kartotek: 'eget' | 'indbygget' | 'intet';
  /** Avanceret beregning og dens valgmuligheder, herunder GVS under terræn og CC3. */
  avanceretBeregning: boolean;
}

export const ACCESS: Record<Udgave, Access> = {
  lokal: {
    udgave: 'lokal',
    rapport: true,
    firmaprofil: true,
    kartotek: 'eget',
    avanceretBeregning: true,
  },
  intern: {
    udgave: 'intern',
    rapport: true,
    firmaprofil: false,
    kartotek: 'indbygget',
    avanceretBeregning: true,
  },
  offentlig: {
    udgave: 'offentlig',
    rapport: false,
    firmaprofil: false,
    kartotek: 'intet',
    avanceretBeregning: false,
  },
};

export function udgaveFraMiljoe(value: string | undefined): Udgave {
  return value === 'intern' || value === 'offentlig' ? value : 'lokal';
}
