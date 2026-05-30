"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import StartCourseButton from "./StartCourseButton";
import { REACT_COURSE } from "@/lib/cursos/courses-meta";
import { formatEstimatedMinutes } from "@/lib/cursos/format-duration";

export default function ReactCourseClient() {
  const t = useTranslations("cursos");

  return (
    <div className="cursos-page">
      <header className="cursos-hero">
        <h1 className="cursos-hero__title">
          <span className="cursos-hero__title-line">{t("heroTitle")}</span>
          <span className="cursos-hero__title-accent">{t("heroTitleAccent")}</span>
        </h1>
        <p className="cursos-hero__tagline">
          {t("courseMetaLine", {
            levels: REACT_COURSE.totalLevels,
            duration: formatEstimatedMinutes(REACT_COURSE.estimatedMinutes),
          })}
        </p>
        <div className="cursos-hero__actions">
          <StartCourseButton />
        </div>
      </header>

      <div className="cursos-feature-row">
        <article className="cursos-feature-card">
          <svg
            className="cursos-feature-card__icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            aria-hidden
          >
            <path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round" />
          </svg>
          <h3>{t("featureLevelsTitle")}</h3>
          <p>{t("featureLevelsDesc")}</p>
        </article>
        <article className="cursos-feature-card">
          <svg
            className="cursos-feature-card__icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            aria-hidden
          >
            <path
              d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <h3>{t("featureCheckTitle")}</h3>
          <p>{t("featureCheckDesc")}</p>
        </article>
      </div>

      <main className="cursos-main" style={{ paddingTop: 0 }}>
        <p style={{ textAlign: "center" }}>
          <Link href="/cursos/react/mapa" className="cursos-btn-outline">
            {t("viewAllLevels")}
          </Link>
        </p>
      </main>
    </div>
  );
}
