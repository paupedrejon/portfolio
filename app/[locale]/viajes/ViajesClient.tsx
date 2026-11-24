"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import PortfolioPageHero from "@/components/portfolio/PortfolioPageHero";
import HomeHeroBackground from "@/components/home/HomeHeroBackground";
import TravelPlannerApp from "@/components/viajes/TravelPlannerApp";
import "../home.css";
import "../proyectos/proyectos.css";
import "./viajes.css";

export default function ViajesClient() {
  const t = useTranslations("viajes");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="portfolio-page portfolio-page--cherry viajes-page">
      <PortfolioPageHero
        kicker={t("hero.kicker")}
        title={t("hero.title")}
        tagline={t("hero.tagline")}
        scrollTargetId="viajes-app"
        mounted={mounted}
        background={<HomeHeroBackground />}
        ariaLabel={t("hero.aria")}
        showCv={false}
        showContact={false}
      />
      <div id="viajes-app">
        <TravelPlannerApp />
      </div>
    </div>
  );
}
