"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export type LevelState = {
  id: number;
  slug: string;
  title: string;
  block: string;
  description: string;
  status: "locked" | "current" | "passed";
  passed: boolean;
  checkpoints: { id: string; label: string; hint?: string; passed: boolean }[];
};

type Props = {
  levels: LevelState[];
  onRefresh?: () => void;
  refreshing?: boolean;
};

const BLOCKS = [
  "Fundamentos",
  "Interactividad",
  "Routing y calidad",
  "Backend real",
  "Pro y despliegue",
];

export default function LevelRoadmap({ levels, onRefresh, refreshing }: Props) {
  const t = useTranslations("cursos");

  const statusLabel = (status: LevelState["status"]) => {
    if (status === "passed") return t("levelPassed");
    if (status === "current") return t("levelCurrent");
    return t("levelLocked");
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "2rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <h2
          style={{
            fontSize: "1.75rem",
            fontWeight: 700,
            margin: 0,
            fontFamily: "var(--font-league-spartan), system-ui, sans-serif",
          }}
        >
          {t("levelsTitle")}
        </h2>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="btn-secondary"
            style={{ fontSize: "0.875rem", padding: "0.5rem 1rem" }}
          >
            {refreshing ? "..." : t("refreshProgress")}
          </button>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
        {BLOCKS.map((block) => {
          const blockLevels = levels.filter((l) => l.block === block);
          if (!blockLevels.length) return null;
          return (
            <section key={block}>
              <h3 className="cursos-block-title">{block}</h3>
              <div className="cursos-level-grid">
                {blockLevels.map((level) => {
                  const isLocked = level.status === "locked" && !level.passed;
                  const cardClass =
                    level.passed
                      ? "cursos-level-card cursos-level-card--passed"
                      : level.status === "current"
                        ? "cursos-level-card cursos-level-card--current"
                        : isLocked
                          ? "cursos-level-card cursos-level-card--locked"
                          : "cursos-level-card";

                  return (
                    <article key={level.id} className={cardClass}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: "0.5rem",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--cursos-text-muted)",
                          }}
                        >
                          Nivel {level.id}
                        </span>
                        <span
                          style={{
                            fontSize: "0.7rem",
                            fontWeight: 600,
                            padding: "0.2rem 0.5rem",
                            borderRadius: "999px",
                            background:
                              level.passed
                                ? "rgba(16, 185, 129, 0.15)"
                                : level.status === "current"
                                  ? "rgba(42, 140, 160, 0.2)"
                                  : "#f3f4f6",
                            color:
                              level.passed
                                ? "#047857"
                                : level.status === "current"
                                  ? "#1f6b7a"
                                  : "var(--cursos-text-muted)",
                          }}
                        >
                          {statusLabel(level.status)}
                        </span>
                      </div>
                      <h4 style={{ fontWeight: 600, margin: 0 }}>{level.title}</h4>
                      <p
                        style={{
                          fontSize: "0.9rem",
                          color: "var(--cursos-text-muted)",
                          margin: 0,
                          lineHeight: 1.4,
                        }}
                      >
                        {level.description}
                      </p>
                      {!isLocked && (
                        <Link
                          href={`/cursos/react/nivel/${level.id}`}
                          className="cursos-btn-primary"
                          style={{
                            fontSize: "0.875rem",
                            padding: "0.5rem 1rem",
                            marginTop: "auto",
                            alignSelf: "flex-start",
                          }}
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
