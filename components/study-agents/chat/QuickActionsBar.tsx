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

/** Acciones rápidas: ghost home (12px, hover cyan). */
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
  const iconProps = { size: 18, strokeWidth: 1.75 } as const;

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
        gap: "0.55rem",
        marginBottom: "0.85rem",
      }}
    >
      {actions.map((a) => (
        <button
          key={a.id}
          type="button"
          disabled={disabled}
          onClick={a.onClick}
          title={a.hint}
          className="sa-btn sa-btn--ghost"
          style={{
            minHeight: "2.55rem",
            padding: "0.55rem 1.1rem",
            fontSize: "0.88rem",
            opacity: disabled ? 0.5 : 1,
            cursor: disabled ? "not-allowed" : "pointer",
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
