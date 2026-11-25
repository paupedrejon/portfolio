export type GuideStyle =
  | "washi" // Japan — hinomaru, hanko, vertical script OK
  | "hanji" // Korea
  | "metro" // NYC / US — newsprint, taxi stripe, no JP motifs
  | "editorial" // Paris / London / Europe — roman numerals
  | "mediterranean" // Spain / Italy
  | "default";

export type DestinationTheme = {
  bg: string;
  ink: string;
  accent: string;
  accentSoft: string;
  paper: string;
  mute: string;
  rule: string;
  secondary: string;
  night: string;
  neon: string;
  heroOverlay: string;
  displayFont: string;
  bodyFont: string;
  googleFontsHref: string;
  /** Section marks — never Japanese glyphs outside washi/hanji */
  scriptSamples: string[];
  /** Visual system — controls ornaments in the renderer */
  style: GuideStyle;
  /** Only true for JP/KR cultural scripts */
  verticalScript: boolean;
  mood: string;
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
      style: "washi",
      verticalScript: true,
      mood: "washi paper, sumi ink, hinomaru red, seigaiha waves, hanko stamps",
      artBrief:
        "SOLO para Japón: papel washi, hinomaru, hanko, tipografía vertical. Nunca reutilizar este sistema en otros destinos.",
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
      scriptSamples: ["한", "국", "서", "울", "01", "02"],
      style: "hanji",
      verticalScript: true,
      mood: "hanji paper, Seoul neon, dancheong red-blue",
      artBrief:
        "SOLO Corea: papel hanji + dancheong. No hinomaru japonés. No Dark Cherry.",
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
      style: "editorial",
      verticalScript: false,
      mood: "cream paper, champagne gold, Haussmann ink",
      artBrief:
        "París editorial: numerales romanos, sin sellos asiáticos ni hinomaru. NO Dark Cherry.",
    };
  }

  if (/roma|rome|italia|italy|milan|mil[aá]n|firenze|florence|napoles|naples|venecia|venice/.test(d)) {
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
      style: "mediterranean",
      verticalScript: false,
      mood: "travertine paper, terracotta, espresso",
      artBrief:
        "Italia mediterránea: terracota, sin estética japonesa. NO Dark Cherry.",
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
      style: "mediterranean",
      verticalScript: false,
      mood: "mediterranean dusk paper, vermillion",
      artBrief:
        "Mediterráneo: vermellón + papel cálido. Sin hinomaru/kanji. NO Dark Cherry.",
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
      style: "editorial",
      verticalScript: false,
      mood: "fog paper, navy, tea brown",
      artBrief:
        "Londres editorial navy. Sin motivos japoneses. NO Dark Cherry.",
    };
  }

  if (/nyc|new york|nueva york|manhattan|brooklyn|miami|los angeles|chicago/.test(d)) {
    return {
      bg: "#f2f0ea",
      ink: "#111111",
      accent: "#e2b007",
      accentSoft: "#f7e7a8",
      paper: "#fffcf5",
      mute: "#5a5a5a",
      rule: "#d4d0c4",
      secondary: "#111111",
      night: "#0a0a0c",
      neon: "#f5c518",
      heroOverlay:
        "linear-gradient(115deg,rgba(8,8,10,.88) 0%,rgba(8,8,10,.45) 55%,rgba(8,8,10,.2) 100%)",
      displayFont: "Playfair Display",
      bodyFont: "Source Sans 3",
      googleFontsHref: fonts("Playfair Display", "Source Sans 3"),
      scriptSamples: ["01", "02", "03", "04", "05", "06"],
      style: "metro",
      verticalScript: false,
      mood: "newsprint, taxi yellow stripe, midnight Manhattan",
      artBrief:
        "NYC METRO: newsprint + franja taxi yellow. PROHIBIDO hinomaru, kanji, hanko japonés, tipografía vertical asiática, olas seigaiha. Estética americana editorial.",
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
      style: "editorial",
      verticalScript: false,
      mood: "central-europe cream paper, plum accent",
      artBrief:
        "Centroeuropa editorial. Sin estética japonesa. NO Dark Cherry.",
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
    style: "default",
    verticalScript: false,
    mood: "warm paper, cherry stamp accent",
    artBrief:
      "Papel cálido genérico. Sin hinomaru/kanji salvo destino JP. NO Dark Cherry.",
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
      /eiffel|tower|skyline|cityscape|plaza|square|cathedral|temple|castle|bridge|colosseum|sagrada|fuji|templo|shibuya|torii|brooklyn|empire|statue of liberty|times square/.test(
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
