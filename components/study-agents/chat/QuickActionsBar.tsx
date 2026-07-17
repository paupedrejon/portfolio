"use client";

import { outfit } from "@/app/fonts";

type Action = {
  id: string;
  label: string;
  hint: string;
  onClick: () => void;
  accent: string;
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
  const actions: Action[] = [
    {
      id: "plan",
      label: "Plan de estudio",
      hint: "Calendario adaptativo",
      onClick: onStudyPlan,
      accent: "#6366f1",
    },
    {
      id: "concepts",
      label: "Conceptos",
      hint: "Qué dominas / qué no",
      onClick: onConcepts,
      accent: "#06b6d4",
    },
    {
      id: "notes",
      label: "Apuntes",
      hint: "Resumen del material",
      onClick: onNotes,
      accent: "#8b5cf6",
    },
    {
      id: "test",
      label: "Test",
      hint: "Retrieval practice",
      onClick: onTest,
      accent: "#f59e0b",
    },
  ];

  if (onReview) {
    actions.splice(2, 0, {
      id: "review",
      label: srsDueCount > 0 ? `Repaso (${srsDueCount})` : "Repaso",
      hint: "Spaced repetition",
      onClick: onReview,
      accent: "#ea580c",
    });
  }

  return (
    <div
      className={outfit.className}
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "0.5rem",
        marginBottom: "0.65rem",
        padding: "0 0.15rem",
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
            flexDirection: "column",
            alignItems: "flex-start",
            gap: 2,
            padding: "0.45rem 0.75rem",
            borderRadius: 10,
            border: `1px solid ${a.accent}55`,
            background: dark ? `${a.accent}18` : `${a.accent}12`,
            color: dark ? "#e2e8f0" : "#1e293b",
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.55 : 1,
            minWidth: 0,
            flex: "1 1 140px",
            textAlign: "left",
          }}
        >
          <span style={{ fontSize: "0.8rem", fontWeight: 700 }}>{a.label}</span>
          <span style={{ fontSize: "0.65rem", color: dark ? "#94a3b8" : "#64748b" }}>
            {a.hint}
          </span>
        </button>
      ))}
    </div>
  );
}
