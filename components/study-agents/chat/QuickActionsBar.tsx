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
import {
  SA_PRIMARY,
  SA_CYAN,
} from "@/lib/study-agents/brand";
import "@/components/study-agents/study-agents-chat.css";

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

/** Pills estilo home sobre canvas blanco. */
export default function QuickActionsBar({
  colorTheme: _colorTheme,
  disabled,
  onStudyPlan,
  onNotes,
  onTest,
  onConcepts,
  onReview,
  srsDueCount = 0,
}: Props) {
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
          className="sa-btn sa-btn--ghost sa-btn--pill"
          style={{
            minHeight: "2.5rem",
            padding: "0.55rem 1.05rem",
            color: SA_PRIMARY,
            opacity: disabled ? 0.55 : 1,
            cursor: disabled ? "not-allowed" : "pointer",
          }}
          onMouseEnter={(e) => {
            if (disabled) return;
            e.currentTarget.style.background = SA_CYAN;
            e.currentTarget.style.borderColor = SA_CYAN;
            e.currentTarget.style.color = "#041018";
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 8px 20px rgba(0, 217, 255, 0.28)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#ffffff";
            e.currentTarget.style.borderColor = "rgba(53, 140, 159, 0.4)";
            e.currentTarget.style.color = SA_PRIMARY;
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(15, 23, 42, 0.04)";
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
