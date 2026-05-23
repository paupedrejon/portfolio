"use client";

import EgoDownloadButton from "@/components/ego/EgoDownloadButton";
import EgoMobileHero from "@/components/ego/EgoMobileHero";
import EgoPageSections from "@/components/ego/EgoPageSections";
import EgoPhoneCanvas from "@/components/ego/EgoPhoneScene";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import "./ego-page.css";

function useNarrowViewport() {
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 899px)");
    const update = () => setNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return narrow;
}

export default function EgoShowcasePage() {
  const t = useTranslations("egoPage.hero");
  const narrow = useNarrowViewport();

  return (
    <main className={`ego-page ${narrow ? "ego-page--mobile-hero" : ""}`.trim()}>
      {narrow ? (
        <EgoMobileHero
          kicker={t("kicker")}
          title={t("title")}
          subtitle={t("subtitle")}
          downloadCta={t("downloadCta")}
        />
      ) : (
        <header className="ego-hero">
          <div className="ego-hero__glow" aria-hidden />
          <div className="ego-hero__inner">
            <section className="ego-hero__copy">
              <p className="ego-hero__kicker">{t("kicker")}</p>
              <h1 className="ego-hero__title">{t("title")}</h1>
              <p className="ego-hero__subtitle">{t("subtitle")}</p>
              <EgoDownloadButton label={t("downloadCta")} />
            </section>
            <section className="ego-hero__canvas-wrap" aria-hidden>
              <EgoPhoneCanvas variant="hero" />
            </section>
          </div>
        </header>
      )}

      <EgoPageSections />
    </main>
  );
}
