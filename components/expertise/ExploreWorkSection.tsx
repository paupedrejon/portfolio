"use client";

import { spaceGrotesk, outfit, jetbrainsMono } from "@/app/fonts";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

const navCardKeys = [
  "projects",
  "skills",
  "experience",
  "education",
  "about",
  "contact",
] as const;

const navCardHrefs = [
  "/proyectos",
  "/skills",
  "/experience",
  "/education",
  "/about-me",
  "/contact",
];

const gradients = [
  "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)",
  "linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)",
  "linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)",
  "linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #4f46e5 100%)",
  "linear-gradient(135deg, #ec4899 0%, #db2777 50%, #be185d 100%)",
  "linear-gradient(135deg, #06b6d4 0%, #0891b2 50%, #0e7490 100%)",
];

const navCardIcons = [
  <svg key="0" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <path d="M8 21h8M12 17v4" />
  </svg>,
  <svg key="1" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>,
  <svg key="2" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>,
  <svg key="3" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c0 1.1.9 2 2 2h3" />
  </svg>,
  <svg key="4" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>,
  <svg key="5" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>,
];

/** Bloque “Explora mi trabajo” bajo la zona expertise (scroll del documento). */
export default function ExploreWorkSection() {
  const t = useTranslations("home");
  const tCommon = useTranslations("common");
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  return (
    <div
      id="sections"
      className="relative px-6 md:px-12 lg:px-16"
      style={{
        background: "#0a0a0f",
        position: "relative",
        overflow: "hidden",
        paddingTop: "5rem",
        paddingBottom: "8rem",
        borderTop: "1px solid rgba(148, 163, 184, 0.08)",
        minHeight: "100%",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
              radial-gradient(circle at 20% 30%, rgba(99, 102, 241, 0.06) 0%, transparent 50%),
              radial-gradient(circle at 80% 70%, rgba(139, 92, 246, 0.06) 0%, transparent 50%)
            `,
        }}
      />

      <div style={{ textAlign: "center", marginBottom: "4rem", position: "relative", zIndex: 1 }}>
        <h2
          className={spaceGrotesk.className}
          style={{
            fontSize: "clamp(2rem, 5vw, 3rem)",
            fontWeight: 700,
            color: "#f8fafc",
            marginBottom: "1rem",
          }}
        >
          {t("exploreWork")}
        </h2>
        <p
          className={outfit.className}
          style={{
            fontSize: "1.1rem",
            color: "#94a3b8",
            maxWidth: "500px",
            margin: "0 auto",
          }}
        >
          {t("exploreSubtext")}
        </p>
      </div>

      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.5rem",
          position: "relative",
          zIndex: 1,
        }}
      >
        {navCardKeys.map((key, index) => (
          <Link
            key={key}
            href={navCardHrefs[index]}
            onMouseEnter={() => setHoveredCard(index)}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              padding: "2rem",
              borderRadius: "24px",
              background: "rgba(26, 26, 36, 0.8)",
              border: "1px solid rgba(148, 163, 184, 0.12)",
              backdropFilter: "blur(20px)",
              textDecoration: "none",
              overflow: "hidden",
              transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
              transform: hoveredCard === index ? "translateY(-8px) scale(1.02)" : "translateY(0) scale(1)",
              boxShadow:
                hoveredCard === index
                  ? "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(99, 102, 241, 0.2)"
                  : "0 10px 40px -10px rgba(0, 0, 0, 0.3)",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: gradients[index],
                opacity: hoveredCard === index ? 0.15 : 0,
                transition: "opacity 0.4s ease",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: -1,
                borderRadius: "24px",
                background: gradients[index],
                opacity: hoveredCard === index ? 1 : 0,
                transition: "opacity 0.4s ease",
                mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                maskComposite: "exclude",
                WebkitMaskComposite: "xor",
                padding: "2px",
              }}
            />
            <span
              className={jetbrainsMono.className}
              style={{
                position: "absolute",
                top: "1.5rem",
                right: "1.5rem",
                fontSize: "0.75rem",
                fontWeight: 600,
                color: hoveredCard === index ? "white" : "rgba(148, 163, 184, 0.6)",
                opacity: 0.7,
                transition: "all 0.3s ease",
              }}
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: hoveredCard === index ? gradients[index] : "rgba(99, 102, 241, 0.1)",
                color: hoveredCard === index ? "white" : "var(--accent-primary)",
                marginBottom: "1.5rem",
                transition: "all 0.4s ease",
                transform: hoveredCard === index ? "scale(1.1) rotate(-5deg)" : "scale(1) rotate(0)",
              }}
            >
              {navCardIcons[index]}
            </div>
            <h3
              className={spaceGrotesk.className}
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "#f8fafc",
                marginBottom: "0.5rem",
                position: "relative",
                zIndex: 1,
              }}
            >
              {t(`navCards.${key}.title`)}
            </h3>
            <p
              className={outfit.className}
              style={{
                fontSize: "0.9rem",
                color: "#94a3b8",
                lineHeight: 1.6,
                marginBottom: "1.5rem",
                position: "relative",
                zIndex: 1,
              }}
            >
              {t(`navCards.${key}.description`)}
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginTop: "auto",
                color: hoveredCard === index ? "white" : "var(--accent-primary)",
                fontSize: "0.875rem",
                fontWeight: 500,
                transition: "all 0.3s ease",
                position: "relative",
                zIndex: 1,
              }}
            >
              <span className={outfit.className}>{tCommon("explore")}</span>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{
                  transition: "transform 0.3s ease",
                  transform: hoveredCard === index ? "translateX(5px)" : "translateX(0)",
                }}
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
            <div
              style={{
                position: "absolute",
                top: 0,
                left: "-100%",
                width: "100%",
                height: "100%",
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
                transition: "left 0.5s ease",
                ...(hoveredCard === index && { left: "100%" }),
              }}
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
