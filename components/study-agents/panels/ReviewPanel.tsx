"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { outfit, spaceGrotesk } from "@/app/fonts";
import { saFetch, saPost } from "@/hooks/study-agents/useApiClient";

export type SrsCard = {
  card_id: string;
  front: string;
  back: string;
  concept_id?: string | null;
  due_date?: string;
  stability?: number;
  difficulty?: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  colorTheme: "dark" | "light";
  userId: string;
  chatId: string | null;
  onDueCountChange?: (n: number) => void;
};

const RATINGS: { id: string; label: string; color: string }[] = [
  { id: "again", label: "Otra vez", color: "#ef4444" },
  { id: "hard", label: "Difícil", color: "#f59e0b" },
  { id: "good", label: "Bien", color: "#22c55e" },
  { id: "easy", label: "Fácil", color: "#06b6d4" },
];

export default function ReviewPanel({
  open,
  onClose,
  colorTheme,
  userId,
  chatId,
  onDueCountChange,
}: Props) {
  const [cards, setCards] = useState<SrsCard[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneMsg, setDoneMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    setDoneMsg(null);
    try {
      const qs = new URLSearchParams({ userId, limit: "40" });
      if (chatId) qs.set("chatId", chatId);
      const { ok, data } = await saFetch<{
        success?: boolean;
        cards?: SrsCard[];
        due_total?: number;
        error?: string;
      }>(`srs/due?${qs}`);
      if (!ok || !data.success) {
        throw new Error(data.error || "No se pudo cargar la cola");
      }
      setCards(data.cards || []);
      setIndex(0);
      setFlipped(false);
      onDueCountChange?.(data.due_total ?? data.cards?.length ?? 0);
      if (!(data.cards || []).length) {
        setDoneMsg("No hay tarjetas pendientes. Fallar preguntas en un test las crea automáticamente.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar repaso");
    } finally {
      setLoading(false);
    }
  }, [userId, chatId, onDueCountChange]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  const rate = async (rating: string) => {
    const card = cards[index];
    if (!card) return;
    try {
      const { ok, data } = await saPost<{ success?: boolean; error?: string }>("srs/review", {
        userId,
        cardId: card.card_id,
        rating,
      });
      if (!ok || !data.success) {
        throw new Error(data.error || "No se pudo registrar el rating");
      }
      const next = cards.filter((_, i) => i !== index);
      setCards(next);
      setFlipped(false);
      setIndex(0);
      onDueCountChange?.(next.length);
      if (!next.length) {
        setDoneMsg("¡Cola terminada! Buen trabajo — retrieval practice completado.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al repasar");
    }
  };

  if (!open || typeof document === "undefined") return null;

  const dark = colorTheme === "dark";
  const bg = dark ? "rgba(22, 22, 32, 0.98)" : "#ffffff";
  const text = dark ? "#f1f5f9" : "#0f172a";
  const muted = dark ? "#94a3b8" : "#64748b";
  const border = dark ? "rgba(245, 158, 11, 0.4)" : "rgba(245, 158, 11, 0.3)";
  const card = cards[index];

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-title"
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
          maxWidth: 480,
          background: bg,
          border: `1px solid ${border}`,
          borderRadius: 16,
          padding: "1.5rem",
          boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
          color: text,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
          <div>
            <h2 id="review-title" className={spaceGrotesk.className} style={{ margin: 0, fontSize: "1.25rem" }}>
              Repaso SRS
            </h2>
            <p style={{ margin: "0.35rem 0 0", fontSize: "0.8rem", color: muted }}>
              Spaced repetition (FSRS) · {cards.length} pendiente{cards.length === 1 ? "" : "s"}
            </p>
          </div>
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
            }}
          >
            ×
          </button>
        </div>

        {loading && <p style={{ color: muted, marginTop: "1.25rem" }}>Cargando cola…</p>}
        {error && <p style={{ color: "#f87171", marginTop: "1rem", fontSize: "0.85rem" }}>{error}</p>}
        {doneMsg && !card && (
          <p style={{ color: muted, marginTop: "1.25rem", lineHeight: 1.5, fontSize: "0.9rem" }}>{doneMsg}</p>
        )}

        {card && (
          <>
            <button
              type="button"
              onClick={() => setFlipped((f) => !f)}
              style={{
                marginTop: "1.25rem",
                width: "100%",
                minHeight: 160,
                padding: "1.25rem",
                borderRadius: 14,
                border: `1px solid ${border}`,
                background: dark ? "rgba(245, 158, 11, 0.08)" : "rgba(245, 158, 11, 0.06)",
                color: text,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div style={{ fontSize: "0.7rem", fontWeight: 700, color: muted, marginBottom: 8 }}>
                {flipped ? "RESPUESTA — toca para ocultar" : "PREGUNTA — toca para revelar"}
              </div>
              <div style={{ fontSize: "1rem", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                {flipped ? card.back : card.front}
              </div>
              {card.concept_id && (
                <div style={{ marginTop: 10, fontSize: "0.7rem", color: muted }}>
                  Concepto: {card.concept_id}
                </div>
              )}
            </button>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.5rem",
                marginTop: "1rem",
              }}
            >
              {RATINGS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  disabled={!flipped}
                  onClick={() => void rate(r.id)}
                  style={{
                    padding: "0.65rem",
                    borderRadius: 10,
                    border: `1px solid ${r.color}66`,
                    background: flipped ? `${r.color}22` : "transparent",
                    color: flipped ? text : muted,
                    fontWeight: 700,
                    fontSize: "0.8rem",
                    cursor: flipped ? "pointer" : "not-allowed",
                    opacity: flipped ? 1 : 0.5,
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>
            {!flipped && (
              <p style={{ margin: "0.75rem 0 0", fontSize: "0.75rem", color: muted, textAlign: "center" }}>
                Revela la respuesta antes de puntuar
              </p>
            )}
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
