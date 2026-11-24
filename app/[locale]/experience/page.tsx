"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import "../home.css";
import "../proyectos/proyectos.css";
import "./experience.css";
import PortfolioPageHero from "@/components/portfolio/PortfolioPageHero";
import HomeHeroBackground from "@/components/home/HomeHeroBackground";

const Topography = dynamic(() => import("@/components/Topography"), {
  ssr: false,
});

type WorkBlock = {
  title: string;
  points: string[];
};

type OwiusItem = {
  title: string;
  company: string;
  years: string;
  summary: string;
  workBlocksTitle: string;
  workBlocks: WorkBlock[];
};

/** Tokens already named in the Owius summary copy — never invent new ones. */
const STACK_FROM_SUMMARY = [
  "React Native",
  "React",
  "Node",
  "Redsys",
  "SEO",
  "i18n",
] as const;

function stackFromSummary(summary: string): string[] {
  return STACK_FROM_SUMMARY.filter((token) => summary.includes(token));
}

export default function ExperiencePage() {
  const t = useTranslations("experience");
  const [mounted, setMounted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [weakDevice, setWeakDevice] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const owius = t.raw("items.owius") as OwiusItem;
  const stack = useMemo(() => stackFromSummary(owius.summary), [owius.summary]);
  const blockCount = owius.workBlocks.length;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setReducedMotion(media.matches);
      setIsMobile(window.innerWidth < 768);
      const lowCpu = (navigator.hardwareConcurrency || 8) < 6;
      const lowMem =
        "deviceMemory" in navigator &&
        (navigator as Navigator & { deviceMemory?: number }).deviceMemory! <= 4;
      setWeakDevice(lowCpu || !!lowMem);
    };
    update();
    media.addEventListener("change", update);
    window.addEventListener("resize", update);
    return () => {
      media.removeEventListener("change", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const showTopo = mounted && !reducedMotion && !weakDevice;

  return (
    <div className="portfolio-page portfolio-page--cherry">
      <PortfolioPageHero
        className="experience-hero"
        kicker={t("badge")}
        title={t("title")}
        tagline={t("tagline")}
        scrollTargetId="experience"
        mounted={mounted}
        background={
          showTopo ? (
            <Topography
              color="#87002e"
              lineCount={isMobile ? 16 : 22}
              lineWidth={1.2}
              elevation={1}
              foreground={0.2}
              tilt={32}
              speed={reducedMotion ? 0 : 0.25}
              direction="forward"
              glow={0.6}
              depthOfField={0.4}
              fog={0.35}
              hoverEffect="lift"
              clickEffect="pulse"
              majorLines
              scale={1}
              detail={isMobile ? 0.25 : 0.35}
              morph={0.2}
              brightness={1}
              markers="none"
              glitch={0}
              opacity={1}
              mouseInteraction={!isMobile}
              mouseRadius={1}
              mouseStrength={0.6}
              trail={0.3}
              parallax={0.5}
              intro
              lightMode={false}
            />
          ) : (
            <HomeHeroBackground />
          )
        }
      />

      <section id="experience" className="experience-section">
        <div className="experience-section__inner">
          <article className="experience-featured">
            <div className="experience-featured__meta">
              <span className="experience-featured__status">
                {t("sectionTitle")}
              </span>
              <span className="experience-featured__years">{owius.years}</span>
            </div>

            <h2 className="experience-featured__role">{owius.title}</h2>
            <p className="experience-featured__company">{owius.company}</p>

            <div className="experience-featured__summary">
              {owius.summary.split("\n\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>

            {stack.length > 0 ? (
              <ul className="experience-featured__stack" aria-label="Stack">
                {stack.map((chip) => (
                  <li key={chip} className="experience-featured__chip">
                    {chip}
                  </li>
                ))}
              </ul>
            ) : null}
          </article>

          <div className="experience-deliveries">
            <div className="experience-deliveries__head">
              <h3 className="experience-deliveries__title">
                {owius.workBlocksTitle}
              </h3>
              <span className="experience-deliveries__count">
                {String(blockCount).padStart(2, "0")}
              </span>
            </div>

            <ul className="experience-deliveries__grid">
              {owius.workBlocks.map((block, bi) => (
                <li key={bi} className="experience-delivery">
                  <span className="experience-delivery__index" aria-hidden>
                    {String(bi + 1).padStart(2, "0")}
                  </span>
                  <h4 className="experience-delivery__title">{block.title}</h4>
                  <ul className="experience-delivery__list">
                    {block.points.map((pt, pi) => (
                      <li key={pi}>{pt}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>

          <p className="experience-section__footnote">{t("yearsFootnote")}</p>
        </div>
      </section>
    </div>
  );
}
