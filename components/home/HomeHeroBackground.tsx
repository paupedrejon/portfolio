"use client";

import FloatingLines from "@/components/FloatingLines";

const HERO_WAVES = ["top", "middle", "bottom"] as ("top" | "middle" | "bottom")[];
const HERO_GRADIENT = ["#358c9f", "#4eb3c8", "#2a6f7d"];

/** Fondo animado del hero (líneas teal, sin interacción ratón). */
export default function HomeHeroBackground() {
  return (
    <div className="home-hero__motion" aria-hidden>
      <FloatingLines
        enabledWaves={HERO_WAVES}
        lineCount={4}
        lineDistance={4}
        bendRadius={4}
        bendStrength={-0.35}
        interactive={false}
        parallax={false}
        animationSpeed={0.85}
        linesGradient={HERO_GRADIENT}
        mixBlendMode="screen"
      />
      <div className="home-hero__blob home-hero__blob--1" />
      <div className="home-hero__blob home-hero__blob--2" />
      <div className="home-hero__blob home-hero__blob--3" />
    </div>
  );
}
