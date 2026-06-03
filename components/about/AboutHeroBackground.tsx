"use client";

type AboutHeroBackgroundProps = {
  mounted: boolean;
};

const LINE_COUNT = 15;

function lineStyle(i: number) {
  const seed = i * 7 + 13;
  const width = (seed % 20) / 10 + 1;
  const height = (seed % 200) + 100;
  const left = (seed * 7) % 100;
  const duration = (seed % 80) / 10 + 6;
  const delay = (seed % 50) / 10;
  const opacity = (seed % 40) / 100 + 0.2;
  const shadowSize = (seed % 100) / 10 + 5;
  const colorVariant = seed % 2 === 0 ? "53, 140, 159" : "78, 179, 200";
  return {
    width: `${width}px`,
    height: `${height}px`,
    left: `${left}%`,
    animationDuration: `${duration}s`,
    animationDelay: `${delay}s`,
    background: `linear-gradient(to top, rgba(${colorVariant}, 0), rgba(${colorVariant}, ${opacity}))`,
    boxShadow: `0 0 ${shadowSize}px rgba(${colorVariant}, 0.35)`,
  } as const;
}

/** Fondo original de Sobre mí: grid, orbes y líneas ascendentes — paleta home teal */
export default function AboutHeroBackground({ mounted }: AboutHeroBackgroundProps) {
  return (
    <div className="about-hero-bg" aria-hidden>
      <div className="hero-grid" />

      <div className="about-hero-bg__orbs">
        <div className="about-hero-bg__orb about-hero-bg__orb--1" />
        <div className="about-hero-bg__orb about-hero-bg__orb--2" />
        <div className="about-hero-bg__orb about-hero-bg__orb--3" />
      </div>

      <div className="about-hero-bg__pulse" />

      {mounted
        ? [...Array(LINE_COUNT)].map((_, i) => (
            <div key={i} className="about-hero-bg__line" style={lineStyle(i)} />
          ))
        : null}
    </div>
  );
}
