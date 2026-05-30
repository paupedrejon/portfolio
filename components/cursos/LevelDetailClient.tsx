"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import DownloadTemplateButton from "./DownloadTemplateButton";

export type CheckpointView = {
  id: string;
  label: string;
  hint: string;
  passed: boolean;
};

type Props = {
  levelId: number;
  title: string;
  block: string;
  instructions: string;
  initialCheckpoints: CheckpointView[];
  initialStatus: string;
  totalLevels: number;
};

export default function LevelDetailClient({
  levelId,
  title,
  block,
  instructions,
  initialCheckpoints,
  initialStatus,
  totalLevels,
}: Props) {
  const t = useTranslations("cursos");
  const { data: session } = useSession();
  const [checkpoints, setCheckpoints] = useState(initialCheckpoints);
  const [status, setStatus] = useState(initialStatus);
  const [openHintId, setOpenHintId] = useState<string | null>(
    initialCheckpoints.find((c) => !c.passed)?.id ?? null
  );
  const hintsRef = useRef(
    Object.fromEntries(initialCheckpoints.map((c) => [c.id, c.hint]))
  );

  const syncProgress = useCallback(async () => {
    if (!session) return;
    try {
      const res = await fetch("/api/me/progress?course=react");
      if (!res.ok) return;
      const data = await res.json();
      const level = data.levels?.find((l: { id: number }) => l.id === levelId);
      if (level) {
        setStatus(level.status);
        setCheckpoints(
          level.checkpoints.map((cp: CheckpointView) => ({
            id: cp.id,
            label: cp.label,
            hint: hintsRef.current[cp.id] ?? cp.hint ?? "",
            passed: cp.passed,
          }))
        );
      }
    } catch {
      /* ignore */
    }
  }, [session, levelId]);

  useEffect(() => {
    syncProgress();
  }, [syncProgress]);

  useEffect(() => {
    if (!session) return;
    const id = setInterval(syncProgress, 4000);
    return () => clearInterval(id);
  }, [session, syncProgress]);

  const passedCount = checkpoints.filter((c) => c.passed).length;
  const allPassed = passedCount === checkpoints.length && checkpoints.length > 0;
  const nextLevelId = levelId < totalLevels ? levelId + 1 : null;

  const badgeClass =
    status === "passed"
      ? "cursos-level-page__badge cursos-level-page__badge--passed"
      : status === "current"
        ? "cursos-level-page__badge cursos-level-page__badge--current"
        : "cursos-level-page__badge cursos-level-page__badge--locked";

  return (
    <div className="cursos-page">
      <article className="cursos-level-page">
        <Link href="/cursos/react/mapa" className="cursos-level-page__back">
          ← {t("levelPageBack")}
        </Link>

        <p className="cursos-level-page__block">{block}</p>
        <h1 className="cursos-level-page__title">
          Nivel {levelId}: {title}
        </h1>
        <span className={badgeClass}>
          {status === "passed"
            ? t("levelPassed")
            : status === "current"
              ? t("levelCurrent")
              : t("levelLocked")}
        </span>

        {levelId === 1 && (
          <div className="cursos-level-page__download">
            <h3>{t("downloadTemplate")}</h3>
            <p>{t("level1DownloadHint")}</p>
            <DownloadTemplateButton />
          </div>
        )}

        {session && (
          <p className="cursos-level-page__sync">
            <span className="cursos-level-page__sync-dot" aria-hidden />
            {t("autoSyncHint")}
          </p>
        )}

        <h2 className="cursos-level-page__section-title">{t("instructionsTitle")}</h2>
        <div className="cursos-level-page__instructions">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{instructions}</ReactMarkdown>
        </div>

        <h2 className="cursos-level-page__section-title">{t("checkpointsTitle")}</h2>
        <ul className="cursos-checklist">
          {checkpoints.map((cp) => {
            const isOpen = openHintId === cp.id;
            return (
              <li
                key={cp.id}
                className={`cursos-check-item${cp.passed ? " cursos-check-item--passed" : ""}`}
              >
                <button
                  type="button"
                  className="cursos-check-item__head"
                  onClick={() => setOpenHintId(isOpen ? null : cp.id)}
                  aria-expanded={isOpen}
                >
                  <span className="cursos-check-item__ring" aria-hidden>
                    {cp.passed ? "✓" : ""}
                  </span>
                  <span className="cursos-check-item__label">{cp.label}</span>
                  <span
                    className={`cursos-check-item__chevron${isOpen ? " cursos-check-item__chevron--open" : ""}`}
                    aria-hidden
                  >
                    ▾
                  </span>
                </button>
                {isOpen && (
                  <div className="cursos-check-item__hint">
                    <p className="cursos-check-item__hint-title">{t("hintLabel")}</p>
                    <p className="cursos-check-item__hint-body">{cp.hint}</p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        {allPassed && nextLevelId && (
          <div className="cursos-level-page__next">
            <Link href={`/cursos/react/nivel/${nextLevelId}`} className="cursos-btn-primary">
              {t("nextLevel")} →
            </Link>
          </div>
        )}

        {allPassed && !nextLevelId && (
          <div className="cursos-level-page__next">
            <Link href="/cursos/react/diploma" className="cursos-btn-primary">
              {t("diplomaTitle")} →
            </Link>
          </div>
        )}
      </article>
    </div>
  );
}
