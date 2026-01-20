"use client";

import { spaceGrotesk, outfit, jetbrainsMono } from "../fonts";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import StudyChat from "@/components/StudyChat";

export default function StudyAgentsPage() {
  const [mounted, setMounted] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirigir a login si no está autenticado
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/study-agents");
    }
  }, [status, router]);

  // Mostrar loading mientras se verifica la sesión
  if (status === "loading" || !mounted) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1a1a24 0%, #2d2d44 100%)",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "4px solid rgba(99, 102, 241, 0.2)",
            borderTop: "4px solid #6366f1",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style jsx>{`
          @keyframes spin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  // Si no hay sesión, no renderizar nada (el useEffect redirigirá)
  if (!session) {
    return null;
  }

  return (
    <>
      {/* Hero Section - Premium Design */}
      <section className="hero-section" style={{ minHeight: '50vh', position: 'relative', overflow: 'hidden' }}>
        <div className="hero-grid" />
        
        {/* Animated Background Orbs - Premium Multi-layer */}
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
              top: "30%",
              right: "30%",
              animation: "floatOrb4 75s ease-in-out infinite",
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

        {/* Rising Lines - Premium Rain Effect */}
        {mounted && [...Array(20)].map((_, i) => {
          // Usar valores determinísticos basados en el índice para evitar errores de hidratación
          const seed = i * 7 + 13; // Semilla determinística
          const width = (seed % 20) / 10 + 1; // 1-3px
          const height = (seed % 200) + 100; // 100-300px
          const left = (seed * 7) % 100; // 0-100%
          const duration = (seed % 80) / 10 + 6; // 6-14s
          const delay = (seed % 50) / 10; // 0-5s
          const opacity = (seed % 40) / 100 + 0.2; // 0.2-0.6
          const shadowSize = (seed % 100) / 10 + 5; // 5-15px
          const colorVariant = seed % 2 === 0 ? '99, 102, 241' : '139, 92, 246';
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: `${width}px`,
                height: `${height}px`,
                background: `linear-gradient(to top, rgba(${colorVariant}, 0), rgba(${colorVariant}, ${opacity}))`,
                left: `${left}%`,
                bottom: '-200px',
                borderRadius: '2px',
                animation: `riseLine ${duration}s linear infinite`,
                animationDelay: `${delay}s`,
                boxShadow: `0 0 ${shadowSize}px rgba(${colorVariant}, 0.3)`,
              }}
            />
          );
        })}

        <div 
          className={`relative z-10 flex flex-col items-center text-center px-6 ${mounted ? 'opacity-100' : 'opacity-0'}`}
          style={{ transition: 'opacity 0.8s ease-out', paddingTop: '6rem', paddingBottom: '3rem' }}
        >
          {/* Logo de Study Agents */}
          <div 
            className={`${mounted ? 'animate-fade-in-up' : ''}`}
            style={{ 
              animationDelay: '0s', 
              animationFillMode: 'both',
              marginBottom: '2rem',
            }}
          >
            <img 
              src="/StudyAgentsLogo.png" 
              alt="Study Agents Logo"
              style={{
                maxWidth: '180px',
                height: 'auto',
                opacity: 0.95,
                filter: 'drop-shadow(0 8px 24px rgba(99, 102, 241, 0.3))',
              }}
              onError={(e) => {
                // Si el logo no se carga, ocultar el contenedor
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>

          <div 
            className={`${mounted ? 'animate-fade-in-up' : ''}`}
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
                fontFamily: 'var(--font-mono)',
              }}
            >
              <span style={{ position: 'relative', zIndex: 1 }}>AI Study Assistant</span>
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
            <span className="gradient-text">STUDY</span>
            <br />
            <span style={{ color: 'var(--text-primary)' }}>AGENTS</span>
          </h1>

          <p 
            className={`${outfit.className} hero-tagline ${mounted ? 'animate-fade-in-up' : ''}`}
            style={{ animationDelay: '0.4s', animationFillMode: 'both', maxWidth: '700px' }}
          >
            Tu asistente inteligente para generar apuntes, resolver dudas y crear tests personalizados. 
            Sube tus documentos y empieza a aprender de manera más eficiente.
          </p>
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
          @keyframes floatOrb4 {
            0%, 100% { transform: translate(0, 0) scale(1) rotate(0deg); }
            25% { transform: translate(-50px, 80px) scale(1.1) rotate(90deg); }
            50% { transform: translate(60px, -40px) scale(0.95) rotate(180deg); }
            75% { transform: translate(-30px, -60px) scale(1.05) rotate(270deg); }
          }
          @keyframes pulseBg {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.05); }
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
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>
      </section>

      {/* Chat Interface */}
      <StudyChat />
    </>
  );
}
