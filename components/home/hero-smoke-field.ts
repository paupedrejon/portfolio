import { measureHeroWords, readMaskFont, type HeroWordFont } from "@/components/home/hero-word-measure";

export type FieldWord = {
  word: string;
  rect: DOMRect;
  fontSize: number;
};

/** Palabras del h1 con rects reales y font-size CSS del título. */
export function measureFieldWords(h1: HTMLElement): FieldWord[] {
  const fontSize = parseFloat(getComputedStyle(h1).fontSize);
  return measureHeroWords(h1).map((w) => ({
    word: w.word,
    rect: w.rect,
    fontSize,
  }));
}

export async function ensureSmokeFontsReady(h1: HTMLElement): Promise<void> {
  await document.fonts.ready;
  const mask = readMaskFont(h1);
  const size = mask.sizePx;
  try {
    await document.fonts.load(`700 ${size}px ${mask.family}`);
    await document.fonts.load(`${mask.weight} ${size}px ${mask.family}`);
  } catch {
    /* fallback metrics */
  }
}

/** Campo de presencia único: elipse radial + forma de texto difuminada. */
export function buildField(
  canvas: HTMLCanvasElement,
  canvasEl: HTMLElement,
  words: FieldWord[],
  maskFont: HeroWordFont,
): HTMLCanvasElement {
  const s = 0.5;
  const fld = document.createElement("canvas");
  fld.width = canvas.width;
  fld.height = canvas.height;
  const fc = fld.getContext("2d");
  if (!fc) return fld;

  const canvasRect = canvasEl.getBoundingClientRect();
  if (canvasRect.width <= 0) return fld;

  const px = (v: number) => v * (canvas.width / canvasRect.width);

  fc.fillStyle = "#000";
  fc.fillRect(0, 0, fld.width, fld.height);
  fc.globalCompositeOperation = "lighter";

  for (const w of words) {
    const cx = px(w.rect.left - canvasRect.left + w.rect.width / 2);
    const cy = px(w.rect.top - canvasRect.top + w.rect.height / 2 - w.fontSize * 0.1);
    const rx = px(w.rect.width) * 0.72;
    const ry = px(w.fontSize) * 1.5;

    fc.save();
    fc.translate(cx, cy);
    if (rx > 0) {
      fc.scale(1, ry / rx);
    }
    const g = fc.createRadialGradient(0, 0, 0, 0, 0, rx);
    g.addColorStop(0.0, "rgba(255,255,255,0.75)");
    g.addColorStop(0.55, "rgba(255,255,255,0.40)");
    g.addColorStop(1.0, "rgba(255,255,255,0)");
    fc.fillStyle = g;
    fc.fillRect(-rx, -rx, rx * 2, rx * 2);
    fc.restore();
  }

  const textCanvas = document.createElement("canvas");
  textCanvas.width = fld.width;
  textCanvas.height = fld.height;
  const tc = textCanvas.getContext("2d");
  if (tc) {
    tc.fillStyle = "#000";
    tc.fillRect(0, 0, textCanvas.width, textCanvas.height);
    tc.fillStyle = "#fff";

    for (const w of words) {
      const x = px(w.rect.left - canvasRect.left + w.rect.width / 2);
      const y = px(w.rect.top - canvasRect.top + w.rect.height / 2);
      const fontSize = px(w.fontSize);

      tc.textAlign = "center";
      tc.textBaseline = "middle";
      tc.font = `700 ${fontSize}px ${maskFont.family}`;

      const measured = tc.measureText(w.word).width;
      const targetWidth = px(w.rect.width);

      tc.save();
      tc.translate(x, y);
      if (measured > 0) {
        tc.scale(targetWidth / measured, 1);
      }
      tc.fillText(w.word, 0, 0);
      tc.restore();
    }

    fc.filter = `blur(${18 * s}px)`;
    fc.globalAlpha = 0.55;
    fc.globalCompositeOperation = "lighter";
    fc.drawImage(textCanvas, 0, -10 * s);
    fc.filter = "none";
    fc.globalAlpha = 1;
  }

  fc.globalCompositeOperation = "source-over";
  return fld;
}

export function computeSplitX(words: FieldWord[], canvasEl: HTMLElement): number {
  if (words.length < 2 || !canvasEl) return 0.5;
  const canvasRect = canvasEl.getBoundingClientRect();
  const w = canvasRect.width;
  if (w <= 0) return 0.5;
  const gapCenter =
    (words[0].rect.right + words[1].rect.left) * 0.5 - canvasRect.left;
  return Math.max(0.08, Math.min(0.92, gapCenter / w));
}
