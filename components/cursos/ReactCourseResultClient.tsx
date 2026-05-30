"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const DEMO_BASE = "/cursos/react-demo";

type DemoView = "home" | "projects" | "contact";

const VIEW_PATH: Record<DemoView, string> = {
  home: "",
  projects: "/proyectos",
  contact: "/contacto",
};

const VIEWS: DemoView[] = ["home", "projects", "contact"];

export default function ReactCourseResultClient() {
  const t = useTranslations("cursos");
  const [view, setView] = useState<DemoView>("home");

  const iframeSrc = useMemo(
    () => `${DEMO_BASE}${VIEW_PATH[view]}`,
    [view]
  );

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
          <a
            href={`${DEMO_BASE}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="cursos-result-page__tab cursos-result-page__tab--external"
          >
            {t("finalResultOpenFull")} ↗
          </a>
        </div>

        <div className="cursos-result-page__preview">
          <iframe
            key={iframeSrc}
            title={t("finalResultIframeTitle")}
            src={iframeSrc}
            className="cursos-result-page__iframe"
            loading="lazy"
          />
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
