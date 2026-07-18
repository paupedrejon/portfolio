"use client";

import { useCallback, useEffect, useState } from "react";
import { saFetch } from "@/hooks/study-agents/useApiClient";
import type { ConceptGap, ConceptNode } from "@/lib/study-agents/types";
import SaModal, {
  saGhostButtonStyle,
  saModalTokens,
  saPrimaryButtonStyle,
} from "@/components/study-agents/ui/SaModal";
import { spaceGrotesk } from "@/app/fonts";

type Props = {
  open: boolean;
  onClose: () => void;
  colorTheme: "dark" | "light";
  apiKey: string | null;
  userId: string;
  chatId: string | null;
};

function masteryColor(m: number): string {
  if (m <= 0) return "#64748b";
  if (m < 0.4) return "#ef4444";
  if (m < 0.7) return "#f59e0b";
  return "#22c55e";
}

function masteryLabel(m: number): string {
  if (m <= 0) return "Sin evaluar";
  if (m < 0.4) return "Débil";
  if (m < 0.7) return "En progreso";
  return "Dominado";
}

export default function ConceptMapPanel({
  open,
  onClose,
  colorTheme,
  apiKey,
  userId,
  chatId,
}: Props) {
  const [concepts, setConcepts] = useState<ConceptNode[]>([]);
  const [gaps, setGaps] = useState<ConceptGap[]>([]);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!chatId || !apiKey) {
      setConcepts([]);
      setGaps([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [conceptsRes, gapsRes] = await Promise.all([
        saFetch<{
          success?: boolean;
          concepts?: ConceptNode[];
          error?: string;
        }>(`concepts/${encodeURIComponent(chatId)}?userId=${encodeURIComponent(userId)}&apiKey=${encodeURIComponent(apiKey)}`),
        saFetch<{
          success?: boolean;
          gaps?: ConceptGap[];
          error?: string;
        }>("detect-gaps", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiKey, chatId, userId, threshold: 0.5 }),
        }),
      ]);
      if (!conceptsRes.ok || !conceptsRes.data.success) {
        throw new Error(conceptsRes.data.error || "No se pudieron cargar los conceptos");
      }
      setConcepts(conceptsRes.data.concepts || []);
      setGaps(gapsRes.ok && gapsRes.data.success ? gapsRes.data.gaps || [] : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar conceptos");
    } finally {
      setLoading(false);
    }
  }, [apiKey, chatId, userId]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  const extract = async () => {
    if (!chatId || !apiKey) {
      setError("Necesitas un chat activo y API Key.");
      return;
    }
    setExtracting(true);
    setError(null);
    try {
      const { ok, data } = await saFetch<{
        success?: boolean;
        concepts?: ConceptNode[];
        error?: string;
      }>("concepts/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, chatId, userId }),
      });
      if (!ok || !data.success) {
        throw new Error(data.error || "No se pudieron extraer conceptos");
      }
      setConcepts(data.concepts || []);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al extraer conceptos");
    } finally {
      setExtracting(false);
    }
  };

  const t = saModalTokens(colorTheme);
  const avg =
    concepts.length > 0
      ? concepts.reduce((s, c) => s + (c.mastery ?? 0), 0) / concepts.length
      : 0;

  return (
    <SaModal
      open={open}
      onClose={onClose}
      colorTheme={colorTheme}
      title="Mapa de conceptos"
      titleId="concept-map-title"
      subtitle="Knowledge tracing: el tutor ve qué micro-conceptos dominas."
      maxWidth={560}
    >
      <div
        style={{
          marginTop: "0.85rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem",
          alignItems: "center",
        }}
      >
        <button
          type="button"
          onClick={() => void extract()}
          disabled={extracting || !chatId}
          style={{
            ...saPrimaryButtonStyle({ dark: t.dark, loading: extracting }),
            opacity: extracting || !chatId ? 0.55 : 1,
          }}
        >
          {extracting ? "Extrayendo…" : concepts.length ? "Re-extraer del material" : "Extraer del material"}
        </button>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          style={saGhostButtonStyle({ dark: t.dark, border: t.border, text: t.text })}
        >
          Actualizar
        </button>
        {concepts.length > 0 && (
          <span style={{ fontSize: "0.75rem", color: t.muted, marginLeft: "auto" }}>
            Dominio medio: {Math.round(avg * 100)}% · {concepts.length} conceptos
          </span>
        )}
      </div>

      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          flexWrap: "wrap",
          marginTop: "0.85rem",
          fontSize: "0.7rem",
          color: t.muted,
        }}
      >
        {[
          ["Sin evaluar", "#64748b"],
          ["Débil", "#ef4444"],
          ["En progreso", "#f59e0b"],
          ["Dominado", "#22c55e"],
        ].map(([label, color]) => (
          <span key={label} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: color,
              }}
            />
            {label}
          </span>
        ))}
      </div>

      {error && (
        <p style={{ color: "#f87171", fontSize: "0.8rem", marginTop: "0.75rem" }}>{error}</p>
      )}

      {!chatId && (
        <p style={{ color: t.muted, fontSize: "0.85rem", marginTop: "1rem" }}>
          Abre o crea un chat y sube un PDF para extraer conceptos.
        </p>
      )}

      {loading && <p style={{ color: t.muted, marginTop: "1rem" }}>Cargando…</p>}

      {!loading && gaps.length > 0 && (
        <div
          style={{
            marginTop: "1rem",
            padding: "0.85rem 1rem",
            borderRadius: 14,
            border: t.dark ? "1px solid rgba(239, 68, 68, 0.35)" : "1px solid rgba(239, 68, 68, 0.25)",
            background: t.dark ? "rgba(239, 68, 68, 0.08)" : "rgba(239, 68, 68, 0.05)",
          }}
        >
          <p
            className={spaceGrotesk.className}
            style={{ margin: "0 0 0.5rem", fontSize: "0.9rem", fontWeight: 700, color: t.text }}
          >
            Gaps prioritarios ({gaps.length})
          </p>
          <p style={{ margin: "0 0 0.65rem", fontSize: "0.75rem", color: t.muted, lineHeight: 1.45 }}>
            Conceptos con dominio &lt; 50%, ordenados por importancia.
          </p>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {gaps.slice(0, 6).map((g) => (
              <li
                key={`gap-${g.concept_id}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "0.75rem",
                  fontSize: "0.8rem",
                  color: t.text,
                }}
              >
                <span>
                  <strong>{g.name}</strong>
                  {g.broken_prerequisites && g.broken_prerequisites.length > 0 && (
                    <span style={{ color: t.muted, fontSize: "0.7rem" }}>
                      {" "}
                      · prerreq. débiles: {g.broken_prerequisites.length}
                    </span>
                  )}
                </span>
                <span style={{ color: "#ef4444", fontWeight: 600, whiteSpace: "nowrap" }}>
                  {Math.round((g.mastery ?? 0) * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!loading && chatId && concepts.length === 0 && !error && (
        <div
          style={{
            marginTop: "1rem",
            padding: "1rem",
            borderRadius: 14,
            border: `1px dashed ${t.border}`,
            background: t.softBg,
            color: t.muted,
            fontSize: "0.85rem",
            lineHeight: 1.5,
          }}
        >
          Aún no hay grafo de conceptos. Sube un documento y pulsa{" "}
          <strong style={{ color: t.primarySoft }}>Extraer del material</strong>.
        </div>
      )}

      <ul
        style={{
          listStyle: "none",
          margin: "1rem 0 0",
          padding: 0,
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
        }}
      >
        {concepts.map((c) => {
          const m = c.mastery ?? 0;
          const color = masteryColor(m);
          return (
            <li
              key={c.concept_id}
              style={{
                padding: "0.75rem 0.9rem",
                borderRadius: 14,
                border: `1px solid ${color}44`,
                background: t.dark ? `${color}12` : `${color}0d`,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem" }}>
                <strong style={{ fontSize: "0.9rem" }}>{c.name}</strong>
                <span style={{ fontSize: "0.7rem", fontWeight: 700, color, whiteSpace: "nowrap" }}>
                  {masteryLabel(m)} · {Math.round(m * 100)}%
                </span>
              </div>
              {c.description && (
                <p style={{ margin: "0.35rem 0 0", fontSize: "0.75rem", color: t.muted, lineHeight: 1.4 }}>
                  {c.description}
                </p>
              )}
              <div
                style={{
                  marginTop: "0.5rem",
                  height: 4,
                  borderRadius: 999,
                  background: t.dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${Math.round(m * 100)}%`,
                    height: "100%",
                    background: color,
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </SaModal>
  );
}
