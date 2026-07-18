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

export type PlanDay = {
  day: number;
  title: string;
  focus: string;
  minutes: number;
  questions: PlanQuestion[];
};

export type InteractivePlan = {
  format?: string;
  topic: string;
  xp_per_correct?: number;
  days: PlanDay[];
};

type Progress = {
  unlockedDay: number;
  completedDays: number[];
  xp: number;
};

type Props = {
  plan: InteractivePlan;
  storageKey?: string;
};

function loadProgress(key: string, maxDay: number): Progress {
  if (typeof window === "undefined") {
    return { unlockedDay: 1, completedDays: [], xp: 0 };
  }
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { unlockedDay: 1, completedDays: [], xp: 0 };
    const p = JSON.parse(raw) as Progress;
    return {
      unlockedDay: Math.min(Math.max(1, p.unlockedDay || 1), maxDay),
      completedDays: Array.isArray(p.completedDays) ? p.completedDays : [],
      xp: Number(p.xp) || 0,
    };
  } catch {
    return { unlockedDay: 1, completedDays: [], xp: 0 };
  }
}

/**
 * Ruta tipo Duolingo: elige día → quiz 1 pregunta a la vez → XP → desbloquea siguiente.
 */
export default function StudyPlanSession({ plan, storageKey }: Props) {
  const key = storageKey || `sa_plan_${plan.topic}`;
  const days = plan.days || [];
  const xpEach = plan.xp_per_correct ?? 10;

  const [progress, setProgress] = useState<Progress>(() =>
    loadProgress(key, days.length || 1),
  );
  const [activeDay, setActiveDay] = useState<PlanDay | null>(null);
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

  const currentQ = activeDay?.questions[qIndex];
  const dayProgress = useMemo(() => {
    if (!activeDay?.questions.length) return 0;
    return ((qIndex + (revealed ? 0.5 : 0)) / activeDay.questions.length) * 100;
  }, [activeDay, qIndex, revealed]);

  const startDay = (d: PlanDay) => {
    if (d.day > progress.unlockedDay) return;
    setActiveDay(d);
    setQIndex(0);
    setPicked(null);
    setRevealed(false);
    setDayXp(0);
    setDayDone(false);
  };

  const choose = (idx: number) => {
    if (revealed || !currentQ) return;
    setPicked(idx);
    setRevealed(true);
    if (idx === currentQ.correct_index) {
      setDayXp((x) => x + xpEach);
    }
  };

  const continueLesson = () => {
    if (!activeDay) return;
    if (qIndex >= activeDay.questions.length - 1) {
      // Día completado
      const nextUnlock = Math.max(progress.unlockedDay, activeDay.day + 1);
      const already = progress.completedDays.includes(activeDay.day);
      const completed = already
        ? progress.completedDays
        : [...progress.completedDays, activeDay.day];
      setProgress({
        unlockedDay: Math.min(nextUnlock, days.length),
        completedDays: completed,
        xp: already ? progress.xp : progress.xp + dayXp,
      });
      setDayDone(true);
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
  };

  // —— Lección activa ——
  if (activeDay) {
    if (dayDone) {
      return (
        <div className={`${outfit.className} sa-steps-card sa-pop`}>
          <div style={{ textAlign: "center", padding: "0.5rem 0 0.25rem" }}>
            <StudyAgentsBotAvatar size={56} color={SA_PRIMARY} state="idle" />
            <h3
              className={spaceGrotesk.className}
              style={{ margin: "0.85rem 0 0.35rem", fontSize: "1.4rem", fontWeight: 800 }}
            >
              ¡Día {activeDay.day} completado!
            </h3>
            <p style={{ margin: 0, color: "#64748b", fontSize: "0.95rem" }}>
              +{dayXp} XP · {activeDay.title}
            </p>
            <p style={{ margin: "0.5rem 0 0", fontWeight: 700, color: SA_PRIMARY }}>
              Total: {progress.xp + dayXp} XP
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

    if (!currentQ) return null;
    const isOk = picked === currentQ.correct_index;

    return (
      <div className={`${outfit.className} sa-steps-card sa-pop`}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem" }}>
          <button type="button" className="sa-chip" onClick={backToMap} style={{ borderRadius: 12 }}>
            ← Camino
          </button>
          <span style={{ fontSize: "0.8rem", fontWeight: 700, color: SA_PRIMARY }}>
            Día {activeDay.day} · {qIndex + 1}/{activeDay.questions.length} · +{dayXp} XP
          </span>
        </div>
        <div className="sa-steps-progress" style={{ marginTop: "0.85rem" }}>
          <span style={{ width: `${Math.max(10, dayProgress)}%` }} />
        </div>
        <p style={{ margin: "0.35rem 0 0", fontSize: "0.75rem", color: "#94a3b8", fontWeight: 600 }}>
          Foco: {activeDay.focus}
        </p>
        <h3
          className={spaceGrotesk.className}
          style={{ margin: "0.85rem 0 1.1rem", fontSize: "1.2rem", fontWeight: 750, lineHeight: 1.35, color: "#0f172a" }}
        >
          {currentQ.prompt}
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
          {currentQ.options.map((opt, idx) => {
            let border = "2px solid rgba(15,23,42,0.12)";
            let bg = "#fff";
            if (revealed) {
              if (idx === currentQ.correct_index) {
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
                key={`${currentQ.id}-${idx}`}
                type="button"
                disabled={revealed}
                onClick={() => choose(idx)}
                className="sa-choice"
                style={{ border, background: bg, opacity: revealed && idx !== currentQ.correct_index && idx !== picked ? 0.55 : 1 }}
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
              {isOk ? currentQ.feedback_ok : currentQ.feedback_bad}
            </p>
            <button
              type="button"
              className="sa-btn sa-btn--primary"
              style={{ width: "100%", marginTop: "0.9rem" }}
              onClick={continueLesson}
            >
              {qIndex >= activeDay.questions.length - 1 ? "Terminar día →" : "Siguiente →"}
            </button>
          </div>
        )}
      </div>
    );
  }

  // —— Mapa de días ——
  return (
    <div className={`${outfit.className} sa-steps-card sa-pop`}>
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
        <StudyAgentsBotAvatar size={40} color={SA_PRIMARY} state="idle" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 className={spaceGrotesk.className} style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800 }}>
            Camino: {plan.topic}
          </h3>
          <p style={{ margin: "0.3rem 0 0", fontSize: "0.82rem", color: "#64748b" }}>
            Un día = una lección corta. Sin muros de texto.
          </p>
        </div>
        <span style={{ fontWeight: 800, color: SA_PRIMARY, fontSize: "0.85rem" }}>{progress.xp} XP</span>
      </div>

      <div style={{ marginTop: "1.35rem", display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
        {days.map((d, i) => {
          const locked = d.day > progress.unlockedDay;
          const done = progress.completedDays.includes(d.day);
          const current = d.day === progress.unlockedDay && !done;
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
                  border: current
                    ? `2px solid ${SA_CYAN}`
                    : done
                      ? "2px solid #22c55e"
                      : "2px solid rgba(15,23,42,0.12)",
                  background: locked
                    ? "rgba(15,23,42,0.04)"
                    : done
                      ? "rgba(34,197,94,0.1)"
                      : current
                        ? "rgba(0,217,255,0.1)"
                        : "#fff",
                  cursor: locked ? "not-allowed" : "pointer",
                  textAlign: "left",
                  boxShadow: current ? "0 0 28px rgba(0,217,255,0.28)" : "none",
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
                    {done ? "✓ " : locked ? "🔒 " : "▶ "}Día {d.day}: {d.title}
                  </strong>
                  <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>
                    {d.questions.length} Q · {d.minutes}m
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
    if (data && data.format === "interactive_v1" && Array.isArray(data.days)) {
      return data as InteractivePlan;
    }
    if (data && Array.isArray(data.days) && data.topic) {
      return { ...data, format: "interactive_v1" } as InteractivePlan;
    }
  } catch {
    /* ignore */
  }
  return null;
}
