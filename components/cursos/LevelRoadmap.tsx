"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";

export type LevelState = {
  id: number;
  slug: string;
  title: string;
  block: string;
  description: string;
  status: "locked" | "current" | "passed";
  passed: boolean;
  checkpoints: { id: string; label: string; passed: boolean }[];
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
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold">{t("levelsTitle")}</h2>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="btn-secondary text-sm py-2 px-4"
          >
            {refreshing ? "..." : t("refreshProgress")}
          </button>
        )}
      </div>

      <div className="space-y-12">
        {BLOCKS.map((block) => {
          const blockLevels = levels.filter((l) => l.block === block);
          if (!blockLevels.length) return null;
          return (
            <div key={block}>
              <h3 className="text-sm uppercase tracking-widest text-indigo-400 mb-4 font-semibold">
                {block}
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {blockLevels.map((level) => {
                  const isLocked = level.status === "locked" && !level.passed;
                  const isCurrent = level.status === "current";
                  return (
                    <motion.div
                      key={level.id}
                      layout
                      className={`relative p-5 rounded-xl border transition-colors ${
                        level.passed
                          ? "border-emerald-500/40 bg-emerald-500/5"
                          : isCurrent
                            ? "border-indigo-500/60 bg-indigo-500/10 ring-1 ring-indigo-500/30"
                            : isLocked
                              ? "border-[var(--border-subtle)] bg-[var(--bg-card)] opacity-60"
                              : "border-[var(--border-subtle)] bg-[var(--bg-card)]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-xs text-[var(--text-muted)]">
                          Nivel {level.id}
                        </span>
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            level.passed
                              ? "bg-emerald-500/20 text-emerald-400"
                              : isCurrent
                                ? "bg-indigo-500/20 text-indigo-300"
                                : "bg-slate-500/20 text-slate-400"
                          }`}
                        >
                          {statusLabel(level.status)}
                        </span>
                      </div>
                      <h4 className="font-semibold mb-1">{level.title}</h4>
                      <p className="text-xs text-[var(--text-secondary)] mb-3 line-clamp-2">
                        {level.description}
                      </p>
                      <ul className="space-y-1 mb-3">
                        {level.checkpoints.map((cp) => (
                          <li
                            key={cp.id}
                            className="text-xs flex items-center gap-2 text-[var(--text-muted)]"
                          >
                            <span
                              className={
                                cp.passed ? "text-emerald-400" : "text-slate-500"
                              }
                            >
                              {cp.passed ? "✓" : "○"}
                            </span>
                            <span className={cp.passed ? "line-through opacity-70" : ""}>
                              {cp.label}
                            </span>
                          </li>
                        ))}
                      </ul>
                      {!isLocked && (
                        <Link
                          href={`/cursos/react/nivel/${level.id}`}
                          className="text-sm text-indigo-400 hover:text-indigo-300 font-medium"
                        >
                          {t("viewLevel")} →
                        </Link>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
