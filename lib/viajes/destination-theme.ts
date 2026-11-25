export type DestinationTheme = {
  /** Paper / page background (light cultural paper) */
  bg: string;
  /** Body ink */
  ink: string;
  /** Primary accent (stamp / CTA) */
  accent: string;
  /** Soft accent wash */
  accentSoft: string;
  /** Card surface */
  paper: string;
  /** Muted text */
  mute: string;
  /** Hairline / rules */
  rule: string;
  /** Secondary accent (links / transit) */
  secondary: string;
  /** Night section background */
  night: string;
  /** Neon / night accent */
  neon: string;
  heroOverlay: string;
  displayFont: string;
  bodyFont: string;
  googleFontsHref: string;
  /** Short cultural script / stamp glyphs for headers (optional) */
  scriptSamples: string[];
  mood: string;
  /** One-line art brief for the model */
  artBrief: string;
};

function fonts(display: string, body: string, extras = ""): string {
  const q = (f: string) => encodeURIComponent(f);
  const extra = extras ? `&${extras}` : "";
  return `https://fonts.googleapis.com/css2?family=${q(display)}:wght@500;700;800&family=${q(body)}:wght@400;500;700${extra}&display=swap`;
}

/** Cultural paper themes for downloadable guides (not Dark Cherry). */
export function themeForDestination(destination: string): DestinationTheme {
  const d = destination.toLowerCase();

  if (/jap[oó]n|japan|tokio|tokyo|kyoto|kioto|osaka|nara|fuji/.test(d)) {
    return {
      bg: "#f1e9d8",
      ink: "#1d1a17",
      accent: "#c3361b",
      accentSoft: "#f4dcd2",
      paper: "#fbf7ee",
      mute: "#625a50",
      rule: "#d9ccb2",
      secondary: "#1f3a63",
      night: "#120f17",
      neon: "#ff4f7b",
      heroOverlay:
        "linear-gradient(90deg,rgba(13,11,16,.92) 0%,rgba(13,11,16,.72) 45%,rgba(13,11,16,.25) 100%),linear-gradient(0deg,rgba(13,11,16,.9),transparent 45%)",
      displayFont: "Shippori Mincho B1",
      bodyFont: "Zen Kaku Gothic New",
      googleFontsHref: fonts(
        "Shippori Mincho B1",
        "Zen Kaku Gothic New",
        "family=Noto+Serif+JP:wght@500;700",
      ),
      scriptSamples: ["旅", "一", "二", "三", "四", "五", "東京", "京都", "大阪"],
      mood: "washi paper, sumi ink, hinomaru red, seigaiha waves, hanko stamps",
      artBrief:
        "Cartel de viaje → papel washi con tinta sumi; secciones con sello hanko y tipografía vertical; billetes perforados; presupuesto como recibo dentado; noches en neón. NO Dark Cherry.",
    };
  }

  if (/corea|korea|seul|seoul|busan|incheon/.test(d)) {
    return {
      bg: "#f3efe8",
      ink: "#16141c",
      accent: "#c41e3a",
      accentSoft: "#f5d6dc",
      paper: "#fbf9f4",
      mute: "#5c5666",
      rule: "#d8d0c4",
      secondary: "#2b2f6b",
      night: "#0e0c14",
      neon: "#ff4f9a",
      heroOverlay:
        "linear-gradient(115deg,rgba(14,12,20,.92) 0%,rgba(14,12,20,.55) 50%,rgba(14,12,20,.2) 100%)",
      displayFont: "Noto Serif KR",
      bodyFont: "Noto Sans KR",
      googleFontsHref: fonts("Noto Serif KR", "Noto Sans KR"),
      scriptSamples: ["旅", "서", "울", "한", "국"],
      mood: "hanji paper, Seoul neon, dancheong red-blue",
      artBrief:
        "Papel hanji claro + tinta oscura; acento dancheong rojo; sellos numerados; billetes; recibo; bloque noche neón. Tipografía coreana si cabe. NO Dark Cherry.",
    };
  }

  if (/par[ií]s|paris|france|francia/.test(d)) {
    return {
      bg: "#f4efe6",
      ink: "#1c1712",
      accent: "#8b6914",
      accentSoft: "#efe4c4",
      paper: "#fbf8f1",
      mute: "#6a5f52",
      rule: "#ddd2be",
      secondary: "#2c3e50",
      night: "#121018",
      neon: "#d4a017",
      heroOverlay:
        "linear-gradient(120deg,rgba(18,16,20,.9) 0%,rgba(18,16,20,.5) 48%,rgba(18,16,20,.2) 100%)",
      displayFont: "Cormorant Garamond",
      bodyFont: "Source Sans 3",
      googleFontsHref: fonts("Cormorant Garamond", "Source Sans 3"),
      scriptSamples: ["I", "II", "III", "IV", "V", "VI"],
      mood: "cream paper, champagne gold, Haussmann ink",
      artBrief:
        "Papel crema parisino + oro champagne; encabezados roman numerals; billetes tipo boarding pass; recibo; noche Seine. NO Dark Cherry.",
    };
  }

  if (/roma|rome|italia|italy|milan|mil[aá]n|firenze|florence|napoles|naples/.test(d)) {
    return {
      bg: "#f3ebe2",
      ink: "#1a120e",
      accent: "#c45c26",
      accentSoft: "#f0d8c8",
      paper: "#faf6f0",
      mute: "#6b584c",
      rule: "#ddcfc2",
      secondary: "#3d4f3a",
      night: "#140f0c",
      neon: "#e86a3a",
      heroOverlay:
        "linear-gradient(125deg,rgba(26,18,14,.9),rgba(26,18,14,.35))",
      displayFont: "Libre Baskerville",
      bodyFont: "Source Sans 3",
      googleFontsHref: fonts("Libre Baskerville", "Source Sans 3"),
      scriptSamples: ["I", "II", "III", "IV", "V", "VI"],
      mood: "travertine paper, terracotta, espresso",
      artBrief:
        "Papel travertino + terracota; billetes; recibo; capítulos por ciudad; noche espresso. NO Dark Cherry.",
    };
  }

  if (/barcelona|madrid|espa[nñ]a|spain|sevilla|valencia|lisboa|lisbon|portugal/.test(d)) {
    return {
      bg: "#f2ebe3",
      ink: "#1a1714",
      accent: "#c0392b",
      accentSoft: "#f3d5cf",
      paper: "#faf7f2",
      mute: "#63584e",
      rule: "#d9cec0",
      secondary: "#1a5276",
      night: "#121018",
      neon: "#e74c3c",
      heroOverlay:
        "linear-gradient(130deg,rgba(18,16,20,.9),rgba(18,16,20,.35))",
      displayFont: "Playfair Display",
      bodyFont: "Source Sans 3",
      googleFontsHref: fonts("Playfair Display", "Source Sans 3"),
      scriptSamples: ["01", "02", "03", "04", "05", "06"],
      mood: "mediterranean dusk paper, vermillion",
      artBrief:
        "Papel mediterráneo + vermellón; billetes; recibo; días densos. NO Dark Cherry.",
    };
  }

  if (/london|londres|uk|inglaterra|edinburgh|edimburgo/.test(d)) {
    return {
      bg: "#eef1f4",
      ink: "#12151a",
      accent: "#1f4e79",
      accentSoft: "#d5e3f0",
      paper: "#f7f9fb",
      mute: "#5a6570",
      rule: "#cfd6de",
      secondary: "#8b4513",
      night: "#0e1218",
      neon: "#6ea8d8",
      heroOverlay:
        "linear-gradient(140deg,rgba(14,18,24,.92),rgba(14,18,24,.4))",
      displayFont: "Libre Baskerville",
      bodyFont: "Source Sans 3",
      googleFontsHref: fonts("Libre Baskerville", "Source Sans 3"),
      scriptSamples: ["I", "II", "III", "IV", "V", "VI"],
      mood: "fog paper, navy, tea brown",
      artBrief:
        "Papel niebla + navy; billetes; recibo; tipografía editorial británica. NO Dark Cherry.",
    };
  }

  if (/nyc|new york|nueva york|usa|miami|los angeles|chicago/.test(d)) {
    return {
      bg: "#f0eee8",
      ink: "#121212",
      accent: "#c9a227",
      accentSoft: "#f0e4bc",
      paper: "#faf9f5",
      mute: "#5c5c5c",
      rule: "#d6d2c6",
      secondary: "#1a1a1a",
      night: "#0a0a0c",
      neon: "#f5c518",
      heroOverlay:
        "linear-gradient(125deg,rgba(10,10,12,.9),rgba(10,10,12,.35))",
      displayFont: "Playfair Display",
      bodyFont: "Source Sans 3",
      googleFontsHref: fonts("Playfair Display", "Source Sans 3"),
      scriptSamples: ["01", "02", "03", "04", "05", "06"],
      mood: "newsprint cream, taxi yellow, midnight",
      artBrief:
        "Papel newsprint + taxi yellow; billetes; recibo; bloque noche. NO Dark Cherry.",
    };
  }

  if (/praga|prague|viena|vienna|berlin|amsterdam|budapest/.test(d)) {
    return {
      bg: "#f1ebe3",
      ink: "#1a1612",
      accent: "#6b2d5c",
      accentSoft: "#e8d4e2",
      paper: "#faf6f0",
      mute: "#62584f",
      rule: "#d9cec2",
      secondary: "#2c4a6e",
      night: "#120f16",
      neon: "#c77db5",
      heroOverlay:
        "linear-gradient(125deg,rgba(18,15,22,.9),rgba(18,15,22,.35))",
      displayFont: "Cormorant Garamond",
      bodyFont: "Source Sans 3",
      googleFontsHref: fonts("Cormorant Garamond", "Source Sans 3"),
      scriptSamples: ["I", "II", "III", "IV", "V", "VI"],
      mood: "central-europe cream paper, plum accent",
      artBrief:
        "Papel crema centroeuropeo + ciruela; billetes; recibo; capítulos ciudad. NO Dark Cherry.",
    };
  }

  return {
    bg: "#f2ebe6",
    ink: "#1a1416",
    accent: "#a8334c",
    accentSoft: "#f0d6dc",
    paper: "#faf6f2",
    mute: "#62555a",
    rule: "#d9cdc8",
    secondary: "#2a3a4a",
    night: "#120e12",
    neon: "#e04667",
    heroOverlay:
      "linear-gradient(125deg,rgba(18,14,18,.92),rgba(18,14,18,.4))",
    displayFont: "Cormorant Garamond",
    bodyFont: "Source Sans 3",
    googleFontsHref: fonts("Cormorant Garamond", "Source Sans 3"),
    scriptSamples: ["01", "02", "03", "04", "05", "06"],
    mood: "warm paper, cherry stamp accent",
    artBrief:
      "Papel cálido claro + sello cherry; billetes perforados; recibo; itinerario denso. NO Dark Cherry (eso es solo el wizard).",
  };
}

export function pickHeroImage<T extends { url: string; title?: string; query?: string }>(
  images: T[],
): T | undefined {
  if (!images.length) return undefined;
  const scored = images.map((img) => {
    const t = `${img.title || ""} ${img.query || ""} ${img.url}`.toLowerCase();
    let score = 0;
    if (
      /eiffel|tower|skyline|cityscape|plaza|square|cathedral|temple|castle|bridge|colosseum|sagrada|fuji|templo|shibuya|torii/.test(
        t,
      )
    )
      score += 5;
    if (/landmark|vista|panorama|night|noche/.test(t)) score += 2;
    if (/map|plan de|carte|turgot|atlas|diagram|flag|coat of arms|logo|svg/.test(t))
      score -= 8;
    return { img, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.img;
}
