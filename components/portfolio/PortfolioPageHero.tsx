"use client";

import { useEffect, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import ScrollButton from "@/components/ScrollButton";
import CurriculumButton from "@/components/CurriculumButton";
import { Link } from "@/i18n/navigation";
import { splitHeroTitle } from "@/lib/splitHeroTitle";

const ElectricLogo = dynamic(() => import("@/components/home/ElectricLogo"), {
  ssr: false,
});

const HERO_LOGO_SRC = "/LOGO_portfolio.png";

type PortfolioPageHeroProps = {
  kicker: string;
  title: string;
  tagline: string;
  scrollTargetId: string;
  mounted: boolean;
  background: ReactNode;
  /** Override de marca; por defecto ElectricLogo soft (como proyectos). `null` lo oculta. */
  brand?: ReactNode | null;
  className?: string;
  ariaLabel?: string;
  showCv?: boolean;
  /** Enlace Contactar (ghost, como home). Off en /contact. */
  showContact?: boolean;
  children?: ReactNode;
  /** Bloque bajo el tagline (p. ej. buscador Skyscanner en /viajes). */
  afterTagline?: ReactNode;
  /** Oculta el scroll cue (útil si el CTA principal ya está en afterTagline). */
  hideScroll?: boolean;
};

function DefaultHeroBrand({ mounted }: { mounted: boolean }) {
  const [showElectric, setShowElectric] = useState(false);

  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lowCpu = (navigator.hardwareConcurrency || 8) < 6;
    const lowMem =
      "deviceMemory" in navigator &&
      (navigator as Navigator & { deviceMemory?: number }).deviceMemory! <= 4;
    setShowElectric(!reduce && !lowCpu && !lowMem);
  }, [mounted]);

  if (!mounted) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={HERO_LOGO_SRC}
        alt=""
        className="portfolio-hero__logo-fallback"
        width={220}
        height={220}
      />
    );
  }

  if (!showElectric) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={HERO_LOGO_SRC}
        alt=""
        className="portfolio-hero__logo-fallback"
        width={220}
        height={220}
      />
    );
  }

  return (
    <div className="portfolio-hero__electric">
      <ElectricLogo
        src={HERO_LOGO_SRC}
        color="#f58393"
        glowColor="#e04667"
        scale={0.82}
        strands={2}
        bend={0.35}
        crackle={0.55}
        arcs={0.4}
        speed={1.35}
        interactive
        intensity={0.38}
        glow={0.1}
        thickness={1.25}
        flicker={0.18}
        fill={0}
        cursorIntensity={0.35}
        cursorRadius={90}
        theme="dark"
      />
    </div>
  );
}

/** Héroe de secciones principales — misma estructura y estilos que la home. */
export default function PortfolioPageHero({
  kicker,
  title,
  tagline,
  scrollTargetId,
  mounted,
  background,
  brand,
  className = "",
  ariaLabel,
  showCv = true,
  showContact = true,
  children,
  afterTagline,
  hideScroll = false,
}: PortfolioPageHeroProps) {
  const tNav = useTranslations("nav");
  const { lead, accent } = splitHeroTitle(title);
  const brandNode =
    brand === null ? null : (brand ?? <DefaultHeroBrand mounted={mounted} />);
  const showContactCta = showContact && showCv;
  const showActions = showCv || showContactCta || Boolean(children);

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
        className={`home-hero__inner${mounted ? " home-hero__inner--ready" : ""}`}
        style={{ transition: "opacity 0.6s ease-out" }}
      >
        <p
          className={`home-hero__kicker${mounted ? " animate-fade-in-up" : ""}`}
          style={{ animationFillMode: "both" }}
        >
          {kicker}
        </p>

        {brandNode ? (
          <div
            className={`portfolio-hero__brand${mounted ? " animate-fade-in-up" : ""}`}
            style={{ animationDelay: "0.04s", animationFillMode: "both" }}
            aria-hidden
          >
            {brandNode}
          </div>
        ) : null}

        <h1
          className={`home-hero__title${mounted ? " animate-fade-in-up" : ""}`}
          style={{ animationDelay: "0.08s", animationFillMode: "both" }}
        >
          {accent ? (
            <>
              {lead}{" "}
              <span className="home-hero__title-accent">{accent}</span>
            </>
          ) : (
            lead
          )}
        </h1>

        <p
          className={`home-hero__tagline${mounted ? " animate-fade-in-up" : ""}`}
          style={{ animationDelay: "0.16s", animationFillMode: "both" }}
        >
          {tagline}
        </p>

        {afterTagline ? (
          <div
            className={`portfolio-hero__after${mounted ? " animate-fade-in-up" : ""}`}
            style={{ animationDelay: "0.22s", animationFillMode: "both" }}
          >
            {afterTagline}
          </div>
        ) : null}

        {showActions ? (
          <div
            className={`home-hero__actions${mounted ? " animate-fade-in-up" : ""}`}
            style={{ animationDelay: "0.24s", animationFillMode: "both" }}
          >
            {showCv ? (
              <CurriculumButton href="/PauPedrejonCV.pdf" className="home-btn--ghost" />
            ) : null}
            {showContactCta ? (
              <Link href="/contact" className="home-btn--ghost">
                {tNav("contact")}
              </Link>
            ) : null}
            {children}
          </div>
        ) : null}
      </div>

      {!hideScroll ? (
        <div
          className={`home-hero__scroll${mounted ? " animate-fade-in" : ""}`}
          style={{ animationDelay: "0.38s", animationFillMode: "both" }}
        >
          <ScrollButton
            targetId={scrollTargetId}
            color="transparent"
            iconColor="var(--portfolio-accent-bright, #e04667)"
          />
        </div>
      ) : null}
    </section>
  );
}
