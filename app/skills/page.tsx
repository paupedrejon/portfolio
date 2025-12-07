"use client";

import { useEffect, useState } from "react";
import AdaptiveCardsRow from "@/components/AdaptiveCardsRow";
import SkillItem from "@/components/SkillItem";
import ScrollButton from "@/components/ScrollButton";
import CurriculumButton from "@/components/CurriculumButton";

import {
  SiCplusplus, SiPython, SiMysql, SiR,
  SiHtml5, SiReact, SiTailwindcss, SiGit, SiJira,
  SiLinux, SiNodedotjs, SiFreebsd,
  SiUnrealengine, SiUnity, SiBlender, SiAdobephotoshop, SiAdobeaftereffects, SiAdobe, SiPrintables,
  SiMongodb, SiTrello
} from "react-icons/si";

import {
  FaJava, FaMicrochip, FaDatabase, FaBrain, FaRobot, FaNetworkWired
} from "react-icons/fa";

import {
  AiOutlineThunderbolt, AiOutlineApi
} from "react-icons/ai";

// Custom icons for AI technologies
const LLMIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
  </svg>
);

const RAGIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const NLPIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

const NeuralNetworkIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="8" r="3" />
    <circle cx="6" cy="16" r="2" />
    <circle cx="18" cy="16" r="2" />
    <line x1="12" y1="11" x2="7" y2="14" />
    <line x1="12" y1="11" x2="17" y2="14" />
  </svg>
);

const ExPIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
    <circle cx="12" cy="12" r="1" />
  </svg>
);

const AutonomousAgentsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="9" cy="9" r="2" />
    <circle cx="15" cy="9" r="2" />
    <path d="M9 15h6" />
  </svg>
);

const skillCategories = [
  {
    title: "Programming Languages",
    skills: [
      { icon: <SiCplusplus />, title: "C / C++", percent: 80 },
      { icon: <FaJava />, title: "Java", percent: 60 },
      { icon: <SiPython />, title: "Python", percent: 50 },
      { icon: <SiMysql />, title: "SQL", percent: 70 },
      { icon: <SiR />, title: "R", percent: 33 },
    ]
  },
  {
    title: "Front-End",
    color: "emerald" as const,
    skills: [
      { icon: <SiHtml5 />, title: "HTML / CSS", percent: 50 },
      { icon: <SiReact />, title: "React / Next.js", percent: 50 },
      { icon: <SiTailwindcss />, title: "TailwindCSS", percent: 50 },
    ]
  },
  {
    title: "Back-End",
    skills: [
      { icon: <SiNodedotjs />, title: "Node.js", percent: 50 },
      { icon: <FaDatabase />, title: "PostgreSQL", percent: 60 },
      { icon: <SiMongodb />, title: "MongoDB", percent: 55 },
    ]
  },
  {
    title: "Artificial Intelligence",
    color: "rose" as const,
    skills: [
      { icon: <LLMIcon />, title: "LLM", percent: 70 },
      { icon: <RAGIcon />, title: "RAG", percent: 65 },
      { icon: <NLPIcon />, title: "NLP", percent: 60 },
      { icon: <NeuralNetworkIcon />, title: "Neural Networks", percent: 55 },
      { icon: <ExPIcon />, title: "ExP", percent: 50 },
      { icon: <AutonomousAgentsIcon />, title: "Autonomous Agents", percent: 60 },
    ]
  },
  {
    title: "Game & Creative Development",
    color: "rose" as const,
    skills: [
      { icon: <SiUnrealengine />, title: "Unreal Engine", percent: 85 },
      { icon: <SiUnity />, title: "Unity", percent: 25 },
      { icon: <SiBlender />, title: "Blender", percent: 33 },
      { icon: <SiAdobephotoshop />, title: "Photoshop", percent: 65 },
      { icon: <SiAdobe />, title: "Substance", percent: 55 },
      { icon: <SiAdobeaftereffects />, title: "After Effects", percent: 25 },
    ]
  },
  {
    title: "Version Control & Tools",
    color: "amber" as const,
    skills: [
      { icon: <SiGit />, title: "Git", percent: 40 },
      { icon: <SiJira />, title: "Jira", percent: 35 },
      { icon: <SiTrello />, title: "Trello", percent: 45 },
    ]
  },
  {
    title: "Hardware & 3D Printing",
    color: "emerald" as const,
    skills: [
      { icon: <SiPrintables />, title: "3D Printing", percent: 70 },
      { icon: <FaMicrochip />, title: "Proteus", percent: 30 },
      { icon: <SiFreebsd />, title: "Computer Systems", percent: 50 },
    ]
  },
];

export default function SkillsPage() {
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
              background: "linear-gradient(135deg, #10b981, #059669)",
              top: "20%",
              right: "10%",
              animation: "floatOrb1 60s ease-in-out infinite",
            }}
          />
          <div 
            className="absolute rounded-full blur-[100px] opacity-20"
            style={{
              width: '500px',
              height: '500px',
              background: "linear-gradient(135deg, #059669, #047857)",
              bottom: "15%",
              left: "15%",
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
              radial-gradient(circle at 30% 20%, rgba(16, 185, 129, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 70% 80%, rgba(5, 150, 105, 0.12) 0%, transparent 50%),
              radial-gradient(circle at 50% 50%, rgba(4, 120, 87, 0.08) 0%, transparent 50%)
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
                background: `linear-gradient(to top, rgba(${Math.random() > 0.5 ? '16, 185, 129' : '5, 150, 105'}, 0), rgba(${Math.random() > 0.5 ? '16, 185, 129' : '5, 150, 105'}, ${Math.random() * 0.4 + 0.2}))`,
                left: `${left}%`,
                bottom: '-200px',
                borderRadius: '2px',
                animation: `riseLine ${duration}s linear infinite`,
                animationDelay: `${delay}s`,
                boxShadow: `0 0 ${Math.random() * 10 + 5}px rgba(${Math.random() > 0.5 ? '16, 185, 129' : '5, 150, 105'}, 0.3)`,
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
              <span style={{ position: 'relative', zIndex: 1 }}>Technical Expertise</span>
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
            className={`hero-title ${mounted ? 'animate-fade-in-up' : ''}`}
            style={{ 
              fontFamily: 'var(--font-display)',
              animationDelay: '0.2s',
              animationFillMode: 'both'
            }}
          >
            <span className="gradient-text">SKILLS</span>
          </h1>

          <p 
            className={`hero-tagline ${mounted ? 'animate-fade-in-up' : ''}`}
            style={{ 
              fontFamily: 'var(--font-body)',
              animationDelay: '0.3s',
              animationFillMode: 'both'
            }}
          >
            A comprehensive overview of my technical skills and proficiency levels.
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
            <ScrollButton targetId="skills" color="transparent" iconColor="var(--text-secondary)" />
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

      {/* Skills Content */}
      <section id="skills" style={{ 
        background: 'var(--bg-secondary)',
        padding: '5rem 2rem',
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          {skillCategories.map((category, catIndex) => (
            <div key={category.title} style={{ marginBottom: '4rem' }}>
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
                  Category
                </p>
                <h2 
                  style={{ 
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                  }}
                >
                  {category.title}
                </h2>
              </div>
              
              {/* Centered Skills Grid */}
              <div style={{ 
                display: 'flex',
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
              }}>
                {category.skills.map((skill) => (
                  <SkillItem
                    key={skill.title}
                    icon={skill.icon}
                    title={skill.title}
                    percent={skill.percent}
                    showScroll={false}
                    color={category.color || "indigo"}
                  />
                ))}
              </div>

              {catIndex < skillCategories.length - 1 && (
                <div className="section-separator" style={{ marginTop: '4rem' }} />
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
