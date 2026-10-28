import type { ReactNode } from 'react';

/** Ramme om en tabel, der kan rulle vandret på smalle skærme. Rammen kan få fokus, så den kan
 * rulles med tastaturet, og har en etiket til skærmlæsere. */
export function TabelRamme({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="table-wrap" role="region" aria-label={label} tabIndex={0}>
      {children}
    </div>
  );
}
