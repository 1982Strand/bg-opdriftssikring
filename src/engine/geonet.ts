import standarder from './defaults.json' with { type: 'json' };

export interface GeonetValg {
  uts: number | null;
  navn: string;
  automatisk: boolean;
  RF: number;
  Ptill: number | null;
  /** P_till/F_opdrift (E238), en sikkerhed; krav over 1,01. */
  sikkerhed: number | null;
  status: 'OK' | 'EJ OK' | null;
  tekst: string | null;
}

const { fKryb, fM, fD, fE } = standarder.geonet;
/** G213 og Navne tabel C44: samlet reduktionsfaktor. */
export const RF = fKryb * fM * fD * fE;

/** Produkterne fra databladet for X-GRID. Valggrænsen er P_till = UTS/RF for alle produkter
 * (beslutning om K-21). Regnearket havde ikke 130 og 200 og brugte 78,9 for 150 (K-02). */
export const geonetProdukter = standarder.geonet.produkter.map((p) => ({
  uts: p.uts,
  graense: p.uts / RF,
}));

export function vaelgGeonet(
  Fopdrift: number,
  overstyring: { uts: number; lag: number } | null,
): GeonetValg {
  if (overstyring) {
    // Som case 2 i arket: UTS og navn skrives ind over G207 og G199.
    const uts = overstyring.uts * overstyring.lag;
    return resultat(uts, `${overstyring.uts} (${overstyring.lag} lag)`, false, Fopdrift);
  }
  // G207 valgte det mindste produkt med F_opdrift < P_till. Appen vælger det mindste produkt, der
  // også opfylder kravet P_till/F_opdrift > 1,01 (fund K-03, beslutning 30. oktober 2026).
  const produkt = geonetProdukter.find((p) => Fopdrift * standarder.krav.geonet < p.graense);
  if (!produkt) {
    return {
      uts: null,
      navn: 'Der produceres ikke geonet med DEN valgte styrke', // G199
      automatisk: true,
      RF,
      Ptill: null, // G229, E238 og H238 giver #VALUE! i arket.
      sikkerhed: null,
      status: null,
      tekst: 'kontakt leverandør for råd', // G207
    };
  }
  return resultat(produkt.uts, String(produkt.uts), true, Fopdrift);
}

function resultat(uts: number, navn: string, automatisk: boolean, Fopdrift: number): GeonetValg {
  const Ptill = uts / RF; // G229
  const sikkerhed = Ptill / Fopdrift; // E238
  return {
    uts,
    navn,
    automatisk,
    RF,
    Ptill,
    sikkerhed,
    status: sikkerhed > standarder.krav.geonet ? 'OK' : 'EJ OK', // H238
    tekst: null,
  };
}
