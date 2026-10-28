/** Tal med dansk komma, tusindtalspunktum og rigtigt minustegn, fx 12.345,60 og −6,60.
 * Manglende værdier (som `#VALUE!` i regnearket) vises som tankestreg. */
export function tal(x: number | null | undefined, decimaler = 2): string {
  if (x == null || !Number.isFinite(x)) return '–';
  const tekst = new Intl.NumberFormat('da-DK', {
    minimumFractionDigits: decimaler,
    maximumFractionDigits: decimaler,
  }).format(x);
  // Et tal, der afrundes til nul, vises uden fortegn.
  return /^-0(,0*)?$/.test(tekst) ? tekst.slice(1) : tekst.replace(/^-/, '−');
}
