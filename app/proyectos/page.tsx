"use client";

import { useEffect, useState } from "react";
import SectionPage from "@/components/SectionPage";
import ScrollButton from "@/components/ScrollButton";
import CurriculumButton from "@/components/CurriculumButton";

const projects = [
  {
    id: "study-agents",
    title: "StudyAgents",
    title2: "AI-Powered Learning Assistant",
    kicker: "2025 - Instituto de Inteligencia Artificial",
    subtitle: "An intelligent educational system that helps students learn through AI agents. Upload PDFs, generate notes, ask questions, and take interactive tests with real-time feedback.",
    imageCard: "/react_study_agents.png",
    tech: "Next.js, React, TypeScript, Python, FastAPI, LangChain, OpenAI, Vector DB",
    ctaText: "Try StudyAgents",
    ctaHref: "/study-agents",
  },
  {
    id: "portfolio",
    title: "Personal Portfolio",
    title2: "Web Application",
    kicker: "2025 - Personal Project",
    subtitle: "Interactive portfolio designed with Next.js and React to showcase my projects, skills and experience as a software engineer.",
    imageCard: "/react.png",
    tech: "React, Next.js, TypeScript, TailwindCSS, Vercel",
    ctaText: "",
    ctaHref: "",
  },
  {
    id: "shooter",
    title: "Online Realistic Videogame",
    title2: "Part 2",
    kicker: "2025 - Personal Project",
    subtitle: "Online Multiplayer character-based shooter with realistic graphics and gameplay mechanics.",
    imageCard: "/salmon2.png",
    tech: "Unreal Engine, Blender, Substance Painter, Photoshop, Networking, C++, Mixamo",
    ctaText: "View Results",
    ctaHref: "https://gamejolt.com/games/salmon_infinite/681208",
  },
  {
    id: "tire-inflator",
    title: "Tire Inflator Simulator",
    title2: "Microcontroller Project",
    kicker: "2024 - Universitat Politècnica de Barcelona",
    subtitle: "Simulation of a tire inflation system built in Proteus, using C for microcontroller programming.",
    imageCard: "/proteus.png",
    tech: "Proteus, C, Microcontroller Simulation, Embedded Systems",
    ctaText: "",
    ctaHref: "",
  },
  {
    id: "fiblab",
    title: "FIB Lab",
    title2: "Unity 2024 Course Project",
    kicker: "2024 - Universitat Politècnica de Barcelona",
    subtitle: "A simple 2D game made during the Unity Essential Course.",
    imageCard: "/fiblab.png",
    tech: "Unity, Photoshop",
    ctaText: "Play Now",
    ctaHref: "https://pa2005.itch.io/fib-lab",
  },
  {
    id: "circusvr",
    title: "Circus VR",
    title2: "Game Jam 2024",
    kicker: "2024 - Universitat Politècnica de Barcelona",
    subtitle: "Built a functional interactive VR system with circus props within 48 hours.",
    imageCard: "/circusvr.png",
    tech: "Unreal Engine VR, Blender, Photoshop, Git",
    ctaText: "About Game Jam",
    ctaHref: "https://gamejambcn.com/",
  },
  {
    id: "vr-experience",
    title: "VR Experience",
    title2: "Treball de Recerca",
    kicker: "2022 - Institut Tecnològic de Barcelona",
    subtitle: "Made a Virtual Reality experience to showcase the capabilities of the Metaverse.",
    imageCard: "/portada.png",
    tech: "Unreal Engine VR, Blender, Photoshop, MetaHumans",
    ctaText: "View Results",
    ctaHref: "https://gamejolt.com/games/realyexperience/728307",
  },
  {
    id: "drovo",
    title: "DROVO",
    title2: "Online Multiplayer Prototype",
    kicker: "2023 - Personal Project",
    subtitle: "Built a fun multiplayer prototype to play with friends.",
    imageCard: "/drovo.png",
    tech: "Unreal Engine, Blender, Photoshop, Mixamo",
    ctaText: "View Prototype",
    ctaHref: "https://gamejolt.com/games/drovo/726952",
  },
  {
    id: "salmon1",
    title: "Online Videogame",
    title2: "Part 1",
    kicker: "2020 - Personal Project",
    subtitle: "My first contact with programming - an online multiplayer game.",
    imageCard: "/salmon1.png",
    tech: "Unreal Engine, Blender, Substance Painter, Photoshop, Networking, C++, Mixamo",
    ctaText: "View Results",
    ctaHref: "https://gamejolt.com/games/salmon_infinite_experimental/712867",
  },
  {
    id: "3dprinting",
    title: "3D Printing",
    title2: "Maker Project",
    kicker: "2020 - Personal Project",
    subtitle: "Adapted and printed complex large-scale 3D models.",
    imageCard: "/impresora3D.jpg",
    tech: "FreeCad, Blender, UltiMaker Cura, Photoshop, FDM Printers",
    ctaText: "",
    ctaHref: "",
  },
];

export default function ProjectsPage() {
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
              background: "linear-gradient(135deg, #6366f1, #a855f7)",
              top: "10%",
              left: "10%",
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
            className="absolute rounded-full blur-[80px] opacity-15"
            style={{
              width: '400px',
              height: '400px',
              background: "linear-gradient(135deg, #a855f7, #6366f1)",
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
              <span style={{ position: 'relative', zIndex: 1 }}>Featured Work</span>
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
            className={`hero-title ${mounted ? 'animate-fade-in-up' : ''}`}
            style={{ 
              fontFamily: 'var(--font-display)',
              animationDelay: '0.2s',
              animationFillMode: 'both'
            }}
          >
            <span className="gradient-text">PROJECTS</span>
          </h1>

          <p 
            className={`hero-tagline ${mounted ? 'animate-fade-in-up' : ''}`}
            style={{ 
              fontFamily: 'var(--font-body)',
              animationDelay: '0.3s',
              animationFillMode: 'both'
            }}
          >
            A collection of projects that showcase my passion for development and creative technology.
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
            <ScrollButton targetId="projects" color="transparent" iconColor="var(--text-secondary)" />
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

      {/* Projects */}
      <div id="projects">
        {projects.map((project, index) => (
          <SectionPage
            key={project.id}
            id={project.id}
            title={project.title}
            title2={project.title2}
            kicker={project.kicker}
            subtitle={project.subtitle}
            imageCard={project.imageCard}
            imageSide={index % 2 === 0 ? "right" : "left"}
            align="left"
            imageMaxW="clamp(300px, 45vw, 600px)"
            imageAspect="16/9"
            midText={`USED: ${project.tech}`}
            ctaText={project.ctaText}
            ctaHref={project.ctaHref}
            solidBg={index % 2 === 0 ? "var(--bg-primary)" : "var(--bg-secondary)"}
          />
        ))}
      </div>
    </>
  );
}
