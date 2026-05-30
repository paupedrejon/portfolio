"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function CursosLanding() {
  const t = useTranslations("cursos");

  return (
    <div className="cursos-page">
      <header className="cursos-hero">
        <p className="cursos-hero__eyebrow">{t("catalogEyebrow")}</p>
        <h1 className="cursos-hero__title">
          <span className="cursos-hero__title-line">{t("catalogTitle")}</span>
          <span className="cursos-hero__title-accent">{t("catalogTitleAccent")}</span>
        </h1>
        <p className="cursos-hero__tagline">{t("catalogSubtitle")}</p>
      </header>

      <main className="cursos-main">
        <Link
          href="/cursos/react"
          className="cursos-feature-card"
          style={{ display: "block", textDecoration: "none", color: "inherit" }}
        >
          <span
            style={{
              fontSize: "0.7rem",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              color: "#a5b4fc",
              fontWeight: 600,
            }}
          >
            Gratis · 30 niveles
          </span>
          <h2
            style={{
              fontFamily: "var(--font-league-spartan), system-ui, sans-serif",
              fontSize: "1.75rem",
              fontWeight: 700,
              margin: "0.75rem 0 0.5rem",
            }}
          >
            {t("reactCardTitle")}
          </h2>
          <p style={{ color: "#94a3b8", fontSize: "1rem", margin: "0 0 1.5rem", lineHeight: 1.55 }}>
            {t("reactCardDescription")}
          </p>
          <span className="btn-primary" style={{ display: "inline-flex", borderRadius: "999px" }}>
            {t("reactCta")} →
          </span>
        </Link>
      </main>
    </div>
  );
}
