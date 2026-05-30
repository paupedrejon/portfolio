"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import EstimatedTimeBadge from "./EstimatedTimeBadge";

export type LevelState = {
  id: number;
  slug: string;
  title: string;
  block: string;
  description: string;
  estimatedMinutes: number;
  status: "locked" | "current" | "passed";
  passed: boolean;
  checkpoints: { id: string; label: string; hint?: string; passed: boolean }[];
};

type Props = {
  levels: LevelState[];
  onRefresh?: () => void;
  refreshing?: boolean;
  large?: boolean;
};

const BLOCKS = [
  "Fundamentos",
  "Interactividad",
  "Routing y calidad",
  "Backend real",
  "Pro y despliegue",
];

export default function LevelRoadmap({
  levels,
  onRefresh,
  refreshing,
  large = false,
}: Props) {
  const t = useTranslations("cursos");

  const statusLabel = (status: LevelState["status"]) => {
    if (status === "passed") return t("levelPassed");
    if (status === "current") return t("levelCurrent");
    return t("levelLocked");
  };

  return (
    <div>
      {(onRefresh || !large) && (
        <div className="cursos-roadmap-toolbar">
          {!large && (
            <h2 className="cursos-roadmap-toolbar__title">{t("levelsTitle")}</h2>
          )}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              className="cursos-btn-outline cursos-roadmap-toolbar__refresh"
            >
              {refreshing ? "..." : t("refreshProgress")}
            </button>
          )}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
        {BLOCKS.map((block) => {
          const blockLevels = levels.filter((l) => l.block === block);
          if (!blockLevels.length) return null;
          return (
            <section key={block}>
              <h3 className="cursos-block-title">{block}</h3>
              <div
                className={`cursos-level-grid${large ? " cursos-level-grid--large" : ""}`}
              >
                {blockLevels.map((level) => {
                  const isLocked = level.status === "locked" && !level.passed;
                  const cardClass = [
                    "cursos-level-card",
                    large && "cursos-level-card--large",
                    level.passed && "cursos-level-card--passed",
                    level.status === "current" && "cursos-level-card--current",
                    isLocked && "cursos-level-card--locked",
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <article key={level.id} className={cardClass}>
                      <div className="cursos-level-card__top">
                        <span className="cursos-level-card__num">
                          Nivel {level.id}
                        </span>
                        <div className="cursos-level-card__meta">
                          <EstimatedTimeBadge
                            minutes={level.estimatedMinutes}
                            size="sm"
                          />
                          <span
                            className={`cursos-level-card__badge cursos-level-card__badge--${level.status}`}
                          >
                            {statusLabel(level.status)}
                          </span>
                        </div>
                      </div>
                      <h4 className="cursos-level-card__title">{level.title}</h4>
                      <p className="cursos-level-card__desc">
                        {level.description}
                      </p>
                      {!isLocked && (
                        <Link
                          href={`/cursos/react/nivel/${level.id}`}
                          className="cursos-btn-primary cursos-level-card__cta"
                        >
                          {t("viewLevel")} →
                        </Link>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
