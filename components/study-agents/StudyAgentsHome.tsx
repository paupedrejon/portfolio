"use client";

import { useCallback, useEffect, useState } from "react";
import { leagueSpartan, outfit, spaceGrotesk } from "@/app/fonts";
import StudyAgentsBotAvatar from "@/components/study-agents/StudyAgentsBotAvatar";
import HomeHeroBackground from "@/components/home/HomeHeroBackground";
import { SA_PRIMARY, SA_CYAN } from "@/lib/study-agents/brand";
import { OPEN_API_KEY_MODAL_EVENT } from "@/lib/study-agents/api-keys";
import { studyAgentsFetch } from "@/hooks/study-agents/useApiClient";
import "@/components/study-agents/study-agents-bot.css";
import "@/components/study-agents/study-agents-hero.css";

export type SaCourseSummary = {
  chatId: string;
  title: string;
  topic: string;
  updatedAt?: string;
  planDays?: number;
  planMinutes?: number;
};

type Props = {
  userId: string;
  onStartCourse: () => void;
  onOpenCourse: (course: SaCourseSummary) => void;
};

function progressForCourse(chatId: string, topic: string): { done: number; xp: number } {
  if (typeof window === "undefined") return { done: 0, xp: 0 };
  try {
    const key = `sa_plan_${chatId}_${topic}`;
    const raw = localStorage.getItem(key);
    if (!raw) return { done: 0, xp: 0 };
    const p = JSON.parse(raw) as { completedDays?: number[]; xp?: number };
    return {
      done: Array.isArray(p.completedDays) ? p.completedDays.length : 0,
      xp: Number(p.xp) || 0,
    };
  } catch {
    return { done: 0, xp: 0 };
  }
}

function todayLessonHint(chatId: string, topic: string): string {
  const { done } = progressForCourse(chatId, topic);
  if (done === 0) return "Empieza la lección 1";
  return `Siguiente: lección ${done + 1}`;
}

/**
 * Home de Study Agents orientada a cursos (hero fullscreen + lista).
 */
export default function StudyAgentsHome({ userId, onStartCourse, onOpenCourse }: Props) {
  const [courses, setCourses] = useState<SaCourseSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCourses = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await studyAgentsFetch("/api/study-agents/list-chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!data.success || !Array.isArray(data.chats)) {
        setCourses([]);
        return;
      }
      const mapped: SaCourseSummary[] = data.chats
        .filter((c: { metadata?: { coursePlan?: boolean }; title?: string; chat_id?: string }) => {
          const meta = c.metadata || {};
          const title = c.title || "";
          return Boolean(meta.coursePlan) || /·\s*Diario$/i.test(title) || /^chat-plan-/i.test(c.chat_id || "");
        })
        .map((c: {
          chat_id: string;
          title?: string;
          updated_at?: string;
          metadata?: {
            topic?: string;
            planDays?: number;
            planMinutes?: number;
            coursePlan?: boolean;
          };
        }) => {
          const title = c.title || "Curso";
          const topic =
            c.metadata?.topic ||
            title.replace(/\s*·\s*Diario$/i, "").trim() ||
            "Curso";
          return {
            chatId: c.chat_id,
            title,
            topic,
            updatedAt: c.updated_at,
            planDays: c.metadata?.planDays,
            planMinutes: c.metadata?.planMinutes,
          };
        });
      setCourses(mapped);
    } catch {
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    const onRefresh = () => void loadCourses();
    window.addEventListener("sa-courses-refresh", onRefresh);
    return () => window.removeEventListener("sa-courses-refresh", onRefresh);
  }, [loadCourses]);

  const continueCourse = courses[0] || null;

  return (
    <div className="sa-home">
      <section className="sa-hero sa-hero--fullscreen" aria-label="Study Agents">
        <div className="sa-hero__bg" aria-hidden />
        <HomeHeroBackground />

        <div className="sa-hero__inner sa-hero__fade">
          <div className="sa-hero__bot">
            <StudyAgentsBotAvatar size={112} color={SA_PRIMARY} state="idle" title="Study Agents" />
          </div>

          <p className={`${outfit.className} sa-hero__kicker`}>
            <span className="sa-hero__kicker-dot" aria-hidden />
            AI Study Assistant
          </p>

          <h1 className={`${leagueSpartan.className} sa-hero__title`}>
            <span className="sa-hero__title-lead">STUDY</span>
            <br />
            <span className="sa-hero__title-accent">AGENTS</span>
          </h1>

          <p className={`${outfit.className} sa-hero__tagline`}>
            Cursos diarios estilo Duolingo. Practica, no solo leas.
          </p>

          <div className="sa-hero__actions">
            {continueCourse ? (
              <button
                type="button"
                className="sa-hero__cta sa-hero__cta--continue"
                onClick={() => onOpenCourse(continueCourse)}
              >
                <StudyAgentsBotAvatar size={28} color="#fff" state="static" />
                <span>
                  Continuar · {continueCourse.topic}
                  <small>{todayLessonHint(continueCourse.chatId, continueCourse.topic)}</small>
                </span>
              </button>
            ) : (
              <button type="button" className="sa-hero__cta" onClick={onStartCourse}>
                Empezar curso
              </button>
            )}
            <button
              type="button"
              className="sa-hero__cta-ghost"
              onClick={continueCourse ? onStartCourse : () => window.dispatchEvent(new Event(OPEN_API_KEY_MODAL_EVENT))}
            >
              {continueCourse ? "Nuevo curso" : "Configurar API Key"}
            </button>
          </div>
        </div>
      </section>

      <section className="sa-courses" aria-label="Tus cursos">
        <div className="sa-courses__inner">
          <div className="sa-courses__head">
            <h2 className={spaceGrotesk.className}>Tus cursos</h2>
            <button type="button" className="sa-courses__new" onClick={onStartCourse}>
              + Nuevo
            </button>
          </div>

          {loading && <p className="sa-courses__empty">Cargando cursos…</p>}

          {!loading && courses.length === 0 && (
            <div className="sa-courses__empty-card">
              <StudyAgentsBotAvatar size={48} color={SA_PRIMARY} state="idle" />
              <p className={spaceGrotesk.className}>Aún no tienes cursos</p>
              <p>Crea uno (ej. React, 5 min/día) y aparecerán aquí.</p>
              <button type="button" className="sa-hero__cta" onClick={onStartCourse}>
                Empezar curso
              </button>
            </div>
          )}

          {!loading && courses.length > 0 && (
            <div className="sa-courses__grid">
              {courses.map((c) => {
                const prog = progressForCourse(c.chatId, c.topic);
                return (
                  <button
                    key={c.chatId}
                    type="button"
                    className="sa-course-card"
                    onClick={() => onOpenCourse(c)}
                  >
                    <StudyAgentsBotAvatar size={40} color={SA_PRIMARY} state="static" />
                    <div className="sa-course-card__body">
                      <strong className={spaceGrotesk.className}>{c.topic}</strong>
                      <span>
                        {prog.done} lecciones · {prog.xp} XP
                        {c.planMinutes ? ` · ${c.planMinutes} min` : ""}
                      </span>
                    </div>
                    <span className="sa-course-card__go" style={{ color: SA_CYAN }}>
                      Abrir →
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
