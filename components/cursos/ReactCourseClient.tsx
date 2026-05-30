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
      if (res.ok) {
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
      }
    } catch {
      /* ignore */
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
        <p className="cursos-hero__subtitle">{t("heroSubtitle")}</p>
        <h1 className="cursos-hero__title gradient-text">{t("heroTitle")}</h1>
        <p className="cursos-hero__tagline">{t("heroDescription")}</p>
        <DownloadTemplateButton />
      </header>

      <main className="cursos-main">
        {session && (
          <ProfileNameForm
            initialName={progress?.displayName ?? session.user?.name ?? ""}
            onSaved={() => fetchProgress()}
          />
        )}

        {session && progress && (
          <div className="cursos-card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "0.5rem",
                fontSize: "0.9rem",
              }}
            >
              <span style={{ color: "#94a3b8" }}>{t("progressLabel")}</span>
              <span>
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

        {loading && session && (
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
          <p style={{ textAlign: "center", color: "#94a3b8" }}>
            {t("loginToDownload")}
          </p>
        )}
      </main>

      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="cursos-card" style={{ maxWidth: "24rem", textAlign: "center" }}>
            <p style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🎉</p>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem" }}>
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
