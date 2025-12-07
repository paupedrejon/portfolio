"use client";

import { useState, useEffect } from "react";
import { spaceGrotesk, outfit, jetbrainsMono } from "../app/fonts";

interface APIKeys {
  openai: string;
  [key: string]: string;
}

interface APIKeyConfigProps {
  onKeysConfigured: (keys: APIKeys) => void;
  onClose: () => void;
}

export default function APIKeyConfig({ onKeysConfigured, onClose }: APIKeyConfigProps) {
  const [keys, setKeys] = useState<APIKeys>({
    openai: "",
  });
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({
    openai: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cargar keys guardadas
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("study_agents_api_keys");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setKeys(parsed);
        } catch (e) {
          console.error("Error loading API keys:", e);
        }
      }
    }
  }, []);

  const handleKeyChange = (service: string, value: string) => {
    setKeys((prev) => ({ ...prev, [service]: value }));
    // Limpiar error cuando el usuario empieza a escribir
    if (errors[service]) {
      setErrors((prev) => ({ ...prev, [service]: "" }));
    }
  };

  const validateKey = (service: string, key: string): boolean => {
    switch (service) {
      case "openai":
        return key.startsWith("sk-") && key.length > 20;
      default:
        return key.length > 0;
    }
  };

  const handleSave = () => {
    const newErrors: Record<string, string> = {};

    // Validar OpenAI (requerido)
    if (!keys.openai || !validateKey("openai", keys.openai)) {
      newErrors.openai = "La API key de OpenAI debe comenzar con 'sk-' y tener al menos 20 caracteres";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Guardar en localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("study_agents_api_keys", JSON.stringify(keys));
    }

    // Notificar al componente padre
    onKeysConfigured(keys);
    onClose();
  };

  const toggleShowKey = (service: string) => {
    setShowKeys((prev) => ({ ...prev, [service]: !prev[service] }));
  };

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
        zIndex: 1000,
        padding: "1rem",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
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
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2
            className={spaceGrotesk.className}
            style={{
              fontSize: "1.75rem",
              fontWeight: 700,
              color: "var(--text-primary)",
              margin: 0,
            }}
          >
            🔐 Configuración de API Keys
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-secondary)",
              cursor: "pointer",
              padding: "0.5rem",
              borderRadius: "8px",
              fontSize: "1.5rem",
              lineHeight: 1,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(148, 163, 184, 0.1)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            ×
          </button>
        </div>

        {/* Warning */}
        <div
          style={{
            padding: "1rem",
            background: "rgba(245, 158, 11, 0.1)",
            border: "1px solid rgba(245, 158, 11, 0.3)",
            borderRadius: "12px",
            marginBottom: "1.5rem",
          }}
        >
          <p
            className={outfit.className}
            style={{
              margin: 0,
              fontSize: "0.875rem",
              color: "#fbbf24",
              lineHeight: 1.6,
            }}
          >
            ⚠️ <strong>Importante:</strong> Estas API keys se guardan solo en tu navegador (localStorage).
            Nunca las compartas. Los costos de uso correrán por tu cuenta.
          </p>
        </div>

        {/* OpenAI API Key */}
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
          <p
            className={outfit.className}
            style={{
              fontSize: "0.75rem",
              color: "var(--text-secondary)",
              marginBottom: "0.75rem",
              lineHeight: 1.5,
            }}
          >
            Requerida para usar ChatGPT. Obtén tu key en{" "}
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "#6366f1",
                textDecoration: "underline",
              }}
            >
              platform.openai.com/api-keys
            </a>
            . Costo aproximado: $0.01-0.06 por 1000 tokens.
          </p>
          <div style={{ position: "relative" }}>
            <input
              type={showKeys.openai ? "text" : "password"}
              value={keys.openai}
              onChange={(e) => handleKeyChange("openai", e.target.value)}
              placeholder="sk-..."
              style={{
                width: "100%",
                padding: "0.875rem 3rem 0.875rem 1rem",
                background: "rgba(26, 26, 36, 0.8)",
                border: errors.openai
                  ? "1px solid rgba(239, 68, 68, 0.5)"
                  : "1px solid rgba(148, 163, 184, 0.2)",
                borderRadius: "10px",
                color: "var(--text-primary)",
                fontSize: "0.875rem",
                fontFamily: "var(--font-mono)",
                transition: "all 0.2s",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.5)";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = errors.openai
                  ? "rgba(239, 68, 68, 0.5)"
                  : "rgba(148, 163, 184, 0.2)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
            <button
              type="button"
              onClick={() => toggleShowKey("openai")}
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
              {showKeys.openai ? (
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
          </div>
          {errors.openai && (
            <p
              className={outfit.className}
              style={{
                fontSize: "0.75rem",
                color: "#ef4444",
                marginTop: "0.5rem",
                marginBottom: 0,
              }}
            >
              {errors.openai}
            </p>
          )}
        </div>

        {/* Info sobre costos */}
        <div
          style={{
            padding: "1rem",
            background: "rgba(99, 102, 241, 0.1)",
            border: "1px solid rgba(99, 102, 241, 0.2)",
            borderRadius: "12px",
            marginBottom: "1.5rem",
          }}
        >
          <h3
            className={outfit.className}
            style={{
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "#6366f1",
              marginTop: 0,
              marginBottom: "0.5rem",
            }}
          >
            💰 Información de Costos
          </h3>
          <ul
            className={outfit.className}
            style={{
              fontSize: "0.75rem",
              color: "var(--text-secondary)",
              margin: 0,
              paddingLeft: "1.25rem",
              lineHeight: 1.6,
            }}
          >
            <li>GPT-4: ~$0.03 por 1000 tokens de entrada, ~$0.06 por 1000 tokens de salida</li>
            <li>GPT-3.5-turbo: ~$0.0015 por 1000 tokens (mucho más barato)</li>
            <li>Una pregunta típica puede usar 500-2000 tokens</li>
            <li>Un documento PDF puede generar 10,000-50,000 tokens</li>
          </ul>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
          <button
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
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(148, 163, 184, 0.1)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            Cancelar
          </button>
          <button
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
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(99, 102, 241, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            Guardar y Continuar
          </button>
        </div>
      </div>
    </div>
  );
}

