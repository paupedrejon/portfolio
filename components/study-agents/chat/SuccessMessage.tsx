"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { StarIcon } from "@/components/Icons";
import UploadSuccessCard from "@/components/study-agents/chat/UploadSuccessCard";

type Props = {
  data: unknown;
  colorTheme?: "dark" | "light";
  onNotes?: () => void;
  onAsk?: () => void;
  onTest?: () => void;
};

/**
 * Mensaje de éxito: level-up o card post-upload (F0.1 — extraído de StudyChat).
 */
export default function SuccessMessage({
  data,
  colorTheme = "dark",
  onNotes,
  onAsk,
  onTest,
}: Props) {
  let isLevelUpMessage = false;
  let messageContent = "";

  if (typeof data === "string") {
    messageContent = data;
    isLevelUpMessage =
      data.includes("Felicitaciones") ||
      data.includes("Felicidades") ||
      data.includes("felicidades") ||
      data.includes("subido al nivel") ||
      data.includes("subido") ||
      data.includes("🎉") ||
      data.includes("niveles") ||
      data.includes("puntos de experiencia");
  }

  if (isLevelUpMessage) {
    const bgColor =
      colorTheme === "dark"
        ? "linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(245, 158, 11, 0.1))"
        : "linear-gradient(135deg, rgba(251, 191, 36, 0.12), rgba(245, 158, 11, 0.08))";
    const borderColor =
      colorTheme === "dark" ? "rgba(251, 191, 36, 0.4)" : "rgba(251, 191, 36, 0.5)";
    const textColor = colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24";

    return (
      <div
        style={{
          background: bgColor,
          borderRadius: "20px",
          padding: "2.5rem",
          border: `2px solid ${borderColor}`,
          boxShadow:
            colorTheme === "dark"
              ? "0 8px 32px rgba(251, 191, 36, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
              : "0 8px 32px rgba(251, 191, 36, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            marginBottom: "2rem",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 4px 16px rgba(251, 191, 36, 0.4)",
            }}
          >
            <StarIcon size={32} color="white" />
          </div>
          <div style={{ textAlign: "center" }}>
            <h2
              style={{
                margin: 0,
                fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
                fontWeight: 700,
                color: textColor,
                marginBottom: "0.5rem",
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
                background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              ¡Felicitaciones!
            </h2>
          </div>
        </div>

        <div
          style={{
            lineHeight: 1.8,
            color: textColor,
            fontSize: "1.1rem",
          }}
          className="message-content"
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ ...props }) => (
                <h1
                  {...props}
                  style={{
                    textDecoration: "none",
                    borderBottom: "none",
                    fontSize: "1.5rem",
                    marginTop: "1rem",
                    marginBottom: "0.5rem",
                  }}
                />
              ),
              h2: ({ ...props }) => (
                <h2
                  {...props}
                  style={{
                    textDecoration: "none",
                    borderBottom: "none",
                    fontSize: "1.3rem",
                    marginTop: "1rem",
                    marginBottom: "0.5rem",
                  }}
                />
              ),
              h3: ({ ...props }) => (
                <h3
                  {...props}
                  style={{
                    textDecoration: "none",
                    borderBottom: "none",
                    fontSize: "1.2rem",
                    marginTop: "1rem",
                    marginBottom: "0.5rem",
                  }}
                />
              ),
              strong: ({ ...props }) => (
                <strong
                  {...props}
                  style={{
                    textDecoration: "none !important",
                    borderBottom: "none !important",
                    fontWeight: 700,
                    color: "#fbbf24",
                  }}
                />
              ),
              p: ({ ...props }) => (
                <p
                  {...props}
                  style={{
                    margin: "1rem 0",
                    textDecoration: "none",
                    fontSize: "1.1rem",
                  }}
                />
              ),
              li: ({ ...props }) => (
                <li
                  {...props}
                  style={{
                    textDecoration: "none",
                    marginBottom: "0.5rem",
                    fontSize: "1.05rem",
                  }}
                />
              ),
              ul: ({ ...props }) => (
                <ul {...props} style={{ margin: "1rem 0", paddingLeft: "1.5rem" }} />
              ),
            }}
          >
            {messageContent}
          </ReactMarkdown>
        </div>
      </div>
    );
  }

  let successData: unknown;

  try {
    if (typeof data === "string") {
      const trimmed = data.trim();
      if (
        (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
        (trimmed.startsWith("[") && trimmed.endsWith("]"))
      ) {
        successData = JSON.parse(data);
      } else {
        console.warn("SuccessMessage: data is string but not JSON, treating as plain text");
        return null;
      }
    } else if (typeof data === "object" && data !== null) {
      successData = data;
    } else {
      throw new Error("Invalid success data");
    }
  } catch (error) {
    console.error("Error parsing success data", error);
    return null;
  }

  const fileNames = Array.isArray((successData as { fileNames?: unknown }).fileNames)
    ? ((successData as { fileNames?: string[] }).fileNames ?? [])
    : [];

  return (
    <UploadSuccessCard
      fileNames={fileNames}
      colorTheme={colorTheme}
      onNotes={onNotes}
      onAsk={onAsk}
      onTest={onTest}
    />
  );
}
