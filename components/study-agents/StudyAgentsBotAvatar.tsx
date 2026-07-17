"use client";

import { SA_PRIMARY } from "@/lib/study-agents/brand";

export const STUDY_AGENTS_BOT_SRC = "/StudyAgentsBot.png";

type BotState = "idle" | "thinking" | "static";

type Props = {
  size?: number;
  /** Color de relleno del robot (máscara sobre el PNG). */
  color?: string;
  state?: BotState;
  className?: string;
  title?: string;
};

/**
 * Logo / avatar Study Agents a partir de `/public/StudyAgentsBot.png`.
 * Usa máscara CSS para teñir el blanco del PNG al color de marca.
 */
export default function StudyAgentsBotAvatar({
  size = 36,
  color = SA_PRIMARY,
  state = "idle",
  className,
  title = "Study Agents",
}: Props) {
  const animClass =
    state === "thinking"
      ? "sa-bot-think"
      : state === "idle"
        ? "sa-bot-float"
        : "";

  return (
    <span
      className={`sa-bot-avatar ${animClass} ${className || ""}`.trim()}
      title={title}
      role="img"
      aria-label={title}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        flexShrink: 0,
        willChange: state === "static" ? undefined : "transform",
      }}
    >
      <span
        aria-hidden
        className={state === "thinking" ? "sa-bot-glow" : undefined}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          backgroundColor: color,
          WebkitMaskImage: `url(${STUDY_AGENTS_BOT_SRC})`,
          maskImage: `url(${STUDY_AGENTS_BOT_SRC})`,
          WebkitMaskSize: "contain",
          maskSize: "contain",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
          ["--sa-bot-color" as string]: color,
        }}
      />
    </span>
  );
}
