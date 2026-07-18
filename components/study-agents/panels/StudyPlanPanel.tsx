"use client";

import { useEffect, useState } from "react";
import { saPost } from "@/hooks/study-agents/useApiClient";
import SaModal, {
  saInputStyle,
  saModalTokens,
  saPrimaryButtonStyle,
} from "@/components/study-agents/ui/SaModal";

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

  const t = saModalTokens(colorTheme);

  const generate = async () => {
    if (!apiKey) {
      setError("Configura tu API Key primero.");
      return;
    }
    const topicVal = topic.trim() || defaultTopic.trim();
    if (!topicVal) {
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
        topic: topicVal,
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
      onPlanGenerated(data.plan, { topic: topicVal, days });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al generar el plan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SaModal
      open={open}
      onClose={onClose}
      colorTheme={colorTheme}
      title="Plan de estudio"
      titleId="study-plan-title"
      subtitle="Prioriza gaps, mezcla repaso SRS y tests cortos. Regenera tras un test."
      maxWidth={440}
    >
      <div
        style={{
          margin: "0.85rem 0 1.1rem",
          padding: "0.7rem 0.85rem",
          borderRadius: 12,
          background: t.softBg,
          border: `1px solid ${t.border}`,
          fontSize: "0.78rem",
          color: t.muted,
          lineHeight: 1.45,
        }}
      >
        Secuenciación adaptativa: el plan usa tu grafo de conceptos y mastery, no un calendario genérico.
      </div>

      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: 6, color: t.muted }}>
        Tema
      </label>
      <input
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder={defaultTopic || "Ej: derivadas, SQL, biología celular…"}
        style={saInputStyle({ ...t, marginBottom: "0.85rem" })}
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        <div>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: 6, color: t.muted }}>
            Días
          </label>
          <input
            type="number"
            min={3}
            max={30}
            value={days}
            onChange={(e) => setDays(Number(e.target.value) || 7)}
            style={saInputStyle(t)}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: 6, color: t.muted }}>
            Min / día
          </label>
          <input
            type="number"
            min={15}
            max={180}
            step={5}
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value) || 45)}
            style={saInputStyle(t)}
          />
        </div>
      </div>

      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, margin: "0.85rem 0 6px", color: t.muted }}>
        Objetivo (opcional)
      </label>
      <input
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
        placeholder="Ej: aprobar el parcial del viernes"
        style={saInputStyle({ ...t, marginBottom: "1rem" })}
      />

      {error && (
        <p style={{ margin: "0 0 0.75rem", color: "#f87171", fontSize: "0.8rem" }}>{error}</p>
      )}

      <button
        type="button"
        onClick={() => void generate()}
        disabled={loading}
        style={saPrimaryButtonStyle({ dark: t.dark, loading, fullWidth: true })}
      >
        {loading ? "Generando plan…" : "Crear mi plan"}
      </button>
    </SaModal>
  );
}
