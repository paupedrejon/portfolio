"use client";

import { useState } from "react";

export type HintStep = {
  type: "file" | "code" | "tip" | "action";
  text: string;
  path?: string;
  code?: string;
};

type Props = {
  steps: HintStep[];
  fallback?: string;
};

const ICONS: Record<HintStep["type"], string> = {
  file: "📄",
  code: "⌨️",
  tip: "💡",
  action: "👉",
};

export default function StepHintPanel({ steps, fallback }: Props) {
  const [copied, setCopied] = useState<string | null>(null);

  if (!steps?.length) {
    if (!fallback) return null;
    return <p className="cursos-hint-fallback">{fallback}</p>;
  }

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <ul className="cursos-hint-steps">
      {steps.map((step, i) => (
        <li key={i} className={`cursos-hint-step cursos-hint-step--${step.type}`}>
          <span className="cursos-hint-step__icon" aria-hidden>
            {ICONS[step.type]}
          </span>
          <div className="cursos-hint-step__body">
            <p className="cursos-hint-step__text">{step.text}</p>
            {step.path && (
              <code className="cursos-hint-step__path">{step.path}</code>
            )}
            {step.code && (
              <div className="cursos-hint-step__code-wrap">
                <pre className="cursos-hint-step__code">
                  <code>{step.code}</code>
                </pre>
                <button
                  type="button"
                  className="cursos-hint-step__copy"
                  onClick={() => copyCode(step.code!)}
                >
                  {copied === step.code ? "✓" : "Copiar"}
                </button>
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
