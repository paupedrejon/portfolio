"use client";

import "@/app/[locale]/home.css";
import dynamic from "next/dynamic";
import HomeHeroBackground from "@/components/home/HomeHeroBackground";
import ScrollButton from "@/components/ScrollButton";
import CurriculumButton from "@/components/CurriculumButton";
import ExploreWorkSection from "@/components/expertise/ExploreWorkSection";
import { Link } from "@/i18n/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { buildHeroWordmarkDataUrl } from "@/components/home/buildHeroWordmark";

const ElectricLogo = dynamic(() => import("@/components/home/ElectricLogo"), {
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
  const [wordmarkSrc, setWordmarkSrc] = useState<string | null>(null);
  const [electricReady, setElectricReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const electricReadyRef = useRef(false);
  const title = t("title");
  const { lead, accent } = useMemo(() => splitDisplayTitle(title), [title]);

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!mounted || reducedMotion) return;
    let cancelled = false;
    const run = async () => {
      try {
        await document.fonts?.ready;
      } catch {
        /* ignore */
      }
      if (cancelled) return;
      const src = buildHeroWordmarkDataUrl(title);
      if (src) setWordmarkSrc(src);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [mounted, reducedMotion, title]);

  const showElectric = Boolean(wordmarkSrc) && !reducedMotion;

  return (
    <div className="home-page">
      <section id="hero-section" className="home-hero home-hero--neon" aria-label="Intro">
        <div className="home-hero__bg" aria-hidden />
        <HomeHeroBackground />

        <div
          className={`home-hero__inner ${mounted ? "opacity-100" : "opacity-0"}`}
          style={{ transition: "opacity 0.6s ease-out" }}
        >
          <p
            className={`home-hero__kicker ${mounted ? "animate-fade-in-up" : ""}`}
            style={{ animationFillMode: "both" }}
          >
            {tCommon("softwareEngineer")}
          </p>

          <div
            className={`home-hero__title-wrap${showElectric ? " home-hero__title-wrap--electric" : ""}`}
          >
            <h1
              className={`home-hero__title ${mounted ? "animate-fade-in-up" : ""}${
                showElectric && electricReady ? " home-hero__title--under-electric" : ""
              }`}
              style={{ animationDelay: "0.08s", animationFillMode: "both" }}
            >
              <span className="home-hero__title-lead">{lead}</span>
              {accent ? (
                <>
                  {" "}
                  <span className="home-hero__title-accent">{accent}</span>
                </>
              ) : null}
            </h1>

            {showElectric && wordmarkSrc ? (
              <div className="home-hero__electric" aria-hidden>
                <ElectricLogo
                  src={wordmarkSrc}
                  color="#f6c2c5"
                  glowColor="#e04667"
                  scale={0.9}
                  strands={5}
                  bend={0.65}
                  crackle={1.55}
                  arcs={1.35}
                  speed={2.4}
                  interactive
                  intensity={0.78}
                  glow={0.85}
                  thickness={1.45}
                  flicker={0.5}
                  fill={0.04}
                  cursorIntensity={0.75}
                  cursorRadius={130}
                  theme="dark"
                  onRender={() => {
                    if (electricReadyRef.current) return;
                    electricReadyRef.current = true;
                    setElectricReady(true);
                  }}
                />
              </div>
            ) : null}
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

        <div
          className={`home-hero__scroll ${mounted ? "animate-fade-in" : ""}`}
          style={{ animationDelay: "0.4s", animationFillMode: "both" }}
        >
          <ScrollButton targetId="explore-section" color="transparent" iconColor="#e04667" />
        </div>
      </section>

      <div id="explore-section">
        <ExploreWorkSection />
      </div>
    </div>
  );
}
