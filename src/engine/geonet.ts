import standarder from './defaults.json' with { type: 'json' };

export interface GeonetValg {
  uts: number | null;
  navn: string;
  automatisk: boolean;
  RF: number;
  Ptill: number | null;
  udnyttelse: number | null;
  status: 'OK' | 'EJ OK' | null;
  tekst: string | null;
}

const { fKryb, fM, fD, fE } = standarder.geonet;
/** G213 og Navne tabel C44: samlet reduktionsfaktor. */
export const RF = fKryb * fM * fD * fE;

/** Navne tabel G44:K44. Valggrænsen er UTS/RF, men for 150 er den indtastet som 78,9 (K-02). */
export const geonetProdukter = standarder.geonet.produkter.map(
  (p: { uts: number; valggraense?: number }) => ({
    uts: p.uts,
    graense: p.valggraense ?? p.uts / RF,
    indtastetGraense: p.valggraense !== undefined,
  }),
);

export function vaelgGeonet(
  Fopdrift: number,
  overstyring: { uts: number; lag: number } | null,
): GeonetValg {
  if (overstyring) {
    // Som case 2 i arket: UTS og navn skrives ind over G207 og G199.
    const uts = overstyring.uts * overstyring.lag;
    return resultat(uts, `${overstyring.uts} (${overstyring.lag} lag)`, false, Fopdrift);
  }
  // G207: mindste UTS, hvor F_opdrift < valggrænsen.
  const produkt = geonetProdukter.find((p) => Fopdrift < p.graense);
  if (!produkt) {
    return {
      uts: null,
      navn: 'Der produceres ikke geonet med DEN valgte styrke', // G199
      automatisk: true,
      RF,
      Ptill: null, // G229, E238 og H238 giver #VALUE! i arket.
      udnyttelse: null,
      status: null,
      tekst: 'kontakt leverandør for råd', // G207
    };
  }
  return resultat(produkt.uts, String(produkt.uts), true, Fopdrift);
}

function resultat(uts: number, navn: string, automatisk: boolean, Fopdrift: number): GeonetValg {
  const Ptill = uts / RF; // G229
  const udnyttelse = Ptill / Fopdrift; // E238
  return {
    uts,
    navn,
    automatisk,
    RF,
    Ptill,
    udnyttelse,
    status: udnyttelse > standarder.krav.udnyttelse ? 'OK' : 'EJ OK', // H238
    tekst: null,
  };
}
