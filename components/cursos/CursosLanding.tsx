"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function CursosLanding() {
  const t = useTranslations("cursos");

  return (
    <div className="cursos-page">
      <header className="cursos-hero">
        <p className="cursos-hero__subtitle">{t("catalogTitle")}</p>
        <h1 className="cursos-hero__title gradient-text">{t("catalogTitle")}</h1>
        <p className="cursos-hero__tagline">{t("catalogSubtitle")}</p>
      </header>

      <main className="cursos-main">
        <Link href="/cursos/react" className="cursos-card" style={{ display: "block", textDecoration: "none", color: "inherit" }}>
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
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0.5rem 0" }}>
            {t("reactCardTitle")}
          </h2>
          <p style={{ color: "#94a3b8", fontSize: "0.95rem", margin: "0 0 1.25rem" }}>
            {t("reactCardDescription")}
          </p>
          <span className="btn-primary" style={{ display: "inline-flex" }}>
            {t("reactCta")}
          </span>
        </Link>
      </main>
    </div>
  );
}
