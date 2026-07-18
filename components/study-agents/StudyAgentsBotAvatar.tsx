"use client";

import { SA_PRIMARY } from "@/lib/study-agents/brand";

export const STUDY_AGENTS_BOT_SRC = "/StudyAgentsBot.png";

type BotState = "idle" | "thinking" | "static";

type Props = {
  size?: number;
  color?: string;
  state?: BotState;
  className?: string;
  title?: string;
};

/**
 * Avatar Study Agents (SVG cute): flota, pestañea y “piensa” con glow + antenas.
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
  const eyeClass =
    state === "thinking"
      ? "sa-bot-eye sa-bot-eye-think"
      : state === "static"
        ? "sa-bot-eye"
        : "sa-bot-eye sa-bot-eye-blink";
  const antennaClass =
    state === "thinking" ? "sa-bot-antenna sa-bot-antenna-wiggle" : "sa-bot-antenna";

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
        ["--sa-bot-color" as string]: color,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
        className={state === "thinking" ? "sa-bot-glow" : undefined}
        style={{ overflow: "visible", display: "block" }}
      >
        {/* Lápiz izquierdo */}
        <g className={`${antennaClass} sa-bot-antenna-left`} style={{ transformOrigin: "22px 14px" }}>
          <path
            d="M18 18 L10 6"
            stroke={color}
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <path d="M10 6 L7.5 4.2" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="6.8" cy="3.6" r="1.35" fill={color} opacity="0.85" />
        </g>

        {/* Lápiz derecho */}
        <g className={`${antennaClass} sa-bot-antenna-right`} style={{ transformOrigin: "42px 14px" }}>
          <path
            d="M46 18 L54 6"
            stroke={color}
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <path d="M54 6 L56.5 4.2" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="57.2" cy="3.6" r="1.35" fill={color} opacity="0.85" />
        </g>

        {/* Orejas */}
        <rect x="6" y="28" width="6" height="12" rx="3" fill={color} />
        <rect x="52" y="28" width="6" height="12" rx="3" fill={color} />

        {/* Cabeza (speech-bubble) */}
        <path
          d="M16 18
             H48
             Q54 18 54 24
             V40
             Q54 46 48 46
             H36
             L32 54
             L28 46
             H16
             Q10 46 10 40
             V24
             Q10 18 16 18 Z"
          fill={color}
        />

        {/* Pantalla interior (recortada) */}
        <path
          d="M18 22
             H46
             Q49 22 49 25
             V39
             Q49 42 46 42
             H18
             Q15 42 15 39
             V25
             Q15 22 18 22 Z"
          fill="var(--sa-bot-face, #ffffff)"
          opacity="0.96"
        />

        {/* Ojos — pestañean con scaleY */}
        <g className="sa-bot-eyes" style={{ transformOrigin: "32px 32px" }}>
          <rect
            className={eyeClass}
            x="22.5"
            y="26.5"
            width="5.5"
            height="12"
            rx="2.75"
            fill={color}
            style={{ transformOrigin: "25.25px 32.5px" }}
          />
          <rect
            className={eyeClass}
            x="36"
            y="26.5"
            width="5.5"
            height="12"
            rx="2.75"
            fill={color}
            style={{ transformOrigin: "38.75px 32.5px" }}
          />
        </g>

        {/* Brillos cute en ojos */}
        <circle className="sa-bot-sparkle" cx="24.2" cy="29" r="1.1" fill="#fff" opacity="0.9" />
        <circle className="sa-bot-sparkle" cx="37.7" cy="29" r="1.1" fill="#fff" opacity="0.9" />
      </svg>
    </span>
  );
}
