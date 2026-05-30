"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import ProfileNameForm from "./ProfileNameForm";
import LevelRoadmap, { type LevelState } from "./LevelRoadmap";
import { REACT_COURSE } from "@/lib/cursos/courses-meta";
import { formatEstimatedMinutes } from "@/lib/cursos/format-duration";

type ProgressPayload = {
  passedCount: number;
  totalLevels: number;
  progressPercent: number;
  courseCompleted: boolean;
  profileNameLocked: boolean;
  displayName: string | null;
  levels: LevelState[];
};

export default function ReactCourseMapClient() {
  const t = useTranslations("cursos");
  const { data: session } = useSession();
  const [progress, setProgress] = useState<ProgressPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [progressError, setProgressError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProgress = useCallback(async () => {
    if (!session) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/me/progress?course=react");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setProgressError(
          typeof data.error === "string"
            ? data.error
            : `Error (${res.status})`
        );
        return;
      }
      setProgressError(null);
      setProgress(await res.json());
    } catch {
      setProgressError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  useEffect(() => {
    if (!session) return;
    const id = setInterval(fetchProgress, 5000);
    return () => clearInterval(id);
  }, [session, fetchProgress]);

  return (
    <div className="cursos-page">
      <header className="cursos-hero cursos-hero--map">
        <Link href="/cursos/react" className="cursos-level-page__back">
          ← {t("backToCourse")}
        </Link>
        <h1 className="cursos-hero__title">
          <span className="cursos-hero__title-line">{t("levelsTitle")}</span>
        </h1>
        {session && progress && (
          <p className="cursos-hero__tagline">
            {progress.passedCount}/{progress.totalLevels} niveles ·{" "}
            {progress.progressPercent}% {t("progressLabel").toLowerCase()} ·{" "}
            {t("courseEstimatedTime", {
              duration: formatEstimatedMinutes(REACT_COURSE.estimatedMinutes),
            })}
          </p>
        )}
        {!session && (
          <p className="cursos-hero__tagline">
            {t("courseEstimatedTime", {
              duration: formatEstimatedMinutes(REACT_COURSE.estimatedMinutes),
            })}
          </p>
        )}
      </header>

      <div className="cursos-map-body">
        {session && (
          <ProfileNameForm
            initialName={progress?.displayName ?? session.user?.name ?? ""}
            locked={progress?.profileNameLocked}
            onSaved={() => fetchProgress()}
          />
        )}

        {progressError && (
          <p className="cursos-download-error">{progressError}</p>
        )}

        {session && progress && (
          <div className="cursos-card cursos-map-progress">
            <div className="cursos-map-progress__row">
              <span>{t("progressLabel")}</span>
              <span className="cursos-map-progress__value">
                {progress.passedCount}/{progress.totalLevels} (
                {progress.progressPercent}%)
              </span>
            </div>
            <div className="cursos-progress-bar">
              <div
                className="cursos-progress-fill"
                style={{ width: `${progress.progressPercent}%` }}
              />
            </div>
            {progress.courseCompleted && (
              <div className="cursos-map-progress__diploma">
                <Link href="/cursos/react/diploma" className="cursos-btn-primary">
                  {t("diplomaTitle")} →
                </Link>
              </div>
            )}
          </div>
        )}

        {loading && session && (
          <p className="cursos-map-loading">Cargando...</p>
        )}

        {progress && (
          <LevelRoadmap
            levels={progress.levels}
            large
            onRefresh={
              session
                ? () => {
                    setRefreshing(true);
                    fetchProgress();
                  }
                : undefined
            }
            refreshing={refreshing}
          />
        )}

        {!session && (
          <p className="cursos-map-login-hint">{t("loginToDownload")}</p>
        )}
      </div>
    </div>
  );
}
