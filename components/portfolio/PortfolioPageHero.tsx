"use client";

import type { ReactNode } from "react";
import ScrollButton from "@/components/ScrollButton";
import CurriculumButton from "@/components/CurriculumButton";
import { splitHeroTitle } from "@/lib/splitHeroTitle";

type PortfolioPageHeroProps = {
  kicker: string;
  title: string;
  tagline: string;
  scrollTargetId: string;
  mounted: boolean;
  background: ReactNode;
  className?: string;
  ariaLabel?: string;
  showCv?: boolean;
  children?: ReactNode;
};

/** Héroe de secciones principales — misma estructura y estilos que la home. */
export default function PortfolioPageHero({
  kicker,
  title,
  tagline,
  scrollTargetId,
  mounted,
  background,
  className = "",
  ariaLabel,
  showCv = true,
  children,
}: PortfolioPageHeroProps) {
  const { lead, accent } = splitHeroTitle(title);

  return (
    <section
      id="hero-section"
      className={`home-hero w-full max-w-[100vw] overflow-x-hidden ${className}`.trim()}
      aria-label={ariaLabel ?? title}
    >
      <div className="home-hero__bg" aria-hidden />
      <div className="portfolio-hero__fx" aria-hidden>
        {background}
      </div>

      <div
        className={`home-hero__inner ${mounted ? "opacity-100" : "opacity-0"}`}
        style={{ transition: "opacity 0.6s ease-out" }}
      >
        <p
          className={`home-hero__kicker ${mounted ? "animate-fade-in-up" : ""}`}
          style={{ animationFillMode: "both" }}
        >
          {kicker}
        </p>

        <h1
          className={`home-hero__title ${mounted ? "animate-fade-in-up" : ""}`}
          style={{ animationDelay: "0.08s", animationFillMode: "both" }}
        >
          {accent ? (
            <>
              {lead}
              {" "}
              <span className="home-hero__title-accent">{accent}</span>
            </>
          ) : (
            lead
          )}
        </h1>

        <p
          className={`home-hero__tagline ${mounted ? "animate-fade-in-up" : ""}`}
          style={{ animationDelay: "0.16s", animationFillMode: "both" }}
        >
          {tagline}
        </p>

        {(showCv || children) && (
          <div
            className={`home-hero__actions ${mounted ? "animate-fade-in-up" : ""}`}
            style={{ animationDelay: "0.24s", animationFillMode: "both" }}
          >
            {showCv ? <CurriculumButton href="/PauPedrejonCV.pdf" className="home-btn--cv" /> : null}
            {children}
          </div>
        )}
      </div>

      <div
        className={`home-hero__scroll ${mounted ? "animate-fade-in" : ""}`}
        style={{ animationDelay: "0.38s", animationFillMode: "both" }}
      >
        <ScrollButton targetId={scrollTargetId} color="transparent" iconColor="#358c9f" />
      </div>
    </section>
  );
}
