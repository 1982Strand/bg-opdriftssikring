import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useSession } from './SessionContext';

export function SaveState() {
  const { saveError, saved } = useSession();
  return (
    <span className="save-state" role="status">
      {saveError ? (
        <AlertCircle size={15} aria-hidden="true" />
      ) : (
        <CheckCircle2 size={15} aria-hidden="true" />
      )}
      <span>{saveError ? 'Ikke gemt' : saved ? 'Gemt i denne browser' : 'Standarddata'}</span>
    </span>
  );
}
