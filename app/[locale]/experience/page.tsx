"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import ScrollButton from "@/components/ScrollButton";
import CurriculumButton from "@/components/CurriculumButton";
import { FaBriefcase } from "react-icons/fa";
import { leagueSpartan } from "@/app/fonts";

const Prism = dynamic(() => import("@/components/Prism"), { ssr: false });

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
      <section
        className="hero-section"
        style={{
          position: "relative",
          overflow: "hidden",
          background: "#000000",
        }}
      >
        {/* Prism background */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            minHeight: "600px",
            zIndex: 0,
          }}
        >
          <Prism
            animationType="rotate"
            timeScale={0.5}
            height={3.5}
            baseWidth={5.5}
            scale={3.6}
            hueShift={0}
            colorFrequency={1}
            noise={0}
            glow={1}
          />
        </div>

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
                color: "rgba(139, 92, 246, 0.9)",
                background:
                  "linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)",
                border: "1px solid rgba(99, 102, 241, 0.2)",
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
                  background:
                    "linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.1), transparent)",
                  animation: 'shimmer 3s ease-in-out infinite',
                }}
              />
            </div>
          </div>

          <h1
            className={`${leagueSpartan.className} hero-title ${mounted ? "animate-fade-in-up" : ""}`}
            style={{
              animationDelay: "0.2s",
              animationFillMode: "both",
            }}
          >
            <span style={{ color: "#ffffff" }}>EXPERIENCE</span>
          </h1>

          <p
            className={`hero-tagline ${mounted ? "animate-fade-in-up" : ""}`}
            style={{
              fontFamily: "var(--font-body)",
              color: "rgba(255, 255, 255, 0.85)",
              animationDelay: "0.3s",
              animationFillMode: "both",
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
            <ScrollButton
              targetId="experience"
              color="transparent"
              iconColor="rgba(255, 255, 255, 0.9)"
            />
          </div>
        </div>

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

      {/* Experience Section - Dark mode */}
      <section id="experience" style={{ 
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
                color: 'rgba(139, 92, 246, 0.95)',
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
                color: '#f8fafc',
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
                    background: hoveredExp === index ? item.gradient : 'rgba(139, 92, 246, 0.9)',
                    border: '3px solid #12121a',
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
                    background: 'rgba(26, 26, 36, 0.9)',
                    border: `1px solid ${hoveredExp === index ? 'rgba(139, 92, 246, 0.5)' : 'rgba(255, 255, 255, 0.08)'}`,
                    backdropFilter: 'blur(20px)',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: hoveredExp === index ? 'translateX(10px) scale(1.02)' : 'translateX(0) scale(1)',
                    boxShadow: hoveredExp === index 
                      ? '0 20px 40px -10px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(139, 92, 246, 0.3)' 
                      : '0 10px 30px -10px rgba(0, 0, 0, 0.3)',
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
                        background: hoveredExp === index ? item.gradient : 'rgba(139, 92, 246, 0.2)',
                        color: hoveredExp === index ? 'white' : 'rgba(139, 92, 246, 0.95)',
                        flexShrink: 0,
                        transition: 'all 0.4s ease',
                        transform: hoveredExp === index ? 'rotate(-5deg) scale(1.1)' : 'rotate(0) scale(1)',
                        boxShadow: hoveredExp === index ? '0 10px 25px rgba(139, 92, 246, 0.4)' : 'none',
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
                          color: 'rgba(139, 92, 246, 0.95)',
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
                          color: '#94a3b8',
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
                          color: '#64748b',
                        }}
                      >
                        <span
                          style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '100px',
                            background: hoveredExp === index ? item.gradient : 'rgba(139, 92, 246, 0.2)',
                            color: hoveredExp === index ? 'white' : 'rgba(139, 92, 246, 0.95)',
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
