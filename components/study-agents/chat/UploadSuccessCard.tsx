"use client";

import type { CSSProperties, ReactNode } from "react";
import {
  HiOutlineBookOpen,
  HiOutlineChatBubbleLeftRight,
  HiOutlineClipboardDocumentCheck,
  HiOutlineDocumentText,
  HiCheck,
} from "react-icons/hi2";
import { outfit, spaceGrotesk } from "@/app/fonts";
import {
  SA_PRIMARY,
  SA_SUCCESS,
} from "@/lib/study-agents/brand";

type Props = {
  fileNames: string[];
  colorTheme: "dark" | "light";
  onNotes?: () => void;
  onAsk?: () => void;
  onTest?: () => void;
};

type Action = {
  id: string;
  title: string;
  description: string;
  color: string;
  softBg: string;
  softBorder: string;
  icon: ReactNode;
  onClick?: () => void;
};

export default function UploadSuccessCard({
  fileNames,
  colorTheme,
  onNotes,
  onAsk,
  onTest,
}: Props) {
  const dark = colorTheme === "dark";
  const text = dark ? "#f1f5f9" : "#0f172a";
  const muted = dark ? "#94a3b8" : "#64748b";
  const cardBg = dark ? "rgba(26, 26, 36, 0.95)" : "#ffffff";
  const cardBorder = dark ? "rgba(16, 185, 129, 0.35)" : "rgba(16, 185, 129, 0.4)";

  const actions: Action[] = [
    {
      id: "notes",
      title: "Generar apuntes",
      description:
        "Crea apuntes visuales con esquemas conceptuales y diagramas interactivos",
      color: SA_PRIMARY,
      softBg: dark ? "rgba(37, 150, 190, 0.12)" : "rgba(37, 150, 190, 0.07)",
      softBorder: dark ? "rgba(37, 150, 190, 0.35)" : "rgba(37, 150, 190, 0.28)",
      icon: <HiOutlineBookOpen size={24} color="#fff" />,
      onClick: onNotes,
    },
    {
      id: "ask",
      title: "Hacer preguntas",
      description:
        "Pregúntame sobre el contenido del documento y obtén respuestas detalladas",
      color: "#0d9488",
      softBg: dark ? "rgba(13, 148, 136, 0.12)" : "rgba(13, 148, 136, 0.07)",
      softBorder: dark ? "rgba(13, 148, 136, 0.35)" : "rgba(13, 148, 136, 0.28)",
      icon: <HiOutlineChatBubbleLeftRight size={24} color="#fff" />,
      onClick: onAsk,
    },
    {
      id: "test",
      title: "Generar test",
      description:
        "Genera un test completo con múltiples preguntas para evaluar tu nivel. Recibe una calificación y feedback detallado al finalizar.",
      color: "#1e6f8c",
      softBg: dark ? "rgba(30, 111, 140, 0.14)" : "rgba(30, 111, 140, 0.08)",
      softBorder: dark ? "rgba(30, 111, 140, 0.4)" : "rgba(30, 111, 140, 0.3)",
      icon: <HiOutlineClipboardDocumentCheck size={24} color="#fff" />,
      onClick: onTest,
    },
  ];

  return (
    <div
      className={outfit.className}
      style={{
        background: cardBg,
        borderRadius: 16,
        padding: "1.5rem 1.6rem",
        border: `1px solid ${cardBorder}`,
        boxShadow: dark
          ? "0 4px 24px rgba(0,0,0,0.25)"
          : "0 4px 20px rgba(15, 23, 42, 0.06)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.9rem", marginBottom: "1.15rem" }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: SA_SUCCESS,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <HiCheck size={22} color="#fff" strokeWidth={2.5} />
        </div>
        <div>
          <h3
            className={spaceGrotesk.className}
            style={{
              margin: 0,
              fontSize: "1.2rem",
              fontWeight: 700,
              color: text,
              letterSpacing: "-0.02em",
            }}
          >
            Documento procesado correctamente
          </h3>
          <p style={{ margin: "0.2rem 0 0", fontSize: "0.85rem", color: muted }}>
            {fileNames.length} archivo(s) procesado(s)
          </p>
        </div>
      </div>

      {fileNames.length > 0 && (
        <div
          style={{
            marginBottom: "1.35rem",
            padding: "0.85rem 1rem",
            borderRadius: 12,
            background: dark ? "rgba(16, 185, 129, 0.1)" : "rgba(16, 185, 129, 0.06)",
            border: `1px solid ${dark ? "rgba(16, 185, 129, 0.28)" : "rgba(16, 185, 129, 0.22)"}`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.55rem",
              marginBottom: "0.45rem",
              fontSize: "0.8rem",
              fontWeight: 600,
              color: muted,
            }}
          >
            <HiOutlineDocumentText size={18} color={SA_SUCCESS} />
            Archivo(s) procesado(s):
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {fileNames.map((name) => (
              <li
                key={name}
                style={{
                  fontSize: "0.9rem",
                  color: SA_PRIMARY,
                  fontWeight: 600,
                  paddingLeft: "0.15rem",
                }}
              >
                · {name}
              </li>
            ))}
          </ul>
        </div>
      )}

      <h4
        className={spaceGrotesk.className}
        style={{
          margin: "0 0 0.85rem",
          fontSize: "1rem",
          fontWeight: 700,
          color: text,
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: SA_PRIMARY,
            display: "inline-block",
          }}
        />
        ¿Qué quieres hacer ahora?
      </h4>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
        {actions.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={a.onClick}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "0.9rem",
              width: "100%",
              textAlign: "left",
              padding: "1rem 1.05rem",
              borderRadius: 12,
              border: `1px solid ${a.softBorder}`,
              background: a.softBg,
              cursor: a.onClick ? "pointer" : "default",
              transition: "background 0.15s ease, border-color 0.15s ease",
            }}
            onMouseEnter={(e) => {
              if (!a.onClick) return;
              e.currentTarget.style.borderColor = a.color;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = a.softBorder;
            }}
          >
            <span
              aria-hidden
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: a.color,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {a.icon}
            </span>
            <span style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0, paddingTop: 2 }}>
              <span
                className={spaceGrotesk.className}
                style={{ fontSize: "0.98rem", fontWeight: 700, color: text }}
              >
                {a.title}
              </span>
              <span style={{ fontSize: "0.82rem", color: muted, lineHeight: 1.45 }}>
                {a.description}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/** Estilos compartidos para chips de acción (toolbar / quick actions). */
export function saChipStyle(dark: boolean, active?: boolean): CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.45rem",
    padding: "0.55rem 1rem",
    borderRadius: 9999,
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: 600,
    color: active || !dark ? SA_PRIMARY : "#e2e8f0",
    background: active
      ? SA_PRIMARY_SOFT
      : dark
        ? "rgba(26, 26, 36, 0.85)"
        : "#ffffff",
    border: `1px solid ${active ? SA_PRIMARY : dark ? "rgba(148, 163, 184, 0.22)" : "rgba(148, 163, 184, 0.32)"}`,
    boxShadow: dark ? "none" : "0 2px 6px rgba(15, 23, 42, 0.05)",
  };
}

export { SA_PRIMARY, SA_PRIMARY_SOFT };
