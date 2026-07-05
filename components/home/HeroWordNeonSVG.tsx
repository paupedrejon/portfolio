"use client";

import { useEffect, useMemo, useState, type CSSProperties, type RefObject } from "react";
import {
  BASELINE_NUDGE,
  measureHeroWord,
  type HeroWordMeasure,
} from "@/components/home/hero-word-measure";

const FINAL_COLORS = {
  default: { halo: "#6db6e8", core: "#ffffff" },
  accent: { halo: "#22c8f0", core: "#eafcff" },
} as const;

type HeroWordNeonSVGProps = {
  word: string;
  variant: "default" | "accent";
  wordRef: RefObject<HTMLElement | null>;
  staggerMs: number;
  startDelayMs: number;
};

function buildCharTspans(
  word: string,
  finalColor: string,
  startDelayMs: number,
  staggerMs: number,
) {
  let charIndex = 0;
  return word.split("").map((char, i) => {
    if (char === " ") {
      return <tspan key={`sp-${i}`}> </tspan>;
    }
    const delay = startDelayMs + charIndex * staggerMs;
    charIndex += 1;
    return (
      <tspan
        key={`${char}-${i}`}
        className="neon-ch"
        style={
          {
            "--d": `${delay}ms`,
            "--ch-final": finalColor,
          } as CSSProperties
        }
      >
        {char}
      </tspan>
    );
  });
}

export default function HeroWordNeonSVG({
  word,
  variant,
  wordRef,
  staggerMs,
  startDelayMs,
}: HeroWordNeonSVGProps) {
  const [measure, setMeasure] = useState<HeroWordMeasure | null>(null);
  const colors = FINAL_COLORS[variant];

  const haloChars = useMemo(
    () => buildCharTspans(word, colors.halo, startDelayMs, staggerMs),
    [word, colors.halo, startDelayMs, staggerMs],
  );
  const coreChars = useMemo(
    () => buildCharTspans(word, colors.core, startDelayMs, staggerMs),
    [word, colors.core, startDelayMs, staggerMs],
  );

  useEffect(() => {
    const wordEl = wordRef.current;
    if (!wordEl) return;

    let debounceTimer = 0;

    const update = () => {
      const h1 = wordEl.closest("h1");
      if (!h1) return;
      const m = measureHeroWord(wordEl, h1);
      if (m && m.rect.width > 0 && m.rect.height > 0) {
        setMeasure(m);
      }
    };

    const debounced = () => {
      window.clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(update, 200);
    };

    document.fonts.ready.then(update);
    update();

    const ro = new ResizeObserver(debounced);
    ro.observe(wordEl);
    const h1 = wordEl.closest("h1");
    if (h1) ro.observe(h1);

    return () => {
      window.clearTimeout(debounceTimer);
      ro.disconnect();
    };
  }, [word, wordRef]);

  if (!measure || measure.rect.width < 1) return null;

  const { rect, font, baselineRatio } = measure;
  const y = rect.height * baselineRatio + BASELINE_NUDGE;
  const cx = rect.width / 2;
  const textStyle = {
    font: `${font.weight} ${font.sizePx}px ${font.family}`,
    letterSpacing: font.letterSpacingPx ? `${font.letterSpacingPx}px` : undefined,
  } as const;

  return (
    <svg
      className="hero-word__neon"
      viewBox={`0 0 ${rect.width} ${rect.height}`}
      aria-hidden="true"
      overflow="visible"
    >
      <text
        className="neon-halo"
        x={cx}
        y={y}
        textAnchor="middle"
        textLength={rect.width}
        lengthAdjust="spacingAndGlyphs"
        stroke="none"
        style={textStyle}
      >
        {haloChars}
      </text>
      <text
        className="neon-core"
        x={cx}
        y={y}
        textAnchor="middle"
        textLength={rect.width}
        lengthAdjust="spacingAndGlyphs"
        stroke="currentColor"
        strokeWidth={font.sizePx * 0.012}
        strokeLinejoin="round"
        strokeLinecap="round"
        style={textStyle}
      >
        {coreChars}
      </text>
    </svg>
  );
}
