"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import HeroWordNeonSVG from "@/components/home/HeroWordNeonSVG";
import "./hero-title-ignite.css";

export type HeroTitleIgniteProps = {
  text: string;
  active?: boolean;
  variant?: "default" | "accent";
  staggerMs?: number;
  startDelayMs?: number;
};

export default function HeroTitleIgnite({
  text,
  active = true,
  variant = "default",
  staggerMs = 88,
  startDelayMs = 0,
}: HeroTitleIgniteProps) {
  const [phase, setPhase] = useState<"idle" | "sequencing" | "done">(() =>
    active ? "sequencing" : "idle",
  );
  const [reducedMotion, setReducedMotion] = useState(false);
  const wordRef = useRef<HTMLSpanElement>(null);
  const letterCount = useMemo(() => text.replace(/\s/g, "").length, [text]);

  const ANIM_MS = 1500;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!active) {
      setPhase("idle");
      return;
    }
    if (reducedMotion) {
      setPhase("done");
      return;
    }
    setPhase("sequencing");
    const end = startDelayMs + letterCount * staggerMs + ANIM_MS;
    const timer = window.setTimeout(() => setPhase("done"), end);
    return () => window.clearTimeout(timer);
  }, [active, reducedMotion, staggerMs, startDelayMs, letterCount]);

  const phaseClass =
    phase === "sequencing"
      ? "hero-ignite--sequencing"
      : phase === "done"
        ? "hero-ignite--done"
        : "hero-ignite--idle";

  return (
    <span className={`hero-ignite hero-ignite--${variant} ${phaseClass}`.trim()}>
      <span ref={wordRef} className="hero-word" data-word={text}>
        <span className="hero-word__sizer" aria-hidden>
          {text}
        </span>
        <HeroWordNeonSVG
          word={text}
          variant={variant}
          wordRef={wordRef}
          staggerMs={staggerMs}
          startDelayMs={startDelayMs}
        />
      </span>
    </span>
  );
}

export function heroIgniteDelayMs(text: string, staggerMs: number): number {
  const letters = text.replace(/\s/g, "").length;
  return letters * staggerMs + 200;
}

const IGNITE_ANIM_MS = 1500;

/** Milisegundos hasta que termina el encendido de lead + accent. */
export function heroIgniteTotalMs(
  lead: string,
  accent: string,
  staggerMs = 88,
): number {
  const leadLetters = lead.replace(/\s/g, "").length;
  const accentLetters = accent.replace(/\s/g, "").length;
  const accentStart = heroIgniteDelayMs(lead, staggerMs);
  if (!accentLetters) return leadLetters * staggerMs + IGNITE_ANIM_MS;
  return accentStart + accentLetters * staggerMs + IGNITE_ANIM_MS;
}

/** Título estático para SSR / primer paint (monolínea, color final, sin animación). */
export function HeroTitleStatic({
  text,
  variant = "default",
}: {
  text: string;
  variant?: "default" | "accent";
}) {
  return (
    <span className={`hero-ignite hero-ignite--${variant} hero-ignite--static`}>
      <span className="hero-word hero-word--static">{text}</span>
    </span>
  );
}
