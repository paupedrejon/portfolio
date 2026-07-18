"use client";

import type { CSSProperties, ReactNode } from "react";
import { createPortal } from "react-dom";
import { outfit, spaceGrotesk } from "@/app/fonts";
import StudyAgentsBotAvatar from "@/components/study-agents/StudyAgentsBotAvatar";
import {
  SA_PRIMARY,
  SA_PRIMARY_BORDER,
} from "@/lib/study-agents/brand";
import "@/components/study-agents/study-agents-chat.css";
import "@/components/study-agents/study-agents-bot.css";

type Props = {
  open: boolean;
  onClose: () => void;
  colorTheme: "dark" | "light";
  title: string;
  titleId: string;
  subtitle?: string;
  maxWidth?: number;
  /** Modal ligero (menos “formulario pesado”). */
  light?: boolean;
  children: ReactNode;
};

/** Modal ligero al estilo home: poco borde, bot, sin cajas densas. */
export default function SaModal({
  open,
  onClose,
  colorTheme,
  title,
  titleId,
  subtitle,
  maxWidth = 440,
  light = false,
  children,
}: Props) {
  if (!open || typeof document === "undefined") return null;

  const dark = colorTheme === "dark";
  const bg = dark ? "rgba(4, 16, 24, 0.96)" : "#ffffff";
  const text = dark ? "#f1f5f9" : "#0f172a";
  const muted = dark ? "#94a3b8" : "#64748b";

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10050,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        background: "rgba(3, 13, 20, 0.55)",
        backdropFilter: "blur(8px)",
      }}
      onClick={onClose}
    >
      <div
        className={`${outfit.className} sa-pop`}
        style={{
          width: "100%",
          maxWidth,
          maxHeight: "85vh",
          overflow: "auto",
          background: bg,
          border: dark
            ? "1px solid rgba(255,255,255,0.14)"
            : "1px solid rgba(15,23,42,0.08)",
          borderRadius: 20,
          padding: light ? "1.5rem 1.4rem 1.55rem" : "1.35rem 1.45rem 1.5rem",
          boxShadow: dark
            ? "0 24px 60px rgba(0,0,0,0.5)"
            : "0 24px 60px rgba(15, 23, 42, 0.14), 0 0 40px rgba(0, 217, 255, 0.08)",
          color: text,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "0.85rem",
            marginBottom: "0.25rem",
          }}
        >
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", minWidth: 0 }}>
            <StudyAgentsBotAvatar size={38} color={SA_PRIMARY} state="idle" />
            <div style={{ minWidth: 0 }}>
              <h2
                id={titleId}
                className={spaceGrotesk.className}
                style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.02em" }}
              >
                {title}
              </h2>
              {subtitle && (
                <p style={{ margin: "0.3rem 0 0", fontSize: "0.82rem", color: muted, lineHeight: 1.45 }}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="sa-chip"
            style={{ width: 36, height: 36, padding: 0, justifyContent: "center", borderRadius: 12 }}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function saModalTokens(colorTheme: "dark" | "light") {
  const dark = colorTheme === "dark";
  return {
    dark,
    text: dark ? "#f1f5f9" : "#0f172a",
    muted: dark ? "#94a3b8" : "#64748b",
    border: dark ? "rgba(53, 140, 159, 0.4)" : SA_PRIMARY_BORDER,
    inputBg: dark ? "rgba(15, 20, 28, 0.95)" : "#ffffff",
    softBg: dark ? "rgba(53, 140, 159, 0.12)" : "rgba(53, 140, 159, 0.06)",
    primary: SA_PRIMARY,
    primarySoft: dark ? "#7dd3fc" : SA_PRIMARY,
  };
}

export function saPrimaryButtonStyle(opts: {
  dark: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}): CSSProperties {
  return {
    width: opts.fullWidth ? "100%" : undefined,
    padding: "0.85rem 1.25rem",
    border: "2px solid rgba(53, 140, 159, 0.45)",
    borderRadius: 12,
    cursor: opts.loading ? "wait" : "pointer",
    fontWeight: 700,
    fontSize: "0.95rem",
    color: "#041018",
    background: opts.loading ? "rgba(0, 217, 255, 0.35)" : "#fff",
    boxShadow: opts.loading ? "none" : "0 4px 16px rgba(53, 140, 159, 0.12)",
    opacity: opts.loading ? 0.75 : 1,
  };
}

export function saGhostButtonStyle(opts: {
  dark: boolean;
  border: string;
  text: string;
}): CSSProperties {
  return {
    padding: "0.65rem 1.1rem",
    borderRadius: 12,
    border: "2px solid rgba(15,23,42,0.14)",
    background: "transparent",
    color: opts.text,
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: 600,
  };
}

export function saInputStyle(opts: {
  border: string;
  inputBg: string;
  text: string;
  marginBottom?: string | number;
}): CSSProperties {
  return {
    width: "100%",
    marginBottom: opts.marginBottom,
    padding: "0.85rem 1rem",
    borderRadius: 14,
    border: "2px solid rgba(15,23,42,0.12)",
    background: opts.inputBg,
    color: opts.text,
    fontSize: "0.95rem",
    boxSizing: "border-box",
    outline: "none",
  };
}
