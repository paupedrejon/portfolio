"use client";

import type { ReactNode } from "react";
import {
  HiOutlineBookOpen,
  HiOutlineCalendarDays,
  HiOutlineClipboardDocumentCheck,
  HiOutlineLightBulb,
  HiOutlineArrowPath,
} from "react-icons/hi2";
import { outfit, spaceGrotesk } from "@/app/fonts";

type Action = {
  id: string;
  label: string;
  hint: string;
  onClick: () => void;
  icon: ReactNode;
};

type Props = {
  colorTheme: "dark" | "light";
  disabled?: boolean;
  onStudyPlan: () => void;
  onNotes: () => void;
  onTest: () => void;
  onConcepts: () => void;
  onReview?: () => void;
  srsDueCount?: number;
};

export default function QuickActionsBar({
  colorTheme,
  disabled,
  onStudyPlan,
  onNotes,
  onTest,
  onConcepts,
  onReview,
  srsDueCount = 0,
}: Props) {
  const dark = colorTheme === "dark";

  const iconProps = { size: 18, strokeWidth: 1.75 } as const;

  const actions: Action[] = [
    {
      id: "plan",
      label: "Plan de estudio",
      hint: "Calendario adaptativo",
      onClick: onStudyPlan,
      icon: <HiOutlineCalendarDays {...iconProps} />,
    },
    {
      id: "concepts",
      label: "Conceptos",
      hint: "Qué dominas / qué no",
      onClick: onConcepts,
      icon: <HiOutlineLightBulb {...iconProps} />,
    },
    {
      id: "notes",
      label: "Apuntes",
      hint: "Resumen del material",
      onClick: onNotes,
      icon: <HiOutlineBookOpen {...iconProps} />,
    },
    {
      id: "test",
      label: "Test",
      hint: "Retrieval practice",
      onClick: onTest,
      icon: <HiOutlineClipboardDocumentCheck {...iconProps} />,
    },
  ];

  if (onReview) {
    actions.splice(2, 0, {
      id: "review",
      label: srsDueCount > 0 ? `Repaso (${srsDueCount})` : "Repaso",
      hint: "Spaced repetition",
      onClick: onReview,
      icon: <HiOutlineArrowPath {...iconProps} />,
    });
  }

  return (
    <div
      className={outfit.className}
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "0.45rem",
        marginBottom: "0.75rem",
        padding: "0.15rem 0",
      }}
      role="toolbar"
      aria-label="Acciones de estudio"
    >
      {actions.map((a) => (
        <button
          key={a.id}
          type="button"
          disabled={disabled}
          onClick={a.onClick}
          title={a.hint}
          style={{
            display: "inline-flex",
            flexDirection: "row",
            alignItems: "center",
            gap: "0.55rem",
            padding: "0.55rem 0.85rem",
            borderRadius: 12,
            border: dark
              ? "1px solid rgba(148, 163, 184, 0.18)"
              : "1px solid rgba(99, 102, 241, 0.18)",
            background: dark
              ? "linear-gradient(145deg, rgba(99, 102, 241, 0.14), rgba(139, 92, 246, 0.08))"
              : "linear-gradient(145deg, rgba(99, 102, 241, 0.08), rgba(139, 92, 246, 0.04))",
            color: dark ? "#e2e8f0" : "#1e293b",
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.55 : 1,
            minWidth: 0,
            flex: "1 1 150px",
            textAlign: "left",
            transition: "border-color 0.15s ease, background 0.15s ease, transform 0.12s ease",
          }}
          onMouseEnter={(e) => {
            if (disabled) return;
            e.currentTarget.style.borderColor = dark
              ? "rgba(129, 140, 248, 0.45)"
              : "rgba(99, 102, 241, 0.4)";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = dark
              ? "rgba(148, 163, 184, 0.18)"
              : "rgba(99, 102, 241, 0.18)";
            e.currentTarget.style.transform = "none";
          }}
        >
          <span
            aria-hidden
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: 9,
              flexShrink: 0,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "#fff",
              boxShadow: "0 4px 12px rgba(99, 102, 241, 0.28)",
            }}
          >
            {a.icon}
          </span>
          <span style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
            <span
              className={spaceGrotesk.className}
              style={{ fontSize: "0.82rem", fontWeight: 700, letterSpacing: "-0.01em" }}
            >
              {a.label}
            </span>
            <span style={{ fontSize: "0.65rem", color: dark ? "#94a3b8" : "#64748b" }}>
              {a.hint}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}
