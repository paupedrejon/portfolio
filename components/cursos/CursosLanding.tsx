"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { COURSES } from "@/lib/cursos/courses-meta";
import CourseMetaChips from "./CourseMetaChips";
import { CourseFinalPreviewMock } from "./level-previews/LevelPreviewMocks";

export default function CursosLanding() {
  const t = useTranslations("cursos");

  return (
    <div className="cursos-page">
      <header className="cursos-hero">
        <h1 className="cursos-hero__title">
          <span className="cursos-hero__title-line">{t("catalogTitle")}</span>
          <span className="cursos-hero__title-accent">{t("catalogTitleAccent")}</span>
        </h1>
        <p className="cursos-hero__tagline">{t("catalogSubtitle")}</p>
      </header>

      <main className="cursos-main cursos-catalog">
        {COURSES.map((course) => (
          <Link
            key={course.slug}
            href={`/cursos/${course.slug}`}
            className="cursos-course-card"
          >
            <div className="cursos-course-card__cover" aria-hidden>
              <CourseFinalPreviewMock view="home" compact />
            </div>
            <div className="cursos-course-card__body">
              <CourseMetaChips
                totalLevels={course.totalLevels}
                estimatedMinutes={course.estimatedMinutes}
                className="cursos-course-card__meta"
              />
              <h2 className="cursos-course-card__title">{t(`${course.slug}CardTitle`)}</h2>
              <p className="cursos-course-card__desc">{t(`${course.slug}CardDescription`)}</p>
              <span className="cursos-btn-primary cursos-course-card__cta">
                {t(`${course.slug}Cta`)} →
              </span>
            </div>
          </Link>
        ))}
      </main>
    </div>
  );
}
