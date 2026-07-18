"use client";

import { useEffect, useState } from "react";
import { saPost } from "@/hooks/study-agents/useApiClient";
import SaModal, { saModalTokens } from "@/components/study-agents/ui/SaModal";
import { spaceGrotesk } from "@/app/fonts";
import "@/components/study-agents/study-agents-chat.css";

type Props = {
  open: boolean;
  onClose: () => void;
  colorTheme: "dark" | "light";
  apiKey: string | null;
  userId: string;
  chatId: string | null;
  defaultTopic?: string;
  model?: string | null;
  onPlanGenerated: (planMarkdown: string, meta: { topic: string; days: number }) => void;
};

const DAY_OPTIONS = [
  { days: 3, label: "Sprint 3 días", hint: "Intensivo" },
  { days: 7, label: "1 semana", hint: "Equilibrado" },
  { days: 14, label: "2 semanas", hint: "Con margen" },
] as const;

const TIME_OPTIONS = [
  { minutes: 25, label: "25 min", hint: "Pomodoro" },
  { minutes: 45, label: "45 min", hint: "Estándar" },
  { minutes: 90, label: "90 min", hint: "Bloque largo" },
] as const;

export default function StudyPlanPanel({
  open,
  onClose,
  colorTheme,
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
  const [minutes, setMinutes] = useState(45);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTopic(defaultTopic);
      setStep(0);
      setError(null);
      setLoading(false);
    }
  }, [open, defaultTopic]);

  const t = saModalTokens(colorTheme);

  const generate = async () => {
    if (!apiKey) {
      setError("Configura tu API Key primero.");
      return;
    }
    const topicVal = topic.trim() || defaultTopic.trim();
    if (!topicVal) {
      setError("Elige o escribe un tema.");
      setStep(0);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { ok, data } = await saPost<{
        success?: boolean;
        plan?: string;
        error?: string;
        detail?: string;
      }>("generate-study-plan", {
        apiKey,
        topic: topicVal,
        days,
        minutes_per_day: minutes,
        goal: null,
        model: model || null,
        userId,
        chatId,
      });
      if (!ok || !data.success || !data.plan) {
        throw new Error(
          (typeof data.error === "string" && data.error) ||
            (typeof data.detail === "string" && data.detail) ||
            "No se pudo generar el plan",
        );
      }
      onPlanGenerated(data.plan, { topic: topicVal, days });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al generar el plan");
    } finally {
      setLoading(false);
    }
  };

  const titles = ["¿Qué estudias?", "¿Cuánto tiempo?", "¡A por ello!"];
  const subs = [
    "Una sola pregunta. Toca y sigue.",
    "Elige ritmo. Sin formularios eternos.",
    "Generamos un plan con gaps + repaso.",
  ];

  return (
    <SaModal
      open={open}
      onClose={onClose}
      colorTheme={colorTheme}
      title={titles[step]}
      titleId="study-plan-title"
      subtitle={subs[step]}
      maxWidth={420}
      light
    >
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
            placeholder={defaultTopic || "Ej: derivadas, SQL…"}
            autoFocus
            style={{
              width: "100%",
              padding: "1rem 1.1rem",
              borderRadius: 14,
              border: "2px solid rgba(15,23,42,0.12)",
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
              e.currentTarget.style.borderColor = "rgba(15,23,42,0.12)";
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
          <p className={spaceGrotesk.className} style={{ margin: "0 0 0.35rem", fontWeight: 700, fontSize: "0.9rem" }}>
            Duración
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
          <p className={spaceGrotesk.className} style={{ margin: "0.85rem 0 0.35rem", fontWeight: 700, fontSize: "0.9rem" }}>
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
            <button type="button" className="sa-btn sa-btn--ghost" onClick={() => setStep(0)}>
              Atrás
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
              border: "2px solid rgba(53,140,159,0.2)",
              background: "rgba(53,140,159,0.06)",
              marginBottom: "1rem",
            }}
          >
            <p style={{ margin: 0, fontWeight: 700, color: "#0f172a" }}>{topic.trim() || defaultTopic}</p>
            <p style={{ margin: "0.35rem 0 0", fontSize: "0.85rem", color: "#64748b" }}>
              {days} días · {minutes} min/día · gaps + SRS
            </p>
          </div>
          {error && <p style={{ color: "#ef4444", fontSize: "0.85rem", margin: "0 0 0.75rem" }}>{error}</p>}
          <div style={{ display: "flex", gap: "0.55rem" }}>
            <button type="button" className="sa-btn sa-btn--ghost" onClick={() => setStep(1)} disabled={loading}>
              Atrás
            </button>
            <button
              type="button"
              className="sa-btn sa-btn--primary"
              style={{ flex: 1 }}
              disabled={loading}
              onClick={() => void generate()}
            >
              {loading ? "Generando…" : "Crear plan →"}
            </button>
          </div>
        </div>
      )}
    </SaModal>
  );
}
