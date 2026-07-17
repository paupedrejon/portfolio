"use client";

import type { ReactNode } from "react";
import {
  HiOutlineBookOpen,
  HiOutlineCalendarDays,
  HiOutlineClipboardDocumentCheck,
  HiOutlineLightBulb,
  HiOutlineArrowPath,
} from "react-icons/hi2";
import { outfit } from "@/app/fonts";

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

/** Chips compactos alineados con la toolbar / input pill de Study Agents. */
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
  const iconProps = { size: 15, strokeWidth: 1.75 } as const;

  const actions: Action[] = [
    {
      id: "plan",
      label: "Plan",
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
      label: srsDueCount > 0 ? `Repaso · ${srsDueCount}` : "Repaso",
      hint: "Spaced repetition",
      onClick: onReview,
      icon: <HiOutlineArrowPath {...iconProps} />,
    });
  }

  const border = dark ? "rgba(148, 163, 184, 0.2)" : "rgba(148, 163, 184, 0.28)";
  const bg = dark ? "rgba(26, 26, 36, 0.85)" : "rgba(255, 255, 255, 0.95)";
  const text = dark ? "#e2e8f0" : "#1e293b";
  const accent = "#6366f1";

  return (
    <div
      className={outfit.className}
      role="toolbar"
      aria-label="Acciones de estudio"
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "0.4rem",
        marginBottom: "0.65rem",
        padding: "0.2rem 0",
      }}
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
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.4rem 0.75rem",
            borderRadius: 9999,
            border: `1px solid ${border}`,
            background: bg,
            color: text,
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.55 : 1,
            fontSize: "0.78rem",
            fontWeight: 600,
            boxShadow: dark
              ? "none"
              : "0 1px 2px rgba(15, 23, 42, 0.04)",
            transition: "border-color 0.15s ease, color 0.15s ease, background 0.15s ease",
          }}
          onMouseEnter={(e) => {
            if (disabled) return;
            e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.45)";
            e.currentTarget.style.color = accent;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = border;
            e.currentTarget.style.color = text;
          }}
        >
          <span style={{ display: "inline-flex", color: accent, opacity: 0.9 }} aria-hidden>
            {a.icon}
          </span>
          {a.label}
        </button>
      ))}
    </div>
  );
}
