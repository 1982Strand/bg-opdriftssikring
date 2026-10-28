/** Den aktuelle beregning og indstillingerne, delt mellem siderne og gemt i browseren. */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { loadSession, saveSession, standardSession, STORAGE_KEY, type Session } from './state';

type Ctx = {
  session: Session;
  update: (s: Session) => void;
  /** Sidste gemning mislykkedes; ændringerne findes kun i den åbne fane. */
  saveError: boolean;
  /** Sessionen ligger i browserens lager. */
  saved: boolean;
  externalChange: boolean;
  loadMessage: string | null;
  reload: () => void;
};
const SessionCtx = createContext<Ctx | null>(null);

const UTILGAENGELIGT = 'Browserens lager er ikke tilgængeligt. Ændringer gemmes ikke.';

function indlaes() {
  let lager: Storage | null = null;
  try {
    lager = localStorage;
  } catch {
    // Lageret kan være blokeret, fx i privat browsing.
  }
  if (!lager) return { session: standardSession(), saved: false, message: UTILGAENGELIGT };
  const r = loadSession(lager);
  let fundet = false;
  try {
    fundet = lager.getItem(STORAGE_KEY) !== null;
  } catch {
    // Behandles som ikke gemt.
  }
  return { session: r.session, saved: fundet && !r.error, message: r.message ?? null };
}

export function SessionProvider({ children }: { children: ReactNode }) {
  // Indlæses før første visning, så standardværdierne ikke blinker.
  const [start] = useState(indlaes);
  const [session, setSession] = useState(start.session);
  const [saved, setSaved] = useState(start.saved);
  const [saveError, setSaveError] = useState(false);
  const [externalChange, setExternalChange] = useState(false);
  const [loadMessage, setLoadMessage] = useState<string | null>(start.message);

  const update = (next: Session) => {
    setSession(next);
    let ok = false;
    try {
      ok = saveSession(localStorage, next);
    } catch {
      ok = false;
    }
    setSaved(ok);
    setSaveError(!ok);
    setLoadMessage(ok ? null : UTILGAENGELIGT);
  };
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY || e.key === null) setExternalChange(true);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  const reload = () => {
    const next = indlaes();
    setSession(next.session);
    setSaved(next.saved);
    setSaveError(false);
    setLoadMessage(next.message);
    setExternalChange(false);
  };
  const value = useMemo(
    () => ({ session, update, saveError, saved, externalChange, loadMessage, reload }),
    // update og reload bruger kun state-settere og den aktuelle session.
    [session, saveError, saved, externalChange, loadMessage],
  );
  return <SessionCtx.Provider value={value}>{children}</SessionCtx.Provider>;
}

export function useSession() {
  const x = useContext(SessionCtx);
  if (!x) throw new Error('SessionProvider mangler');
  return x;
}
