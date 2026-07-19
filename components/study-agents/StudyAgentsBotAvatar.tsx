"use client";

import { SA_PRIMARY } from "@/lib/study-agents/brand";

export const STUDY_AGENTS_BOT_SRC = "/StudyAgentsBot.png";

type BotState = "idle" | "thinking" | "static";

type Props = {
  size?: number;
  /** Solo para glow / acentos; cuerpo blanco, cara oscura, ojos blancos. */
  color?: string;
  state?: BotState;
  className?: string;
  title?: string;
};

/** Ojo con parpadeo SMIL (height/y centrado — evita el salto de scaleY en SVG). */
function BotEye({
  cx,
  color,
  fast,
  animate,
}: {
  cx: number;
  color: string;
  fast: boolean;
  animate: boolean;
}) {
  const w = 5.5;
  const h = 12;
  const x = cx - w / 2;
  const yOpen = 26.5;
  const yClosed = yOpen + (h - 1) / 2;

  return (
    <g>
      <rect x={x} y={yOpen} width={w} height={h} rx={2.75} fill={color}>
        {animate && (
          <>
            <animate
              attributeName="height"
              values={fast ? "12;12;1;1;12;12;12;1;1;12;12" : "12;12;1;12;12;12;1;1;12;12"}
              keyTimes={fast ? "0;0.18;0.22;0.25;0.28;0.55;0.59;0.62;0.65;0.68;1" : "0;0.42;0.45;0.48;0.78;0.81;0.83;0.86;0.9;1"}
              dur={fast ? "1.6s" : "4.2s"}
              repeatCount="indefinite"
              calcMode="linear"
            />
            <animate
              attributeName="y"
              values={
                fast
                  ? `${yOpen};${yOpen};${yClosed};${yClosed};${yOpen};${yOpen};${yOpen};${yClosed};${yClosed};${yOpen};${yOpen}`
                  : `${yOpen};${yOpen};${yClosed};${yOpen};${yOpen};${yOpen};${yClosed};${yClosed};${yOpen};${yOpen}`
              }
              keyTimes={fast ? "0;0.18;0.22;0.25;0.28;0.55;0.59;0.62;0.65;0.68;1" : "0;0.42;0.45;0.48;0.78;0.81;0.83;0.86;0.9;1"}
              dur={fast ? "1.6s" : "4.2s"}
              repeatCount="indefinite"
              calcMode="linear"
            />
          </>
        )}
      </rect>
      <circle cx={cx - 1.05} cy={29} r={1.1} fill="rgba(6,16,24,0.55)" opacity={0.9}>
        {animate && (
          <animate
            attributeName="opacity"
            values={fast ? "0.95;0.95;0;0;0.95;0.95;0.95;0;0;0.95;0.95" : "0.95;0.95;0;0.95;0.95;0.95;0;0;0.95;0.95"}
            keyTimes={fast ? "0;0.18;0.22;0.25;0.28;0.55;0.59;0.62;0.65;0.68;1" : "0;0.42;0.45;0.48;0.78;0.81;0.83;0.86;0.9;1"}
            dur={fast ? "1.6s" : "4.2s"}
            repeatCount="indefinite"
            calcMode="linear"
          />
        )}
      </circle>
    </g>
  );
}

/**
 * Bot Study Agents: cuerpo/antenas/ojos blancos, pantalla interior azul.
 */
export default function StudyAgentsBotAvatar({
  size = 36,
  color = SA_PRIMARY,
  state = "idle",
  className,
  title = "Study Agents",
}: Props) {
  const body = "#ffffff";
  const face = color; // azul (pantalla)
  const eyes = "#ffffff";

  const animClass =
    state === "thinking"
      ? "sa-bot-think"
      : state === "idle"
        ? "sa-bot-float"
        : "";
  const antennaClass =
    state === "thinking" ? "sa-bot-antenna sa-bot-antenna-wiggle" : "sa-bot-antenna";
  const blink = state !== "static";
  const blinkFast = state === "thinking";

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
        ["--sa-bot-face" as string]: face,
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
        <g className={`${antennaClass} sa-bot-antenna-left`} style={{ transformOrigin: "22px 14px" }}>
          <path d="M18 18 L10 6" stroke={body} strokeWidth="3.2" strokeLinecap="round" />
          <path d="M10 6 L7.5 4.2" stroke={body} strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="6.8" cy="3.6" r="1.35" fill={body} opacity="0.95" />
        </g>

        <g className={`${antennaClass} sa-bot-antenna-right`} style={{ transformOrigin: "42px 14px" }}>
          <path d="M46 18 L54 6" stroke={body} strokeWidth="3.2" strokeLinecap="round" />
          <path d="M54 6 L56.5 4.2" stroke={body} strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="57.2" cy="3.6" r="1.35" fill={body} opacity="0.95" />
        </g>

        <rect x="6" y="28" width="6" height="12" rx="3" fill={body} />
        <rect x="52" y="28" width="6" height="12" rx="3" fill={body} />

        {/* Cáscara blanca */}
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
          fill={body}
        />

        {/* Pantalla interior azul */}
        <path
          d="M19 23.5
             H45
             Q47.5 23.5 47.5 26
             V38
             Q47.5 40.5 45 40.5
             H19
             Q16.5 40.5 16.5 38
             V26
             Q16.5 23.5 19 23.5 Z"
          fill={face}
        />

        <BotEye cx={25.25} color={eyes} fast={blinkFast} animate={blink} />
        <BotEye cx={38.75} color={eyes} fast={blinkFast} animate={blink} />
      </svg>
    </span>
  );
}
