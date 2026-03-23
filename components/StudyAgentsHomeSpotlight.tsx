"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { spaceGrotesk, outfit, jetbrainsMono } from "@/app/fonts";

type StudyAgentsHomeSpotlightProps = {
  imageSrc: string;
  badge: string;
  previewCaption: string;
  title: string;
  titleLine2: string;
  description: string;
  ctaLabel: string;
};

/**
 * Destacado StudyAgents — estética alineada con la sección "Proyectos que destacan"
 * (mismo CTA que "Ver todos los proyectos").
 */
export default function StudyAgentsHomeSpotlight({
  imageSrc,
  badge,
  previewCaption,
  title,
  titleLine2,
  description,
  ctaLabel,
}: StudyAgentsHomeSpotlightProps) {
  const [light, setLight] = useState(false);

  useEffect(() => {
    const read = () => {
      const attr = document.documentElement.getAttribute("data-theme");
      if (attr === "light" || attr === "dark") {
        setLight(attr === "light");
        return;
      }
      const saved =
        typeof window !== "undefined"
          ? localStorage.getItem("study_agents_color_theme")
          : null;
      setLight(saved === "light");
    };
    read();
    const obs = new MutationObserver(read);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => obs.disconnect();
  }, []);

  const border = light
    ? "rgba(148, 163, 184, 0.28)"
    : "rgba(148, 163, 184, 0.14)";
  const borderSoft = light
    ? "rgba(148, 163, 184, 0.16)"
    : "rgba(148, 163, 184, 0.1)";
  const panelBg = light
    ? "linear-gradient(165deg, rgba(255,255,255,0.99) 0%, rgba(248,250,252,0.97) 100%)"
    : "linear-gradient(165deg, rgba(34, 34, 44, 0.96) 0%, rgba(22, 22, 30, 0.98) 55%, rgba(18, 18, 26, 1) 100%)";
  const mockInnerBg = light ? "#eef2f7" : "#0c0c10";
  const urlBarBg = light ? "rgba(255,255,255,0.95)" : "rgba(0,0,0,0.45)";
  const urlBarBorder = light ? "rgba(148,163,184,0.2)" : "rgba(255,255,255,0.07)";
  const textMain = light ? "#0f172a" : "#f8fafc";
  const textMid = light ? "rgba(15, 23, 42, 0.68)" : "rgba(226, 232, 240, 0.75)";
  const textMuted = light ? "rgba(15, 23, 42, 0.52)" : "rgba(148, 163, 184, 0.78)";
  const shadow = light
    ? "0 20px 48px -20px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(99, 102, 241, 0.06)"
    : "0 24px 56px -20px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255,255,255,0.05)";

  /* Mismo criterio que "Ver todos los proyectos": fondo claro + texto oscuro; en tema claro panel blanco → CTA con contraste */
  const ctaBg = light ? "#ffffff" : "#ffffff";
  const ctaColor = light ? "#0f172a" : "#000000";
  const ctaShadow = light
    ? "0 4px 20px rgba(15, 23, 42, 0.06)"
    : "0 4px 20px rgba(255,255,255,0.12)";
  const ctaBorder = light ? "1px solid rgba(15, 23, 42, 0.08)" : "none";

  const PREVIEW_W = 196;
  const PREVIEW_H = 124;
  const CHROME_H = 26;

  return (
    <div
      style={{
        maxWidth: "680px",
        marginLeft: "auto",
        marginRight: "auto",
        marginBottom: "2.25rem",
      }}
    >
      <Link
        href="/study-agents"
        className="study-agents-home-spotlight-link"
        style={{
          display: "block",
          textDecoration: "none",
          color: textMain,
          borderRadius: "20px",
          outline: "none",
          transition: "transform 0.3s ease, box-shadow 0.3s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-3px)";
          e.currentTarget.style.boxShadow = light
            ? "0 22px 48px -16px rgba(99, 102, 241, 0.12)"
            : "0 28px 56px -16px rgba(99, 102, 241, 0.18)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        <article
          style={{
            overflow: "clip",
            borderRadius: "20px",
            border: `1px solid ${border}`,
            background: panelBg,
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            boxShadow: shadow,
            position: "relative",
          }}
        >
          {/* Brillo superior sutil */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: 0,
              left: "12%",
              right: "12%",
              height: "1px",
              background:
                "linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.35), transparent)",
              opacity: light ? 0.5 : 0.85,
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              padding: "1.2rem 1.35rem 1.05rem",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "flex-start",
              gap: "1.35rem",
            }}
          >
            {/* Preview compacta, capas suaves */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                flexShrink: 0,
                marginLeft: "auto",
                marginRight: "auto",
              }}
              className="sa-preview-wrap"
            >
              <span
                className={jetbrainsMono.className}
                style={{
                  marginBottom: "0.4rem",
                  fontSize: "0.56rem",
                  fontWeight: 600,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: textMuted,
                }}
              >
                {previewCaption}
              </span>
              <div
                style={{
                  position: "relative",
                  width: PREVIEW_W,
                  height: PREVIEW_H,
                }}
              >
                <div
                  aria-hidden
                  style={{
                    position: "absolute",
                    inset: "-4px 8px 5px -10px",
                    borderRadius: "12px",
                    background:
                      "linear-gradient(145deg, rgba(99,102,241,0.35), rgba(139,92,246,0.2))",
                    transform: "rotate(-5deg)",
                    opacity: light ? 0.18 : 0.32,
                    zIndex: 0,
                  }}
                />
                <div
                  aria-hidden
                  style={{
                    position: "absolute",
                    inset: "5px -6px -2px 8px",
                    borderRadius: "10px",
                    border: `1px solid ${borderSoft}`,
                    background: light
                      ? "rgba(99,102,241,0.04)"
                      : "rgba(99,102,241,0.08)",
                    transform: "rotate(3deg)",
                    zIndex: 1,
                  }}
                />
                <div
                  style={{
                    position: "relative",
                    zIndex: 2,
                    height: "100%",
                    borderRadius: "10px",
                    overflow: "hidden",
                    border: `1px solid ${border}`,
                    background: mockInnerBg,
                    boxShadow: light
                      ? "0 10px 24px -8px rgba(15,23,42,0.1)"
                      : "0 12px 28px -8px rgba(0,0,0,0.55)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      height: CHROME_H,
                      padding: "0 0.5rem",
                      borderBottom: `1px solid ${borderSoft}`,
                      background: light
                        ? "rgba(255,255,255,0.9)"
                        : "rgba(0,0,0,0.32)",
                    }}
                    aria-hidden
                  >
                    {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
                      <span
                        key={c}
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: c,
                          opacity: 0.92,
                        }}
                      />
                    ))}
                    <span
                      className={jetbrainsMono.className}
                      style={{
                        marginLeft: "0.3rem",
                        flex: 1,
                        minWidth: 0,
                        padding: "2px 5px",
                        fontSize: "0.52rem",
                        color: textMuted,
                        background: urlBarBg,
                        border: `1px solid ${urlBarBorder}`,
                        borderRadius: "4px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      studyagents
                    </span>
                  </div>
                  <div
                    style={{
                      height: PREVIEW_H - CHROME_H,
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageSrc}
                      alt=""
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        objectPosition: "top center",
                      }}
                      loading="lazy"
                    />
                    <div
                      aria-hidden
                      style={{
                        position: "absolute",
                        inset: 0,
                        background:
                          "linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.08) 100%)",
                        pointerEvents: "none",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                flex: "1 1 200px",
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                paddingTop: "0.1rem",
              }}
            >
              <p
                className={jetbrainsMono.className}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  alignSelf: "flex-start",
                  margin: 0,
                  padding: "0.25rem 0.6rem",
                  fontSize: "0.58rem",
                  fontWeight: 600,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "rgba(129, 140, 248, 0.95)",
                  background: light
                    ? "rgba(99, 102, 241, 0.08)"
                    : "rgba(99, 102, 241, 0.12)",
                  border: `1px solid ${light ? "rgba(99, 102, 241, 0.2)" : "rgba(99, 102, 241, 0.22)"}`,
                  borderRadius: "999px",
                }}
              >
                {badge}
              </p>
              <h2
                className={spaceGrotesk.className}
                style={{
                  margin: 0,
                  fontSize: "clamp(1.25rem, 3.2vw, 1.55rem)",
                  fontWeight: 700,
                  lineHeight: 1.12,
                  letterSpacing: "-0.03em",
                  color: textMain,
                }}
              >
                {title}
              </h2>
              <p
                className={outfit.className}
                style={{
                  margin: 0,
                  fontSize: "0.9rem",
                  fontWeight: 500,
                  lineHeight: 1.45,
                  color: textMid,
                }}
              >
                {titleLine2}
              </p>
              <div style={{ marginTop: "0.35rem" }}>
                {/* Mismo estilo base que "Ver todos los proyectos" (page.tsx) */}
                <span
                  className={`sa-spotlight-cta ${outfit.className}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.85rem 1.85rem",
                    fontSize: "0.95rem",
                    fontWeight: 600,
                    color: ctaColor,
                    background: ctaBg,
                    borderRadius: "12px",
                    boxShadow: ctaShadow,
                    fontFamily: "var(--font-body), system-ui, sans-serif",
                    transition: "all 0.3s ease",
                  }}
                >
                  {ctaLabel}
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </div>
          </div>

          <div
            style={{
              padding: "0 1.35rem 1.15rem",
              borderTop: `1px solid ${borderSoft}`,
            }}
          >
            <p
              className={outfit.className}
              style={{
                margin: 0,
                paddingTop: "0.9rem",
                fontSize: "0.84rem",
                lineHeight: 1.6,
                color: textMuted,
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {description}
            </p>
          </div>
        </article>
      </Link>

      <style jsx global>{`
        a.study-agents-home-spotlight-link,
        a.study-agents-home-spotlight-link:visited,
        a.study-agents-home-spotlight-link:hover,
        a.study-agents-home-spotlight-link:active {
          text-decoration: none !important;
        }
        a.study-agents-home-spotlight-link h2,
        a.study-agents-home-spotlight-link p {
          text-decoration: none;
        }
        /* Hover del CTA = mismo que "Ver todos los proyectos" */
        a.study-agents-home-spotlight-link:hover .sa-spotlight-cta {
          background: rgba(99, 102, 241, 1) !important;
          color: #ffffff !important;
          border-color: transparent !important;
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(99, 102, 241, 0.35) !important;
        }
        @media (min-width: 560px) {
          .sa-preview-wrap {
            margin-left: 0 !important;
            margin-right: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
