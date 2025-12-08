"use client";

import { spaceGrotesk, outfit, jetbrainsMono } from "./fonts";
import ScrollButton from "@/components/ScrollButton";
import CurriculumButton from "@/components/CurriculumButton";
import { useEffect, useState } from "react";

const navCards = [
  { 
    href: "/proyectos", 
    title: "Projects", 
    description: "Explore my creative work and technical projects",
    gradient: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
    number: "01"
  },
  { 
    href: "/skills", 
    title: "Skills", 
    description: "Technologies and tools I work with",
    gradient: "linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
    number: "02"
  },
  { 
    href: "/experience", 
    title: "Experience", 
    description: "My professional journey and work experience",
    gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
    number: "03"
  },
  { 
    href: "/education", 
    title: "Education", 
    description: "My academic background and achievements",
    gradient: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #4f46e5 100%)",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c0 1.1.9 2 2 2h3" />
      </svg>
    ),
    number: "04"
  },
  { 
    href: "/about-me", 
    title: "About Me", 
    description: "Get to know me and my background",
    gradient: "linear-gradient(135deg, #ec4899 0%, #db2777 50%, #be185d 100%)",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    number: "05"
  },
  { 
    href: "/contact", 
    title: "Contact", 
    description: "Let's connect and work together",
    gradient: "linear-gradient(135deg, #06b6d4 0%, #0891b2 50%, #0e7490 100%)",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
    number: "06"
  },
];

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      {/* HERO SECTION */}
      <section className="hero-section" style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="hero-grid" />
        
        {/* Animated Background Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Orb 1 - Slow Moving */}
          <div 
            className="absolute rounded-full blur-[120px] opacity-25"
            style={{
              width: '600px',
              height: '600px',
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              top: "10%",
              left: "20%",
              animation: "floatOrb1 60s ease-in-out infinite",
            }}
          />
          {/* Orb 2 - Slow Moving */}
          <div 
            className="absolute rounded-full blur-[100px] opacity-20"
            style={{
              width: '500px',
              height: '500px',
              background: "linear-gradient(135deg, #a855f7, #6366f1)",
              bottom: "20%",
              right: "15%",
              animation: "floatOrb2 70s ease-in-out infinite reverse",
            }}
          />
          {/* Orb 3 - Floating */}
          <div 
            className="absolute rounded-full blur-[80px] opacity-15"
            style={{
              width: '400px',
              height: '400px',
              background: "linear-gradient(135deg, #8b5cf6, #a855f7)",
              top: "50%",
              left: "50%",
              transform: 'translate(-50%, -50%)',
              animation: "floatOrb3 80s ease-in-out infinite",
            }}
          />
          {/* Orb 4 - Additional floating */}
          <div 
            className="absolute rounded-full blur-[90px] opacity-18"
            style={{
              width: '450px',
              height: '450px',
              background: "linear-gradient(135deg, #6366f1, #a855f7)",
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
              radial-gradient(circle at 30% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 70% 80%, rgba(139, 92, 246, 0.12) 0%, transparent 50%),
              radial-gradient(circle at 50% 50%, rgba(168, 85, 247, 0.08) 0%, transparent 50%)
            `,
            animation: 'pulseBg 30s ease-in-out infinite',
          }}
        />

        {/* Rising Lines - Inverted Rain */}
        {[...Array(15)].map((_, i) => {
          const width = Math.random() * 2 + 1;
          const height = Math.random() * 200 + 100;
          const left = Math.random() * 100;
          const duration = Math.random() * 8 + 6;
          const delay = Math.random() * 5;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: `${width}px`,
                height: `${height}px`,
                background: `linear-gradient(to top, rgba(${Math.random() > 0.5 ? '99, 102, 241' : '139, 92, 246'}, 0), rgba(${Math.random() > 0.5 ? '99, 102, 241' : '139, 92, 246'}, ${Math.random() * 0.4 + 0.2}))`,
                left: `${left}%`,
                bottom: '-200px',
                borderRadius: '2px',
                animation: `riseLine ${duration}s linear infinite`,
                animationDelay: `${delay}s`,
                boxShadow: `0 0 ${Math.random() * 10 + 5}px rgba(${Math.random() > 0.5 ? '99, 102, 241' : '139, 92, 246'}, 0.3)`,
              }}
            />
          );
        })}

        {/* Content */}
        <div 
          className={`relative z-10 flex flex-col items-center text-center px-6 ${mounted ? 'opacity-100' : 'opacity-0'}`}
          style={{ transition: 'opacity 0.8s ease-out' }}
        >
          <div 
            className={`${jetbrainsMono.className} ${mounted ? 'animate-fade-in-up' : ''}`}
            style={{ 
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
                color: 'rgba(99, 102, 241, 0.9)',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                borderRadius: '50px',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 4px 20px rgba(99, 102, 241, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <span style={{ position: 'relative', zIndex: 1 }}>Software Engineer & Developer</span>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.1), transparent)',
                  animation: 'shimmer 3s ease-in-out infinite',
                }}
              />
            </div>
          </div>

          <h1 
            className={`${spaceGrotesk.className} hero-title ${mounted ? 'animate-fade-in-up' : ''}`}
            style={{ animationDelay: '0.2s', animationFillMode: 'both' }}
          >
            <span className="gradient-text">PAU</span>
            <br />
            <span style={{ color: 'var(--text-primary)' }}>PEDREJON</span>
          </h1>

          <p 
            className={`${outfit.className} hero-tagline ${mounted ? 'animate-fade-in-up' : ''}`}
            style={{ animationDelay: '0.4s', animationFillMode: 'both' }}
          >
            Crafting immersive digital experiences through code, design, and creative technology.
          </p>

          <div 
            className={`flex flex-wrap gap-4 justify-center mt-10 ${mounted ? 'animate-fade-in-up' : ''}`}
            style={{ animationDelay: '0.5s', animationFillMode: 'both' }}
          >
            <CurriculumButton 
              href="/PauPedrejonCV.pdf" 
              bgColor="var(--accent-primary)" 
              textColor="#ffffff" 
            />
            <a href="/proyectos" className="btn-secondary">
              View Projects
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          </div>

          <div 
            className={`scroll-wrap ${mounted ? 'animate-fade-in' : ''}`}
            style={{ animationDelay: '0.8s', animationFillMode: 'both', marginTop: '4rem' }}
          >
            <ScrollButton targetId="sections" color="transparent" iconColor="var(--text-secondary)" />
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
      </section>

      {/* NAVIGATION SECTION */}
      <section
        id="sections"
        className="relative px-6 md:px-12 lg:px-16"
        style={{ 
          background: 'var(--bg-secondary)', 
          position: 'relative', 
          overflow: 'hidden',
          paddingTop: '5rem',
          paddingBottom: '8rem',
        }}
      >
        {/* Animated Background */}
        <div 
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              radial-gradient(circle at 20% 30%, rgba(99, 102, 241, 0.08) 0%, transparent 50%),
              radial-gradient(circle at 80% 70%, rgba(139, 92, 246, 0.08) 0%, transparent 50%)
            `,
            animation: 'pulseBg 30s ease-in-out infinite',
          }}
        />

        {/* Latest Project Section */}
        <div style={{ marginBottom: '8rem', position: 'relative', zIndex: 1 }}>
          {/* Animated Background Elements */}
          <div
            style={{
              position: 'absolute',
              top: '-50px',
              left: '10%',
              width: '300px',
              height: '300px',
              background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
              borderRadius: '50%',
              filter: 'blur(60px)',
              animation: 'floatOrb1 20s ease-in-out infinite',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-50px',
              right: '10%',
              width: '250px',
              height: '250px',
              background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
              borderRadius: '50%',
              filter: 'blur(60px)',
              animation: 'floatOrb2 25s ease-in-out infinite reverse',
            }}
          />

          <div style={{ textAlign: 'center', marginBottom: '3rem', position: 'relative', zIndex: 2 }}>
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
                marginBottom: '1rem',
                fontFamily: 'var(--font-mono)',
              }}
            >
              <span style={{ position: 'relative', zIndex: 1 }}>Latest Release</span>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.1), transparent)',
                  animation: 'shimmer 3s ease-in-out infinite',
                }}
              />
            </div>
            <h2 
              className={spaceGrotesk.className}
              style={{ 
                fontSize: 'clamp(2rem, 5vw, 3rem)',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: '0.5rem',
              }}
            >
              What&apos;s New
            </h2>
            <p
              className={outfit.className}
              style={{
                fontSize: '1.1rem',
                color: 'var(--text-secondary)',
                maxWidth: '600px',
                margin: '0 auto',
              }}
            >
              Introducing my latest innovation in educational technology
            </p>
          </div>
          
          {/* Latest Project Card - Enhanced */}
          <div
            style={{
              maxWidth: '1000px',
              margin: '0 auto',
              position: 'relative',
              zIndex: 2,
            }}
          >
            <div
              style={{
                background: '#ffffff',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                borderRadius: '24px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.02) inset',
                overflow: 'hidden',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px) scale(1.01)';
                e.currentTarget.style.boxShadow = '0 30px 80px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.04) inset';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.02) inset';
              }}
              onClick={() => window.location.href = '/study-agents'}
            >
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'auto 1fr',
                gap: '2.5rem',
                padding: '1.5rem 2.5rem',
                alignItems: 'center',
                position: 'relative',
                zIndex: 1,
              }}>
                {/* Logo Section */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '180px',
                    height: '180px',
                    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                    borderRadius: '20px',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    padding: '1.5rem',
                    position: 'relative',
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.3), transparent)',
                      animation: 'shimmer 4s ease-in-out infinite',
                    }}
                  />
                  <img
                    src="/StudyAgentsLogo.png"
                    alt="StudyAgents Logo"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      position: 'relative',
                      zIndex: 1,
                    }}
                  />
                </div>

                {/* Content Section */}
                <div style={{ flex: '1' }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.35rem 0.9rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'rgba(99, 102, 241, 0.9)',
                      background: 'rgba(99, 102, 241, 0.08)',
                      borderRadius: '8px',
                      marginBottom: '0.25rem',
                      marginTop: '-0.5rem',
                      fontFamily: 'var(--font-mono)',
                      border: '1px solid rgba(99, 102, 241, 0.15)',
                    }}
                  >
                    <span>2025 - Instituto de Inteligencia Artificial</span>
                  </div>
                  
                  <h3 
                    className={spaceGrotesk.className}
                    style={{ 
                      fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
                      fontWeight: 700,
                      color: '#1a1a1a',
                      marginBottom: '0.75rem',
                      lineHeight: '1.2',
                    }}
                  >
                    StudyAgents
                  </h3>
                  
                  <p
                    className={outfit.className}
                    style={{
                      fontSize: '1rem',
                      color: '#666666',
                      marginBottom: '1.5rem',
                      lineHeight: '1.7',
                    }}
                  >
                    An intelligent AI-powered learning assistant that revolutionizes how students study. Upload PDFs, generate comprehensive notes with visual diagrams, ask questions in natural language, and take interactive tests with real-time feedback.
                  </p>
                  
                  {/* Agents Section Header */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginBottom: '1rem',
                    }}
                  >
                    <svg 
                      width="24" 
                      height="24" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      style={{ color: '#6366f1' }}
                    >
                      <path d="M12 2L2 7l10 5 10-5-10-5z" />
                      <path d="M2 17l10 5 10-5" />
                      <path d="M2 12l10 5 10-5" />
                    </svg>
                    <h4
                      className={spaceGrotesk.className}
                      style={{
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        color: '#1a1a1a',
                        margin: 0,
                      }}
                    >
                      Agentes
                    </h4>
                  </div>
                  
                  {/* Agents */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                      gap: '0.75rem',
                      marginBottom: '1.5rem',
                    }}
                  >
                    {[
                      { 
                        name: 'Content Processor', 
                        icon: (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                            <polyline points="10 9 9 9 8 9" />
                          </svg>
                        )
                      },
                      { 
                        name: 'Explanation Agent', 
                        icon: (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                            <line x1="10" y1="9" x2="8" y2="9" />
                          </svg>
                        )
                      },
                      { 
                        name: 'Q&A Assistant', 
                        icon: (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                          </svg>
                        )
                      },
                      { 
                        name: 'Test Generator', 
                        icon: (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                            <polyline points="10 9 9 9 8 9" />
                          </svg>
                        )
                      },
                      { 
                        name: 'Feedback Agent', 
                        icon: (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                          </svg>
                        )
                      },
                    ].map((agent, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.75rem 1rem',
                          background: 'rgba(99, 102, 241, 0.05)',
                          borderRadius: '10px',
                          border: '1px solid rgba(99, 102, 241, 0.1)',
                          fontSize: '0.85rem',
                          color: '#1a1a1a',
                          fontWeight: 500,
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                          e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(99, 102, 241, 0.05)';
                          e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.1)';
                        }}
                      >
                        <span style={{ color: '#6366f1', display: 'flex', alignItems: 'center' }}>
                          {agent.icon}
                        </span>
                        <span>{agent.name}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Tech Stack */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                      marginBottom: '1.5rem',
                    }}
                  >
                    {['Next.js', 'React', 'TypeScript', 'Python', 'FastAPI', 'LangChain', 'OpenAI'].map((tech) => (
                      <span
                        key={tech}
                        style={{
                          padding: '0.35rem 0.85rem',
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          color: '#6366f1',
                          background: 'rgba(99, 102, 241, 0.08)',
                          borderRadius: '8px',
                          fontFamily: 'var(--font-mono)',
                          border: '1px solid rgba(99, 102, 241, 0.15)',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)';
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(99, 102, 241, 0.08)';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                  
                  {/* CTA Button */}
                  <a
                    href="/study-agents"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.9rem 2rem',
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: 'white',
                      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                      borderRadius: '12px',
                      textDecoration: 'none',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 20px rgba(99, 102, 241, 0.3)',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 8px 30px rgba(99, 102, 241, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                      e.currentTarget.style.boxShadow = '0 4px 20px rgba(99, 102, 241, 0.3)';
                    }}
                  >
                    <span>Try StudyAgents</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                        transform: 'translateX(-100%)',
                        transition: 'transform 0.6s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateX(100%)';
                      }}
                    />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section Header - Centered */}
        <div style={{ textAlign: 'center', marginBottom: '4rem', position: 'relative', zIndex: 1 }}>
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
              color: 'rgba(99, 102, 241, 0.9)',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: '50px',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 20px rgba(99, 102, 241, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              position: 'relative',
              overflow: 'hidden',
              marginBottom: '1rem',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <span style={{ position: 'relative', zIndex: 1 }}>Navigation</span>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.1), transparent)',
                animation: 'shimmer 3s ease-in-out infinite',
              }}
            />
          </div>
          <h2 
            className={spaceGrotesk.className}
            style={{ 
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: '1rem',
            }}
          >
            Explore My Work
          </h2>
          <p
            className={outfit.className}
            style={{
              fontSize: '1.1rem',
              color: 'var(--text-secondary)',
              maxWidth: '500px',
              margin: '0 auto',
            }}
          >
            Discover what I do and how I can help bring your ideas to life
          </p>
        </div>

        {/* Navigation Cards - Centered Grid */}
        <div 
          style={{ 
            maxWidth: '1000px', 
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {navCards.map((card, index) => (
            <a 
              key={card.href}
              href={card.href}
              onMouseEnter={() => setHoveredCard(index)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                padding: '2rem',
                borderRadius: '24px',
                background: 'rgba(26, 26, 36, 0.6)',
                border: '1px solid rgba(148, 163, 184, 0.1)',
                backdropFilter: 'blur(20px)',
                textDecoration: 'none',
                overflow: 'hidden',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: hoveredCard === index ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
                boxShadow: hoveredCard === index 
                  ? '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(99, 102, 241, 0.2)' 
                  : '0 10px 40px -10px rgba(0, 0, 0, 0.3)',
              }}
            >
              {/* Gradient Background on Hover */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: card.gradient,
                  opacity: hoveredCard === index ? 0.15 : 0,
                  transition: 'opacity 0.4s ease',
                }}
              />

              {/* Animated Border */}
              <div
                style={{
                  position: 'absolute',
                  inset: -1,
                  borderRadius: '24px',
                  background: card.gradient,
                  opacity: hoveredCard === index ? 1 : 0,
                  transition: 'opacity 0.4s ease',
                  mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  maskComposite: 'exclude',
                  WebkitMaskComposite: 'xor',
                  padding: '2px',
                }}
              />

              {/* Number Badge */}
              <span
                className={jetbrainsMono.className}
                style={{
                  position: 'absolute',
                  top: '1.5rem',
                  right: '1.5rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: hoveredCard === index ? 'white' : 'var(--text-muted)',
                  opacity: 0.5,
                  transition: 'all 0.3s ease',
                }}
              >
                {card.number}
              </span>

              {/* Icon */}
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: hoveredCard === index ? card.gradient : 'rgba(99, 102, 241, 0.1)',
                  color: hoveredCard === index ? 'white' : 'var(--accent-primary)',
                  marginBottom: '1.5rem',
                  transition: 'all 0.4s ease',
                  transform: hoveredCard === index ? 'scale(1.1) rotate(-5deg)' : 'scale(1) rotate(0)',
                }}
              >
                {card.icon}
              </div>

              {/* Content */}
              <h3
                className={spaceGrotesk.className}
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '0.5rem',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                {card.title}
              </h3>

              <p
                className={outfit.className}
                style={{
                  fontSize: '0.9rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  marginBottom: '1.5rem',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                {card.description}
              </p>

              {/* Arrow */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginTop: 'auto',
                  color: hoveredCard === index ? 'white' : 'var(--accent-primary)',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                <span className={outfit.className}>Explore</span>
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                  style={{
                    transition: 'transform 0.3s ease',
                    transform: hoveredCard === index ? 'translateX(5px)' : 'translateX(0)',
                  }}
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>

              {/* Shine Effect */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
                  transition: 'left 0.5s ease',
                  ...(hoveredCard === index && { left: '100%' }),
                }}
              />
            </a>
          ))}
        </div>
      </section>
    </>
  );
}
