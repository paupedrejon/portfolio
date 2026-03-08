"use client";

import { spaceGrotesk, outfit, jetbrainsMono, leagueSpartan } from "../fonts";
import ScrollButton from "@/components/ScrollButton";
import CurriculumButton from "@/components/CurriculumButton";
import FloatingLines from "@/components/FloatingLines";
import Masonry from "@/components/Masonry";
import { allProjects } from "@/data/projectsData";
import { useEffect, useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";

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

export default function HomePage() {
  const t = useTranslations("home");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const [mounted, setMounted] = useState(false);
  const floatingLinesWaves = useMemo(() => ["top", "middle", "bottom"] as ("top" | "middle" | "bottom")[], []);
  const floatingLinesGradient = useMemo(() => ["#6366f1", "#8b5cf6", "#a855f7"], []);

  const masonryItems = useMemo(
    () =>
      allProjects.map((p) => {
        const isInternal = p.ctaHref.startsWith("/") && !p.ctaHref.startsWith("//");
        const isOutsideLocale = /^\/(study-agents|api|auth)/.test(p.ctaHref);
        const url = isInternal && !isOutsideLocale
          ? `/${locale}${p.ctaHref}`
          : p.ctaHref;
        return { id: p.id, img: p.imageCard, url, height: p.height };
      }),
    [locale]
  );

  const risingLinesConfig = useMemo(
    () =>
      [
        { width: 1.8, height: 245, left: 18, duration: 10.4, delay: 5, color: "139, 92, 246", opacity: 0.33, shadowSize: 13.6 },
        { width: 1.35, height: 154, left: 15, duration: 13.5, delay: 2.9, color: "139, 92, 246", opacity: 0.2, shadowSize: 10.8 },
        { width: 1.66, height: 206, left: 6, duration: 6, delay: 0.7, color: "99, 102, 241", opacity: 0.21, shadowSize: 8.5 },
        { width: 2.68, height: 121, left: 42, duration: 10.5, delay: 2.6, color: "99, 102, 241", opacity: 0.41, shadowSize: 10.2 },
        { width: 1.64, height: 196, left: 19, duration: 13.2, delay: 1.2, color: "139, 92, 246", opacity: 0.54, shadowSize: 7.7 },
        { width: 2.85, height: 286, left: 86, duration: 12.6, delay: 0.7, color: "139, 92, 246", opacity: 0.46, shadowSize: 6.8 },
        { width: 2.99, height: 119, left: 27, duration: 13.6, delay: 4.8, color: "99, 102, 241", opacity: 0.4, shadowSize: 10.1 },
        { width: 2.41, height: 266, left: 27, duration: 6.8, delay: 3, color: "99, 102, 241", opacity: 0.41, shadowSize: 8.5 },
        { width: 1.87, height: 128, left: 36, duration: 9.8, delay: 4.2, color: "139, 92, 246", opacity: 0.49, shadowSize: 13.1 },
        { width: 2.35, height: 110, left: 69, duration: 13.1, delay: 0.7, color: "139, 92, 246", opacity: 0.51, shadowSize: 14.1 },
        { width: 1.47, height: 296, left: 9, duration: 11.3, delay: 1.8, color: "99, 102, 241", opacity: 0.22, shadowSize: 9.3 },
        { width: 2.55, height: 123, left: 53, duration: 9.3, delay: 1.8, color: "139, 92, 246", opacity: 0.4, shadowSize: 13 },
        { width: 1.17, height: 147, left: 18, duration: 12.8, delay: 2.5, color: "99, 102, 241", opacity: 0.29, shadowSize: 9 },
        { width: 1.06, height: 140, left: 98, duration: 7.5, delay: 1.6, color: "139, 92, 246", opacity: 0.35, shadowSize: 5.2 },
        { width: 1.31, height: 293, left: 89, duration: 11.1, delay: 1.9, color: "139, 92, 246", opacity: 0.33, shadowSize: 12.7 },
      ],
    []
  );
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <section className="hero-section" style={{ position: "relative", overflow: "hidden" }}>
        <div className="hero-grid" />
        <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          <FloatingLines
            enabledWaves={floatingLinesWaves}
            lineCount={5}
            lineDistance={5}
            bendRadius={5}
            bendStrength={-0.5}
            interactive={true}
            parallax={true}
            linesGradient={floatingLinesGradient}
            mixBlendMode="screen"
          />
        </div>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute rounded-full blur-[120px] opacity-25"
            style={{
              width: "600px",
              height: "600px",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              top: "10%",
              left: "20%",
              animation: "floatOrb1 60s ease-in-out infinite",
            }}
          />
          <div
            className="absolute rounded-full blur-[100px] opacity-20"
            style={{
              width: "500px",
              height: "500px",
              background: "linear-gradient(135deg, #a855f7, #6366f1)",
              bottom: "20%",
              right: "15%",
              animation: "floatOrb2 70s ease-in-out infinite reverse",
            }}
          />
          <div
            className="absolute rounded-full blur-[80px] opacity-15"
            style={{
              width: "400px",
              height: "400px",
              background: "linear-gradient(135deg, #8b5cf6, #a855f7)",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              animation: "floatOrb3 80s ease-in-out infinite",
            }}
          />
          <div
            className="absolute rounded-full blur-[90px] opacity-18"
            style={{
              width: "450px",
              height: "450px",
              background: "linear-gradient(135deg, #6366f1, #a855f7)",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              animation: "floatOrb3 80s ease-in-out infinite",
            }}
          />
        </div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `
              radial-gradient(circle at 30% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 70% 80%, rgba(139, 92, 246, 0.12) 0%, transparent 50%),
              radial-gradient(circle at 50% 50%, rgba(168, 85, 247, 0.08) 0%, transparent 50%)
            `,
            animation: "pulseBg 30s ease-in-out infinite",
          }}
        />
        {risingLinesConfig.map((line, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: `${line.width}px`,
              height: `${line.height}px`,
              background: `linear-gradient(to top, rgba(${line.color}, 0), rgba(${line.color}, ${line.opacity}))`,
              left: `${line.left}%`,
              bottom: "-200px",
              borderRadius: "2px",
              animation: `riseLine ${line.duration}s linear infinite`,
              animationDelay: `${line.delay}s`,
              boxShadow: `0 0 ${line.shadowSize}px rgba(${line.color}, 0.3)`,
            }}
          />
        ))}

        <div
          className={`relative z-10 flex flex-col items-center text-center px-6 ${mounted ? "opacity-100" : "opacity-0"}`}
          style={{ transition: "opacity 0.8s ease-out" }}
        >
          <div
            className={`${jetbrainsMono.className} ${mounted ? "animate-fade-in-up" : ""}`}
            style={{ animationDelay: "0.1s", animationFillMode: "both", marginBottom: "1.5rem" }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 1.25rem",
                fontSize: "0.75rem",
                fontWeight: 500,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "rgba(99, 102, 241, 0.9)",
                background: "linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)",
                border: "1px solid rgba(99, 102, 241, 0.2)",
                borderRadius: "50px",
                backdropFilter: "blur(10px)",
                boxShadow: "0 4px 20px rgba(99, 102, 241, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <span style={{ position: "relative", zIndex: 1 }}>{tCommon("softwareEngineer")}</span>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.1), transparent)",
                  animation: "shimmer 3s ease-in-out infinite",
                }}
              />
            </div>
          </div>

          <h1
            className={`${leagueSpartan.className} hero-title ${mounted ? "animate-fade-in-up" : ""}`}
            style={{ animationDelay: "0.2s", animationFillMode: "both" }}
          >
            <span style={{ color: "white" }}>{t("title")}</span>
          </h1>

          <p
            className={`${outfit.className} hero-tagline ${mounted ? "animate-fade-in-up" : ""}`}
            style={{ animationDelay: "0.4s", animationFillMode: "both", color: "white" }}
          >
            {t("tagline")}
          </p>

          <div
            className={`flex flex-wrap gap-4 justify-center mt-10 ${mounted ? "animate-fade-in-up" : ""}`}
            style={{ animationDelay: "0.5s", animationFillMode: "both" }}
          >
            <CurriculumButton href="/PauPedrejonCV.pdf" />
          </div>

          <div
            className={`scroll-wrap ${mounted ? "animate-fade-in" : ""}`}
            style={{ animationDelay: "0.8s", animationFillMode: "both", marginTop: "4rem" }}
          >
            <ScrollButton targetId="sections" color="transparent" iconColor="rgba(255,255,255,0.9)" />
          </div>
        </div>

        <style jsx>{`
          @keyframes floatOrb1 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            25% { transform: translate(60px, -100px) scale(1.1); }
            50% { transform: translate(-40px, 80px) scale(0.9); }
            75% { transform: translate(100px, 50px) scale(1.05); }
          }
          @keyframes floatOrb2 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(-80px, -120px) scale(1.15); }
            66% { transform: translate(60px, 100px) scale(0.85); }
          }
          @keyframes floatOrb3 {
            0%, 100% { transform: translate(-50%, -50%) scale(1) rotate(0deg); }
            50% { transform: translate(-50%, -50%) scale(1.2) rotate(180deg); }
          }
          @keyframes riseLine {
            0% { transform: translateY(0); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translateY(calc(-100vh - 200px)); opacity: 0; }
          }
          @keyframes pulseBg {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.6; }
          }
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "280px",
            background: "linear-gradient(to bottom, transparent 0%, rgba(10, 10, 15, 0.5) 40%, #0a0a0f 85%)",
            pointerEvents: "none",
            zIndex: 5,
          }}
        />
      </section>

      <section
        className="relative px-6 md:px-12 lg:px-16"
        style={{
          background: "#0a0a0f",
          position: "relative",
          overflow: "visible",
          paddingTop: "0",
          paddingBottom: "0",
        }}
      >
        <div
          className="whats-new-section"
          style={{
            position: "relative",
            zIndex: 1,
            padding: "2rem 0 4rem",
            overflow: "hidden",
          }}
        >
          <div
            className="whats-new-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 0.9fr) minmax(0, 1.4fr)",
              gap: "2.5rem",
              alignItems: "center",
              maxWidth: "1600px",
              margin: "0 auto",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
                textAlign: "left",
              }}
            >
              <h2
                className={spaceGrotesk.className}
                style={{
                  fontSize: "clamp(2.25rem, 4.5vw, 3.5rem)",
                  fontWeight: 700,
                  color: "#fff",
                  margin: 0,
                  lineHeight: 1.15,
                  letterSpacing: "-0.02em",
                }}
              >
                {t("projectsHighlight")}
              </h2>
              <p
                className={outfit.className}
                style={{
                  fontSize: "1rem",
                  color: "rgba(255,255,255,0.55)",
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {t("projectsSubtext")}
              </p>
              <Link
                href="/proyectos"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "1rem 2.5rem",
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: "#000",
                  background: "#fff",
                  borderRadius: "12px",
                  textDecoration: "none",
                  transition: "all 0.3s ease",
                  boxShadow: "0 4px 20px rgba(255,255,255,0.2)",
                  fontFamily: "var(--font-body)",
                  width: "fit-content",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(99, 102, 241, 1)";
                  e.currentTarget.style.color = "#fff";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#fff";
                  e.currentTarget.style.color = "#000";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {t("viewAllProjects")}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            <div style={{ width: "100%", minHeight: "400px", display: "flex", justifyContent: "center", alignItems: "center" }}>
              <Masonry
                items={masonryItems.slice(0, 7)}
                columns={3}
                ease="power3.out"
                duration={0.6}
                stagger={0.05}
                animateFrom="bottom"
                scaleOnHover
                hoverScale={0.97}
                blurToFocus
                colorShiftOnHover={false}
              />
            </div>
          </div>
        </div>
      </section>

      <section
        id="sections"
        className="relative px-6 md:px-12 lg:px-16"
        style={{
          background: "#0a0a0f",
          position: "relative",
          overflow: "hidden",
          paddingTop: "5rem",
          paddingBottom: "8rem",
          borderTop: "1px solid rgba(148, 163, 184, 0.08)",
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
            animation: "pulseBg 30s ease-in-out infinite",
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
      </section>
    </>
  );
}
