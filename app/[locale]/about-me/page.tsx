"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { MapPin } from "lucide-react";
import ReactCountryFlag from "react-country-flag";
import "../home.css";
import "../proyectos/proyectos.css";
import "./about-me.css";
import PortfolioPageHero from "@/components/portfolio/PortfolioPageHero";
import AboutHeroBackground from "@/components/about/AboutHeroBackground";

const LANGUAGES = [
  { key: "spanish", countryCode: "ES", flag: "country" as const },
  { key: "catalan", countryCode: null, flag: "catalonia" as const },
  { key: "english", countryCode: "GB", flag: "country" as const },
  { key: "chinese", countryCode: "CN", flag: "country" as const },
] as const;

export default function AboutMePage() {
  const t = useTranslations("about");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="portfolio-page">
      <PortfolioPageHero
        className="about-hero"
        kicker={t("badge")}
        title={t("title")}
        tagline={t("tagline")}
        scrollTargetId="profile"
        mounted={mounted}
        background={<AboutHeroBackground mounted={mounted} />}
      />

      <section id="profile" className="about-section">
        <div className="portfolio-filters about-filters">
          <div className="portfolio-filters__bar">
            <h2 className="portfolio-filters__title">{t("sectionProfile")}</h2>
          </div>
        </div>

        <div className="about-section__inner">
          <article className="about-profile-card">
            <p className="about-profile-card__bio">{t("bio")}</p>
            <p className="about-profile-card__location">
              <MapPin size={18} strokeWidth={2} aria-hidden />
              <span>{t("location")}</span>
            </p>
          </article>
        </div>

        <div className="portfolio-filters about-filters">
          <div className="portfolio-filters__bar">
            <h2 className="portfolio-filters__title">{t("sectionLanguages")}</h2>
          </div>
        </div>

        <div className="about-section__inner">
          <div className="about-languages" role="list">
            {LANGUAGES.map(({ key, countryCode, flag }) => (
              <div key={key} className="about-lang-card" role="listitem">
                <div className="about-lang-card__icon" aria-hidden>
                  {flag === "catalonia" ? (
                    <img
                      src="/Flag_of_Catalonia.svg"
                      alt=""
                      width={28}
                      height={20}
                    />
                  ) : (
                    <ReactCountryFlag
                      countryCode={countryCode!}
                      svg
                      style={{ width: "1.75em", height: "1.75em" }}
                    />
                  )}
                </div>
                <h3 className="about-lang-card__title">{t(`languages.${key}.name`)}</h3>
                <p className="about-lang-card__level">{t(`languages.${key}.level`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
