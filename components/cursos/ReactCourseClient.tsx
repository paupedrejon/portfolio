"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import DownloadTemplateButton from "./DownloadTemplateButton";
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

export default function ReactCourseClient() {
  const t = useTranslations("cursos");
  const { data: session } = useSession();
  const [progress, setProgress] = useState<ProgressPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [progressError, setProgressError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const lastPassedRef = useRef(0);
  const initialLoadRef = useRef(true);

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
            : `Error al cargar progreso (${res.status})`
        );
        return;
      }
      setProgressError(null);
      const data: ProgressPayload = await res.json();
      if (
        !initialLoadRef.current &&
        data.passedCount > lastPassedRef.current
      ) {
        setShowCelebration(true);
      }
      initialLoadRef.current = false;
      lastPassedRef.current = data.passedCount;
      setProgress(data);
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

  const handleRefresh = () => {
    setRefreshing(true);
    fetchProgress();
  };

  return (
    <div className="cursos-page">
      <header className="cursos-hero">
        <p className="cursos-hero__eyebrow">{t("heroEyebrow")}</p>
        <h1 className="cursos-hero__title">
          <span className="cursos-hero__title-line">{t("heroTitle")}</span>
          <span className="cursos-hero__title-accent">{t("heroTitleAccent")}</span>
        </h1>
        <p className="cursos-hero__tagline">{t("heroDescription")}</p>
        <div className="cursos-hero__actions">
          <DownloadTemplateButton compact />
          <a href="#niveles" className="cursos-btn-outline">
            {t("heroSecondaryCta")}
          </a>
        </div>
      </header>

      <div className="cursos-feature-row">
        <article className="cursos-feature-card">
          <svg
            className="cursos-feature-card__icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            aria-hidden
          >
            <path d="M12 6v12M6 12h12" strokeLinecap="round" />
            <rect x="3" y="3" width="18" height="18" rx="3" />
          </svg>
          <h3>{t("featureLevelsTitle")}</h3>
          <p>{t("featureLevelsDesc")}</p>
        </article>
        <article className="cursos-feature-card">
          <svg
            className="cursos-feature-card__icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            aria-hidden
          >
            <path
              d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <h3>{t("featureCheckTitle")}</h3>
          <p>{t("featureCheckDesc")}</p>
        </article>
      </div>

      <main className="cursos-main" id="niveles">
        {session && (
          <ProfileNameForm
            initialName={progress?.displayName ?? session.user?.name ?? ""}
            onSaved={() => fetchProgress()}
          />
        )}

        {progressError && (
          <p className="cursos-download-error" style={{ textAlign: "center" }}>
            {progressError}
          </p>
        )}

        {session && progress && (
          <div className="cursos-card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "0.5rem",
                fontSize: "0.95rem",
              }}
            >
              <span style={{ color: "#94a3b8" }}>{t("progressLabel")}</span>
              <span style={{ fontWeight: 600 }}>
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
                <Link href="/cursos/react/diploma" className="btn-primary">
                  {t("diplomaTitle")} →
                </Link>
              </div>
            )}
          </div>
        )}

        {loading && session && !progressError && (
          <p style={{ textAlign: "center", color: "#64748b" }}>
            Cargando progreso...
          </p>
        )}

        {progress && (
          <LevelRoadmap
            levels={progress.levels}
            onRefresh={session ? handleRefresh : undefined}
            refreshing={refreshing}
          />
        )}

        {!session && (
          <p style={{ textAlign: "center", color: "#94a3b8", fontSize: "1.05rem" }}>
            {t("loginToDownload")}
          </p>
        )}
      </main>

      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div
            className="cursos-card"
            style={{ maxWidth: "24rem", textAlign: "center" }}
          >
            <p style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🎉</p>
            <h3
              style={{
                fontSize: "1.35rem",
                fontWeight: 700,
                marginBottom: "1rem",
                fontFamily: "var(--font-league-spartan), system-ui, sans-serif",
              }}
            >
              {t("celebrationTitle")}
            </h3>
            <button
              type="button"
              className="btn-primary"
              onClick={() => setShowCelebration(false)}
            >
              {t("celebrationClose")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
