"use client";

import { useState, useEffect } from "react";
import { HiKey } from "react-icons/hi2";
import { spaceGrotesk, outfit } from "../app/fonts";
import {
  getStoredAPIKeys,
  isValidOpenAIKey,
  isValidOptionalKey,
  saveAPIKeys,
  type StudyAgentsAPIKeys,
} from "@/lib/study-agents/api-keys";

interface APIKeys extends StudyAgentsAPIKeys {
  [key: string]: string | undefined;
}

interface APIKeyConfigProps {
  onKeysConfigured: (keys: APIKeys) => void;
  onClose: () => void;
}

type OptionalField = {
  id: keyof StudyAgentsAPIKeys;
  label: string;
  hint: string;
  href: string;
  hrefLabel: string;
  placeholder: string;
};

const OPTIONAL_FIELDS: OptionalField[] = [
  {
    id: "deepseek",
    label: "DeepSeek API Key",
    hint: "Modelos chinos DeepSeek Chat / Reasoner (muy baratos).",
    href: "https://platform.deepseek.com/api_keys",
    hrefLabel: "platform.deepseek.com",
    placeholder: "sk-...",
  },
  {
    id: "groq",
    label: "Groq API Key",
    hint: "Llama 3.3 y Gemma con tier gratuito.",
    href: "https://console.groq.com/keys",
    hrefLabel: "console.groq.com",
    placeholder: "gsk_...",
  },
  {
    id: "openrouter",
    label: "OpenRouter API Key",
    hint: "Qwen, GLM, DeepSeek y Llama en modo gratis.",
    href: "https://openrouter.ai/keys",
    hrefLabel: "openrouter.ai/keys",
    placeholder: "sk-or-...",
  },
];

export default function APIKeyConfig({ onKeysConfigured, onClose }: APIKeyConfigProps) {
  const [keys, setKeys] = useState<APIKeys>({
    openai: "",
    deepseek: "",
    groq: "",
    openrouter: "",
  });
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({
    openai: false,
    deepseek: false,
    groq: false,
    openrouter: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const stored = getStoredAPIKeys();
    if (stored) {
      setKeys({
        openai: stored.openai || "",
        deepseek: stored.deepseek || "",
        groq: stored.groq || "",
        openrouter: stored.openrouter || "",
      });
    }
  }, []);

  const handleKeyChange = (service: string, value: string) => {
    setKeys((prev) => ({ ...prev, [service]: value }));
    if (errors[service]) {
      setErrors((prev) => ({ ...prev, [service]: "" }));
    }
  };

  const handleSave = () => {
    const newErrors: Record<string, string> = {};
    const trimmedOpenAI = keys.openai.trim();

    if (!trimmedOpenAI || !isValidOpenAIKey(trimmedOpenAI)) {
      newErrors.openai =
        "La API key de OpenAI debe comenzar con 'sk-' y tener al menos 20 caracteres (necesaria para embeddings/RAG).";
    }

    for (const field of OPTIONAL_FIELDS) {
      const val = (keys[field.id] || "").trim();
      if (val && !isValidOptionalKey(val)) {
        newErrors[field.id] = "Key demasiado corta";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const normalized: StudyAgentsAPIKeys = { openai: trimmedOpenAI };
    for (const field of OPTIONAL_FIELDS) {
      const val = (keys[field.id] || "").trim();
      if (val) normalized[field.id] = val;
    }
    saveAPIKeys(normalized);
    onKeysConfigured(normalized);
    onClose();
  };

  const toggleShowKey = (service: string) => {
    setShowKeys((prev) => ({ ...prev, [service]: !prev[service] }));
  };

  const renderKeyInput = (
    id: string,
    value: string,
    placeholder: string,
    error?: string,
  ) => (
    <div style={{ position: "relative" }}>
      <input
        type={showKeys[id] ? "text" : "password"}
        value={value}
        onChange={(e) => handleKeyChange(id, e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "0.875rem 3rem 0.875rem 1rem",
          background: "rgba(26, 26, 36, 0.8)",
          border: error
            ? "1px solid rgba(239, 68, 68, 0.5)"
            : "1px solid rgba(148, 163, 184, 0.2)",
          borderRadius: "10px",
          color: "var(--text-primary)",
          fontSize: "0.875rem",
          fontFamily: "var(--font-mono)",
          boxSizing: "border-box",
        }}
      />
      <button
        type="button"
        onClick={() => toggleShowKey(id)}
        aria-label={showKeys[id] ? "Ocultar key" : "Mostrar key"}
        style={{
          position: "absolute",
          right: "0.75rem",
          top: "50%",
          transform: "translateY(-50%)",
          background: "transparent",
          border: "none",
          color: "var(--text-secondary)",
          cursor: "pointer",
          padding: "0.25rem",
          display: "flex",
          alignItems: "center",
        }}
      >
        {showKeys[id] ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
      {error && (
        <p className={outfit.className} style={{ fontSize: "0.75rem", color: "#ef4444", marginTop: "0.5rem" }}>
          {error}
        </p>
      )}
    </div>
  );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.8)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        padding: "1rem",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "rgba(26, 26, 36, 0.95)",
          border: "1px solid rgba(148, 163, 184, 0.2)",
          borderRadius: "24px",
          padding: "2rem",
          maxWidth: "600px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2
            className={spaceGrotesk.className}
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "var(--text-primary)",
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <HiKey size={22} color="#a5b4fc" />
            Configuración de API Keys
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-secondary)",
              cursor: "pointer",
              padding: "0.5rem",
              fontSize: "1.5rem",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            padding: "1rem",
            background: "rgba(245, 158, 11, 0.1)",
            border: "1px solid rgba(245, 158, 11, 0.3)",
            borderRadius: "12px",
            marginBottom: "1.5rem",
          }}
        >
          <p className={outfit.className} style={{ margin: 0, fontSize: "0.875rem", color: "#fbbf24", lineHeight: 1.6 }}>
            <strong>Importante:</strong> Las keys se guardan solo en tu navegador (localStorage).
            OpenAI sigue siendo necesaria para embeddings/RAG; DeepSeek, Groq y OpenRouter son opcionales
            para chat con modelos chinos o gratuitos.
          </p>
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label
            className={outfit.className}
            style={{
              display: "block",
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: "0.5rem",
            }}
          >
            OpenAI API Key <span style={{ color: "#ef4444" }}>*</span>
          </label>
          <p className={outfit.className} style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
            Requerida para indexar PDFs. Obtén tu key en{" "}
            <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" style={{ color: "#6366f1" }}>
              platform.openai.com/api-keys
            </a>
            .
          </p>
          {renderKeyInput("openai", keys.openai, "sk-...", errors.openai)}
        </div>

        <h3
          className={outfit.className}
          style={{ fontSize: "0.9rem", fontWeight: 700, color: "#c4b5fd", margin: "0 0 1rem" }}
        >
          Alternativas (opcionales)
        </h3>

        {OPTIONAL_FIELDS.map((field) => (
          <div key={field.id} style={{ marginBottom: "1.25rem" }}>
            <label
              className={outfit.className}
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: "0.35rem",
              }}
            >
              {field.label} <span style={{ color: "#94a3b8", fontWeight: 500 }}>(opcional)</span>
            </label>
            <p className={outfit.className} style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.65rem" }}>
              {field.hint}{" "}
              <a href={field.href} target="_blank" rel="noopener noreferrer" style={{ color: "#6366f1" }}>
                {field.hrefLabel}
              </a>
            </p>
            {renderKeyInput(field.id, keys[field.id] || "", field.placeholder, errors[field.id])}
          </div>
        ))}

        <div
          style={{
            padding: "1rem",
            background: "rgba(99, 102, 241, 0.1)",
            border: "1px solid rgba(99, 102, 241, 0.2)",
            borderRadius: "12px",
            marginBottom: "1.5rem",
          }}
        >
          <h3 className={outfit.className} style={{ fontSize: "0.875rem", fontWeight: 600, color: "#6366f1", marginTop: 0 }}>
            Costes orientativos
          </h3>
          <ul className={outfit.className} style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: 0, paddingLeft: "1.25rem", lineHeight: 1.6 }}>
            <li>OpenRouter / Groq free: 0$ en el tier gratuito</li>
            <li>DeepSeek Chat: ~$0.14 / $0.28 por millón de tokens</li>
            <li>GPT-4o mini: barato; GPT-5: premium</li>
          </ul>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "0.75rem 1.5rem",
              background: "transparent",
              border: "1px solid rgba(148, 163, 184, 0.2)",
              borderRadius: "10px",
              color: "var(--text-secondary)",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: 600,
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            style={{
              padding: "0.75rem 1.5rem",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              border: "none",
              borderRadius: "10px",
              color: "white",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: 600,
            }}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
