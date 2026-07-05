/** Calibración vertical del tubo SVG (px en coords del viewBox). */
export const BASELINE_NUDGE = 0;

/** Escala del font-size de la capa neón respecto al h1 (1 = misma fuente que proyectos). */
export const NEON_SCALE = 1;

export type HeroWordFont = {
  family: string;
  weight: string;
  sizePx: number;
  letterSpacingPx: number;
};

export type HeroWordMeasure = {
  word: string;
  variant: "default" | "accent";
  rect: DOMRect;
  font: HeroWordFont;
  baselineRatio: number;
};

function parseLetterSpacingPx(value: string, fontSizePx: number): number {
  if (!value || value === "normal") return 0;
  if (value.endsWith("px")) return parseFloat(value);
  if (value.endsWith("em")) return parseFloat(value) * fontSizePx;
  return 0;
}

export function computeBaselineRatio(font: HeroWordFont, sample: string): number {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return 0.72;
  ctx.font = `${font.weight} ${font.sizePx}px ${font.family}`;
  const m = ctx.measureText(sample || "Hg");
  const ascent = m.fontBoundingBoxAscent ?? font.sizePx * 0.8;
  const descent = m.fontBoundingBoxDescent ?? font.sizePx * 0.2;
  return ascent / (ascent + descent);
}

/** Fuente del título neón — misma que el h1 (League Spartan / --font-body). */
export function readNeonFont(h1: HTMLElement, wordEl?: HTMLElement): HeroWordFont {
  const sizer = wordEl?.querySelector<HTMLElement>(".hero-word__sizer");
  const el = sizer ?? h1;
  const style = getComputedStyle(el);
  const baseSizePx = parseFloat(style.fontSize);
  return {
    family: style.fontFamily,
    weight: style.fontWeight || "800",
    sizePx: baseSizePx * NEON_SCALE,
    letterSpacingPx: parseLetterSpacingPx(style.letterSpacing, baseSizePx),
  };
}

/** Fuente bold del h1 — máscara de presencia del humo (masa, no tubo visual). */
export function readMaskFont(h1: HTMLElement): HeroWordFont {
  const style = getComputedStyle(h1);
  const sizePx = parseFloat(style.fontSize);
  return {
    family: style.fontFamily,
    weight: style.fontWeight || "800",
    sizePx,
    letterSpacingPx: parseLetterSpacingPx(style.letterSpacing, sizePx),
  };
}

export function measureHeroWord(wordEl: HTMLElement, h1: HTMLElement): HeroWordMeasure | null {
  const word = wordEl.getAttribute("data-word")?.replace(/\s+/g, " ").trim() ?? "";
  if (!word) return null;

  const ignite = wordEl.closest(".hero-ignite");
  const variant = ignite?.classList.contains("hero-ignite--accent") ? "accent" : "default";
  const font = readNeonFont(h1, wordEl);

  return {
    word,
    variant,
    rect: wordEl.getBoundingClientRect(),
    font,
    baselineRatio: computeBaselineRatio(font, word),
  };
}

/** Mide cada `.hero-word` dentro del h1 — fuente única para SVG neón. */
export function measureHeroWords(h1: HTMLElement): HeroWordMeasure[] {
  const wordEls = h1.querySelectorAll<HTMLElement>(".hero-word");
  const out: HeroWordMeasure[] = [];
  wordEls.forEach((el) => {
    const m = measureHeroWord(el, h1);
    if (m) out.push(m);
  });
  return out;
}
