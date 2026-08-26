"use client";

import { useEffect, useRef, useState } from "react";
import { saPost } from "@/hooks/study-agents/useApiClient";
import SaModal, { saModalTokens } from "@/components/study-agents/ui/SaModal";
import StudyAgentsBotAvatar from "@/components/study-agents/StudyAgentsBotAvatar";
import {
  buildInstantInteractivePlan,
  hasLocalCourseBank,
} from "@/components/study-agents/chat/StudyPlanSession";
import { SA_BOT_FACE } from "@/lib/study-agents/brand";
import { spaceGrotesk } from "@/app/fonts";
import "@/components/study-agents/study-agents-chat.css";
import "@/components/study-agents/study-agents-bot.css";

type Props = {
  open: boolean;
  onClose: () => void;
  colorTheme: "dark" | "light";
  apiKey: string | null;
  userId: string;
  chatId: string | null;
  defaultTopic?: string;
  model?: string | null;
  /** Crea un chat-curso diario con el plan interactivo */
  onPlanGenerated: (
    planMarkdown: string,
    meta: { topic: string; days: number; minutes: number },
  ) => void | Promise<void>;
};

const DAY_OPTIONS = [
  { days: 7, label: "1 semana", hint: "Ideal" },
  { days: 14, label: "2 semanas", hint: "Con margen" },
  { days: 30, label: "30 días", hint: "Hábito" },
] as const;

const TIME_OPTIONS = [
  { minutes: 5, label: "5 min", hint: "Micro · Duolingo" },
  { minutes: 15, label: "15 min", hint: "Rápido" },
  { minutes: 25, label: "25 min", hint: "Pomodoro" },
] as const;

const LOAD_STAGES = [
  { at: 0, label: "Afinando el tema…" },
  { at: 16, label: "Diseñando el camino…" },
  { at: 38, label: "Montando lecciones…" },
  { at: 62, label: "Preparando el test…" },
  { at: 84, label: "Casi listo…" },
] as const;

function stageLabel(pct: number): string {
  let label: string = LOAD_STAGES[0].label;
  for (const s of LOAD_STAGES) {
    if (pct >= s.at) label = s.label;
  }
  return label;
}

export default function StudyPlanPanel({
  open,
  onClose,
  colorTheme: _colorTheme,
  apiKey,
  userId,
  chatId,
  defaultTopic = "",
  model = null,
  onPlanGenerated,
}: Props) {
  const [step, setStep] = useState(0);
  const [topic, setTopic] = useState(defaultTopic);
  const [days, setDays] = useState(7);
  const [minutes, setMinutes] = useState(5);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (open) {
      setTopic(defaultTopic);
      setStep(0);
      setError(null);
      setLoading(false);
      setProgress(0);
      setMinutes(5);
      setDays(7);
    }
  }, [open, defaultTopic]);

  useEffect(() => {
    return () => {
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, []);

  const t = saModalTokens("dark");

  const startProgress = (fast: boolean) => {
    if (progressRef.current) clearInterval(progressRef.current);
    setProgress(fast ? 8 : 4);
    const tickMs = fast ? 45 : 120;
    const ceiling = fast ? 92 : 88;
    progressRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= ceiling) return p;
        const remain = ceiling - p;
        const stepUp = Math.max(0.35, remain * (fast ? 0.085 : 0.035));
        return Math.min(ceiling, p + stepUp);
      });
    }, tickMs);
  };

  const finishProgress = () =>
    new Promise<void>((resolve) => {
      if (progressRef.current) {
        clearInterval(progressRef.current);
        progressRef.current = null;
      }
      setProgress(100);
      window.setTimeout(resolve, 280);
    });

  const generate = async () => {
    const topicVal = topic.trim() || defaultTopic.trim();
    if (!topicVal) {
      setError("Elige o escribe un tema.");
      setStep(0);
      return;
    }
    setLoading(true);
    setError(null);
    const local = hasLocalCourseBank(topicVal);
    startProgress(local);

    try {
      let payload = "";

      if (local) {
        // Currículo local: casi instantáneo (CSS, React, SQL, idiomas…)
        await new Promise((r) => setTimeout(r, 720));
        payload = JSON.stringify(buildInstantInteractivePlan(topicVal, days, minutes));
      } else {
        const { ok, data } = await saPost<{
          success?: boolean;
          plan?: string;
          plan_interactive?: unknown;
          error?: string;
          detail?: string;
        }>("generate-study-plan", {
          apiKey: apiKey || "default",
          topic: topicVal,
          days,
          minutes_per_day: minutes,
          goal: `Curso diario de ${topicVal}: ${minutes} min al día, lecciones interactivas estilo Duolingo.`,
          model: model || null,
          userId,
          chatId,
          outline_only: true,
        });
        if (!ok || !data.success || (!data.plan && !data.plan_interactive)) {
          throw new Error(
            (typeof data.error === "string" && data.error) ||
              (typeof data.detail === "string" && data.detail) ||
              "No se pudo generar el plan",
          );
        }
        payload =
          data.plan_interactive != null
            ? JSON.stringify(data.plan_interactive)
            : data.plan || "";
      }

      let valid = false;
      try {
        const parsed = JSON.parse(payload);
        valid = Boolean(parsed && Array.isArray(parsed.days) && parsed.days.length > 0);
      } catch {
        valid = false;
      }
      if (!valid) {
        throw new Error(
          "El modelo no devolvió un camino interactivo válido. Prueba otra vez (plan Free con Groq o regenera).",
        );
      }

      await finishProgress();
      await onPlanGenerated(payload, { topic: topicVal, days, minutes });
      onClose();
    } catch (e) {
      if (progressRef.current) {
        clearInterval(progressRef.current);
        progressRef.current = null;
      }
      setProgress(0);
      setError(e instanceof Error ? e.message : "Error al generar el plan");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  const titles = ["¿Qué curso?", "¿Ritmo diario?", "Crear chat"];
  const subs = [
    "Ej: React, SQL, derivadas… Se creará un chat solo para ese curso.",
    "Como Duolingo: pocos minutos al día, una lección interactiva.",
    "Abrimos un chat nuevo con el camino día a día.",
  ];

  const pct = Math.round(progress);
  const loadMsg = stageLabel(progress);

  return (
    <SaModal
      open={open}
      onClose={handleClose}
      colorTheme="dark"
      title={loading ? "Creando tu curso" : titles[step]}
      titleId="study-plan-title"
      subtitle={loading ? loadMsg : subs[step]}
      maxWidth={420}
      botState={loading ? "thinking" : "idle"}
      hideClose={loading}
    >
      {loading ? (
        <div className="sa-course-load sa-pop" role="status" aria-live="polite">
          <div className="sa-course-load__bot">
            <StudyAgentsBotAvatar
              size={88}
              color={SA_BOT_FACE}
              state="thinking"
              className="sa-bot-avatar--bright"
              title="Creando curso"
            />
            <span className="sa-course-load__ring" aria-hidden />
          </div>
          <p className={`${spaceGrotesk.className} sa-course-load__title`}>
            {(topic.trim() || defaultTopic || "Tu curso").trim()}
          </p>
          <p className="sa-course-load__hint">
            {hasLocalCourseBank(topic.trim() || defaultTopic)
              ? "Currículo listo · montando el camino"
              : "El robotito está diseñando lecciones a medida"}
          </p>
          <div className="sa-course-load__bar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
            <span style={{ width: `${Math.max(6, pct)}%` }} />
          </div>
          <p className="sa-course-load__pct">{pct}%</p>
        </div>
      ) : (
        <>
          <div className="sa-step-dots" aria-hidden>
            {[0, 1, 2].map((i) => (
              <span key={i} className={`sa-step-dot ${i === step ? "sa-step-dot--on" : ""}`} />
            ))}
          </div>

          {step === 0 && (
            <div className="sa-pop">
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={defaultTopic || "Ej: React, SQL…"}
                autoFocus
                style={{
                  width: "100%",
                  padding: "1rem 1.1rem",
                  borderRadius: 14,
                  border: "2px solid rgba(255,255,255,0.18)",
                  background: t.inputBg,
                  color: "#ffffff",
                  fontSize: "1.05rem",
                  fontWeight: 600,
                  boxSizing: "border-box",
                  marginBottom: "0.85rem",
                  outline: "none",
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && topic.trim()) setStep(1);
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#00d9ff";
                  e.currentTarget.style.boxShadow = "0 0 0 4px rgba(0,217,255,0.15)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
              {defaultTopic && (
                <button
                  type="button"
                  className={`sa-choice ${topic === defaultTopic ? "sa-choice--on" : ""}`}
                  onClick={() => setTopic(defaultTopic)}
                  style={{ marginBottom: "0.5rem" }}
                >
                  Usar tema del chat: {defaultTopic}
                </button>
              )}
              <button
                type="button"
                className="sa-btn sa-btn--primary"
                style={{ width: "100%", marginTop: "0.75rem" }}
                disabled={!topic.trim() && !defaultTopic.trim()}
                onClick={() => setStep(1)}
              >
                Siguiente →
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="sa-pop" style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
              <p
                className={spaceGrotesk.className}
                style={{ margin: "0 0 0.35rem", fontWeight: 700, fontSize: "0.9rem", color: "#ffffff" }}
              >
                Duración del curso
              </p>
              {DAY_OPTIONS.map((o) => (
                <button
                  key={o.days}
                  type="button"
                  className={`sa-choice ${days === o.days ? "sa-choice--on" : ""}`}
                  onClick={() => setDays(o.days)}
                >
                  <span style={{ flex: 1 }}>{o.label}</span>
                  <span style={{ fontSize: "0.8rem", color: t.muted, fontWeight: 500 }}>{o.hint}</span>
                </button>
              ))}
              <p
                className={spaceGrotesk.className}
                style={{ margin: "0.85rem 0 0.35rem", fontWeight: 700, fontSize: "0.9rem", color: "#ffffff" }}
              >
                Cada día
              </p>
              {TIME_OPTIONS.map((o) => (
                <button
                  key={o.minutes}
                  type="button"
                  className={`sa-choice ${minutes === o.minutes ? "sa-choice--on" : ""}`}
                  onClick={() => setMinutes(o.minutes)}
                >
                  <span style={{ flex: 1 }}>{o.label}</span>
                  <span style={{ fontSize: "0.8rem", color: t.muted, fontWeight: 500 }}>{o.hint}</span>
                </button>
              ))}
              <div style={{ display: "flex", gap: "0.55rem", marginTop: "0.85rem" }}>
                <button
                  type="button"
                  className="sa-btn sa-btn--ghost sa-btn--icon"
                  onClick={() => setStep(0)}
                  title="Atrás"
                  aria-label="Atrás"
                >
                  ←
                </button>
                <button type="button" className="sa-btn sa-btn--primary" style={{ flex: 1 }} onClick={() => setStep(2)}>
                  Siguiente →
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="sa-pop">
              <div
                style={{
                  padding: "1rem 1.1rem",
                  borderRadius: 14,
                  border: "2px solid rgba(53,140,159,0.4)",
                  background: "rgba(53,140,159,0.12)",
                  marginBottom: "1rem",
                }}
              >
                <p style={{ margin: 0, fontWeight: 700, color: "#ffffff" }}>
                  Chat: {(topic.trim() || defaultTopic) + " · Diario"}
                </p>
                <p style={{ margin: "0.35rem 0 0", fontSize: "0.85rem", color: "rgba(255,255,255,0.7)" }}>
                  {days} lecciones · {minutes} min/día · recordatorio diario
                </p>
                {hasLocalCourseBank(topic.trim() || defaultTopic) ? (
                  <p style={{ margin: "0.45rem 0 0", fontSize: "0.78rem", color: "#5eead4", fontWeight: 650 }}>
                    Currículo listo · creación casi instantánea
                  </p>
                ) : null}
              </div>
              {error && <p style={{ color: "#f87171", fontSize: "0.85rem", margin: "0 0 0.75rem" }}>{error}</p>}
              <div style={{ display: "flex", gap: "0.55rem" }}>
                <button
                  type="button"
                  className="sa-btn sa-btn--ghost sa-btn--icon"
                  onClick={() => setStep(1)}
                  title="Atrás"
                  aria-label="Atrás"
                >
                  ←
                </button>
                <button
                  type="button"
                  className="sa-btn sa-btn--primary"
                  style={{ flex: 1 }}
                  onClick={() => void generate()}
                >
                  Crear curso →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </SaModal>
  );
}
