"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

type Props = {
  levelId: number;
  title: string;
  block: string;
  instructions: string;
  checkpoints: { id: string; label: string; passed?: boolean }[];
  status: string;
};

export default function LevelDetailClient({
  levelId,
  title,
  block,
  instructions,
  checkpoints,
  status,
}: Props) {
  const t = useTranslations("cursos");

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link
          href="/cursos/react"
          className="text-sm text-indigo-400 hover:text-indigo-300 mb-8 inline-block"
        >
          ← {t("levelPageBack")}
        </Link>

        <p className="text-xs uppercase tracking-widest text-indigo-400 mb-2">{block}</p>
        <h1 className="text-3xl font-bold mb-2">
          Nivel {levelId}: {title}
        </h1>
        <span
          className={`inline-block text-xs px-3 py-1 rounded-full mb-8 ${
            status === "passed"
              ? "bg-emerald-500/20 text-emerald-400"
              : status === "current"
                ? "bg-indigo-500/20 text-indigo-300"
                : "bg-slate-500/20 text-slate-400"
          }`}
        >
          {status === "passed"
            ? t("levelPassed")
            : status === "current"
              ? t("levelCurrent")
              : t("levelLocked")}
        </span>

        <div className="prose prose-invert prose-indigo max-w-none mb-10">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] not-prose mb-4">
            {t("instructionsTitle")}
          </h2>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{instructions}</ReactMarkdown>
        </div>

        <div className="p-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)]">
          <h3 className="font-semibold mb-4">Puntos a completar</h3>
          <ul className="space-y-2">
            {checkpoints.map((cp) => (
              <li key={cp.id} className="flex items-center gap-3 text-sm">
                <span className={cp.passed ? "text-emerald-400" : "text-slate-500"}>
                  {cp.passed ? "✓" : "○"}
                </span>
                {cp.label}
              </li>
            ))}
          </ul>
          <p className="text-xs text-[var(--text-muted)] mt-6">
            En la carpeta del proyecto ejecuta:{" "}
            <code className="bg-[var(--bg-secondary)] px-2 py-1 rounded">
              npm run check
            </code>
          </p>
        </div>
      </div>
    </div>
  );
}
