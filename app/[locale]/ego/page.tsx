"use client";

import EgoDownloadButton from "@/components/ego/EgoDownloadButton";
import EgoPageSections from "@/components/ego/EgoPageSections";
import EgoPhoneCanvas from "@/components/ego/EgoPhoneScene";
import { useTranslations } from "next-intl";
import "./ego-page.css";

export default function EgoShowcasePage() {
  const t = useTranslations("egoPage.hero");

  return (
    <main className="ego-page">
      <header className="ego-hero">
        <div className="ego-hero__glow" aria-hidden />
        <div className="ego-hero__inner">
          <section className="ego-hero__copy">
            <p className="ego-hero__kicker">{t("kicker")}</p>
            <h1 className="ego-hero__title">{t("title")}</h1>
            <p className="ego-hero__subtitle">{t("subtitle")}</p>
            <EgoDownloadButton label={t("downloadCta")} />
          </section>
          <section className="ego-hero__canvas-wrap" aria-hidden={false}>
            <EgoPhoneCanvas variant="hero" />
          </section>
        </div>
      </header>
      <EgoPageSections />
    </main>
  );
}
