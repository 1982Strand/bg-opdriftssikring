import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../components/ui/accordion';
import { KraftensVej } from './KraftensVej';
import { pageName } from './navigation';
import { PageFooter, PageHeader } from './page';
import './hjaelp.css';

/** Siden »Hjælp og dokumentation« med foldbare kapitler som i MSL Dimensionering. */
export function Hjaelp() {
  return (
    <>
      <PageHeader
        page="hjaelp"
        title={pageName('hjaelp')}
        intro="Beregningsgrundlag og brugervejledning."
      />
      <Accordion type="multiple" defaultValue={['kraftens-vej']} className="help-chapters">
        <AccordionItem value="kraftens-vej" className="help-chapter">
          <AccordionTrigger className="help-chapter-trigger">
            <span className="help-chapter-number">1</span>
            <span className="help-chapter-summary">
              <span className="help-chapter-title">Kraftens vej i geonettet</span>
              <span className="help-chapter-resume">
                Trækket i nettet, knækket og trissevirkningen.
              </span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="help-chapter-content">
            <KraftensVej />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <PageFooter />
    </>
  );
}
