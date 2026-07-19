"use client";

import { useMemo, useState } from "react";
import { outfit, spaceGrotesk } from "@/app/fonts";
import StudyAgentsBotAvatar from "@/components/study-agents/StudyAgentsBotAvatar";
import { SA_PRIMARY, SA_BOT_FACE } from "@/lib/study-agents/brand";
import "@/components/study-agents/study-agents-chat.css";
import "@/components/study-agents/study-agents-bot.css";

export type InteractiveStep = {
  id: string;
  title: string;
  body?: string;
};

type Props = {
  title: string;
  subtitle?: string;
  steps: InteractiveStep[];
  colorTheme?: "dark" | "light";
  onComplete?: () => void;
  completeLabel?: string;
};

/**
 * Pasos interactivos estilo “una cosa a la vez” (dopamina / Duolingo-lite).
 */
export default function InteractiveSteps({
  title,
  subtitle,
  steps,
  onComplete,
  completeLabel = "Listo",
}: Props) {
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);
  const safe = steps.length ? steps : [{ id: "empty", title: "Sin pasos" }];
  const current = safe[Math.min(index, safe.length - 1)];
  const progress = useMemo(
    () => ((done ? safe.length : index) / safe.length) * 100,
    [done, index, safe.length],
  );

  const next = () => {
    if (index >= safe.length - 1) {
      setDone(true);
      onComplete?.();
      return;
    }
    setIndex((i) => i + 1);
  };

  return (
    <div className={`${outfit.className} sa-steps-card sa-pop`}>
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
        <StudyAgentsBotAvatar size={36} color={SA_BOT_FACE} state={done ? "idle" : "thinking"} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <h3
            className={spaceGrotesk.className}
            style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "#0f172a" }}
          >
            {title}
          </h3>
          {subtitle && (
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem", color: "#64748b", lineHeight: 1.4 }}>
              {subtitle}
            </p>
          )}
        </div>
        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: SA_PRIMARY, whiteSpace: "nowrap" }}>
          {done ? "✓" : `${index + 1}/${safe.length}`}
        </span>
      </div>

      <div className="sa-steps-progress" aria-hidden>
        <span style={{ width: `${Math.max(8, progress)}%` }} />
      </div>

      {done ? (
        <div className="sa-pop">
          <p
            className={spaceGrotesk.className}
            style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "#0f172a" }}
          >
            ¡Hecho!
          </p>
          <p style={{ margin: "0.4rem 0 0", color: "#64748b", fontSize: "0.9rem", lineHeight: 1.5 }}>
            Siguiente hit de dopamina: abre <strong>Repaso</strong> o lanza un test corto.
          </p>
        </div>
      ) : (
        <div key={current.id} className="sa-pop">
          <p
            className={spaceGrotesk.className}
            style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "#0f172a", lineHeight: 1.3 }}
          >
            {current.title}
          </p>
          {current.body && (
            <p style={{ margin: "0.55rem 0 0", color: "#475569", fontSize: "0.92rem", lineHeight: 1.55 }}>
              {current.body}
            </p>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: "0.6rem", marginTop: "1.25rem" }}>
        {!done && index > 0 && (
          <button type="button" className="sa-btn sa-btn--ghost" onClick={() => setIndex((i) => i - 1)}>
            Atrás
          </button>
        )}
        <button
          type="button"
          className="sa-btn sa-btn--primary"
          style={{ flex: 1 }}
          onClick={() => {
            if (done) {
              setDone(false);
              setIndex(0);
              return;
            }
            next();
          }}
        >
          {done ? "Repetir pasos" : index >= safe.length - 1 ? completeLabel : "Siguiente →"}
        </button>
      </div>
    </div>
  );
}

/** Extrae pasos del calendario de un plan Markdown. */
export function stepsFromPlanMarkdown(plan: string, topic: string): InteractiveStep[] {
  const lines = plan.split(/\r?\n/);
  const found: InteractiveStep[] = [];
  const dayRe = /^(?:#{1,3}\s*)?(?:\*\*)?(?:día|dia)\s*(\d+)\s*[:.\-]?\s*(.*?)(?:\*\*)?$/i;

  for (const raw of lines) {
    const line = raw.trim();
    const m = line.match(dayRe);
    if (!m) continue;
    const day = m[1];
    const rest = (m[2] || "").replace(/\*+/g, "").trim();
    found.push({
      id: `day-${day}`,
      title: `Día ${day}${rest ? `: ${rest.slice(0, 80)}` : ""}`,
      body: rest.length > 80 ? rest : undefined,
    });
    if (found.length >= 10) break;
  }

  if (found.length >= 2) return found;

  return [
    {
      id: "1",
      title: `Enfócate en ${topic || "tu tema"}`,
      body: "Hoy: 10 min de repaso + 1 micro-test. Retrieval practice > releer.",
    },
    {
      id: "2",
      title: "Cierra un gap débil",
      body: "Abre Conceptos, elige uno en rojo/naranja y practícalo con un ejercicio.",
    },
    {
      id: "3",
      title: "Repasa con FSRS",
      body: "Cuando falles preguntas, las tarjetas nacen solas. Ábrelo en Repaso.",
    },
  ];
}
