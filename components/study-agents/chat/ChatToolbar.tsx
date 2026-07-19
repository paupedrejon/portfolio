"use client";

import { RefObject } from "react";
import { HiCheck, HiKey } from "react-icons/hi2";
import { MoonIcon, SunIcon } from "@/components/Icons";
import { formatCost } from "@/components/costCalculator";
import {
  STUDY_MODEL_OPTIONS,
  MODEL_GROUP_LABELS,
  getStudyModelOption,
  type StudyModelOption,
} from "@/lib/study-agents/models";
import {
  SA_PRIMARY,
  SA_PRIMARY_SOFT,
  SA_PRIMARY_BORDER,
} from "@/lib/study-agents/brand";
import "@/components/study-agents/study-agents-chat.css";

type Props = {
  colorTheme: "dark" | "light";
  isMounted: boolean;
  hasApiKey: boolean;
  onOpenApiKeyConfig: () => void;
  selectedModel: string;
  onSelectModel: (model: string) => void;
  showModelDropdown: boolean;
  onToggleModelDropdown: () => void;
  modelDropdownRef: RefObject<HTMLDivElement | null>;
  onSetColorTheme: (theme: "dark" | "light") => void;
  sessionCostUsd?: number;
  documentCount?: number;
  onToggleDocuments?: () => void;
  showDocuments?: boolean;
  onOpenStudyPlan?: () => void;
  onOpenConcepts?: () => void;
  onOpenReview?: () => void;
  showStudyPlan?: boolean;
  showConcepts?: boolean;
  showReview?: boolean;
  srsDueCount?: number;
  hideThemeToggle?: boolean;
};

export default function ChatToolbar({
  colorTheme,
  isMounted,
  hasApiKey,
  onOpenApiKeyConfig,
  selectedModel,
  onSelectModel,
  showModelDropdown,
  onToggleModelDropdown,
  modelDropdownRef,
  onSetColorTheme,
  sessionCostUsd = 0,
  documentCount = 0,
  onToggleDocuments,
  showDocuments = false,
  onOpenStudyPlan,
  onOpenConcepts,
  onOpenReview,
  showStudyPlan = false,
  showConcepts = false,
  showReview = false,
  srsDueCount = 0,
  hideThemeToggle = false,
}: Props) {
  const selected = getStudyModelOption(selectedModel);
  const modelLabel = selected
    ? selected.subtitle
      ? `${selected.label}`
      : selected.label
    : selectedModel;

  const grouped = (["auto", "chinese", "free", "openai"] as const).map((group) => ({
    group,
    label: MODEL_GROUP_LABELS[group],
    items: STUDY_MODEL_OPTIONS.filter((m) => m.group === group),
  }));

  const chip = (active?: boolean) => ({
    display: "inline-flex" as const,
    alignItems: "center" as const,
    gap: "0.35rem",
    padding: "0.5rem 0.95rem",
    borderRadius: 12,
    cursor: "pointer" as const,
    fontSize: "0.82rem",
    fontWeight: 600,
    color: "#ffffff",
    background: active ? "rgba(0, 217, 255, 0.14)" : "rgba(255, 255, 255, 0.04)",
    border: `1.5px solid ${active ? "#00d9ff" : "rgba(255, 255, 255, 0.28)"}`,
    boxShadow: active ? "0 0 18px rgba(0, 217, 255, 0.22)" : "none",
  });

  return (
    <div
      className="sa-chat-toolbar"
      style={{
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        padding: "1rem 1.5rem",
        gap: "0.5rem",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        flexWrap: "wrap",
        position: "relative",
        zIndex: 10,
      }}
    >
      {sessionCostUsd > 0 && (
        <span
          style={{
            fontSize: "0.75rem",
            color: "#e2e8f0",
            padding: "0.35rem 0.65rem",
            borderRadius: 999,
            background: SA_PRIMARY_SOFT,
            border: `1px solid ${SA_PRIMARY_BORDER}`,
          }}
          title="Coste estimado de esta sesión (BYOK)"
        >
          Sesión: ~${sessionCostUsd.toFixed(3)}
        </span>
      )}

      {isMounted && onToggleDocuments && (
        <button type="button" onClick={onToggleDocuments} title="Documentos indexados" style={chip(showDocuments)}>
          Docs{documentCount > 0 ? ` (${documentCount})` : ""}
        </button>
      )}

      {isMounted && onOpenStudyPlan && (
        <button type="button" onClick={onOpenStudyPlan} title="Plan de estudio" style={chip(showStudyPlan)}>
          Plan
        </button>
      )}

      {isMounted && onOpenConcepts && (
        <button type="button" onClick={onOpenConcepts} title="Mapa de conceptos" style={chip(showConcepts)}>
          Conceptos
        </button>
      )}

      {isMounted && onOpenReview && (
        <button type="button" onClick={onOpenReview} title="Repaso FSRS" style={chip(showReview)}>
          Repaso
          {srsDueCount > 0 && (
            <span
              style={{
                minWidth: 18,
                height: 18,
                padding: "0 5px",
                borderRadius: 999,
                background: SA_PRIMARY,
                color: "#fff",
                fontSize: "0.65rem",
                fontWeight: 800,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {srsDueCount > 99 ? "99+" : srsDueCount}
            </span>
          )}
        </button>
      )}

      {isMounted && (
        <button
          type="button"
          onClick={onOpenApiKeyConfig}
          title={hasApiKey ? "Cambiar API keys" : "Configurar API keys"}
          style={chip(hasApiKey)}
        >
          <HiKey size={16} color="#00d9ff" />
          <span style={{ color: "#ffffff" }}>{hasApiKey ? "API Key" : "Configurar API"}</span>
        </button>
      )}

      {isMounted && (
        <>
          <span style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.72)", marginRight: "0.25rem", fontWeight: 500 }}>
            Modelo:
          </span>
          <div ref={modelDropdownRef} style={{ position: "relative", display: "inline-block" }}>
            <button type="button" onClick={onToggleModelDropdown} style={{ ...chip(false), paddingRight: "1.75rem" }}>
              <span style={{ color: "#ffffff" }}>{modelLabel}</span>
              <span
                style={{
                  fontSize: "0.625rem",
                  color: "#ffffff",
                  transform: showModelDropdown ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s ease",
                }}
              >
                ▼
              </span>
            </button>

            {showModelDropdown && (
              <div
                className="model-dropdown-scroll"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                style={{
                  position: "absolute",
                  top: "calc(100% + 0.5rem)",
                  left: 0,
                  background: "#041018",
                  backdropFilter: "blur(20px)",
                  borderRadius: 12,
                  padding: "0.375rem",
                  minWidth: 300,
                  maxHeight: 320,
                  overflowY: "auto",
                  zIndex: 10000,
                  border: "1px solid rgba(255,255,255,0.16)",
                  boxShadow: "0 16px 40px rgba(0, 0, 0, 0.45)",
                }}
              >
                {grouped.map(({ group, label, items }) => (
                  <div key={group}>
                    <div
                      style={{
                        padding: "0.4rem 0.75rem 0.25rem",
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.55)",
                      }}
                    >
                      {label}
                    </div>
                    {items.map((model: StudyModelOption) => {
                      const isSelected = selectedModel === model.value;
                      const isFree = model.pricing.input === 0 && model.pricing.output === 0;
                      const price = !isFree
                        ? formatCost(model.pricing.input + model.pricing.output)
                        : null;
                      return (
                        <button
                          key={model.value}
                          type="button"
                          onClick={() => onSelectModel(model.value)}
                          style={{
                            width: "100%",
                            padding: "0.5rem 0.75rem",
                            background: isSelected ? SA_PRIMARY_SOFT : "transparent",
                            border: "none",
                            borderRadius: 8,
                            color: "#f1f5f9",
                            fontSize: "0.8125rem",
                            fontWeight: isSelected ? 600 : 500,
                            cursor: "pointer",
                            textAlign: "left",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "0.5rem",
                          }}
                        >
                          <div>
                            <div>{model.label}</div>
                            {model.subtitle && (
                              <div style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.5)" }}>{model.subtitle}</div>
                            )}
                          </div>
                          <span style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                            {isFree ? (
                              <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#4ade80" }}>Gratis</span>
                            ) : (
                              price && <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.5)" }}>{price}/1k</span>
                            )}
                            {isSelected && <HiCheck size={14} color="#00d9ff" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {!hideThemeToggle && (
        <>
          <span style={{ fontSize: "0.875rem", color: "#64748b", marginLeft: "1rem", fontWeight: 500 }}>
            Tema:
          </span>
          <button
            type="button"
            onClick={() => onSetColorTheme("dark")}
            title="Tema oscuro"
            className="sa-chip"
            style={{
              width: 44,
              height: 44,
              padding: 0,
              justifyContent: "center",
              background: colorTheme === "dark" ? SA_PRIMARY_SOFT : "#fff",
              borderColor: colorTheme === "dark" ? SA_PRIMARY : SA_PRIMARY_BORDER,
            }}
          >
            <MoonIcon size={18} />
          </button>
          <button
            type="button"
            onClick={() => onSetColorTheme("light")}
            title="Tema claro"
            className="sa-chip"
            style={{
              width: 44,
              height: 44,
              padding: 0,
              justifyContent: "center",
              background: colorTheme === "light" ? SA_PRIMARY_SOFT : "#fff",
              borderColor: colorTheme === "light" ? SA_PRIMARY : SA_PRIMARY_BORDER,
            }}
          >
            <SunIcon size={18} />
          </button>
        </>
      )}
    </div>
  );
}
