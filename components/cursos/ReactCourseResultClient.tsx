"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  CourseFinalPreviewMock,
  type CourseFinalView,
} from "./level-previews/LevelPreviewMocks";

const VIEWS: CourseFinalView[] = ["home", "projects", "contact"];

export default function ReactCourseResultClient() {
  const t = useTranslations("cursos");
  const [view, setView] = useState<CourseFinalView>("home");

  return (
    <div className="cursos-page cursos-result-page">
      <div className="cursos-result-page__inner">
        <Link href="/cursos/react" className="cursos-diploma-page__back">
          ← {t("backToCourse")}
        </Link>

        <header className="cursos-result-page__header">
          <h1 className="cursos-diploma-page__title">{t("finalResultTitle")}</h1>
          <p className="cursos-diploma-page__subtitle">{t("finalResultSubtitle")}</p>
        </header>

        <div className="cursos-result-page__tabs" role="tablist" aria-label={t("finalResultTitle")}>
          {VIEWS.map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={view === v}
              className={`cursos-result-page__tab${view === v ? " cursos-result-page__tab--active" : ""}`}
              onClick={() => setView(v)}
            >
              {t(`finalResultTab_${v}`)}
            </button>
          ))}
        </div>

        <div className="cursos-result-page__preview">
          <CourseFinalPreviewMock view={view} />
        </div>

        <p className="cursos-result-page__note">{t("finalResultNote")}</p>

        <div className="cursos-result-page__actions">
          <Link href="/cursos/react/mapa" className="cursos-btn-primary">
            {t("startCourse")} →
          </Link>
        </div>
      </div>
    </div>
  );
}
