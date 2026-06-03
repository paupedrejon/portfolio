"use client";

import { Canvas } from "@react-three/fiber";
import { Bloom, ChromaticAberration, EffectComposer, Vignette } from "@react-three/postprocessing";
import { Suspense, useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import type { ExpertiseArea } from "./types";
import { useExpertiseSnapScroller } from "./ExpertiseSnapScrollerContext";

interface SceneProps {
  reducedMotion: boolean;
  /** Lectura en useFrame sin depender del ritmo de re-renders de React. */
  scrollProgressRef: MutableRefObject<number>;
  isMobile: boolean;
}

interface ExpertiseSectionProps {
  area: ExpertiseArea;
  title: string;
  subtitle: string;
  education: string;
  educationLines?: string[];
  experience?: string;
  portfolioLabel: string;
  ctaLabel: string;
  scene: React.ComponentType<SceneProps>;
  textAlign: "left" | "right";
  reducedMotion: boolean;
  isMobile: boolean;
  weakDevice: boolean;
  active: boolean;
  onActive: () => void;
  /** En /proyectos: hero de área sin CTA hacia la misma página. */
  heroMode?: boolean;
}

type ExpertiseInfoRow =
  | { label: "EDUCATION"; value?: string; values?: string[] }
  | { label: "EXPERIENCE"; value: string }
  | {
      label: "PORTFOLIO";
      value?: string;
      href?: string;
      links?: Array<{ label: string; href: string | null }>;
    };

gsap.registerPlugin(ScrollTrigger);

const expertiseInfoIcons = {
  education: (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M2 11 12 6l10 5-10 5L2 11z" />
      <path d="M7 12.5v4.5c0 1.5 2.5 2.5 5 2.5s5-1 5-2.5v-4.5" />
    </svg>
  ),
  experience: (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  portfolio: (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
} as const;

const expertiseInfoIconByLabel: Record<
  "EDUCATION" | "EXPERIENCE" | "PORTFOLIO",
  (typeof expertiseInfoIcons)[keyof typeof expertiseInfoIcons]
> = {
  EDUCATION: expertiseInfoIcons.education,
  EXPERIENCE: expertiseInfoIcons.experience,
  PORTFOLIO: expertiseInfoIcons.portfolio,
};

export default function ExpertiseSection({
  area,
  title,
  subtitle,
  education,
  educationLines,
  experience,
  portfolioLabel,
  ctaLabel,
  scene: Scene,
  textAlign,
  reducedMotion,
  isMobile,
  weakDevice,
  active,
  onActive,
  heroMode = false,
}: ExpertiseSectionProps) {
  void textAlign;
  const t = useTranslations("expertise");
  const scrollRoot = useExpertiseSnapScroller();
  const sectionRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [shouldRenderCanvas, setShouldRenderCanvas] = useState(false);
  const scrollProgressRef = useRef(0);

  useEffect(() => {
    if (heroMode) {
      setShouldRenderCanvas(true);
      return;
    }
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        // Enganche unidireccional: no volver a false. Si desmontamos el Canvas mientras
        // el GLTFLoader aún pide scene.bin / texturas, el abort rompe la carga
        // ("Failed to fetch" / "Failed to load buffer scene.bin").
        setShouldRenderCanvas(true);
      },
      {
        root: scrollRoot ?? null,
        rootMargin: "50% 0px",
        threshold: 0,
      },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, [scrollRoot, heroMode]);

  useEffect(() => {
    const section = sectionRef.current;
    const text = textRef.current;
    if (!section || !text) return;

    const trigger = ScrollTrigger.create({
      ...(scrollRoot ? { scroller: scrollRoot } : {}),
      trigger: section,
      start: "top center",
      end: "bottom center",
      onToggle: (self) => {
        if (self.isActive) onActive();
      },
      onUpdate: (self) => {
        scrollProgressRef.current = self.progress;
      },
    });

    let textTween: gsap.core.Tween | undefined;
    if (!reducedMotion) {
      textTween = gsap.fromTo(
        text.children,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.75,
          stagger: 0.08,
          ease: "power2.out",
          scrollTrigger: {
            ...(scrollRoot ? { scroller: scrollRoot } : {}),
            trigger: section,
            start: "top 70%",
          },
        },
      );
    }

    return () => {
      trigger.kill();
      textTween?.scrollTrigger?.kill();
      textTween?.kill();
    };
  }, [onActive, reducedMotion, scrollRoot]);

  const showEffects = !reducedMotion && !isMobile && !weakDevice;
  const finalDpr = isMobile || weakDevice ? 1 : 1.6;
  const sectionOpacity = heroMode || active ? 1 : 0.86;
  const canvasActive = heroMode || active;

  const headingStyles = useMemo(
    () => ({
      color: "#ffffff",
      fontFamily: '"Lulo Clean", "Bebas Neue", Georgia, serif',
      fontWeight: 700,
      fontSize: "clamp(5rem, 14vw, 13rem)",
      letterSpacing: "0.05em",
      lineHeight: 0.9,
      margin: 0,
      textAlign: "center" as const,
      textShadow: "none",
      WebkitTextStroke: "0px",
    }),
    []
  );

  const ctaHref = area.ctaHref;
  const ctaExternal = /^https?:\/\//.test(ctaHref);
  const stackSubtitle = area.id === "web-development" ? "FULL-STACK · REACT · NEXT.JS" : subtitle.toUpperCase();
  const bottomExperience = area.id === "web-development" ? "Owius" : experience ?? "—";
  const bottomPortfolioDisplay = area.id === "web-development" ? "turelojya.com" : portfolioLabel;

  const expertiseInfoRows: ExpertiseInfoRow[] = [];
  if (educationLines?.length) {
    expertiseInfoRows.push({ label: "EDUCATION", values: educationLines });
  } else {
    expertiseInfoRows.push({
      label: "EDUCATION",
      value: area.id === "web-development" ? "Universitat Politècnica de Barcelona" : education,
    });
  }
  if (!area.hideExperience) {
    expertiseInfoRows.push({ label: "EXPERIENCE", value: bottomExperience });
  }
  if (area.portfolioLinks.length > 1) {
    expertiseInfoRows.push({
      label: "PORTFOLIO",
      links: area.portfolioLinks.map((l) => ({
        label: t(l.labelKey),
        href: l.href,
      })),
    });
  } else if (area.portfolioLinks.length === 1) {
    expertiseInfoRows.push({
      label: "PORTFOLIO",
      value: bottomPortfolioDisplay,
      href: area.portfolioLinks[0]?.href ?? undefined,
    });
  }

  const vignetteGradient =
    area.vignetteGradient ??
    "radial-gradient(ellipse 70% 60% at center, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.65) 55%, rgba(0,0,0,0.97) 100%)";

  const canvasCamera =
    area.sceneId === "ai"
      ? { position: [0, 0, 5] as [number, number, number], fov: 40 }
      : area.sceneId === "games"
        ? { position: [0, 3, 6] as [number, number, number], fov: 35 }
        : area.sceneId === "mobile"
          ? { position: [0, 0, 7] as [number, number, number], fov: 30 }
          : area.sceneId === "hardware"
            ? { position: [0, 1, 8] as [number, number, number], fov: 35 }
            : { position: [0, 1, 14] as [number, number, number], fov: 28 };

  const isAiScene = area.sceneId === "ai";
  const isMobileScene = area.sceneId === "mobile";
  const isGamesScene = area.sceneId === "games";
  const isHardwareScene = area.sceneId === "hardware";
  const isProduct3DScene = isMobileScene || isGamesScene || isHardwareScene;

  return (
    <section
      ref={sectionRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "#000000",
        overflow: "hidden",
        opacity: sectionOpacity,
        colorScheme: "dark",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 0,
        }}
      >
        {shouldRenderCanvas && !weakDevice && canvasActive ? (
          <Canvas
            style={{ width: "100%", height: "100%", display: "block" }}
            dpr={[1, finalDpr]}
            shadows
            camera={canvasCamera}
            gl={{ antialias: true, powerPreference: "high-performance", alpha: false }}
            onCreated={({ gl }) => {
              gl.setSize(window.innerWidth, window.innerHeight);
            }}
            aria-hidden="true"
          >
            <Suspense fallback={null}>
              <Scene
                reducedMotion={reducedMotion}
                scrollProgressRef={scrollProgressRef}
                isMobile={isMobile}
              />
              {showEffects ? (
                <EffectComposer multisampling={0}>
                  {isAiScene ? (
                    <Bloom
                      intensity={1.05}
                      luminanceThreshold={0.62}
                      luminanceSmoothing={0.85}
                      mipmapBlur
                    />
                  ) : isProduct3DScene ? (
                    <Bloom
                      intensity={isMobileScene ? 0.2 : 0.45}
                      luminanceThreshold={isMobileScene ? 0.95 : 0.88}
                      luminanceSmoothing={0.85}
                      mipmapBlur
                    />
                  ) : (
                    <Bloom intensity={0.8} luminanceThreshold={0.72} />
                  )}
                  <Vignette
                    eskil={false}
                    offset={isMobileScene ? 0.25 : 0.18}
                    darkness={isMobileScene ? 0.7 : 0.52}
                  />
                  <ChromaticAberration
                    offset={isMobileScene ? [0, 0] : [0.0005, 0.0005]}
                  />
                </EffectComposer>
              ) : isMobile && !weakDevice ? (
                <EffectComposer multisampling={0}>
                  <Vignette eskil={false} offset={0.2} darkness={0.5} />
                </EffectComposer>
              ) : null}
            </Suspense>
          </Canvas>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-black text-sm uppercase tracking-[0.24em] text-[#f5f3ee]/45">
            3D Scene Preview
          </div>
        )}
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 10,
          pointerEvents: "none",
          background: vignetteGradient,
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 11,
          pointerEvents: "none",
          background: "rgba(0,0,0,0.22)",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 20,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          paddingLeft: "1.5rem",
          paddingRight: "1.5rem",
          pointerEvents: "none",
        }}
      >
        <div
          ref={textRef}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
            textAlign: "center",
            width: "100%",
            maxWidth: "80rem",
          }}
        >
          <h2 style={headingStyles}>
            {title}
          </h2>
          <div
            style={{
              width: "60px",
              height: "1px",
              background: "rgba(255,255,255,0.4)",
            }}
          />
          <p
            style={{
              color: "#ffffff",
              fontSize: "0.95rem",
              fontFamily: "Inter, sans-serif",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              margin: 0,
              textAlign: "center",
            }}
          >
            {stackSubtitle}
          </p>
          {!heroMode ? (
            <Link
              href={ctaHref}
              target={ctaExternal ? "_blank" : undefined}
              rel={ctaExternal ? "noopener noreferrer" : undefined}
              style={{
                pointerEvents: "auto",
                display: "inline-flex",
                alignItems: "center",
                gap: "12px",
                padding: "14px 36px",
                background: "rgba(0,0,0,0.55)",
                border: "1px solid rgba(255,255,255,0.35)",
                color: "#ffffff",
                fontFamily: "Inter, sans-serif",
                fontSize: "0.75rem",
                fontWeight: 600,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                textDecoration: "none",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                transition: "border-color 0.3s, background 0.3s",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.8)";
                e.currentTarget.style.background = "rgba(0,0,0,0.75)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)";
                e.currentTarget.style.background = "rgba(0,0,0,0.55)";
              }}
            >
              <span style={{ opacity: 0.5 }}>—</span>
              {ctaLabel}
              <span style={{ opacity: 0.5 }}>—</span>
            </Link>
          ) : null}
        </div>
        <div
          style={{
            position: "absolute",
            bottom: "48px",
            left: "48px",
            zIndex: 35,
            pointerEvents: "auto",
            maxWidth: "min(460px, 88vw)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "stretch",
              gap: "16px",
            }}
          >
            <div
              style={{
                position: "relative",
                width: "18px",
                flexShrink: 0,
                alignSelf: "stretch",
              }}
              aria-hidden
            >
              <div
                style={{
                  position: "absolute",
                  left: "8px",
                  top: "10px",
                  bottom: "10px",
                  width: "1px",
                  background: "rgba(255,255,255,0.28)",
                }}
              />
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  height: "100%",
                  paddingTop: "6px",
                  paddingBottom: "6px",
                  alignItems: "center",
                }}
              >
                {expertiseInfoRows.map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: "8px",
                      height: "8px",
                      border: "1px solid rgba(255,255,255,0.7)",
                      background: "#000000",
                      transform: "rotate(45deg)",
                      flexShrink: 0,
                      boxSizing: "border-box",
                    }}
                  />
                ))}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "28px",
                flex: 1,
                minWidth: 0,
                lineHeight: "normal",
              }}
            >
              {expertiseInfoRows.map((item) => (
                <div key={item.label}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "6px",
                    }}
                  >
                    {expertiseInfoIconByLabel[item.label]}
                    <span
                      style={{
                        color: "rgba(255,255,255,0.45)",
                        fontSize: "11px",
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        fontFamily: "Inter, sans-serif",
                        fontWeight: 600,
                      }}
                    >
                      {item.label}
                    </span>
                  </div>
                  {item.label === "EDUCATION" && "values" in item && item.values ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {item.values.map((v, i) => (
                        <p
                          key={i}
                          style={{
                            margin: 0,
                            color: "#ffffff",
                            fontSize: "14px",
                            fontFamily: "Inter, sans-serif",
                            lineHeight: 1.45,
                            opacity: i === 0 ? 1 : 0.6,
                            fontWeight: i === 0 ? 500 : 400,
                          }}
                        >
                          {v}
                        </p>
                      ))}
                    </div>
                  ) : item.label === "PORTFOLIO" && "links" in item && item.links && item.links.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {item.links.map((link, i) =>
                        link.href ? (
                          <a
                            key={i}
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: "#ffffff",
                              fontSize: "15px",
                              lineHeight: 1.45,
                              fontFamily: "Inter, sans-serif",
                              textDecoration: "none",
                              opacity: 0.95,
                            }}
                          >
                            {link.label} ↗
                          </a>
                        ) : (
                          <p
                            key={i}
                            style={{
                              margin: 0,
                              color: "#ffffff",
                              fontSize: "15px",
                              lineHeight: 1.45,
                              fontFamily: "Inter, sans-serif",
                              opacity: 0.85,
                            }}
                          >
                            {link.label}
                          </p>
                        )
                      )}
                    </div>
                  ) : item.label === "PORTFOLIO" && item.href ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "#ffffff",
                        fontSize: "17px",
                        lineHeight: 1.45,
                        fontFamily: "Inter, sans-serif",
                        textDecoration: "none",
                      }}
                    >
                      {item.value} ↗
                    </a>
                  ) : (
                    <p
                      style={{
                        color: "#ffffff",
                        fontSize: "17px",
                        lineHeight: 1.45,
                        margin: 0,
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      {"value" in item ? item.value : ""}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
