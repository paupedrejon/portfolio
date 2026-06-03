"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import EgoPhoneCanvas from "./EgoPhoneScene";
import { IconZap } from "./EgoIcons";

const APK_HREF =
  "https://github.com/paupedrejon/portfolio/releases/download/v1.0.0-ego/e-Go.apk";

function splitBannerTitle(title: string) {
  const space = title.lastIndexOf(" ");
  if (space <= 0) return { lead: title, accent: "" };
  return { lead: title.slice(0, space), accent: title.slice(space + 1) };
}

/** Bloque e-Go en la home — estilos en `home.css` (.home-ego). */
export default function EgoHomeBanner() {
  const t = useTranslations("home.egoBanner");
  const stats = t.raw("stats") as { value: string; label: string }[];
  const { lead, accent } = useMemo(() => splitBannerTitle(t("title")), [t]);

  return (
    <section aria-labelledby="ego-banner-title" className="home-ego">
      <div className="home-ego__card">
        <div className="home-ego__glow" aria-hidden />
        <div className="home-ego__mesh" aria-hidden />

        <div className="home-ego__inner">
          <div className="home-ego__visual">
            <div className="home-ego__phone-glow" aria-hidden />
            <EgoPhoneCanvas variant="banner" />
          </div>

          <div className="home-ego__content">
            <span className="home-ego__badge">
              <IconZap width={16} height={16} aria-hidden />
              {t("badge")}
            </span>

            <p className="home-ego__kicker">{t("headline")}</p>

            <h2 id="ego-banner-title" className="home-ego__title">
              {lead}
              {accent ? (
                <>
                  {" "}
                  <span className="home-ego__title-accent">{accent}</span>
                </>
              ) : null}
            </h2>

            <p className="home-ego__desc">{t("description")}</p>

            <ul className="home-ego__stats">
              {stats.map((s) => (
                <li key={s.label}>
                  <strong>{s.value}</strong>
                  <span>{s.label}</span>
                </li>
              ))}
            </ul>

            <div className="home-ego__actions">
              <a href={APK_HREF} download className="home-btn--primary home-ego__action-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                {t("downloadCta")}
              </a>
              <Link href="/ego" className="home-btn--ghost home-ego__action-btn">
                {t("learnMore")}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
