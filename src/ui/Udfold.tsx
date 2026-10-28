import type { ReactNode } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../components/ui/accordion';

/** Udfoldeligt felt til mellemregninger og supplerende tabeller. */
export function Udfold({ titel, children }: { titel: string; children: ReactNode }) {
  return (
    <Accordion type="single" collapsible className="dim-expander-card">
      <AccordionItem value="indhold">
        <AccordionTrigger>{titel}</AccordionTrigger>
        <AccordionContent className="mellemregninger">{children}</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
