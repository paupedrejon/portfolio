"use client";

import { outfit } from "@/app/fonts";
import type { ChatDocument } from "@/lib/study-agents/types";

type Props = {
  colorTheme: "dark" | "light";
  documents: ChatDocument[];
  loading: boolean;
  onRefresh: () => void;
  onDelete: (docId: string) => void;
  onClose: () => void;
};

export default function ChatDocumentsPanel({
  colorTheme,
  documents,
  loading,
  onRefresh,
  onDelete,
  onClose,
}: Props) {
  return (
    <div
      style={{
        margin: "0 1.5rem 0.75rem",
        padding: "1rem",
        borderRadius: "12px",
        background:
          colorTheme === "dark"
            ? "rgba(26, 26, 36, 0.95)"
            : "rgba(255, 255, 255, 0.95)",
        border: `1px solid ${colorTheme === "dark" ? "rgba(148, 163, 184, 0.15)" : "rgba(148, 163, 184, 0.25)"}`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
        <strong className={outfit.className} style={{ color: colorTheme === "dark" ? "#f1f5f9" : "#0f172a" }}>
          Documentos en este chat
        </strong>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            style={{
              padding: "0.25rem 0.6rem",
              fontSize: "0.75rem",
              borderRadius: "6px",
              border: "1px solid rgba(99,102,241,0.3)",
              background: "transparent",
              color: "#a5b4fc",
              cursor: "pointer",
            }}
          >
            {loading ? "..." : "Actualizar"}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            style={{
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              fontSize: "1.1rem",
            }}
          >
            ×
          </button>
        </div>
      </div>
      {documents.length === 0 ? (
        <p className={outfit.className} style={{ margin: 0, fontSize: "0.8rem", color: "#94a3b8" }}>
          {loading ? "Cargando..." : "No hay PDFs indexados. Sube un documento para empezar."}
        </p>
      ) : (
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {documents.map((doc) => (
            <li
              key={doc.doc_id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.5rem 0.75rem",
                borderRadius: "8px",
                background:
                  colorTheme === "dark"
                    ? "rgba(255,255,255,0.03)"
                    : "rgba(0,0,0,0.02)",
              }}
            >
              <div>
                <div className={outfit.className} style={{ fontSize: "0.85rem", color: colorTheme === "dark" ? "#e2e8f0" : "#1e293b" }}>
                  {doc.filename}
                </div>
                <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                  {doc.chunk_count ?? 0} fragmentos
                  {doc.uploaded_at ? ` · ${new Date(doc.uploaded_at).toLocaleDateString()}` : ""}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onDelete(doc.doc_id)}
                title="Eliminar del índice RAG"
                style={{
                  padding: "0.25rem 0.5rem",
                  fontSize: "0.7rem",
                  borderRadius: "6px",
                  border: "1px solid rgba(239,68,68,0.35)",
                  background: "rgba(239,68,68,0.08)",
                  color: "#f87171",
                  cursor: "pointer",
                }}
              >
                Quitar
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
