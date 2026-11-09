# Forslag: reduktion for ender og gennemføringer som del af beregningsgangen

Status: besluttet 9. november 2026 med anbefalingerne 1a, 2a, 3a og 4a, jf. [BESLUTNINGER.md](BESLUTNINGER.md).

## 1. Baggrund

I dag er reduktionen et selvstændigt kort 8 i avanceret beregning. Kort 5–7 regner pr. meter rør, og kort 8 gentager opdrift, ballast, geonet og alle fire løsninger med figurer for den sikrede længde. Brugerens ønske 9. november 2026: reduktionen vælges i kort 3, og der dukker et ekstra kort op til længder, ender og gennemføringer. De følgende kort regner derefter med reduktionen, så beregningsgangen ligner den almindelige beregning, og der ikke kommer et ekstra sæt tegninger til sidst.

Beregningsmodellen er uændret, jf. [FORSLAG_SIKRET_LAENGDE.md](FORSLAG_SIKRET_LAENGDE.md). Kun opbygningen på skærm og i rapport ændres.

## 2. Kortene

Uden reduktion er kortene som i dag: 1–7 og 8 Dybere forankring i avanceret beregning.

Med reduktion:

| Kort | Indhold | Ændring |
|---|---|---|
| 1–2 | Forudsætninger og partialkoefficienter | Ingen |
| 3 Geometri og grundvand | d, h₁, GVS og tværsnit | Ny afkrydsning »Beregning med reduktion for ender og gennemføringer« under GVS-felterne, kun i avanceret beregning |
| 4 Længde, ender og gennemføringer (nyt) | L_rør, antal ender og deres udstrækning, antal gennemføringer og deres form og mål, længdesnit og forudsætninger | Indholdet fra nuværende kort 8's øverste del |
| 5 Egenvægt og fyldmateriale | E_k, γ, φ | Ingen |
| 6 Opdrift og stabiliserende ballast | O_d, B_d og S₁ | Regner for hele røret og pr. meter sikret længde |
| 7 Geonet | F_op,d og valgt net | F_op,d,s i stedet for F_op,d |
| 8 Forankring | K og løsning A–D | K_s, og hver løsning får rækken »Samlet netareal« |
| 9 Dybere forankring | Som i dag | Regner med K_s; ingen særlig tekst om kort 8 |

Kort 8 »Beregning med reduktion for gennemføringer« forsvinder.

## 3. Ændringerne i kort 6–8

**Kort 6.** Fliserne viser opdrift og ballast pr. meter sikret længde, så enhederne følger de næste kort:

- »Opdrift O_d,s« 68,53 kN/m med noten »O_d,tot = 548,26 kN på L_sikret = 8,00 m«.
- »Stabiliserende ballast B_d,s« 30,40 kN/m med noten »B_d,tot = 243,20 kN«.
- »Kontrol uden geonet S₁ = B_d,tot/O_d,tot« 0,44 EJ OK.

Mellemregningerne begynder som i dag med opdrift og ballast pr. meter rør. Derefter følger grupperne »Hele røret« (O_d · L_rør, gennemføringernes hulrum, O_d,tot, L_ballast og B_d,tot), »Pr. meter sikret længde« (O_d,s og B_d,s) og »Kontrol uden geonet« med S₁ for hele røret.

**Kort 7.** Som i dag med F_op,d,s = O_d,s − B_d,s. Fliserne og mellemregningerne får indekset s.

**Kort 8.** Som i dag med K_s = F_op,d,s · S₂. Løsningerne A–D regnes og tegnes én gang med K_s, B_d,s og O_d,s. Hver løsning får rækken »Samlet netareal A_geonet = L_geonet,tot · L_sikret«.

Tal fra tanken på 10 m med to ender på 0,60 m og én cirkulær gennemføring på 0,80 m. Det er den godkendte kontrolcase 1.

## 4. Fordele og konsekvenser

- Beregningsgangen er den samme med og uden reduktion, og løsningerne står kun ét sted.
- Kanttilfældet forsvinder, hvor S₁ ≥ 1 pr. meter, men under 1 for hele røret. Der er kun ét S₁, og det gælder hele røret.
- Resultaterne pr. meter rør uden reduktion vises ikke længere som et eget sæt. O_d og B_d pr. meter står som grundlag i mellemregningerne i kort 6.
- Kort 9 har ikke længere brug for en særlig tekst om, at der regnes med K fra kort 8.
- Fejl i kort 4 giver samme besked som andre fejl i inddata: »Beregningen vises, når inddata er rettet.«

## 5. Rapport

Rapporten følger skærmen. Med reduktion får den et nyt afsnit 4 »Længde, ender og gennemføringer« med inddata, længdesnit og forudsætninger, og de følgende afsnit rykker et nummer. Afsnit 6–8 viser de samme ændringer som kortene. Valget »Medtag beregning med reduktion for gennemføringer som afsnit 8« på rapportsiden udgår, fordi reduktionen er en del af beregningen. Projektbeskrivelsen på forsiden får linjen »Længde 10,00 m, regnet med reduktion for ender og gennemføringer«.

## 6. Spørgsmål til beslutning

Anbefalingen står først.

1. **Nummerering.** a) Det nye kort bliver kort 4, og de følgende kort rykker et nummer, kun når reduktionen er valgt. Uden reduktion er numrene som i dag. b) Det nye kort får et fast nummer, fx 3a, og de øvrige numre er altid de samme.
2. **Titel på det nye kort.** a) »Længde, ender og gennemføringer« som de andre inddatakort. b) »Reduktion for ender og gennemføringer«.
3. **Fliserne i kort 6.** a) Pr. meter sikret længde i kN/m med de samlede værdier i noten. b) De samlede værdier i kN med værdierne pr. meter sikret længde i noten.
4. **Rapport.** a) Afsnittene følger skærmen, og valget på rapportsiden udgår. b) Valget på rapportsiden bevares.

Beslutningen fra 9. november 2026 om kun at vise reduktionen i avanceret beregning (spørgsmål 2a i FORSLAG_SIKRET_LAENGDE.md) gælder fortsat.

## 7. Implementering efter beslutning

- Motoren er uændret. Siden bruger resultatet pr. meter sikret længde fra `beregnReduktion` i kort 6–9, når reduktionen er valgt.
- Kortnumre og henvisninger som »kort 7« og »afsnit 7« beregnes ud fra, om reduktionen er valgt.
- Mellemregningerne i kort 6 får de nye grupper, og symbolerne følger reduktionen i kort 6–9.
- Kort 8 og afsnit 8 med reduktion fjernes, og det samme gør valget på rapportsiden og den særlige tekst i kort 9.
- De godkendte kontroltal er uændrede. Testene for kort 8 flyttes til den nye opbygning.
