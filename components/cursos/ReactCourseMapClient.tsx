"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import ProfileNameForm from "./ProfileNameForm";
import LevelRoadmap, { type LevelState } from "./LevelRoadmap";

type ProgressPayload = {
  passedCount: number;
  totalLevels: number;
  progressPercent: number;
  courseCompleted: boolean;
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
      <div className="cursos-level-page" style={{ maxWidth: "72rem" }}>
        <Link href="/cursos/react" className="cursos-level-page__back">
          ← {t("backToCourse")}
        </Link>
        <h1 className="cursos-level-page__title">{t("levelsTitle")}</h1>

        {session && (
          <ProfileNameForm
            initialName={progress?.displayName ?? session.user?.name ?? ""}
            onSaved={() => fetchProgress()}
          />
        )}

        {progressError && (
          <p className="cursos-download-error">{progressError}</p>
        )}

        {session && progress && (
          <div className="cursos-card" style={{ marginBottom: "2rem" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "0.5rem",
              }}
            >
              <span style={{ color: "var(--cursos-text-muted)" }}>
                {t("progressLabel")}
              </span>
              <span style={{ fontWeight: 700 }}>
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
              <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
                <Link href="/cursos/react/diploma" className="cursos-btn-primary">
                  {t("diplomaTitle")} →
                </Link>
              </div>
            )}
          </div>
        )}

        {loading && session && (
          <p style={{ color: "var(--cursos-text-muted)" }}>Cargando...</p>
        )}

        {progress && (
          <LevelRoadmap
            levels={progress.levels}
            onRefresh={session ? () => { setRefreshing(true); fetchProgress(); } : undefined}
            refreshing={refreshing}
          />
        )}

        {!session && (
          <p style={{ color: "var(--cursos-text-muted)" }}>{t("loginToDownload")}</p>
        )}
      </div>
    </div>
  );
}
