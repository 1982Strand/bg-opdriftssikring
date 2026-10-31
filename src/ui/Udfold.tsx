import type { ReactNode } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../components/ui/accordion';

/** Udfoldeligt felt til mellemregninger og supplerende tabeller. Et låst felt er lukket og kan
 * ikke foldes ud. */
export function Udfold({
  titel,
  laast = false,
  children,
}: {
  titel: string;
  laast?: boolean;
  children: ReactNode;
}) {
  // Nøglen genstarter feltet, så et åbent felt lukkes, når det låses.
  return (
    <Accordion
      key={laast ? 'laast' : 'aaben'}
      type="single"
      collapsible
      className="dim-expander-card"
    >
      <AccordionItem value="indhold" disabled={laast}>
        <AccordionTrigger>{titel}</AccordionTrigger>
        <AccordionContent className="mellemregninger">{children}</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
