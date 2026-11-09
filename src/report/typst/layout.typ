// Alle variable værdier læses som JSON; ingen eval/markup fra formularfelter.
// Sidehoved, sidefod og sidetal følger MSL-rapporten; indholdet følger opdriftsrapporten.

// Fælles målinger til sidens opbygning.
#let rapport-geometri(profil) = {
  let m = profil.margener_mm
  let skrift = profil.skrift
  let body-width = (210 - m.venstre - m.hoejre) * 1mm
  let logo = measure(image(profil.logo, width: profil.logo_bredde_mm * 1mm))
  let slogan = measure(text(font: skrift.sidehoved, size: skrift.sidehoved_pt * 1pt,
    style: "italic", top-edge: "cap-height", bottom-edge: "baseline", ligatures: false, profil.slogan))
  let footer = measure(text(font: skrift.sidehoved, size: skrift.sidefod_pt * 1pt,
    top-edge: "cap-height", bottom-edge: "baseline", ligatures: false, profil.sidefod))
  let page-number = measure(text(font: skrift.sidehoved, size: skrift.sidetal_pt * 1pt,
    top-edge: "cap-height", bottom-edge: "baseline", "[1]"))
  // Et større logo flytter slogan og brødtekst ned; små marginer er minimumsafstande.
  let slogan-top = calc.max(profil.slogan_top_mm * 1mm,
    profil.logo_top_mm * 1mm + logo.height + 0.5mm)
  let wrap-footer = footer.width > body-width
  let footer-text = if wrap-footer {
    measure(block(width: body-width)[#set par(leading: 0pt, spacing: 0pt)
      #text(font: skrift.sidehoved, size: skrift.sidefod_pt * 1pt,
        top-edge: "ascender", bottom-edge: "descender", ligatures: false, profil.sidefod)])
  } else { footer }
  let footer-height = calc.max(profil.sidefod_hoejde_mm * 1mm, footer-text.height + 4mm)
  let page-number-offset = calc.max(profil.sidetal_fra_bund_mm * 1mm, footer-height + 5mm)
  (
    slogan_top: slogan-top,
    footer_height: footer-height,
    footer_wrap: wrap-footer,
    page_number_offset: page-number-offset,
    top: calc.max(m.top * 1mm, slogan-top + slogan.height + 2mm),
    bottom: calc.max(m.bund * 1mm, page-number-offset + page-number.height + 2mm),
    body_width: body-width,
  )
}

#let rapport(profil, data) = context {
  let farve = rgb(profil.farve)
  let tone = farve.lighten(88%)
  let graa = luma(70)
  let regel = luma(110)
  let m = profil.margener_mm
  let skrift = profil.skrift
  let geometri = rapport-geometri(profil)
  set document(title: profil.titel + " - " + data.forside.projekt, author: data.forside.forfatter, date: none)
  set text(font: skrift.broedtekst, size: skrift.stoerrelse_pt * 1pt, lang: "da",
    hyphenate: false, ligatures: false, top-edge: "ascender", bottom-edge: "descender")
  set par(leading: 0pt, spacing: 0pt)
  set block(above: 0pt, below: 0pt)
  let sidetal() = {
    let nr = counter(page).display("1")
    if profil.sidetal == "side-af" { [Side #nr af #counter(page).final().first()] }
    else { [\[#nr\]] }
  }
  set page(paper: "a4",
    margin: (top: geometri.top, bottom: geometri.bottom, left: m.venstre * 1mm, right: m.hoejre * 1mm),
    background: context {
      set text(font: skrift.sidehoved, top-edge: "cap-height", bottom-edge: "baseline")
      if profil.logo_paa_alle_sider or counter(page).get().first() == 1 {
        place(top + right, dx: -profil.logo_hoejre_mm * 1mm, dy: profil.logo_top_mm * 1mm,
          image(profil.logo, width: profil.logo_bredde_mm * 1mm))
        place(top + right, dx: -profil.slogan_hoejre_mm * 1mm, dy: geometri.slogan_top,
          text(size: skrift.sidehoved_pt * 1pt, style: "italic", profil.slogan))
      }
      let kontakt = text(size: skrift.sidefod_pt * 1pt,
        fill: rgb(profil.sidefod_tekstfarve), profil.sidefod)
      if geometri.footer_wrap {
        kontakt = block(width: geometri.body_width,
          text(size: skrift.sidefod_pt * 1pt, top-edge: "ascender", bottom-edge: "descender",
            fill: rgb(profil.sidefod_tekstfarve), profil.sidefod))
      }
      place(bottom, block(width: 100%, height: geometri.footer_height, fill: farve,
        align(center + horizon, kontakt)))
      place(bottom + center, dy: -geometri.page_number_offset,
        text(size: skrift.sidetal_pt * 1pt, sidetal()))
    },
  )
  let overskriftfarve = if profil.overskrifter_i_farve { farve } else { black }
  show heading: it => block(sticky: true, below: 2.4mm, text(weight: "bold", fill: overskriftfarve,
    size: if it.level == 1 { 13pt } else { 12pt }, it.body))

  // Tekst med sænket skrift kommer som stykker fra TypeScript, aldrig som Typst-opmærkning.
  let tekst(dele) = {
    for d in dele {
      if d.sub { sub(typographic: false, size: 0.72em, baseline: 0.22em, [#d.t]) } else { [#d.t] }
    }
  }
  let dobbeltstreg = stack(dir: ttb, spacing: 0.45mm,
    line(length: 100%, stroke: 0.25mm), line(length: 100%, stroke: 0.25mm))
  // Inputværdier er grønne. I løbende tekst står de på samme grundlinje som teksten og i tabeller
  // på linje med de beregnede værdier.
  let inddata(vaerdi, bredde: auto) = {
    let v = text(fill: farve, weight: "bold", vaerdi)
    if bredde == auto { v } else { box(width: bredde, inset: (x: 1.6mm), align(right, v)) }
  }
  let statusfarve(s) = if s == "OK" { farve } else { rgb("#b42318") }

  // Formlen med forklaring, symboler og tal til venstre og resultatet til højre.
  let regning(b) = block(breakable: false, below: 2.6mm, grid(
    columns: (1fr, 50mm), column-gutter: 3mm, align: left + bottom,
    {
      // Sænket skrift må ikke ramme linjen nedenunder.
      set par(leading: 0.9mm)
      if b.forklaring != none {
        tekst(b.forklaring)
        if b.detalje != none { text(size: 9pt, fill: graa, [ (#tekst(b.detalje))]) }
        linebreak()
      }
      tekst(b.formel)
      if b.tal != none { linebreak(); text(fill: graa, tekst(b.tal)) }
    },
    if b.vaerdi != none {
      let vaegt = if b.hoved { "bold" } else { "regular" }
      let raekke = if b.status != none {
        grid(columns: (5mm, 1fr, 11mm, 12mm), align: (left, right, right, right),
          [=], text(weight: "bold", b.vaerdi), text(b.krav), text(weight: "bold", fill: statusfarve(b.status), b.status))
      } else {
        grid(columns: (5mm, 1fr, 16mm), column-gutter: (0mm, 1.6mm), align: (left, right, left),
          text(weight: vaegt, [=]), text(weight: vaegt, b.vaerdi), text(weight: vaegt, b.enhed))
      }
      raekke
      v(0.5mm)
      if b.hoved { dobbeltstreg } else { line(length: 100%, stroke: 0.25mm) }
    },
  ))
  let resultat(b) = block(breakable: false, above: 1.6mm, below: 2.6mm, {
    grid(columns: (1fr, auto), column-gutter: 6mm,
      text(weight: "bold", size: 11.5pt, tekst(b.tekst)), text(weight: "bold", size: 11.5pt, b.vaerdi))
    v(0.7mm)
    dobbeltstreg
  })
  // Almindelig tabel med net; `tal` angiver de højrestillede kolonner.
  let tabel(b) = block(breakable: false, above: 1mm, below: 3mm, {
    set text(size: 10pt)
    table(columns: b.kolonner.map(k => if k == "auto" { auto } else if k == "1fr" { 1fr } else { float(k) * 1mm }),
      stroke: 0.2mm + regel, inset: (x: 1.8mm, y: 0.8mm),
      align: (x, y) => if b.tal.contains(x) { right } else { left },
      fill: (x, y) => if y == 0 and b.hoved.len() > 0 { tone },
      ..b.hoved.map(c => strong(tekst(c))),
      ..b.raekker.enumerate().map(((i, r)) => r.map(c =>
        if b.sum == i { strong(tekst(c)) } else { tekst(c) })).flatten(),
    )
  })
  // Værdi og enhed i hver sin kolonne, så tallene flugter.
  let vaerditabel(b) = block(breakable: false, above: 1mm, below: 3mm, {
    set text(size: 10pt)
    let celle(c) = table.cell(stroke: (right: none), align: right + horizon, c)
    let enhed(c) = table.cell(stroke: (left: none), align: left + horizon, c)
    table(columns: (1fr, auto, auto, auto, auto, auto, auto), stroke: 0.2mm + regel,
      inset: (x: 1.8mm, y: 0.9mm), align: left + horizon,
      fill: (x, y) => if y == 0 { tone },
      strong[Parameter], strong[Symbol], table.cell(colspan: 2, align: right, strong[Karakteristisk]),
      strong[Symbol], table.cell(colspan: 2, align: right, strong[Regningsmæssig]),
      ..b.raekker.map(r => (
        [#r.navn], tekst(r.symbolK),
        celle(if r.inddata { inddata(r.vaerdiK, bredde: 15mm) } else { box(width: 15mm, inset: (x: 1.6mm), align(right, r.vaerdiK)) }),
        enhed(r.enhed), tekst(r.symbolD), celle(r.vaerdiD), enhed(r.enhed),
      )).flatten(),
    )
  })
  let figur(b) = block(breakable: false, below: 2.4mm, width: 100%,
    align(center, image(b.fil, width: float(b.bredde_mm) * 1mm)))
  let tofigur(b) = block(breakable: false, below: 3mm, grid(
    columns: (1fr,) * b.figurer.len(), column-gutter: 4mm, align: left + bottom,
    ..b.figurer.map(f => {
      image(f.fil, width: 100%)
      v(0.8mm)
      text(size: 9pt, fill: graa, f.tekst)
    }),
  ))
  let maalfelt(x) = {
    text(size: 9pt, fill: graa, x.tekst)
    v(0.4mm)
    grid(columns: (17mm, 1fr), column-gutter: 1.6mm, align: (left + bottom, right + bottom),
      tekst(x.symbol), x.vaerdi)
    v(0.3mm)
    line(length: 100%, stroke: 0.25mm)
    if x.note != none { v(0.5mm); text(size: 8.5pt, fill: graa, x.note) }
  }
  // Samlet bredde og netlængde til venstre og løsningens figur til højre.
  let maalfigur(b) = block(breakable: false, below: 2.6mm, grid(
    columns: (52mm, 1fr), column-gutter: 4mm, align: left + horizon,
    stack(dir: ttb, spacing: 2.6mm, ..b.maal.map(maalfelt)),
    align(center, image(b.fil, width: 100%)),
  ))
  let advarsel(b) = block(breakable: false, above: 1mm, below: 3mm, width: 100%, inset: 2.4mm,
    stroke: 0.3mm + rgb("#b42318"), text(size: 10pt, tekst(b.tekst)))
  let symboler(b) = block(breakable: false, below: 3mm, {
    set text(size: 10pt)
    grid(columns: (15mm, 1fr), row-gutter: 0.8mm, column-gutter: 2mm,
      ..b.raekker.map(r => (tekst(r.symbol), tekst(r.tekst))).flatten())
  })

  let blok(b) = {
    if b.type == "tekst" { block(below: 2.4mm, tekst(b.tekst)) }
    else if b.type == "lille" { block(below: 2.4mm, text(size: 9pt, fill: graa, tekst(b.tekst))) }
    else if b.type == "h3" { block(sticky: true, above: 4.5mm, below: 1.5mm, text(weight: "bold", tekst(b.tekst))) }
    else if b.type == "punkter" {
      let liste = list(indent: 0mm, body-indent: 3mm, spacing: 1mm, tight: false,
        ..b.punkter.map(p => list.item(tekst(p))))
      // Små punkter står som note-tekst, fx forudsætningerne for længde, ender og gennemføringer.
      if b.at("lille", default: false) { block(below: 3mm, text(size: 9pt, fill: graa, liste)) }
      else { block(below: 4mm, liste) }
    }
    else if b.type == "inddata" {
      block(below: 3mm, grid(columns: (auto,) * b.felter.len(), column-gutter: 7mm, align: horizon,
        ..b.felter.map(f => [#tekst(f.tekst) #inddata(f.vaerdi) #tekst(f.enhed)])))
    }
    else if b.type == "regning" { regning(b) }
    else if b.type == "resultat" { resultat(b) }
    else if b.type == "tabel" { tabel(b) }
    else if b.type == "vaerditabel" { vaerditabel(b) }
    else if b.type == "figur" { figur(b) }
    else if b.type == "tofigur" { tofigur(b) }
    else if b.type == "maalfigur" { maalfigur(b) }
    else if b.type == "advarsel" { advarsel(b) }
    else if b.type == "symboler" { symboler(b) }
  }

  // Forside: titel, projektoplysninger og indholdsfortegnelse.
  v(4mm)
  text(size: skrift.titel_pt * 1pt, profil.titel)
  v(9mm)
  let felter(rows) = grid(columns: (32mm, 1fr), row-gutter: 1.6mm, column-gutter: 2mm,
    ..rows.map(r => (strong(r.navn), [#r.vaerdi])).flatten())
  grid(columns: (1fr, 1fr), column-gutter: 8mm, felter(data.forside.venstre), felter(data.forside.hoejre))
  v(5mm)
  grid(columns: (32mm, 1fr), column-gutter: 2mm, strong[Projektbeskrivelse],
    stack(dir: ttb, spacing: 1mm, ..data.forside.beskrivelse.map(l => [#l])))
  v(14mm)
  text(weight: "bold", size: 13pt, [Indholdsfortegnelse])
  v(3mm)
  context {
    for o in query(heading) {
      let side = counter(page).at(o.location()).first()
      block(below: 1.5mm, link(o.location(), grid(columns: (1fr, auto), column-gutter: 2mm,
        [#h((o.level - 1) * 8mm)#o.body #box(width: 1fr, repeat(gap: 0.6mm, [.]))],
        [#side])))
    }
  }

  // Afslutningen står nederst på forsiden.
  if data.afslutning != none {
    v(1fr)
    block(breakable: false, {
      strong(data.afslutning.by_og_dato)
      v(3mm)
      grid(columns: (1fr, 1fr), column-gutter: 8mm,
        ..data.afslutning.personer.map(p => stack(dir: ttb, spacing: 0.6mm, ..p.map(l => [#l]))))
    })
  }

  // Samme mål som i maalfelt, men på én linje, så de fylder mindre i højden.
  let maallinje(x) = {
    block(width: 100%, spacing: 0pt, {
      text(size: 9pt, fill: graa, x.tekst)
      h(2mm)
      tekst(x.symbol)
      h(1fr)
      x.vaerdi
    })
    v(0.8mm)
    line(length: 100%, stroke: 0.25mm)
    if x.note != none { v(0.5mm); text(size: 8.5pt, fill: graa, x.note) }
  }
  // To ledninger: målene står over figuren, og figurerne fylder den plads, teksten levner, så
  // begge afsnit kan være på én side. Figurerne er lige brede og højst lige så brede som teksten.
  let bredt-afsnit(a, bredde) = {
    heading(level: a.niveau, outlined: true, bookmarked: true, tekst(a.titel))
    for b in a.blokke {
      if b.type == "maalfigur" {
        block(breakable: false, below: 2.6mm, {
          grid(columns: (1fr, 1fr), column-gutter: 8mm, ..b.maal.map(maallinje))
          if bredde != none {
            v(2mm)
            align(center, image(b.fil, width: bredde))
          }
        })
      } else { blok(b) }
    }
  }
  let to-ledninger(liste) = context {
    let afstand = 6mm
    let forloeb(bredde) = {
      for (i, a) in liste.enumerate() {
        if i > 0 { v(afstand) }
        bredt-afsnit(a, bredde)
      }
    }
    let fast = measure(width: geometri.body_width, forloeb(none)).height
    let figurer = liste.map(a => a.blokke.filter(b => b.type == "maalfigur")).flatten()
    let forhold = figurer.map(b => measure(image(b.fil, width: 100mm)).height / 100mm).sum()
    // Luften over hver figur og lidt margen, så en afrunding ikke sender et afsnit videre.
    let plads = 297mm - geometri.top - geometri.bottom - fast - figurer.len() * 2mm - 2mm
    let bredde = calc.max(60mm, calc.min(geometri.body_width, plads / forhold))
    forloeb(bredde)
  }

  // Afsnittene.
  let to-ledninger-vist = false
  for a in data.afsnit {
    if a.toLedninger {
      if not to-ledninger-vist {
        to-ledninger-vist = true
        pagebreak(weak: true)
        to-ledninger(data.afsnit.filter(x => x.toLedninger))
      }
      continue
    }
    if a.nySide { pagebreak(weak: true) } else if a.niveau == 1 { v(8mm, weak: true) } else { v(6mm, weak: true) }
    if a.samlet {
      block(breakable: false, {
        heading(level: a.niveau, outlined: true, bookmarked: true, tekst(a.titel))
        for b in a.blokke { blok(b) }
      })
    } else {
      heading(level: a.niveau, outlined: true, bookmarked: true, tekst(a.titel))
      for b in a.blokke { blok(b) }
    }
  }
}
