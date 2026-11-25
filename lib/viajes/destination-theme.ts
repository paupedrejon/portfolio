export type GuideStyle =
  | "washi" // Japan writing-system ornaments only
  | "hanji" // Korea writing-system ornaments only
  | "editorial" // default for everyone else
  | "metro"; // optional urban vibe when palette says so

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
  scriptSamples: string[];
  style: GuideStyle;
  verticalScript: boolean;
  mood: string;
  artBrief: string;
};

function fonts(display: string, body: string, extras = ""): string {
  const q = (f: string) => encodeURIComponent(f);
  const extra = extras ? `&${extras}` : "";
  return `https://fonts.googleapis.com/css2?family=${q(display)}:wght@500;700;800&family=${q(body)}:wght@400;500;700${extra}&display=swap`;
}

/** Stable accent from place name — any destination gets a unique-ish color without a country list. */
function accentFromName(name: string): { accent: string; soft: string; neon: string } {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return {
    accent: `hsl(${hue} 55% 38%)`,
    soft: `hsl(${hue} 40% 90%)`,
    neon: `hsl(${(hue + 40) % 360} 70% 55%)`,
  };
}

/**
 * Themes: only special-case writing systems (JP/KR fonts + ornaments).
 * Every other place on Earth uses a versatile editorial paper theme + hashed accent.
 * The AI plan palette can still override colors in the renderer.
 */
export function themeForDestination(destination: string): DestinationTheme {
  const d = destination.toLowerCase();
  const place = destination.trim() || "viaje";

  // Writing-system special cases only (not "product for each country")
  if (/jap[oó]n|japan|tokio|tokyo|kyoto|kioto|osaka|nara|fuji|北海道|東京/.test(d)) {
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
      scriptSamples: ["旅", "一", "二", "三", "四", "五"],
      style: "washi",
      verticalScript: true,
      mood: `washi paper for ${place}`,
      artBrief: `Japón: washi/sumi/hinomaru OK. Ciudades concretas del plan. Adaptar contenido a ${place}.`,
    };
  }

  if (/corea|korea|seul|seoul|busan|incheon|한국/.test(d)) {
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
      scriptSamples: ["한", "국", "01", "02", "03", "04"],
      style: "hanji",
      verticalScript: true,
      mood: `hanji paper for ${place}`,
      artBrief: `Corea: hanji OK. Sin hinomaru japonés. Adaptar a ${place}.`,
    };
  }

  const { accent, soft, neon } = accentFromName(place);
  // Paper tint derived from the same hash so each destination feels distinct
  let h = 0;
  for (let i = 0; i < place.length; i++) h = (h * 31 + place.charCodeAt(i)) >>> 0;
  const paperHue = h % 360;
  const bg = `hsl(${paperHue} 22% 92%)`;
  const paper = `hsl(${paperHue} 28% 96%)`;
  return {
    bg,
    ink: "#1a1416",
    accent,
    accentSoft: soft,
    paper,
    mute: "#62555a",
    rule: `hsl(${paperHue} 14% 80%)`,
    secondary: "#2a3a4a",
    night: "#120e12",
    neon,
    heroOverlay:
      "linear-gradient(125deg,rgba(18,14,18,.92),rgba(18,14,18,.4))",
    displayFont: "Cormorant Garamond",
    bodyFont: "Source Sans 3",
    googleFontsHref: fonts("Cormorant Garamond", "Source Sans 3"),
    scriptSamples: ["01", "02", "03", "04", "05", "06"],
    style: "editorial",
    verticalScript: false,
    mood: `travel paper for ${place}`,
    artBrief: `Guía versátil para «${place}». Tipografía editorial + papel claro. PROHIBIDO copiar estética japonesa (hinomaru, kanji, hanko) salvo que el destino sea Japón. Elige colores/ornamentos coherentes con el lugar. Contenido 100% sobre las ciudades concretas del plan.`,
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
      /skyline|cityscape|landmark|plaza|square|cathedral|temple|castle|bridge|tower|palace|harbor|harbour|waterfront|old.?town|centro|night|noche/.test(
        t,
      )
    )
      score += 5;
    if (/vista|panorama|street|avenue/.test(t)) score += 2;
    if (/map|plan de|carte|atlas|diagram|flag|coat of arms|logo|svg|satellite|modis/.test(t))
      score -= 8;
    return { img, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.img;
}
