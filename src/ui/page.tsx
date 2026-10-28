import type { ReactNode } from 'react';
import { Calculator, CircleHelp, FileText, Grid3x3, Settings } from 'lucide-react';
import { breadcrumb, type PageKey } from './navigation';

export const pageIcons = {
  opdriftssikring: Calculator,
  rapport: FileText,
  geonet: Grid3x3,
  hjaelp: CircleHelp,
  indstillinger: Settings,
};

export function PageHeader({
  page,
  title,
  intro,
  status,
}: {
  page: PageKey;
  title: ReactNode;
  intro?: ReactNode;
  status?: ReactNode;
}) {
  return (
    <>
      <div className="breadcrumb">{breadcrumb(page)}</div>
      <div className="page-heading">
        <div>
          <h1>{title}</h1>
          {intro && <p className="intro">{intro}</p>}
        </div>
        {status && <div className="page-heading-actions">{status}</div>}
      </div>
    </>
  );
}

export function PageFooter({ children }: { children?: ReactNode }) {
  return (
    <footer className="page-footer">
      <span>{children}</span>
      <span>Opdriftssikring</span>
    </footer>
  );
}
