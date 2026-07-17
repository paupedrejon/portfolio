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

  const dark = colorTheme === "dark";
  const chip = (active?: boolean) => ({
    display: "flex" as const,
    alignItems: "center" as const,
    gap: "0.4rem",
    padding: "0.55rem 1rem",
    borderRadius: 9999,
    cursor: "pointer" as const,
    fontSize: "0.85rem",
    fontWeight: 600,
    color: active || !dark ? "#2596be" : "#e2e8f0",
    background: active
      ? "rgba(37, 150, 190, 0.12)"
      : dark
        ? "rgba(26, 26, 36, 0.85)"
        : "#ffffff",
    border: `1px solid ${
      active
        ? "#2596be"
        : dark
          ? "rgba(148, 163, 184, 0.22)"
          : "rgba(148, 163, 184, 0.32)"
    }`,
    boxShadow: dark ? "none" : "0 2px 6px rgba(15, 23, 42, 0.05)",
  });

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        padding: "1rem 1.5rem",
        gap: "0.5rem",
        background:
          colorTheme === "dark"
            ? "rgba(26, 26, 36, 0.6)"
            : "rgba(255, 255, 255, 0.8)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: `1px solid ${colorTheme === "dark" ? "rgba(148, 163, 184, 0.15)" : "rgba(148, 163, 184, 0.25)"}`,
        flexWrap: "wrap",
        position: "relative",
        zIndex: 10,
        boxShadow:
          colorTheme === "dark"
            ? "0 2px 8px rgba(0, 0, 0, 0.1)"
            : "0 2px 8px rgba(0, 0, 0, 0.05)",
      }}
    >
      {sessionCostUsd > 0 && (
        <span
          style={{
            fontSize: "0.75rem",
            color: colorTheme === "dark" ? "#94a3b8" : "#64748b",
            padding: "0.35rem 0.65rem",
            borderRadius: "8px",
            background:
              colorTheme === "dark"
                ? "rgba(37, 150, 190, 0.08)"
                : "rgba(37, 150, 190, 0.06)",
          }}
          title="Coste estimado de esta sesión (BYOK)"
        >
          Sesión: ~${sessionCostUsd.toFixed(3)}
        </span>
      )}

      {isMounted && onToggleDocuments && (
        <button
          type="button"
          onClick={onToggleDocuments}
          title="Documentos indexados en este chat"
          style={chip(showDocuments)}
        >
          Docs{documentCount > 0 ? ` (${documentCount})` : ""}
        </button>
      )}

      {isMounted && onOpenStudyPlan && (
        <button
          type="button"
          onClick={onOpenStudyPlan}
          title="Generar plan de estudio adaptativo"
          style={chip(showStudyPlan)}
        >
          Plan
        </button>
      )}

      {isMounted && onOpenConcepts && (
        <button
          type="button"
          onClick={onOpenConcepts}
          title="Mapa de conceptos y dominio"
          style={chip(showConcepts)}
        >
          Conceptos
        </button>
      )}

      {isMounted && onOpenReview && (
        <button
          type="button"
          onClick={onOpenReview}
          title="Repaso spaced repetition (FSRS)"
          style={chip(showReview)}
        >
          Repaso
          {srsDueCount > 0 && (
            <span
              style={{
                minWidth: 18,
                height: 18,
                padding: "0 5px",
                borderRadius: 999,
                background: "#2596be",
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
          <HiKey size={16} color="#2596be" />
          {hasApiKey ? "API Key" : "Configurar API"}
        </button>
      )}

      {isMounted && (
        <>
          <span
            style={{
              fontSize: "0.875rem",
              color: colorTheme === "dark" ? "var(--text-secondary)" : "#4b5563",
              marginRight: "0.25rem",
              fontWeight: 500,
            }}
          >
            Modelo:
          </span>
          <div ref={modelDropdownRef} style={{ position: "relative", display: "inline-block" }}>
            <button
              type="button"
              onClick={onToggleModelDropdown}
              style={{
                ...chip(false),
                paddingRight: "1.75rem",
              }}
            >
              <span>{modelLabel}</span>
              <span
                style={{
                  fontSize: "0.625rem",
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
                  background:
                    colorTheme === "dark"
                      ? "rgba(26, 26, 36, 0.95)"
                      : "rgba(255, 255, 255, 0.95)",
                  backdropFilter: "blur(20px)",
                  borderRadius: "12px",
                  padding: "0.375rem",
                  minWidth: "300px",
                  maxHeight: "320px",
                  overflowY: "auto",
                  zIndex: 10000,
                  border: `1px solid ${colorTheme === "dark" ? "rgba(37, 150, 190, 0.2)" : "rgba(148, 163, 184, 0.2)"}`,
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
                        color: colorTheme === "dark" ? "#94a3b8" : "#64748b",
                      }}
                    >
                      {label}
                    </div>
                    {items.map((model: StudyModelOption) => {
                      const isSelected = selectedModel === model.value;
                      const isFree =
                        model.pricing.input === 0 && model.pricing.output === 0;
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
                            background: isSelected
                              ? colorTheme === "dark"
                                ? "rgba(37, 150, 190, 0.2)"
                                : "rgba(37, 150, 190, 0.15)"
                              : "transparent",
                            border: "none",
                            borderRadius: "8px",
                            color: colorTheme === "dark" ? "#e2e8f0" : "#1a1a24",
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
                              <div style={{ fontSize: "0.6875rem", color: "#94a3b8" }}>
                                {model.subtitle}
                              </div>
                            )}
                          </div>
                          <span style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                            {isFree ? (
                              <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#22c55e" }}>
                                Gratis
                              </span>
                            ) : (
                              price && (
                                <span style={{ fontSize: "0.65rem", color: "#94a3b8" }}>
                                  {price}/1k
                                </span>
                              )
                            )}
                            {isSelected && <HiCheck size={14} color="#6366f1" />}
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

      <span
        style={{
          fontSize: "0.875rem",
          color: colorTheme === "dark" ? "var(--text-secondary)" : "#4b5563",
          marginLeft: "1rem",
          fontWeight: 500,
        }}
      >
        Tema:
      </span>
      <button
        type="button"
        onClick={() => onSetColorTheme("dark")}
        title="Tema oscuro"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "48px",
          height: "48px",
          background:
            colorTheme === "dark"
              ? "rgba(37, 150, 190, 0.1)"
              : "rgba(37, 150, 190, 0.08)",
          borderRadius: "24px",
          border: "none",
          cursor: "pointer",
        }}
      >
        <MoonIcon size={18} />
      </button>
      <button
        type="button"
        onClick={() => onSetColorTheme("light")}
        title="Tema claro"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "48px",
          height: "48px",
          background:
            colorTheme === "light"
              ? "rgba(37, 150, 190, 0.1)"
              : "rgba(37, 150, 190, 0.08)",
          borderRadius: "24px",
          border: "none",
          cursor: "pointer",
        }}
      >
        <SunIcon size={18} />
      </button>
    </div>
  );
}
