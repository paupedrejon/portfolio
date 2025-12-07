"use client";

import { useEffect, useState } from "react";
import AdaptiveCardsRow from "@/components/AdaptiveCardsRow";
import SkillItem from "@/components/SkillItem";
import ScrollButton from "@/components/ScrollButton";
import CurriculumButton from "@/components/CurriculumButton";

import ReactCountryFlag from "react-country-flag";
import { FaMapMarkerAlt } from "react-icons/fa";

export default function AboutMePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      {/* Hero Section */}
      <section className="hero-section" style={{ minHeight: '80vh', position: 'relative', overflow: 'hidden' }}>
        <div className="hero-grid" />
        
        {/* Animated Background Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute rounded-full blur-[120px] opacity-25"
            style={{
              width: '600px',
              height: '600px',
              background: "linear-gradient(135deg, #a855f7, #6366f1)",
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
              background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
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
              background: "linear-gradient(135deg, #a855f7, #6366f1)",
              top: "50%",
              left: "50%",
              transform: 'translate(-50%, -50%)',
              animation: "floatOrb3 80s ease-in-out infinite",
              transform: 'translate(-50%, -50%)',
            }}
          />
        </div>

        {/* Animated Background Pattern */}
        <div 
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              radial-gradient(circle at 30% 20%, rgba(168, 85, 247, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 70% 80%, rgba(139, 92, 246, 0.12) 0%, transparent 50%),
              radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.08) 0%, transparent 50%)
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
                background: `linear-gradient(to top, rgba(${Math.random() > 0.5 ? '168, 85, 247' : '139, 92, 246'}, 0), rgba(${Math.random() > 0.5 ? '168, 85, 247' : '139, 92, 246'}, ${Math.random() * 0.4 + 0.2}))`,
                left: `${left}%`,
                bottom: '-200px',
                borderRadius: '2px',
                animation: `riseLine ${duration}s linear infinite`,
                animationDelay: `${delay}s`,
                boxShadow: `0 0 ${Math.random() * 10 + 5}px rgba(${Math.random() > 0.5 ? '168, 85, 247' : '139, 92, 246'}, 0.3)`,
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
                color: 'rgba(168, 85, 247, 0.9)',
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
                border: '1px solid rgba(168, 85, 247, 0.2)',
                borderRadius: '50px',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 4px 20px rgba(168, 85, 247, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <span style={{ position: 'relative', zIndex: 1 }}>Get to know me</span>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(90deg, transparent, rgba(168, 85, 247, 0.1), transparent)',
                  animation: 'shimmer 3s ease-in-out infinite',
                }}
              />
            </div>
          </div>

          <h1 
            className={`hero-title ${mounted ? 'animate-fade-in-up' : ''}`}
            style={{ 
              fontFamily: 'var(--font-display)',
              animationDelay: '0.2s',
              animationFillMode: 'both'
            }}
          >
            <span className="gradient-text">ABOUT ME</span>
          </h1>

          <p 
            className={`hero-tagline ${mounted ? 'animate-fade-in-up' : ''}`}
            style={{ 
              fontFamily: 'var(--font-body)',
              animationDelay: '0.3s',
              animationFillMode: 'both'
            }}
          >
            Software engineer with a passion for creating innovative solutions.
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
            <ScrollButton targetId="profile" color="transparent" iconColor="var(--text-secondary)" />
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

      {/* Profile Section */}
      <section id="profile" style={{ 
        background: 'var(--bg-secondary)',
        padding: '5rem 2rem',
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Centered Header */}
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <p 
              style={{ 
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'var(--accent-primary)',
                marginBottom: '0.75rem',
              }}
            >
              Introduction
            </p>
            <h2 
              style={{ 
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}
            >
              Profile
            </h2>
          </div>

          {/* Centered Profile Card */}
          <div 
            style={{ 
              padding: '2.5rem',
              borderRadius: '24px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              backdropFilter: 'blur(20px)',
              marginBottom: '4rem',
              textAlign: 'center',
            }}
          >
            <p 
              style={{ 
                fontFamily: 'var(--font-body)',
                fontSize: '1.1rem',
                lineHeight: 1.8,
                color: 'var(--text-secondary)',
                marginBottom: '1.5rem',
              }}
            >
              Creative Computer Engineering student specializing in Software at UPC. Motivated to apply multidisciplinary expertise within collaborative teams to deliver impactful user experiences.
            </p>
            
            <div 
              style={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.9rem',
                color: 'var(--text-muted)',
              }}
            >
              <FaMapMarkerAlt style={{ color: 'var(--accent-primary)' }} />
              <span>Castelldefels, Barcelona, Spain</span>
            </div>
          </div>

          <div className="section-separator" />

          {/* Languages - Centered */}
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <p 
              style={{ 
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'var(--accent-primary)',
                marginBottom: '0.75rem',
              }}
            >
              Communication
            </p>
            <h2 
              style={{ 
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}
            >
              Languages
            </h2>
          </div>

          {/* Centered Languages Grid */}
          <div style={{ 
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}>
            <SkillItem
              icon={<ReactCountryFlag countryCode="ES" svg style={{ width: "1.5em", height: "1.5em" }} />}
              title="Spanish"
              color="indigo"
            />
            <SkillItem
              icon={<img src="/Flag_of_Catalonia.svg" alt="Catalonia" style={{ width: "1.5em", height: "1.1em" }} />}
              title="Catalan"
              color="emerald"
            />
            <SkillItem
              icon={<ReactCountryFlag countryCode="GB" svg style={{ width: "1.5em", height: "1.5em" }} />}
              title="English"
              color="rose"
            />
            <SkillItem
              icon={<ReactCountryFlag countryCode="CN" svg style={{ width: "1.5em", height: "1.5em" }} />}
              title="Chinese"
              color="amber"
            />
          </div>
        </div>
      </section>
    </>
  );
}
