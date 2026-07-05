import { measureHeroWords, readMaskFont, type HeroWordFont } from "@/components/home/hero-word-measure";

export type FieldWord = {
  word: string;
  rect: DOMRect;
  fontSize: number;
};

export type SmokeLayout = {
  stacked: boolean;
  splitX: number;
  splitY: number;
};

function isStackedWords(words: FieldWord[]): boolean {
  if (words.length < 2) return false;
  return words[1].rect.top > words[0].rect.top + words[0].rect.height * 0.35;
}

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

function drawPresenceEllipse(
  fc: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  strength = 1,
) {
  if (rx <= 0 || ry <= 0) return;
  fc.save();
  fc.translate(cx, cy);
  fc.scale(1, ry / rx);
  const g = fc.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0.0, `rgba(255,255,255,${0.75 * strength})`);
  g.addColorStop(0.55, `rgba(255,255,255,${0.4 * strength})`);
  g.addColorStop(1.0, "rgba(255,255,255,0)");
  fc.fillStyle = g;
  fc.fillRect(-rx, -rx, rx * 2, rx * 2);
  fc.restore();
}

/** Campo de presencia único: elipse radial + forma de texto difuminada. */
export function buildField(
  canvas: HTMLCanvasElement,
  canvasEl: HTMLElement,
  words: FieldWord[],
  maskFont: HeroWordFont,
  options?: { mobile?: boolean },
): HTMLCanvasElement {
  const s = 0.5;
  const mobile = options?.mobile ?? false;
  const fld = document.createElement("canvas");
  fld.width = canvas.width;
  fld.height = canvas.height;
  const fc = fld.getContext("2d");
  if (!fc) return fld;

  const canvasRect = canvasEl.getBoundingClientRect();
  if (canvasRect.width <= 0) return fld;

  const px = (v: number) => v * (canvas.width / canvasRect.width);
  const stacked = isStackedWords(words);

  fc.fillStyle = "#000";
  fc.fillRect(0, 0, fld.width, fld.height);
  fc.globalCompositeOperation = "lighter";

  for (const w of words) {
    const cx = px(w.rect.left - canvasRect.left + w.rect.width / 2);
    const cy = px(w.rect.top - canvasRect.top + w.rect.height / 2 - w.fontSize * (stacked ? 0.06 : 0.1));
    const rx = px(w.rect.width) * (stacked ? 0.82 : 0.72);
    const ry = px(w.fontSize) * (stacked ? 2.1 : 1.5);
    drawPresenceEllipse(fc, cx, cy, rx, ry);
  }

  if (stacked && words.length >= 2) {
    const w0 = words[0];
    const w1 = words[1];
    const cx = px((w0.rect.left + w0.rect.right + w1.rect.left + w1.rect.right) * 0.25 - canvasRect.left);
    const cy = px((w0.rect.bottom + w1.rect.top) * 0.5 - canvasRect.top);
    const rx = px(Math.max(w0.rect.width, w1.rect.width)) * 0.62;
    const ry = px(Math.max(w0.fontSize, w1.fontSize)) * 0.85;
    drawPresenceEllipse(fc, cx, cy, rx, ry, 0.65);
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

    const blurPx = (mobile ? 22 : 18) * s;
    fc.filter = `blur(${blurPx}px)`;
    fc.globalAlpha = mobile ? 0.62 : 0.55;
    fc.globalCompositeOperation = "lighter";
    fc.drawImage(textCanvas, 0, stacked ? 0 : -10 * s);
    fc.filter = "none";
    fc.globalAlpha = 1;
  }

  fc.globalCompositeOperation = "source-over";
  return fld;
}

export function computeSmokeLayout(words: FieldWord[], canvasEl: HTMLElement): SmokeLayout {
  const fallback: SmokeLayout = { stacked: false, splitX: 0.5, splitY: 0.5 };
  if (!canvasEl || words.length === 0) return fallback;

  const canvasRect = canvasEl.getBoundingClientRect();
  const w = canvasRect.width;
  const h = canvasRect.height;
  if (w <= 0 || h <= 0) return fallback;

  const stacked = isStackedWords(words);
  if (stacked && words.length >= 2) {
    const gapCenterY =
      (words[0].rect.bottom + words[1].rect.top) * 0.5 - canvasRect.top;
    return {
      stacked: true,
      splitX: 0.5,
      splitY: Math.max(0.08, Math.min(0.92, gapCenterY / h)),
    };
  }

  if (words.length >= 2) {
    const gapCenterX =
      (words[0].rect.right + words[1].rect.left) * 0.5 - canvasRect.left;
    return {
      stacked: false,
      splitX: Math.max(0.08, Math.min(0.92, gapCenterX / w)),
      splitY: 0.5,
    };
  }

  return fallback;
}

/** @deprecated Usar computeSmokeLayout */
export function computeSplitX(words: FieldWord[], canvasEl: HTMLElement): number {
  return computeSmokeLayout(words, canvasEl).splitX;
}
