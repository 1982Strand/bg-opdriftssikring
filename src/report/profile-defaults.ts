/** Firmaets standardprofil. Logo, slogan, sidefod og mål er de samme som i MSL Dimensionering. */
export type ReportFont = 'Carlito' | 'Liberation Sans';
/** B-048: kartoteket er profildata, ikke rapportens underskrift. */
export interface Employee {
  navn: string;
  initialer: string;
  mail: string;
  telefon: string;
}
export interface CompanyProfile {
  medarbejdere: Employee[];
  logo: string;
  logo_bredde_mm: number;
  logo_paa_alle_sider: boolean;
  logo_top_mm: number;
  logo_hoejre_mm: number;
  sidehoved_afstand_mm: number;
  sidefod_afstand_mm: number;
  slogan: string;
  slogan_top_mm: number;
  slogan_hoejre_mm: number;
  sidefod: string;
  farve: string;
  sidefod_tekstfarve: string;
  overskrifter_i_farve: boolean;
  skrift: {
    broedtekst: ReportFont;
    sidehoved: ReportFont;
    stoerrelse_pt: number;
    sidehoved_pt: number;
    sidefod_pt: number;
    sidetal_pt: number;
    titel_pt: number;
    projekt_pt: number;
  };
  margener_mm: { top: number; bund: number; venstre: number; hoejre: number };
  sidefod_hoejde_mm: number;
  sidetal_fra_bund_mm: number;
  titel: string;
  by: string;
  sidetal: 'klammer' | 'side-af';
}

export const DEFAULT_COMPANY_PROFILE: CompanyProfile = {
  medarbejdere: [],
  logo: 'assets/logo.jpeg',
  logo_bredde_mm: 1534537 / 36000,
  logo_paa_alle_sider: true,
  logo_top_mm: (18.15 * 25.4) / 72,
  logo_hoejre_mm: ((595.3 - 440.65 - 120.77) * 25.4) / 72,
  sidehoved_afstand_mm: (709 * 25.4) / 1440,
  sidefod_afstand_mm: (981 * 25.4) / 1440,
  slogan: 'Skaber sikre løsninger',
  slogan_top_mm: (55.72 * 25.4) / 72,
  slogan_hoejre_mm: (31 * 25.4) / 72,
  sidefod: 'BG Byggros A/S | Østbirkvej 2 | 5240 Odense NV | Tlf. 5948 9000 | www.byggros.com',
  farve: '#247322',
  sidefod_tekstfarve: '#ffffff',
  overskrifter_i_farve: false,
  skrift: {
    broedtekst: 'Carlito',
    sidehoved: 'Liberation Sans', // header2/footer2: HelveticaNeueLTStd-Roman; Helvetica/Arial-substitution.
    stoerrelse_pt: 11,
    sidehoved_pt: 9,
    sidefod_pt: 9,
    sidetal_pt: 9,
    titel_pt: 24,
    projekt_pt: 16,
  },
  margener_mm: {
    top: (1701 * 25.4) / 1440,
    bund: (1560 * 25.4) / 1440,
    venstre: (1134 * 25.4) / 1440,
    hoejre: (1134 * 25.4) / 1440,
  },
  sidefod_hoejde_mm: (44 * 25.4) / 72,
  sidetal_fra_bund_mm: (64.36 * 25.4) / 72,
  titel: 'NOTAT – Opdriftssikring',
  by: 'Odense',
  sidetal: 'klammer',
};

export const REPORT_FONT_FILES = [
  'Carlito-Regular',
  'Carlito-Bold',
  'Carlito-Italic',
  'Carlito-BoldItalic',
  'LiberationSans-Regular',
  'LiberationSans-Bold',
  'LiberationSans-Italic',
  'LiberationSans-BoldItalic',
].map((name) => `${name}.ttf`);
