"use client";

import { useEffect, useMemo, useState } from "react";
import { outfit, spaceGrotesk } from "@/app/fonts";
import StudyAgentsBotAvatar from "@/components/study-agents/StudyAgentsBotAvatar";
import { SA_PRIMARY, SA_CYAN } from "@/lib/study-agents/brand";
import "@/components/study-agents/study-agents-chat.css";
import "@/components/study-agents/study-agents-bot.css";

export type PlanQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correct_index: number;
  feedback_ok?: string;
  feedback_bad?: string;
};

export type PlanTeachStep = {
  id: string;
  kind: "card" | "tap";
  title?: string;
  body?: string;
  prompt?: string;
  options?: string[];
  correct_index?: number;
  feedback_ok?: string;
  feedback_bad?: string;
};

export type PlanDay = {
  day: number;
  title: string;
  focus: string;
  minutes: number;
  teach?: PlanTeachStep[];
  questions: PlanQuestion[];
};

export type InteractivePlan = {
  format?: string;
  topic: string;
  xp_per_correct?: number;
  minutes_per_day?: number;
  started_at?: string;
  days: PlanDay[];
};

type Progress = {
  unlockedDay: number;
  completedDays: number[];
  xp: number;
  startedAt: string;
  lastCompletedDate?: string;
};

type Props = {
  plan: InteractivePlan;
  storageKey?: string;
};

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(fromISO: string, toISO: string): number {
  const a = new Date(fromISO + "T12:00:00");
  const b = new Date(toISO + "T12:00:00");
  return Math.max(0, Math.floor((b.getTime() - a.getTime()) / 86400000));
}

function loadProgress(key: string, maxDay: number, startedAt?: string): Progress {
  const fallbackStart = startedAt || todayISO();
  if (typeof window === "undefined") {
    return { unlockedDay: 1, completedDays: [], xp: 0, startedAt: fallbackStart };
  }
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { unlockedDay: 1, completedDays: [], xp: 0, startedAt: fallbackStart };
    const p = JSON.parse(raw) as Progress;
    return {
      unlockedDay: Math.min(Math.max(1, p.unlockedDay || 1), maxDay),
      completedDays: Array.isArray(p.completedDays) ? p.completedDays : [],
      xp: Number(p.xp) || 0,
      startedAt: p.startedAt || fallbackStart,
      lastCompletedDate: p.lastCompletedDate,
    };
  } catch {
    return { unlockedDay: 1, completedDays: [], xp: 0, startedAt: fallbackStart };
  }
}

/**
 * Curso diario estilo Duolingo: mapa → enseñar (cards/taps) → quiz → XP.
 * Muestra recordatorio de la lección de hoy.
 */
export default function StudyPlanSession({ plan, storageKey }: Props) {
  const key = storageKey || `sa_plan_${plan.topic}`;
  const days = plan.days || [];
  const xpEach = plan.xp_per_correct ?? 10;

  const [progress, setProgress] = useState<Progress>(() =>
    loadProgress(key, days.length || 1, plan.started_at),
  );
  const [activeDay, setActiveDay] = useState<PlanDay | null>(null);
  const [phase, setPhase] = useState<"teach" | "quiz">("teach");
  const [tIndex, setTIndex] = useState(0);
  const [qIndex, setQIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [dayXp, setDayXp] = useState(0);
  const [dayDone, setDayDone] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(key, JSON.stringify(progress));
    }
  }, [key, progress]);

  const today = todayISO();
  const calendarDay = Math.min(
    days.length,
    daysBetween(progress.startedAt, today) + 1,
  );
  const todayLesson =
    days.find(
      (d) =>
        d.day === calendarDay &&
        !progress.completedDays.includes(d.day) &&
        d.day <= progress.unlockedDay,
    ) ||
    days.find(
      (d) => !progress.completedDays.includes(d.day) && d.day <= progress.unlockedDay,
    ) ||
    null;

  const teachSteps = activeDay?.teach?.length
    ? activeDay.teach
    : activeDay
      ? [
          {
            id: `${activeDay.day}-intro`,
            kind: "card" as const,
            title: activeDay.title,
            body: `Hoy practicas: ${activeDay.focus}. Lee, toca y responde — sin muro de texto.`,
          },
        ]
      : [];

  const currentTeach = teachSteps[tIndex];
  const currentQ = activeDay?.questions[qIndex];

  const stepTotal =
    (teachSteps.length || 0) + (activeDay?.questions.length || 0);
  const stepDone =
    phase === "teach"
      ? tIndex
      : teachSteps.length + qIndex + (revealed ? 0.5 : 0);
  const dayProgress = stepTotal ? (stepDone / stepTotal) * 100 : 0;

  const startDay = (d: PlanDay) => {
    if (d.day > progress.unlockedDay) return;
    // Ritmo diario: no adelantar lecciones futuras del calendario
    if (d.day > calendarDay && !progress.completedDays.includes(d.day)) return;
    setActiveDay(d);
    setPhase(d.teach && d.teach.length > 0 ? "teach" : "quiz");
    setTIndex(0);
    setQIndex(0);
    setPicked(null);
    setRevealed(false);
    setDayXp(0);
    setDayDone(false);
  };

  const choose = (idx: number, correctIndex: number) => {
    if (revealed) return;
    setPicked(idx);
    setRevealed(true);
    if (idx === correctIndex) setDayXp((x) => x + xpEach);
  };

  const finishDay = () => {
    if (!activeDay) return;
    const nextUnlock = Math.max(progress.unlockedDay, activeDay.day + 1);
    const already = progress.completedDays.includes(activeDay.day);
    const completed = already
      ? progress.completedDays
      : [...progress.completedDays, activeDay.day];
    setProgress({
      unlockedDay: Math.min(nextUnlock, days.length),
      completedDays: completed,
      xp: already ? progress.xp : progress.xp + dayXp,
      startedAt: progress.startedAt,
      lastCompletedDate: today,
    });
    setDayDone(true);
  };

  const continueLesson = () => {
    if (!activeDay) return;

    if (phase === "teach") {
      if (tIndex >= teachSteps.length - 1) {
        if (activeDay.questions?.length) {
          setPhase("quiz");
          setQIndex(0);
          setPicked(null);
          setRevealed(false);
        } else {
          finishDay();
        }
        return;
      }
      setTIndex((i) => i + 1);
      setPicked(null);
      setRevealed(false);
      return;
    }

    if (qIndex >= activeDay.questions.length - 1) {
      finishDay();
      return;
    }
    setQIndex((i) => i + 1);
    setPicked(null);
    setRevealed(false);
  };

  const backToMap = () => {
    setActiveDay(null);
    setDayDone(false);
    setPicked(null);
    setRevealed(false);
    setQIndex(0);
    setTIndex(0);
    setPhase("teach");
  };

  const streakHint = useMemo(() => {
    if (progress.completedDays.length === 0) return "Empieza hoy — 1 lección al día.";
    if (progress.lastCompletedDate === today) return "¡Lección de hoy hecha! Vuelve mañana.";
    return `Llevas ${progress.completedDays.length} día(s). Hoy toca seguir.`;
  }, [progress.completedDays.length, progress.lastCompletedDate, today]);

  // —— Lección activa ——
  if (activeDay) {
    if (dayDone) {
      const shownXp = progress.completedDays.includes(activeDay.day)
        ? progress.xp
        : progress.xp + dayXp;
      return (
        <div className={`${outfit.className} sa-steps-card sa-pop`}>
          <div style={{ textAlign: "center", padding: "0.5rem 0 0.25rem" }}>
            <StudyAgentsBotAvatar size={56} color={SA_PRIMARY} state="idle" />
            <h3
              className={spaceGrotesk.className}
              style={{ margin: "0.85rem 0 0.35rem", fontSize: "1.4rem", fontWeight: 800 }}
            >
              ¡Día {activeDay.day} listo!
            </h3>
            <p style={{ margin: 0, color: "#64748b", fontSize: "0.95rem" }}>
              +{dayXp} XP · {activeDay.title}
            </p>
            <p style={{ margin: "0.5rem 0 0", fontWeight: 700, color: SA_PRIMARY }}>
              Total: {shownXp} XP
            </p>
            <p style={{ margin: "0.75rem 0 0", fontSize: "0.85rem", color: "#64748b" }}>
              Vuelve mañana a este chat para la siguiente lección.
            </p>
          </div>
          <button
            type="button"
            className="sa-btn sa-btn--primary"
            style={{ width: "100%", marginTop: "1.25rem" }}
            onClick={backToMap}
          >
            Volver al camino →
          </button>
        </div>
      );
    }

    // Teach: card
    if (phase === "teach" && currentTeach?.kind === "card") {
      return (
        <div className={`${outfit.className} sa-steps-card sa-pop`}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button type="button" className="sa-chip" onClick={backToMap} style={{ borderRadius: 12 }}>
              ← Camino
            </button>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: SA_PRIMARY }}>
              Día {activeDay.day} · Aprende · +{dayXp} XP
            </span>
          </div>
          <div className="sa-steps-progress" style={{ marginTop: "0.85rem" }}>
            <span style={{ width: `${Math.max(8, dayProgress)}%` }} />
          </div>
          <p style={{ margin: "0.85rem 0 0", fontSize: "0.72rem", fontWeight: 700, color: SA_CYAN, letterSpacing: "0.04em" }}>
            IDEA CLAVE
          </p>
          <h3
            className={spaceGrotesk.className}
            style={{ margin: "0.35rem 0 0.75rem", fontSize: "1.25rem", fontWeight: 800, color: "#0f172a" }}
          >
            {currentTeach.title || activeDay.title}
          </h3>
          <p style={{ margin: 0, fontSize: "1.02rem", lineHeight: 1.55, color: "#334155" }}>
            {currentTeach.body}
          </p>
          <button
            type="button"
            className="sa-btn sa-btn--primary"
            style={{ width: "100%", marginTop: "1.35rem" }}
            onClick={continueLesson}
          >
            {tIndex >= teachSteps.length - 1 && activeDay.questions?.length
              ? "Practicar →"
              : "Siguiente →"}
          </button>
        </div>
      );
    }

    // Teach: tap OR quiz question
    const isTeachTap = phase === "teach" && currentTeach?.kind === "tap";
    const prompt = isTeachTap
      ? currentTeach.prompt || ""
      : currentQ?.prompt || "";
    const options = isTeachTap
      ? currentTeach.options || []
      : currentQ?.options || [];
    const correctIndex = isTeachTap
      ? currentTeach.correct_index ?? 0
      : currentQ?.correct_index ?? 0;
    const feedbackOk = isTeachTap ? currentTeach.feedback_ok : currentQ?.feedback_ok;
    const feedbackBad = isTeachTap ? currentTeach.feedback_bad : currentQ?.feedback_bad;

    if (!prompt || options.length < 2) {
      return (
        <div className={`${outfit.className} sa-steps-card`}>
          <button type="button" className="sa-btn sa-btn--primary" style={{ width: "100%" }} onClick={continueLesson}>
            Continuar →
          </button>
        </div>
      );
    }

    const isOk = picked === correctIndex;

    return (
      <div className={`${outfit.className} sa-steps-card sa-pop`}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem" }}>
          <button type="button" className="sa-chip" onClick={backToMap} style={{ borderRadius: 12 }}>
            ← Camino
          </button>
          <span style={{ fontSize: "0.8rem", fontWeight: 700, color: SA_PRIMARY }}>
            Día {activeDay.day} · {phase === "teach" ? "Check" : "Quiz"} · +{dayXp} XP
          </span>
        </div>
        <div className="sa-steps-progress" style={{ marginTop: "0.85rem" }}>
          <span style={{ width: `${Math.max(8, dayProgress)}%` }} />
        </div>
        <p style={{ margin: "0.35rem 0 0", fontSize: "0.75rem", color: "#94a3b8", fontWeight: 600 }}>
          Foco: {activeDay.focus}
        </p>
        <h3
          className={spaceGrotesk.className}
          style={{ margin: "0.85rem 0 1.1rem", fontSize: "1.2rem", fontWeight: 750, lineHeight: 1.35, color: "#0f172a" }}
        >
          {prompt}
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
          {options.map((opt, idx) => {
            let border = "2px solid rgba(15,23,42,0.12)";
            let bg = "#fff";
            if (revealed) {
              if (idx === correctIndex) {
                border = "2px solid #22c55e";
                bg = "rgba(34,197,94,0.12)";
              } else if (idx === picked) {
                border = "2px solid #ef4444";
                bg = "rgba(239,68,68,0.1)";
              }
            } else if (picked === idx) {
              border = `2px solid ${SA_CYAN}`;
              bg = "rgba(0,217,255,0.1)";
            }
            return (
              <button
                key={`${isTeachTap ? currentTeach.id : currentQ?.id}-${idx}`}
                type="button"
                disabled={revealed}
                onClick={() => choose(idx, correctIndex)}
                className="sa-choice"
                style={{
                  border,
                  background: bg,
                  opacity: revealed && idx !== correctIndex && idx !== picked ? 0.55 : 1,
                }}
              >
                {opt}
              </button>
            );
          })}
        </div>
        {revealed && (
          <div
            className="sa-pop"
            style={{
              marginTop: "1rem",
              padding: "0.85rem 1rem",
              borderRadius: 14,
              background: isOk ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.08)",
              border: `1px solid ${isOk ? "rgba(34,197,94,0.35)" : "rgba(239,68,68,0.3)"}`,
            }}
          >
            <p style={{ margin: 0, fontWeight: 700, color: "#0f172a" }}>
              {isOk ? "¡Correcto!" : "Casi — sigue"}
            </p>
            <p style={{ margin: "0.35rem 0 0", fontSize: "0.88rem", color: "#475569", lineHeight: 1.45 }}>
              {isOk ? feedbackOk : feedbackBad}
            </p>
            <button
              type="button"
              className="sa-btn sa-btn--primary"
              style={{ width: "100%", marginTop: "0.9rem" }}
              onClick={continueLesson}
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>
    );
  }

  // —— Mapa de días ——
  const allDone = days.length > 0 && progress.completedDays.length >= days.length;

  return (
    <div className={`${outfit.className} sa-steps-card sa-pop`}>
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
        <StudyAgentsBotAvatar size={40} color={SA_PRIMARY} state="idle" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 className={spaceGrotesk.className} style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800 }}>
            {plan.topic} · Diario
          </h3>
          <p style={{ margin: "0.3rem 0 0", fontSize: "0.82rem", color: "#64748b" }}>
            {plan.minutes_per_day || days[0]?.minutes || 5} min/día · {streakHint}
          </p>
        </div>
        <span style={{ fontWeight: 800, color: SA_PRIMARY, fontSize: "0.85rem" }}>{progress.xp} XP</span>
      </div>

      {!allDone && todayLesson && (
        <button
          type="button"
          onClick={() => startDay(todayLesson)}
          className="sa-pop"
          style={{
            marginTop: "1.1rem",
            width: "100%",
            padding: "1rem 1.1rem",
            borderRadius: 16,
            border: `2px solid ${SA_CYAN}`,
            background: "rgba(0,217,255,0.12)",
            boxShadow: "0 0 28px rgba(0,217,255,0.25)",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <p style={{ margin: 0, fontSize: "0.72rem", fontWeight: 800, color: SA_CYAN, letterSpacing: "0.05em" }}>
            HOY · RECORDATORIO
          </p>
          <p className={spaceGrotesk.className} style={{ margin: "0.35rem 0 0", fontWeight: 800, fontSize: "1.05rem", color: "#0f172a" }}>
            Día {todayLesson.day}: {todayLesson.title}
          </p>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem", color: "#64748b" }}>
            {todayLesson.focus} · ~{todayLesson.minutes} min · Toca para empezar
          </p>
        </button>
      )}

      {allDone && (
        <p
          style={{
            marginTop: "1rem",
            padding: "0.85rem 1rem",
            borderRadius: 14,
            background: "rgba(34,197,94,0.1)",
            border: "1px solid rgba(34,197,94,0.3)",
            fontWeight: 700,
            color: "#166534",
          }}
        >
          Curso completado. ¡Buen trabajo!
        </p>
      )}

      <div style={{ marginTop: "1.35rem", display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
        {days.map((d, i) => {
          const locked =
            d.day > progress.unlockedDay ||
            (d.day > calendarDay && !progress.completedDays.includes(d.day));
          const done = progress.completedDays.includes(d.day);
          const isToday = todayLesson?.day === d.day;
          return (
            <div key={d.day} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
              {i > 0 && (
                <div
                  style={{
                    width: 3,
                    height: 22,
                    background: done || d.day <= progress.unlockedDay ? SA_PRIMARY : "rgba(15,23,42,0.12)",
                    borderRadius: 2,
                  }}
                />
              )}
              <button
                type="button"
                disabled={locked}
                onClick={() => startDay(d)}
                style={{
                  width: "100%",
                  maxWidth: 320,
                  padding: "0.95rem 1.1rem",
                  borderRadius: 16,
                  border: isToday
                    ? `2px solid ${SA_CYAN}`
                    : done
                      ? "2px solid #22c55e"
                      : "2px solid rgba(15,23,42,0.12)",
                  background: locked
                    ? "rgba(15,23,42,0.04)"
                    : done
                      ? "rgba(34,197,94,0.1)"
                      : isToday
                        ? "rgba(0,217,255,0.1)"
                        : "#fff",
                  cursor: locked ? "not-allowed" : "pointer",
                  textAlign: "left",
                  boxShadow: isToday ? "0 0 28px rgba(0,217,255,0.28)" : "none",
                  opacity: locked ? 0.55 : 1,
                  transition: "transform 0.18s ease, box-shadow 0.18s ease",
                }}
                onMouseEnter={(e) => {
                  if (!locked) e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
                  <strong style={{ fontSize: "0.95rem", color: "#0f172a" }}>
                    {done ? "✓ " : locked ? "🔒 " : isToday ? "▶ " : ""}Día {d.day}: {d.title}
                  </strong>
                  <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>
                    {d.minutes}m
                  </span>
                </div>
                <p style={{ margin: "0.3rem 0 0", fontSize: "0.78rem", color: "#64748b" }}>{d.focus}</p>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function parseInteractivePlan(raw: string): InteractivePlan | null {
  try {
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.days)) return null;
    if (data.format === "interactive_v1" || data.format === "interactive_v2" || data.topic) {
      return data as InteractivePlan;
    }
  } catch {
    /* ignore */
  }
  return null;
}
