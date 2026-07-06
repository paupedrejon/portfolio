"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import "../home.css";
import "../proyectos/proyectos.css";
import "./privacy.css";
import PortfolioPageHero from "@/components/portfolio/PortfolioPageHero";
import HomeHeroBackground from "@/components/home/HomeHeroBackground";

const SECTION_KEYS = [
  "controller",
  "data",
  "purpose",
  "cookies",
  "retention",
  "recipients",
  "rights",
  "contact",
] as const;

export default function PrivacyPage() {
  const t = useTranslations("privacy");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="portfolio-page">
      <PortfolioPageHero
        className="privacy-hero"
        kicker={t("badge")}
        title={t("title")}
        tagline={t("tagline")}
        scrollTargetId="privacy-content"
        mounted={mounted}
        showCv={false}
        background={<HomeHeroBackground />}
      />

      <section id="privacy-content" className="privacy-section">
        <div className="privacy-section__inner">
          <p className="privacy-updated">{t("lastUpdated")}</p>

          <div className="privacy-grid">
            {SECTION_KEYS.map((key) => (
              <article key={key} className="privacy-card">
                <h2 className="privacy-card__title">{t(`sections.${key}.title`)}</h2>
                <p className="privacy-card__body">{t(`sections.${key}.body`)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
