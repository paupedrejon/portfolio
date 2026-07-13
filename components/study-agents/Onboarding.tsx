"use client";

import { useEffect, useState } from "react";
import { outfit, spaceGrotesk } from "@/app/fonts";
import { getStoredAPIKeys, openAPIKeyModal } from "@/lib/study-agents/api-keys";

const STORAGE_KEY = "sa_onboarding_done";

type Props = {
  onUploadClick?: () => void;
  onAskTestClick?: () => void;
};

export default function Onboarding({ onUploadClick, onAskTestClick }: Props) {
  const [visible, setVisible] = useState(false);
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const done = localStorage.getItem(STORAGE_KEY) === "1";
    setVisible(!done);
    setHasKey(!!getStoredAPIKeys()?.openai);

    const onKeys = () => setHasKey(!!getStoredAPIKeys()?.openai);
    window.addEventListener("apiKeysUpdated", onKeys);
    return () => window.removeEventListener("apiKeysUpdated", onKeys);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  };

  const steps = [
    {
      id: "api",
      title: "Configura tu API Key",
      desc: "Study Agents usa tu cuenta de OpenAI (BYOK). Los costes van a tu factura.",
      done: hasKey,
      action: () => openAPIKeyModal(),
      label: hasKey ? "Cambiar API Key" : "Configurar API",
    },
    {
      id: "upload",
      title: "Sube un PDF o pega una URL",
      desc: "El tutor usará tus documentos como contexto (RAG).",
      done: false,
      action: () => {
        onUploadClick?.();
        document.getElementById("study-chat-file-input")?.click();
      },
      label: "Subir documento",
    },
    {
      id: "test",
      title: "Pídele un test",
      desc: 'Escribe algo como: "Hazme un test de 5 preguntas sobre el documento".',
      done: false,
      action: () => onAskTestClick?.(),
      label: "Probar en el chat",
    },
  ];

  return (
    <div
      style={{
        position: "fixed",
        bottom: "1.25rem",
        right: "1.25rem",
        zIndex: 9998,
        maxWidth: "360px",
        background: "rgba(26, 26, 36, 0.97)",
        border: "1px solid rgba(99, 102, 241, 0.35)",
        borderRadius: "16px",
        padding: "1.25rem",
        boxShadow: "0 20px 50px rgba(0,0,0,0.45)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
        <h3 className={spaceGrotesk.className} style={{ margin: 0, fontSize: "1.1rem", color: "#f1f5f9" }}>
          Primeros pasos
        </h3>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Cerrar"
          style={{
            background: "transparent",
            border: "none",
            color: "#94a3b8",
            cursor: "pointer",
            fontSize: "1.25rem",
          }}
        >
          ×
        </button>
      </div>
      <p className={outfit.className} style={{ margin: "0 0 1rem", fontSize: "0.8rem", color: "#94a3b8" }}>
        Completa estos 3 pasos para sacar el máximo partido al tutor.
      </p>
      <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {steps.map((step, i) => (
          <li
            key={step.id}
            style={{
              display: "flex",
              gap: "0.75rem",
              alignItems: "flex-start",
              padding: "0.65rem",
              borderRadius: "10px",
              background: step.done ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.03)",
            }}
          >
            <span
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.75rem",
                fontWeight: 700,
                background: step.done ? "#22c55e" : "rgba(99,102,241,0.25)",
                color: step.done ? "#fff" : "#c7d2fe",
              }}
            >
              {step.done ? "✓" : i + 1}
            </span>
            <div style={{ flex: 1 }}>
              <div className={outfit.className} style={{ fontWeight: 600, fontSize: "0.85rem", color: "#e2e8f0" }}>
                {step.title}
              </div>
              <div className={outfit.className} style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: 2 }}>
                {step.desc}
              </div>
              {!step.done && (
                <button
                  type="button"
                  onClick={step.action}
                  style={{
                    marginTop: "0.5rem",
                    padding: "0.35rem 0.75rem",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    borderRadius: "8px",
                    border: "none",
                    cursor: "pointer",
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    color: "#fff",
                  }}
                >
                  {step.label}
                </button>
              )}
            </div>
          </li>
        ))}
      </ol>
      <button
        type="button"
        onClick={dismiss}
        className={outfit.className}
        style={{
          marginTop: "1rem",
          width: "100%",
          padding: "0.5rem",
          background: "transparent",
          border: "1px solid rgba(148,163,184,0.2)",
          borderRadius: "8px",
          color: "#94a3b8",
          cursor: "pointer",
          fontSize: "0.8rem",
        }}
      >
        Entendido, no volver a mostrar
      </button>
    </div>
  );
}
