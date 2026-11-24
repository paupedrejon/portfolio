"use client";

import "@/app/[locale]/home.css";
import dynamic from "next/dynamic";
import HomeHeroBackground from "@/components/home/HomeHeroBackground";
import ScrollButton from "@/components/ScrollButton";
import CurriculumButton from "@/components/CurriculumButton";
import ExploreWorkSection from "@/components/expertise/ExploreWorkSection";
import { Link } from "@/i18n/navigation";
import gsap from "gsap";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";

const ElectricLogo = dynamic(() => import("@/components/home/ElectricLogo"), {
  ssr: false,
});

/** Marca tipográfica compacta (blanco sobre negro) — silueta limpia para ElectricLogo */
const HERO_LOGO_SRC = "/LOGO_portfolio.png";

function splitDisplayTitle(title: string) {
  const space = title.lastIndexOf(" ");
  if (space <= 0) return { lead: title, accent: "" };
  return { lead: title.slice(0, space), accent: title.slice(space + 1) };
}

export default function HomePage() {
  const t = useTranslations("home");
  const tCommon = useTranslations("common");
  const [mounted, setMounted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const plateRef = useRef<HTMLDivElement>(null);
  const restRef = useRef<HTMLDivElement>(null);
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
    if (!mounted) return;
    const plate = plateRef.current;
    const rest = restRef.current;
    if (!plate) return;

    if (reducedMotion) {
      gsap.set(plate, { clearProps: "all", opacity: 1 });
      if (rest) gsap.set(rest, { clearProps: "all", opacity: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.set(plate, {
        opacity: 0,
        y: -140,
        scale: 0.78,
        rotateX: 38,
        transformPerspective: 900,
        transformOrigin: "50% 50%",
      });
      if (rest) gsap.set(rest, { opacity: 0, y: 28 });

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.to(plate, {
        opacity: 1,
        y: 18,
        scale: 1.04,
        rotateX: -4,
        duration: 0.95,
      }).to(plate, {
        y: 0,
        scale: 1,
        rotateX: 0,
        duration: 0.55,
        ease: "power2.out",
      });

      if (rest) {
        tl.to(
          rest,
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: "power2.out",
          },
          "-=0.35",
        );
      }
    });

    return () => ctx.revert();
  }, [mounted, reducedMotion]);

  const showElectric = mounted && !reducedMotion;

  return (
    <div className="home-page">
      <section id="hero-section" className="home-hero" aria-label="Intro">
        <div className="home-hero__bg" aria-hidden />
        <HomeHeroBackground />

        <div className={`home-hero__inner${mounted ? " home-hero__inner--ready" : ""}`}>
          <p className="home-hero__kicker">{tCommon("softwareEngineer")}</p>

          <div className="home-hero__brand">
            <div ref={plateRef} className="home-hero__plate">
              {showElectric ? (
                <div className="home-hero__electric" aria-hidden>
                  <ElectricLogo
                    src={HERO_LOGO_SRC}
                    color="#f58393"
                    glowColor="#e04667"
                    scale={0.88}
                    strands={3}
                    bend={0.4}
                    crackle={1.15}
                    arcs={0.85}
                    speed={2}
                    interactive
                    intensity={0.7}
                    glow={0.16}
                    thickness={1.55}
                    flicker={0.3}
                    fill={0}
                    cursorIntensity={0.65}
                    cursorRadius={120}
                    theme="dark"
                  />
                </div>
              ) : (
                <img
                  src={HERO_LOGO_SRC}
                  alt=""
                  className="home-hero__logo-fallback"
                  width={420}
                  height={420}
                />
              )}
            </div>

            <div ref={restRef} className="home-hero__copy">
              <h1 className="home-hero__title">
                {lead}
                {accent ? ` ${accent}` : ""}
              </h1>

              <p className="home-hero__tagline">{t("tagline")}</p>

              <div className="home-hero__actions">
                <CurriculumButton href="/PauPedrejonCV.pdf" className="home-btn--cv" />
                <Link href="/proyectos" className="home-btn--ghost">
                  {t("viewAllProjects")}
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="home-hero__scroll">
          <ScrollButton targetId="explore-section" color="transparent" iconColor="#e04667" />
        </div>
      </section>

      <div id="explore-section">
        <ExploreWorkSection />
      </div>
    </div>
  );
}
