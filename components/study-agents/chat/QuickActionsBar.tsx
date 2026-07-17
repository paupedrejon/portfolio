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
import { SA_PRIMARY, SA_PRIMARY_SOFT } from "@/lib/study-agents/brand";

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

/** Pills blancos clean con iconos grandes y color marca #2596be. */
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
  const iconProps = { size: 20, strokeWidth: 1.75 } as const;

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

  const border = dark ? "rgba(148, 163, 184, 0.22)" : "rgba(148, 163, 184, 0.35)";
  const bg = dark ? "rgba(26, 26, 36, 0.9)" : "#ffffff";

  return (
    <div
      className={outfit.className}
      role="toolbar"
      aria-label="Acciones de estudio"
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "0.5rem",
        marginBottom: "0.7rem",
        padding: "0.15rem 0",
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
            gap: "0.5rem",
            padding: "0.55rem 1.05rem",
            borderRadius: 9999,
            border: `1px solid ${border}`,
            background: bg,
            color: SA_PRIMARY,
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.55 : 1,
            fontSize: "0.88rem",
            fontWeight: 600,
            boxShadow: dark ? "none" : "0 2px 8px rgba(15, 23, 42, 0.05)",
            transition: "background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease",
          }}
          onMouseEnter={(e) => {
            if (disabled) return;
            e.currentTarget.style.background = SA_PRIMARY_SOFT;
            e.currentTarget.style.borderColor = SA_PRIMARY;
            e.currentTarget.style.boxShadow = dark
              ? "none"
              : "0 4px 12px rgba(37, 150, 190, 0.15)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = bg;
            e.currentTarget.style.borderColor = border;
            e.currentTarget.style.boxShadow = dark
              ? "none"
              : "0 2px 8px rgba(15, 23, 42, 0.05)";
          }}
        >
          <span style={{ display: "inline-flex", lineHeight: 0 }} aria-hidden>
            {a.icon}
          </span>
          {a.label}
        </button>
      ))}
    </div>
  );
}
