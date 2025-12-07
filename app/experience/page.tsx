"use client";

import { useEffect, useState } from "react";
import ScrollButton from "@/components/ScrollButton";
import CurriculumButton from "@/components/CurriculumButton";
import { FaBriefcase } from "react-icons/fa";

const experienceItems = [
  {
    icon: <FaBriefcase size={24} />,
    title: "Software Development Internship",
    company: "Owius",
    description: "Developing software projects using React.js, React Native, and Node.js. Working on front-end, back-office, and back-end development, synchronizing all components to deliver complete solutions. Following Agile development processes, interacting with clients to gather requirements and resolve issues, and managing tasks using Asana. Building web environments, back-office systems, and REST API endpoints.",
    years: "2025 (Present)",
    gradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
  },
];

export default function ExperiencePage() {
  const [mounted, setMounted] = useState(false);
  const [hoveredExp, setHoveredExp] = useState<number | null>(null);

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
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
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
              background: "linear-gradient(135deg, #d97706, #b45309)",
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
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
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
              radial-gradient(circle at 30% 20%, rgba(245, 158, 11, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 70% 80%, rgba(217, 119, 6, 0.12) 0%, transparent 50%),
              radial-gradient(circle at 50% 50%, rgba(180, 83, 9, 0.08) 0%, transparent 50%)
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
                background: `linear-gradient(to top, rgba(${Math.random() > 0.5 ? '245, 158, 11' : '217, 119, 6'}, 0), rgba(${Math.random() > 0.5 ? '245, 158, 11' : '217, 119, 6'}, ${Math.random() * 0.4 + 0.2}))`,
                left: `${left}%`,
                bottom: '-200px',
                borderRadius: '2px',
                animation: `riseLine ${duration}s linear infinite`,
                animationDelay: `${delay}s`,
                boxShadow: `0 0 ${Math.random() * 10 + 5}px rgba(${Math.random() > 0.5 ? '245, 158, 11' : '217, 119, 6'}, 0.3)`,
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
                color: 'rgba(245, 158, 11, 0.9)',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                borderRadius: '50px',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 4px 20px rgba(245, 158, 11, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <span style={{ position: 'relative', zIndex: 1 }}>Professional Journey</span>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(90deg, transparent, rgba(245, 158, 11, 0.1), transparent)',
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
            <span className="gradient-text">EXPERIENCE</span>
          </h1>

          <p 
            className={`hero-tagline ${mounted ? 'animate-fade-in-up' : ''}`}
            style={{ 
              fontFamily: 'var(--font-body)',
              animationDelay: '0.3s',
              animationFillMode: 'both'
            }}
          >
            My professional experience and career milestones.
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
            <ScrollButton targetId="experience" color="transparent" iconColor="var(--text-secondary)" />
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

      {/* Experience Section */}
      <section id="experience" style={{ 
        background: 'var(--bg-secondary)',
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
                color: 'var(--accent-primary)',
                marginBottom: '0.75rem',
              }}
            >
              Work Experience
            </p>
            <h2 
              style={{ 
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}
            >
              Experience Timeline
            </h2>
          </div>

          {/* Timeline-style Experience */}
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

            {experienceItems.map((item, index) => (
              <div
                key={index}
                onMouseEnter={() => setHoveredExp(index)}
                onMouseLeave={() => setHoveredExp(null)}
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
                    background: hoveredExp === index ? item.gradient : 'var(--accent-primary)',
                    border: '3px solid var(--bg-secondary)',
                    zIndex: 2,
                    transition: 'all 0.3s ease',
                    transform: hoveredExp === index ? 'scale(1.3)' : 'scale(1)',
                    boxShadow: hoveredExp === index ? `0 0 20px ${item.gradient.split(',')[0].replace('linear-gradient(135deg, ', '').replace(')', '')}` : 'none',
                  }}
                />

                {/* Experience Card */}
                <div
                  style={{
                    display: 'block',
                    padding: '1.75rem 2rem',
                    borderRadius: '20px',
                    background: 'var(--bg-card)',
                    border: `1px solid ${hoveredExp === index ? 'rgba(99, 102, 241, 0.5)' : 'var(--border-subtle)'}`,
                    backdropFilter: 'blur(20px)',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: hoveredExp === index ? 'translateX(10px) scale(1.02)' : 'translateX(0) scale(1)',
                    boxShadow: hoveredExp === index 
                      ? '0 20px 40px -10px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(99, 102, 241, 0.2)' 
                      : '0 10px 30px -10px rgba(0, 0, 0, 0.2)',
                  }}
                >
                  {/* Gradient Overlay on Hover */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: item.gradient,
                      opacity: hoveredExp === index ? 0.1 : 0,
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
                        background: hoveredExp === index ? item.gradient : 'rgba(99, 102, 241, 0.15)',
                        color: hoveredExp === index ? 'white' : 'var(--accent-primary)',
                        flexShrink: 0,
                        transition: 'all 0.4s ease',
                        transform: hoveredExp === index ? 'rotate(-5deg) scale(1.1)' : 'rotate(0) scale(1)',
                        boxShadow: hoveredExp === index ? '0 10px 25px rgba(99, 102, 241, 0.4)' : 'none',
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
                          color: 'var(--text-primary)',
                          marginBottom: '0.5rem',
                        }}
                      >
                        {item.title}
                      </h3>
                      <p
                        style={{
                          fontFamily: 'var(--font-body)',
                          fontSize: '0.95rem',
                          color: 'var(--accent-primary)',
                          fontWeight: 600,
                          marginBottom: '0.75rem',
                        }}
                      >
                        {item.company}
                      </p>
                      <p
                        style={{
                          fontFamily: 'var(--font-body)',
                          fontSize: '0.9rem',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.7,
                          marginBottom: '1rem',
                        }}
                      >
                        {item.description}
                      </p>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.85rem',
                          color: 'var(--text-muted)',
                        }}
                      >
                        <span
                          style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '100px',
                            background: hoveredExp === index ? item.gradient : 'rgba(99, 102, 241, 0.1)',
                            color: hoveredExp === index ? 'white' : 'var(--accent-primary)',
                            fontWeight: 600,
                            transition: 'all 0.3s ease',
                          }}
                        >
                          {item.years}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
