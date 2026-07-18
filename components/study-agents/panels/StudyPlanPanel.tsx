"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { outfit, spaceGrotesk } from "@/app/fonts";
import { saPost } from "@/hooks/study-agents/useApiClient";

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
  const [topic, setTopic] = useState(defaultTopic);
  const [days, setDays] = useState(7);
  const [minutes, setMinutes] = useState(45);
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTopic(defaultTopic);
      setError(null);
    }
  }, [open, defaultTopic]);

  if (!open || typeof document === "undefined") return null;

  const dark = colorTheme === "dark";
  const bg = dark ? "rgba(22, 22, 32, 0.98)" : "#ffffff";
  const text = dark ? "#f1f5f9" : "#0f172a";
  const muted = dark ? "#94a3b8" : "#64748b";
  const border = dark ? "rgba(99, 102, 241, 0.35)" : "rgba(99, 102, 241, 0.25)";
  const inputBg = dark ? "rgba(15, 15, 25, 0.9)" : "rgba(248, 250, 252, 1)";

  const generate = async () => {
    if (!apiKey) {
      setError("Configura tu API Key primero.");
      return;
    }
    const t = topic.trim() || defaultTopic.trim();
    if (!t) {
      setError("Indica un tema para el plan.");
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
        topic: t,
        days,
        minutes_per_day: minutes,
        goal: goal.trim() || null,
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
      onPlanGenerated(data.plan, { topic: t, days });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al generar el plan");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="study-plan-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10050,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        background: "rgba(0,0,0,0.55)",
      }}
      onClick={onClose}
    >
      <div
        className={outfit.className}
        style={{
          width: "100%",
          maxWidth: 440,
          background: bg,
          border: `1px solid ${border}`,
          borderRadius: 16,
          padding: "1.5rem",
          boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
          color: text,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
          <h2
            id="study-plan-title"
            className={spaceGrotesk.className}
            style={{ margin: 0, fontSize: "1.25rem" }}
          >
            Plan de estudio
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            style={{
              background: "transparent",
              border: "none",
              color: muted,
              fontSize: "1.4rem",
              cursor: "pointer",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
        <p style={{ margin: "0 0 1.25rem", fontSize: "0.85rem", color: muted, lineHeight: 1.5 }}>
          Usa tu grafo de conceptos y mastery: prioriza gaps, mezcla repaso SRS y
          tests cortos. Tras un test, regenera el plan para reinyectar lo débil.
        </p>

        <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: 6, color: muted }}>
          Tema
        </label>
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder={defaultTopic || "Ej: derivadas, SQL, biología celular…"}
          style={{
            width: "100%",
            marginBottom: "0.85rem",
            padding: "0.65rem 0.75rem",
            borderRadius: 10,
            border: `1px solid ${border}`,
            background: inputBg,
            color: text,
            fontSize: "0.9rem",
            boxSizing: "border-box",
          }}
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: 6, color: muted }}>
              Días
            </label>
            <input
              type="number"
              min={3}
              max={30}
              value={days}
              onChange={(e) => setDays(Number(e.target.value) || 7)}
              style={{
                width: "100%",
                padding: "0.65rem 0.75rem",
                borderRadius: 10,
                border: `1px solid ${border}`,
                background: inputBg,
                color: text,
                boxSizing: "border-box",
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: 6, color: muted }}>
              Min / día
            </label>
            <input
              type="number"
              min={15}
              max={180}
              step={5}
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value) || 45)}
              style={{
                width: "100%",
                padding: "0.65rem 0.75rem",
                borderRadius: 10,
                border: `1px solid ${border}`,
                background: inputBg,
                color: text,
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, margin: "0.85rem 0 6px", color: muted }}>
          Objetivo (opcional)
        </label>
        <input
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="Ej: aprobar el parcial del viernes"
          style={{
            width: "100%",
            marginBottom: "1rem",
            padding: "0.65rem 0.75rem",
            borderRadius: 10,
            border: `1px solid ${border}`,
            background: inputBg,
            color: text,
            fontSize: "0.9rem",
            boxSizing: "border-box",
          }}
        />

        {error && (
          <p style={{ margin: "0 0 0.75rem", color: "#f87171", fontSize: "0.8rem" }}>{error}</p>
        )}

        <button
          type="button"
          onClick={() => void generate()}
          disabled={loading}
          style={{
            width: "100%",
            padding: "0.75rem",
            border: "none",
            borderRadius: 10,
            cursor: loading ? "wait" : "pointer",
            fontWeight: 700,
            fontSize: "0.9rem",
            color: "#fff",
            background: loading
              ? "rgba(99, 102, 241, 0.45)"
              : "linear-gradient(135deg, #6366f1, #8b5cf6)",
          }}
        >
          {loading ? "Generando plan…" : "Crear mi plan"}
        </button>
      </div>
    </div>,
    document.body,
  );
}
