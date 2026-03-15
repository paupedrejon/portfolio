"use client";

import { useEffect, useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import ScrollButton from "@/components/ScrollButton";
import { leagueSpartan } from "@/app/fonts";
import CurriculumButton from "@/components/CurriculumButton";
import PrismaticBurst from "@/components/PrismaticBurst";
import { FaUniversity, FaGraduationCap, FaCertificate } from "react-icons/fa";

const EDUCATION_CONFIG = [
  { key: "iia10x", icon: <FaCertificate size={24} />, href: "https://www.credential.net/9340a704-7896-4104-b745-d6e2c9605eb0#acc.zYw8lsuv", years: "2025–2026", type: "certificate" as const, gradient: "linear-gradient(135deg, #6366f1, #8b5cf6)" },
  { key: "upcDegree", icon: <FaGraduationCap size={24} />, href: "https://www.upc.edu/ca/graus/enginyeria-informatica-barcelona-fib", years: "2023–2027*", type: "degree" as const, gradient: "linear-gradient(135deg, #10b981, #059669)" },
  { key: "unityCourse", icon: <FaCertificate size={24} />, href: "https://www.fib.upc.edu/es/noticias/cursos-vgafib-febrero-2022", years: "2024", type: "course" as const, gradient: "linear-gradient(135deg, #f59e0b, #d97706)" },
  { key: "itbDiploma", icon: <FaUniversity size={24} />, href: "https://itecbcn.eu/portfolio/batxillerat-tecnologic-digital/", years: "2021–2023", type: "diploma" as const, gradient: "linear-gradient(135deg, #ec4899, #db2777)" },
] as const;

export default function EducationPage() {
  const t = useTranslations("education");
  const [mounted, setMounted] = useState(false);
  const [hoveredEdu, setHoveredEdu] = useState<number | null>(null);
  const [selectedEdu, setSelectedEdu] = useState<{ key: string; icon: React.ReactNode; title: string; school: string; description: string; href: string; years: string; type: string; gradient: string } | null>(null);

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

  return (
    <>
      {/* Hero Section */}
      <section className="hero-section" style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="hero-grid" />

        {/* PrismaticBurst Background */}
        <div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}>
          <PrismaticBurst
            animationType="rotate3d"
            intensity={2}
            speed={0.5}
            distort={0}
            paused={false}
            offset={{ x: 0, y: 0 }}
            hoverDampness={0.25}
            rayCount={0}
            mixBlendMode="lighten"
            colors={['#10b981', '#059669', '#ffffff']}
          />
        </div>
        
        {/* Animated Background Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute rounded-full blur-[120px] opacity-25"
            style={{
              width: '600px',
              height: '600px',
              background: "linear-gradient(135deg, #10b981, #059669)",
              top: "15%",
              left: "15%",
              animation: "floatOrb1 60s ease-in-out infinite",
            }}
          />
          <div 
            className="absolute rounded-full blur-[100px] opacity-20"
            style={{
              width: '500px',
              height: '500px',
              background: "linear-gradient(135deg, #059669, #047857)",
              bottom: "20%",
              right: "20%",
              animation: "floatOrb2 70s ease-in-out infinite reverse",
            }}
          />
          <div 
            className="absolute rounded-full blur-[80px] opacity-15 transition-all duration-500"
            style={{
              width: '400px',
              height: '400px',
              background: "linear-gradient(135deg, #10b981, #059669)",
              top: "50%",
              left: "50%",
              transform: 'translate(-50%, -50%)',
              animation: "floatOrb3 80s ease-in-out infinite",
            }}
          />
        </div>

        {/* Animated Background Pattern */}
        <div 
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              radial-gradient(circle at 30% 20%, rgba(16, 185, 129, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 70% 80%, rgba(5, 150, 105, 0.12) 0%, transparent 50%),
              radial-gradient(circle at 50% 50%, rgba(4, 120, 87, 0.08) 0%, transparent 50%)
            `,
            animation: 'pulseBg 30s ease-in-out infinite',
          }}
        />

        {/* Rising Lines - Inverted Rain (deterministic to avoid hydration mismatch) */}
        {[...Array(15)].map((_, i) => {
          const s = (i * 2654435761) % 10000 / 10000;
          const t = ((i + 1) * 1597334677) % 10000 / 10000;
          const u = ((i + 2) * 32416190071) % 10000 / 10000;
          const v = ((i + 3) * 2038074743) % 10000 / 10000;
          const w = ((i + 4) * 2166136261) % 10000 / 10000;
          const width = s * 2 + 1;
          const height = t * 200 + 100;
          const left = u * 100;
          const duration = v * 8 + 6;
          const delay = w * 5;
          const color1 = s > 0.5 ? '16, 185, 129' : '5, 150, 105';
          const color2 = t > 0.5 ? '16, 185, 129' : '5, 150, 105';
          const opacity = u * 0.4 + 0.2;
          const shadowSize = v * 10 + 5;
          const shadowColor = w > 0.5 ? '16, 185, 129' : '5, 150, 105';
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: `${width}px`,
                height: `${height}px`,
                background: `linear-gradient(to top, rgba(${color1}, 0), rgba(${color2}, ${opacity}))`,
                left: `${left}%`,
                bottom: '-200px',
                borderRadius: '2px',
                animation: `riseLine ${duration}s linear infinite`,
                animationDelay: `${delay}s`,
                boxShadow: `0 0 ${shadowSize}px rgba(${shadowColor}, 0.3)`,
              }}
            />
          );
        })}

        <div 
          className={`relative z-10 flex flex-col items-center text-center px-6 ${mounted ? 'opacity-100' : 'opacity-0'}`}
          style={{ transition: 'opacity 0.8s ease-out' }}
        >
          <div 
            className={`${mounted ? 'animate-fade-in-up' : ''}`}
            style={{ 
              fontFamily: 'var(--font-mono)',
              animationDelay: '0.1s',
              animationFillMode: 'both',
              marginBottom: '1.5rem',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1.25rem',
                fontSize: '0.75rem',
                fontWeight: 500,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'rgba(16, 185, 129, 0.9)',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '50px',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 4px 20px rgba(16, 185, 129, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <span style={{ position: 'relative', zIndex: 1 }}>Academic Journey</span>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.1), transparent)',
                  animation: 'shimmer 3s ease-in-out infinite',
                }}
              />
            </div>
          </div>

          <h1 
            className={`${leagueSpartan.className} hero-title ${mounted ? 'animate-fade-in-up' : ''}`}
            style={{ 
              color: '#ffffff',
              animationDelay: '0.2s',
              animationFillMode: 'both'
            }}
          >
            {t("title")}
          </h1>

          <p 
            className={`hero-tagline ${mounted ? 'animate-fade-in-up' : ''}`}
            style={{ 
              fontFamily: 'var(--font-body)',
              animationDelay: '0.3s',
              animationFillMode: 'both'
            }}
          >
            {t("tagline")}
          </p>

          <div 
            className={`flex flex-wrap gap-4 justify-center mt-8 ${mounted ? 'animate-fade-in-up' : ''}`}
            style={{ animationDelay: '0.4s', animationFillMode: 'both' }}
          >
            <CurriculumButton href="/PauPedrejonCV.pdf" />
          </div>

          <div 
            className={`scroll-wrap ${mounted ? 'animate-fade-in' : ''}`}
            style={{ animationDelay: '0.6s', animationFillMode: 'both', marginTop: '3rem' }}
          >
            <ScrollButton targetId="education" color="transparent" iconColor="var(--text-secondary)" />
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
            0% {
              transform: translateY(0);
              opacity: 0;
            }
            10% {
              opacity: 1;
            }
            90% {
              opacity: 1;
            }
            100% {
              transform: translateY(calc(-100vh - 200px));
              opacity: 0;
            }
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

        {/* Suavizado negro hacia arriba (transición al siguiente apartado) */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '120px',
            background: 'linear-gradient(to top, #0a0a0f 0%, transparent 100%)',
            pointerEvents: 'none',
            zIndex: 5,
          }}
        />
      </section>

      {/* Education Section - Dark mode */}
      <section id="education" style={{ 
        background: '#0a0a0f',
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
                color: '#10b981',
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
                onMouseEnter={() => setHoveredEdu(index)}
                onMouseLeave={() => setHoveredEdu(null)}
                style={{
                  position: 'relative',
                  marginBottom: '2rem',
                  paddingLeft: '5rem',
                }}
              >
                {/* Timeline Dot */}
                <div
                  style={{
                    position: 'absolute',
                    left: '1.5rem',
                    top: '1.5rem',
                    width: '1rem',
                    height: '1rem',
                    borderRadius: '50%',
                    background: hoveredEdu === index ? item.gradient : '#10b981',
                    border: '3px solid #12121a',
                    zIndex: 2,
                    transition: 'all 0.3s ease',
                    transform: hoveredEdu === index ? 'scale(1.3)' : 'scale(1)',
                    boxShadow: hoveredEdu === index ? `0 0 20px ${item.gradient.split(',')[0].replace('linear-gradient(135deg, ', '').replace(')', '')}` : 'none',
                  }}
                />

                {/* Education Card */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedEdu(item)}
                  onKeyDown={(e) => e.key === 'Enter' && setSelectedEdu(item)}
                  style={{
                    display: 'block',
                    padding: '1.75rem 2rem',
                    borderRadius: '20px',
                    background: 'rgba(26, 26, 36, 0.9)',
                    border: `1px solid ${hoveredEdu === index ? 'rgba(16, 185, 129, 0.5)' : 'rgba(255, 255, 255, 0.08)'}`,
                    backdropFilter: 'blur(20px)',
                    cursor: 'pointer',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: hoveredEdu === index ? 'translateX(10px) scale(1.02)' : 'translateX(0) scale(1)',
                    boxShadow: hoveredEdu === index 
                      ? '0 20px 40px -10px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(16, 185, 129, 0.3)' 
                      : '0 10px 30px -10px rgba(0, 0, 0, 0.3)',
                  }}
                >
                  {/* Gradient Overlay on Hover */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: item.gradient,
                      opacity: hoveredEdu === index ? 0.1 : 0,
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
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: hoveredEdu === index ? item.gradient : 'rgba(16, 185, 129, 0.2)',
                        color: hoveredEdu === index ? 'white' : '#10b981',
                        flexShrink: 0,
                        transition: 'all 0.4s ease',
                        transform: hoveredEdu === index ? 'rotate(-5deg) scale(1.1)' : 'rotate(0) scale(1)',
                        boxShadow: hoveredEdu === index ? '0 10px 25px rgba(16, 185, 129, 0.4)' : 'none',
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
                          style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '100px',
                            background: hoveredEdu === index ? item.gradient : 'rgba(16, 185, 129, 0.2)',
                            color: hoveredEdu === index ? 'white' : '#10b981',
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
                      width="20" 
                      height="20" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke={hoveredEdu === index ? '#10b981' : '#64748b'}
                      strokeWidth="2"
                      style={{
                        transition: 'all 0.3s ease',
                        transform: hoveredEdu === index ? 'translateX(5px)' : 'translateX(0)',
                        opacity: hoveredEdu === index ? 1 : 0.5,
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
              backgroundColor: '#0c0c14',
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
                  color: '#10b981',
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
    </>
  );
}

