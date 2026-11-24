export type DestinationTheme = {
  bg: string;
  ink: string;
  accent: string;
  paper: string;
  heroOverlay: string;
  displayFont: string;
  mood: string;
};

/** Sensible destination defaults so fallback guides don't look generic/beige. */
export function themeForDestination(destination: string): DestinationTheme {
  const d = destination.toLowerCase();
  if (/corea|korea|seul|seoul|busan|incheon/.test(d)) {
    return {
      bg: "#0b0c10",
      ink: "#f4f1ea",
      accent: "#e04667",
      paper: "#151821",
      heroOverlay:
        "linear-gradient(125deg, rgba(11,12,16,.92) 0%, rgba(11,12,16,.45) 55%, rgba(11,12,16,.2) 100%)",
      displayFont: "Playfair Display",
      mood: "Seoul neon night, hanok charcoal, cherry accent",
    };
  }
  if (/par[ií]s|paris|france|francia/.test(d)) {
    return {
      bg: "#0f1419",
      ink: "#f3ebe0",
      accent: "#c9a227",
      paper: "#1a222c",
      heroOverlay:
        "linear-gradient(115deg, rgba(15,20,25,.92) 0%, rgba(15,20,25,.55) 48%, rgba(15,20,25,.25) 100%)",
      displayFont: "Cormorant Garamond",
      mood: "Haussmann ink, champagne gold, night Seine",
    };
  }
  if (/jap[oó]n|japan|tokio|tokyo|kyoto|osaka/.test(d)) {
    return {
      bg: "#0a0a0c",
      ink: "#f7f2ea",
      accent: "#e10600",
      paper: "#141418",
      heroOverlay:
        "linear-gradient(160deg, rgba(10,10,12,.88), rgba(10,10,12,.35))",
      displayFont: "Shippori Mincho",
      mood: "washi paper, hinomaru red, neon night",
    };
  }
  if (/roma|rome|italia|italy|milan|mil[aá]n|firenze|florence/.test(d)) {
    return {
      bg: "#1a120e",
      ink: "#f6efe4",
      accent: "#c45c26",
      paper: "#241812",
      heroOverlay:
        "linear-gradient(120deg, rgba(26,18,14,.9), rgba(26,18,14,.4))",
      displayFont: "Libre Baskerville",
      mood: "terracotta, travertine, espresso",
    };
  }
  if (/barcelona|madrid|espa[nñ]a|spain|sevilla|valencia/.test(d)) {
    return {
      bg: "#12161c",
      ink: "#f5f0e8",
      accent: "#e4572e",
      paper: "#1b222c",
      heroOverlay:
        "linear-gradient(130deg, rgba(18,22,28,.9), rgba(18,22,28,.4))",
      displayFont: "Playfair Display",
      mood: "mediterranean dusk, vermillion",
    };
  }
  if (/london|londres|uk|inglaterra/.test(d)) {
    return {
      bg: "#10131a",
      ink: "#eef2f6",
      accent: "#6ea8d8",
      paper: "#181d27",
      heroOverlay:
        "linear-gradient(140deg, rgba(16,19,26,.92), rgba(16,19,26,.4))",
      displayFont: "Libre Baskerville",
      mood: "fog blue, black cab, tea",
    };
  }
  if (/nyc|new york|nueva york|usa|miami|los angeles/.test(d)) {
    return {
      bg: "#0b0d12",
      ink: "#f4f4f5",
      accent: "#f5c518",
      paper: "#151821",
      heroOverlay:
        "linear-gradient(125deg, rgba(11,13,18,.9), rgba(11,13,18,.35))",
      displayFont: "Playfair Display",
      mood: "taxi yellow, midnight glass",
    };
  }
  return {
    bg: "#121014",
    ink: "#f6eef2",
    accent: "#e04667",
    paper: "#1c161a",
    heroOverlay:
      "linear-gradient(125deg, rgba(18,16,20,.92), rgba(18,16,20,.4))",
    displayFont: "Cormorant Garamond",
    mood: "anodized cherry night",
  };
}

export function pickHeroImage<T extends { url: string; title?: string; query?: string }>(
  images: T[],
): T | undefined {
  if (!images.length) return undefined;
  const scored = images.map((img) => {
    const t = `${img.title || ""} ${img.query || ""} ${img.url}`.toLowerCase();
    let score = 0;
    if (/eiffel|tower|skyline|cityscape|plaza|square|cathedral|temple|castle|bridge|colosseum|sagrada|fuji|templo/.test(t))
      score += 5;
    if (/landmark|vista|panorama|night|noche/.test(t)) score += 2;
    if (/map|plan de|carte|turgot|atlas|diagram|flag|coat of arms|logo|svg/.test(t))
      score -= 8;
    return { img, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.img;
}
