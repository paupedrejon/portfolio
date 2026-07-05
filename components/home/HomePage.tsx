"use client";

import "@/app/[locale]/home.css";
import dynamic from "next/dynamic";
import HeroTitleIgnite, {
  heroIgniteDelayMs,
  heroIgniteTotalMs,
  HeroTitleStatic,
} from "@/components/home/HeroTitleIgnite";
import HeroNeonFilters from "@/components/home/HeroNeonFilters";
import HomeHeroBackground from "@/components/home/HomeHeroBackground";
import ScrollButton from "@/components/ScrollButton";
import CurriculumButton from "@/components/CurriculumButton";
import ExploreWorkSection from "@/components/expertise/ExploreWorkSection";
import { Link } from "@/i18n/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";

const HeroTitleSmokeGL = dynamic(() => import("@/components/home/HeroTitleSmokeGL"), {
  ssr: false,
});

function splitDisplayTitle(title: string) {
  const space = title.lastIndexOf(" ");
  if (space <= 0) return { lead: title, accent: "" };
  return { lead: title.slice(0, space), accent: title.slice(space + 1) };
}

export default function HomePage() {
  const t = useTranslations("home");
  const tCommon = useTranslations("common");
  const [mounted, setMounted] = useState(false);
  const [heroPhase, setHeroPhase] = useState<"idle" | "ignite" | "neon">("idle");
  const titleRef = useRef<HTMLHeadingElement>(null);
  const title = t("title");
  const { lead, accent } = useMemo(() => splitDisplayTitle(title), [title]);
  const accentDelay = useMemo(() => heroIgniteDelayMs(lead, 88), [lead]);
  const igniteTotalMs = useMemo(() => heroIgniteTotalMs(lead, accent, 88), [lead, accent]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    setHeroPhase("ignite");
  }, [mounted]);

  useEffect(() => {
    if (!mounted || heroPhase !== "ignite") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const delay = mq.matches ? 0 : Math.max(0, igniteTotalMs - 200);
    const timer = window.setTimeout(() => setHeroPhase("neon"), delay);
    return () => window.clearTimeout(timer);
  }, [mounted, heroPhase, igniteTotalMs]);

  const neonActive = heroPhase === "neon";
  const heroClassName = [
    "home-hero",
    heroPhase === "ignite" ? "home-hero--ignite" : "",
    heroPhase === "neon" ? "home-hero--neon home-hero--ignite-fade" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="home-page">
      <section
        id="hero-section"
        className={heroClassName}
        aria-label="Intro"
      >
        <div className="home-hero__bg" aria-hidden />
        <div className="home-hero__ignite-ambient" aria-hidden />
        <HomeHeroBackground />

        <div
          className={`home-hero__inner ${mounted ? "opacity-100" : "opacity-0"}`}
          style={{ transition: "opacity 0.6s ease-out" }}
        >
          <p className={`home-hero__kicker ${mounted ? "animate-fade-in-up" : ""}`} style={{ animationFillMode: "both" }}>
            {tCommon("softwareEngineer")}
          </p>

          <div
            className={`home-hero__title-wrap${neonActive ? " home-hero__title-wrap--neon" : ""}`}
          >
            {mounted ? <HeroNeonFilters /> : null}
            {mounted ? <div className="home-hero__title-rays" aria-hidden /> : null}
            {neonActive ? <HeroTitleSmokeGL titleRef={titleRef} /> : null}
            <h1
              ref={titleRef}
              className={`home-hero__title ${mounted ? "animate-fade-in-up" : ""}`}
              style={{ animationDelay: "0.08s", animationFillMode: "both" }}
              suppressHydrationWarning
            >
              <span className="sr-only">{title}</span>
              {mounted ? (
                <>
                  <HeroTitleIgnite text={lead} active variant="default" />
                  {accent ? (
                    <>
                      {" "}
                      <span className="home-hero__title-accent">
                        <HeroTitleIgnite
                          text={accent}
                          variant="accent"
                          startDelayMs={accentDelay}
                        />
                      </span>
                    </>
                  ) : null}
                </>
              ) : (
                <>
                  <HeroTitleStatic text={lead} variant="default" />
                  {accent ? (
                    <>
                      {" "}
                      <span className="home-hero__title-accent">
                        <HeroTitleStatic text={accent} variant="accent" />
                      </span>
                    </>
                  ) : null}
                </>
              )}
            </h1>
          </div>

          <p
            className={`home-hero__tagline ${mounted ? "animate-fade-in-up" : ""}`}
            style={{ animationDelay: "0.16s", animationFillMode: "both" }}
          >
            {t("tagline")}
          </p>

          <div
            className={`home-hero__actions ${mounted ? "animate-fade-in-up" : ""}`}
            style={{ animationDelay: "0.24s", animationFillMode: "both" }}
          >
            <CurriculumButton href="/PauPedrejonCV.pdf" className="home-btn--cv" />
            <Link href="/proyectos" className="home-btn--ghost">
              {t("viewAllProjects")}
            </Link>
          </div>
        </div>

        <div className={`home-hero__scroll ${mounted ? "animate-fade-in" : ""}`} style={{ animationDelay: "0.4s", animationFillMode: "both" }}>
          <ScrollButton targetId="explore-section" color="transparent" iconColor="#358c9f" />
        </div>
      </section>

      <div id="explore-section">
        <ExploreWorkSection />
      </div>
    </div>
  );
}
