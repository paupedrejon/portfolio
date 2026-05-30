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
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <section className="hero-section proyectos-hero">
        <div className="hero-grid" aria-hidden />
        <div className="relative z-10 max-w-5xl mx-auto px-6 py-20 text-center">
          <p className="hero-subtitle text-indigo-400 mb-2">{t("heroSubtitle")}</p>
          <h1 className="hero-title gradient-text mb-4">{t("heroTitle")}</h1>
          <p className="hero-tagline mx-auto mb-10 max-w-2xl">{t("heroDescription")}</p>
          <DownloadTemplateButton />
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-24 space-y-12">
        {session && (
          <ProfileNameForm
            initialName={progress?.displayName ?? session.user?.name ?? ""}
            onSaved={() => fetchProgress()}
          />
        )}

        {session && progress && (
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-[var(--text-secondary)]">{t("progressLabel")}</span>
              <span className="font-medium">
                {progress.passedCount}/{progress.totalLevels} ({progress.progressPercent}%)
              </span>
            </div>
            <div className="h-3 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                style={{ width: `${progress.progressPercent}%` }}
              />
            </div>
            {progress.courseCompleted && (
              <div className="mt-6 text-center">
                <Link href="/cursos/react/diploma" className="btn-primary inline-block">
                  {t("diplomaTitle")} →
                </Link>
              </div>
            )}
          </div>
        )}

        {loading && session && (
          <p className="text-center text-[var(--text-muted)]">Cargando progreso...</p>
        )}

        {progress && (
          <LevelRoadmap
            levels={progress.levels}
            onRefresh={session ? handleRefresh : undefined}
            refreshing={refreshing}
          />
        )}

        {!session && (
          <p className="text-center text-[var(--text-muted)]">
            {t("loginToDownload")}
          </p>
        )}
      </section>

      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-[var(--bg-card)] border border-indigo-500/40 rounded-2xl p-8 max-w-sm text-center">
            <p className="text-4xl mb-4">🎉</p>
            <h3 className="text-xl font-bold mb-4">{t("celebrationTitle")}</h3>
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
