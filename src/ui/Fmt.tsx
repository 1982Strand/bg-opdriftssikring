/** Tekst med sænket skrift skrevet som `L_{geonet}`, samme notation som i figurerne. */
export function Fmt({ text }: { text: string }) {
  const dele = text.split(/_\{([^}]*)\}/);
  return <>{dele.map((del, i) => (i % 2 ? <sub key={i}>{del}</sub> : del))}</>;
}

/** Teksten uden markering, fx til aria-label: `L_{geonet}` bliver `Lgeonet`. */
export const ren = (text: string) => text.replace(/_\{([^}]*)\}/g, '$1');
