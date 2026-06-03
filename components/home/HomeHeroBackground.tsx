"use client";

import FloatingLines from "@/components/FloatingLines";
import { useMemo } from "react";

/** Fondo animado del hero (líneas teal, sin interacción ratón). */
export default function HomeHeroBackground() {
  const waves = useMemo(() => ["top", "middle", "bottom"] as const, []);
  const gradient = useMemo(() => ["#358c9f", "#4eb3c8", "#2a6f7d"], []);

  return (
    <div className="home-hero__motion" aria-hidden>
      <FloatingLines
        enabledWaves={[...waves]}
        lineCount={4}
        lineDistance={4}
        bendRadius={4}
        bendStrength={-0.35}
        interactive={false}
        parallax={false}
        animationSpeed={0.85}
        linesGradient={gradient}
        mixBlendMode="screen"
      />
      <div className="home-hero__blob home-hero__blob--1" />
      <div className="home-hero__blob home-hero__blob--2" />
      <div className="home-hero__blob home-hero__blob--3" />
    </div>
  );
}
