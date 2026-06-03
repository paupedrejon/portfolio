"use client";

import { useEffect, useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import "../home.css";
import PortfolioPageHero from "@/components/portfolio/PortfolioPageHero";
import HomeHeroBackground from "@/components/home/HomeHeroBackground";
import PrismaticBurst from "@/components/PrismaticBurst";
import { FaUniversity, FaGraduationCap, FaCertificate } from "react-icons/fa";

const EDUCATION_CONFIG = [
  { key: "iia10x", icon: <FaCertificate size={24} />, href: "https://www.credential.net/9340a704-7896-4104-b745-d6e2c9605eb0#acc.zYw8lsuv", years: "2025–2026", type: "certificate" as const, gradient: "linear-gradient(135deg, #358c9f, #4eb3c8)" },
  { key: "upcDegree", icon: <FaGraduationCap size={24} />, href: "https://www.upc.edu/ca/graus/enginyeria-informatica-barcelona-fib", years: "2023–2027*", type: "degree" as const, gradient: "linear-gradient(135deg, #4eb3c8, #2a6f7d)" },
  { key: "unityCourse", icon: <FaCertificate size={24} />, href: "https://www.fib.upc.edu/es/noticias/cursos-vgafib-febrero-2022", years: "2024", type: "course" as const, gradient: "linear-gradient(135deg, #358c9f, #4eb3c8)" },
  { key: "itbDiploma", icon: <FaUniversity size={24} />, href: "https://itecbcn.eu/portfolio/batxillerat-tecnologic-digital/", years: "2021–2023", type: "diploma" as const, gradient: "linear-gradient(135deg, #2a6f7d, #358c9f)" },
] as const;

export default function EducationPage() {
  const t = useTranslations("education");
  const [mounted, setMounted] = useState(false);
  const [selectedEdu, setSelectedEdu] = useState<{ key: string; icon: React.ReactNode; title: string; school: string; description: string; href: string; years: string; type: string; gradient: string } | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [weakDevice, setWeakDevice] = useState(false);

  const educationItems = useMemo(
    () =>
      EDUCATION_CONFIG.map((config) => {
        const item = t.raw(`items.${config.key}`) as { title: string; school: string; description: string };
        return {
          ...config,
          title: item.title,
          school: item.school,
          description: item.description,
        };
      }),
    [t]
  );

  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setReducedMotion(media.matches);
      setIsMobile(window.innerWidth < 768);
      const lowCpu = (navigator.hardwareConcurrency || 8) < 6;
      const lowMem = "deviceMemory" in navigator && (navigator as Navigator & { deviceMemory?: number }).deviceMemory! <= 4;
      setWeakDevice(lowCpu || !!lowMem);
    };
    update();
    media.addEventListener("change", update);
    window.addEventListener("resize", update);
    return () => {
      media.removeEventListener("change", update);
      window.removeEventListener("resize", update);
    };
  }, []);
  const showPrismatic = !reducedMotion && !weakDevice;

  return (
    <div className="portfolio-page">
      <PortfolioPageHero
        className="education-hero"
        kicker={t("badge")}
        title={t("title")}
        tagline={t("tagline")}
        scrollTargetId="education"
        mounted={mounted}
        background={
          showPrismatic ? (
            <PrismaticBurst
              animationType="rotate3d"
              intensity={isMobile ? 1.2 : 2}
              speed={isMobile ? 0.35 : 0.5}
              distort={0}
              paused={false}
              offset={{ x: 0, y: 0 }}
              hoverDampness={0.25}
              rayCount={0}
              mixBlendMode="lighten"
              colors={["#4eb3c8", "#358c9f", "#ffffff"]}
            />
          ) : (
            <HomeHeroBackground />
          )
        }
      />

      {/* Education Section - Dark mode */}
      <section id="education" style={{ 
        background: '#030d14',
        padding: '5rem 2rem',
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Centered Header */}
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <p 
              style={{ 
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: '#4eb3c8',
                marginBottom: '0.75rem',
              }}
            >
              {t("academicBackground")}
            </p>
            <h2 
              style={{ 
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
                fontWeight: 700,
                color: '#f8fafc',
              }}
            >
              {t("educationTimeline")}
            </h2>
          </div>

          {/* Timeline-style Education */}
          <div style={{ 
            maxWidth: '700px',
            margin: '0 auto',
            position: 'relative',
          }}>
            {/* Timeline Line */}
            <div 
              style={{
                position: 'absolute',
                left: '2rem',
                top: 0,
                bottom: 0,
                width: '2px',
                background: 'linear-gradient(180deg, var(--accent-primary), var(--accent-secondary))',
                opacity: 0.3,
              }}
            />

            {educationItems.map((item, index) => (
              <div
                key={index}
                className="edu-item"
                style={{
                  position: 'relative',
                  marginBottom: '2rem',
                  paddingLeft: '5rem',
                  ["--edu-gradient" as string]: item.gradient,
                }}
              >
                {/* Timeline Dot */}
                <div
                  className="edu-dot"
                  style={{
                    position: 'absolute',
                    left: '1.5rem',
                    top: '1.5rem',
                    width: '1rem',
                    height: '1rem',
                    borderRadius: '50%',
                    background: '#4eb3c8',
                    border: '3px solid #12121a',
                    zIndex: 2,
                    transition: 'all 0.3s ease',
                    transform: 'scale(1)',
                    boxShadow: 'none',
                  }}
                />

                {/* Education Card */}
                <div
                  className="edu-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedEdu(item)}
                  onKeyDown={(e) => e.key === 'Enter' && setSelectedEdu(item)}
                  style={{
                    display: 'block',
                    padding: '1.75rem 2rem',
                    borderRadius: '20px',
                    background: 'rgba(26, 26, 36, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    backdropFilter: isMobile ? 'none' : 'blur(20px)',
                    cursor: 'pointer',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: 'translateX(0) scale(1)',
                    boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.3)',
                  }}
                >
                  {/* Gradient Overlay on Hover */}
                  <div
                    className="edu-overlay"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: item.gradient,
                      opacity: 0,
                      borderRadius: '20px',
                      transition: 'opacity 0.4s ease',
                      pointerEvents: 'none',
                    }}
                  />

                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: '1.25rem',
                    position: 'relative',
                    zIndex: 1,
                  }}>
                    {/* Icon */}
                    <div
                      className="edu-icon"
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(16, 185, 129, 0.2)',
                        color: '#4eb3c8',
                        flexShrink: 0,
                        transition: 'all 0.4s ease',
                        transform: 'rotate(0) scale(1)',
                        boxShadow: 'none',
                      }}
                    >
                      {item.icon}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1 }}>
                      <h3
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: '1.25rem',
                          fontWeight: 700,
                          color: '#f8fafc',
                          marginBottom: '0.5rem',
                        }}
                      >
                        {item.title}
                      </h3>
                      <p
                        style={{
                          fontFamily: 'var(--font-body)',
                          fontSize: '0.95rem',
                          color: '#94a3b8',
                          marginBottom: '0.75rem',
                        }}
                      >
                        {item.school}
                      </p>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.85rem',
                          color: '#64748b',
                        }}
                      >
                        <span
                          className="edu-years-pill"
                          style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '100px',
                            background: 'rgba(16, 185, 129, 0.2)',
                            color: '#4eb3c8',
                            fontWeight: 600,
                            transition: 'all 0.3s ease',
                          }}
                        >
                          {item.years}
                        </span>
                      </div>
                    </div>

                    {/* Arrow */}
                    <svg 
                      className="edu-arrow"
                      width="20" 
                      height="20" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor"
                      strokeWidth="2"
                      style={{
                        color: '#64748b',
                        transition: 'all 0.3s ease',
                        transform: 'translateX(0)',
                        opacity: 0.5,
                      }}
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modal Education */}
      {selectedEdu && (
        <div
          onClick={() => setSelectedEdu(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              backgroundColor: '#142a38',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '28px',
              padding: '48px',
              maxWidth: '540px',
              width: '100%',
              overflow: 'hidden',
            }}
          >
            {/* Glow */}
            <div
              style={{
                position: 'absolute',
                top: '-80px',
                right: '-80px',
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 65%)',
                filter: 'blur(50px)',
                pointerEvents: 'none',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '-60px',
                left: '-60px',
                width: '160px',
                height: '160px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(5, 150, 105, 0.15) 0%, transparent 65%)',
                filter: 'blur(40px)',
                pointerEvents: 'none',
              }}
            />

            {/* Header: Icon + Close */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '20px',
                position: 'relative',
                zIndex: 1,
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  background: selectedEdu.gradient,
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  flexShrink: 0,
                }}
              >
                {selectedEdu.icon}
              </div>
              <button
                onClick={() => setSelectedEdu(null)}
                aria-label={t("close")}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: '18px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'background 0.2s, color 0.2s',
                }}
              >
                ✕
              </button>
            </div>

            {/* Type label */}
            <span
              style={{
                display: 'inline-block',
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                fontSize: '0.7rem',
                fontWeight: 600,
                color: 'rgba(16, 185, 129, 0.95)',
                marginBottom: '10px',
                position: 'relative',
                zIndex: 1,
              }}
            >
              {t(`types.${selectedEdu.type}`)}
            </span>

            {/* Title */}
            <h2
              style={{
                color: '#f8fafc',
                fontSize: '1.35rem',
                fontWeight: 700,
                margin: '0 0 6px',
                fontFamily: 'var(--font-display)',
                lineHeight: 1.3,
                position: 'relative',
                zIndex: 1,
              }}
            >
              {selectedEdu.title}
            </h2>

            {/* Institution */}
            <p
              style={{
                color: '#94a3b8',
                fontSize: '0.95rem',
                margin: '0 0 12px',
                fontFamily: 'var(--font-body)',
                position: 'relative',
                zIndex: 1,
              }}
            >
              {selectedEdu.school}
            </p>

            {/* Description */}
            {selectedEdu.description && (
              <p
                style={{
                  color: 'rgba(248, 250, 252, 0.75)',
                  fontSize: '0.9rem',
                  lineHeight: 1.55,
                  margin: '0 0 20px',
                  fontFamily: 'var(--font-body)',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                {selectedEdu.description}
              </p>
            )}

            {/* Footer: Years + Link button */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '12px',
                position: 'relative',
                zIndex: 1,
              }}
            >
              <span
                style={{
                  padding: '0.4rem 1rem',
                  borderRadius: '100px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#4eb3c8',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {selectedEdu.years}
              </span>
              {selectedEdu.href && (
                <a
                  href={selectedEdu.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.6rem 1.25rem',
                    background: selectedEdu.gradient,
                    color: 'white',
                    borderRadius: '12px',
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    transition: 'transform 0.2s, box-shadow 0.2s, opacity 0.2s',
                    boxShadow: '0 4px 16px rgba(99, 102, 241, 0.25)',
                  }}
                >
                  {t("viewMoreInfo")}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

