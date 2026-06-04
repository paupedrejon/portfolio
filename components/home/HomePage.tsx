"use client";

import "@/app/[locale]/home.css";
import HomeHeroBackground from "@/components/home/HomeHeroBackground";
import ScrollButton from "@/components/ScrollButton";
import CurriculumButton from "@/components/CurriculumButton";
import ExploreWorkSection from "@/components/expertise/ExploreWorkSection";
import { Link } from "@/i18n/navigation";
import { useEffect, useState, useMemo } from "react";
import { useTranslations } from "next-intl";

function splitDisplayTitle(title: string) {
  const space = title.lastIndexOf(" ");
  if (space <= 0) return { lead: title, accent: "" };
  return { lead: title.slice(0, space), accent: title.slice(space + 1) };
}

export default function HomePage() {
  const t = useTranslations("home");
  const tCommon = useTranslations("common");
  const [mounted, setMounted] = useState(false);
  const { lead, accent } = useMemo(() => splitDisplayTitle(t("title")), [t]);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="home-page">
      <section id="hero-section" className="home-hero" aria-label="Intro">
        <div className="home-hero__bg" aria-hidden />
        <HomeHeroBackground />

        <div
          className={`home-hero__inner ${mounted ? "opacity-100" : "opacity-0"}`}
          style={{ transition: "opacity 0.6s ease-out" }}
        >
          <p className={`home-hero__kicker ${mounted ? "animate-fade-in-up" : ""}`} style={{ animationFillMode: "both" }}>
            {tCommon("softwareEngineer")}
          </p>

          <h1
            className={`home-hero__title ${mounted ? "animate-fade-in-up" : ""}`}
            style={{ animationDelay: "0.08s", animationFillMode: "both" }}
          >
            {lead}
            {accent ? (
              <>
                {" "}
                <span className="home-hero__title-accent">{accent}</span>
              </>
            ) : null}
          </h1>

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
