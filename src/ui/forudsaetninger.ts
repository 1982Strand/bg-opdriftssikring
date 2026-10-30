/** Regnearkets generelle beregningsforudsætninger (Rapporten A39:A69) med rettet stavning.
 * Konsekvensklassen følger valget i stedet for arkets faste »middel konsekvensklasse«.
 * Teksterne bruges på beregningssiden og senere i rapporten. */
import type { Konsekvensklasse } from '../engine/opdrift.ts';

const klassenavn: Record<Konsekvensklasse, string> = { CC2: 'middel', CC3: 'høj' };

export const betingelser = (klasse: Konsekvensklasse) => [
  'Forudsætninger vedrørende geometri, materialeparametre, belastninger m.v., som måtte have indflydelse på konstruktionen, er baseret på kundens oplysninger.',
  'Beregningen gælder pr. løbende meter for et tomt, cirkulært rør i homogent friktionsfyld med geonettet ført symmetrisk om røret.',
  'Dimensionering af geonet er baseret på en designmæssig levetid på 120 år, indbygget i < 35 mm tilfyldsjord med en pH-værdi i området 4,1–8,9.',
  'Partialkoefficienter indregnes i henhold til British Board of Agrément (BBA).',
  'Analysen foretages under anvendelse af DS/EN 1997-1 DK NA:2021 (Eurocode 7).',
  `Analysen sker i konsekvensklasse ${klasse} (${klassenavn[klasse]} konsekvensklasse).`,
  'Vedlagte beregninger, skitser, vejledninger og teori er baseret på vores nuværende viden og erfaring.',
];

export const projekteringsansvar = [
  'Byggros påtager sig som udgangspunkt ikke projekteringsopgaver, medmindre der indgås aftale herom. Alle forslag, vurderinger, beregninger og tegninger mv. fra Byggros udarbejdes som en vederlagsfri service. Medmindre andet udtrykkeligt er aftalt skriftligt, fraskriver Byggros sig ansvaret for indholdet og anvendelsen af sådanne forslag mv. I øvrigt gælder Byggros’ salgs- og leveringsbetingelser, hvortil der henvises.',
  'Såfremt der er indgået aftale om projekteringsansvar på sagen, vil omfanget alene omfatte udarbejdelse af nærværende beregning. Det forudsættes, at alle anvendte koter og øvrige indgangsparametre er verificeret af udførende entreprenør og rådgiver. Eventuel indgået projekteringsaftale vil være økonomisk begrænset til 5 gange honoraret.',
];
