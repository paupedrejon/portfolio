"use client";

import type { CSSProperties, ReactNode } from "react";
import { createPortal } from "react-dom";
import { outfit, spaceGrotesk } from "@/app/fonts";
import StudyAgentsBotAvatar from "@/components/study-agents/StudyAgentsBotAvatar";
import {
  SA_PRIMARY,
  SA_PRIMARY_BORDER,
  SA_PRIMARY_SOFT,
} from "@/lib/study-agents/brand";

type Props = {
  open: boolean;
  onClose: () => void;
  colorTheme: "dark" | "light";
  title: string;
  titleId: string;
  subtitle?: string;
  maxWidth?: number;
  children: ReactNode;
};

/** Shell de modal unificado al estilo home (#358c9f, bot, pills). */
export default function SaModal({
  open,
  onClose,
  colorTheme,
  title,
  titleId,
  subtitle,
  maxWidth = 480,
  children,
}: Props) {
  if (!open || typeof document === "undefined") return null;

  const dark = colorTheme === "dark";
  const bg = dark ? "rgba(4, 16, 24, 0.98)" : "#ffffff";
  const text = dark ? "#f1f5f9" : "#0f172a";
  const muted = dark ? "#94a3b8" : "#64748b";
  const border = dark ? "rgba(53, 140, 159, 0.4)" : SA_PRIMARY_BORDER;

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
        background: dark ? "rgba(2, 8, 16, 0.72)" : "rgba(15, 23, 42, 0.45)",
        backdropFilter: "blur(6px)",
      }}
      onClick={onClose}
    >
      <div
        className={outfit.className}
        style={{
          width: "100%",
          maxWidth,
          maxHeight: "85vh",
          overflow: "auto",
          background: bg,
          border: `1px solid ${border}`,
          borderRadius: 18,
          padding: "1.35rem 1.45rem 1.5rem",
          boxShadow: dark
            ? "0 24px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(37,150,190,0.08)"
            : "0 20px 50px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(37,150,190,0.06)",
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
            marginBottom: subtitle ? "0.35rem" : "0.85rem",
          }}
        >
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", minWidth: 0 }}>
            <StudyAgentsBotAvatar
              size={40}
              color={dark ? "#7dd3fc" : SA_PRIMARY}
              state="idle"
            />
            <div style={{ minWidth: 0 }}>
              <h2
                id={titleId}
                className={spaceGrotesk.className}
                style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, letterSpacing: "-0.02em" }}
              >
                {title}
              </h2>
              {subtitle && (
                <p style={{ margin: "0.3rem 0 0", fontSize: "0.8rem", color: muted, lineHeight: 1.45 }}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            style={{
              width: 32,
              height: 32,
              borderRadius: 999,
              border: `1px solid ${border}`,
              background: dark ? "rgba(37,150,190,0.1)" : SA_PRIMARY_SOFT,
              color: muted,
              fontSize: "1.15rem",
              cursor: "pointer",
              lineHeight: 1,
              flexShrink: 0,
            }}
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
    border: dark ? "rgba(37, 150, 190, 0.4)" : SA_PRIMARY_BORDER,
    inputBg: dark ? "rgba(15, 20, 28, 0.95)" : "#f8fafc",
    softBg: dark ? "rgba(37, 150, 190, 0.12)" : SA_PRIMARY_SOFT,
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
    padding: "0.7rem 1.15rem",
    border: "none",
    borderRadius: 999,
    cursor: opts.loading ? "wait" : "pointer",
    fontWeight: 700,
    fontSize: "0.9rem",
    color: "#fff",
    background: opts.loading
      ? "rgba(37, 150, 190, 0.45)"
      : SA_PRIMARY,
    boxShadow: opts.loading
      ? "none"
      : "0 8px 20px rgba(37, 150, 190, 0.28)",
    opacity: opts.loading ? 0.75 : 1,
  };
}

export function saGhostButtonStyle(opts: {
  dark: boolean;
  border: string;
  text: string;
}): CSSProperties {
  return {
    padding: "0.55rem 1rem",
    borderRadius: 999,
    border: `1px solid ${opts.border}`,
    background: opts.dark ? "rgba(37,150,190,0.08)" : "#fff",
    color: opts.text,
    cursor: "pointer",
    fontSize: "0.8rem",
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
    padding: "0.65rem 0.85rem",
    borderRadius: 12,
    border: `1px solid ${opts.border}`,
    background: opts.inputBg,
    color: opts.text,
    fontSize: "0.9rem",
    boxSizing: "border-box",
    outline: "none",
  };
}
