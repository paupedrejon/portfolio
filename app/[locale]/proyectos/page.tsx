"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import SectionPage from "@/components/SectionPage";
import ScrollButton from "@/components/ScrollButton";
import CurriculumButton from "@/components/CurriculumButton";
import Hyperspeed from "@/components/Hyperspeed";
import { hyperspeedPresets } from "@/components/hyperspeed-presets";
import { leagueSpartan } from "@/app/fonts";

const PROJECTS_CONFIG = [
  { id: "study-agents", imageCard: "/react_study_agents.png", tech: "Next.js, React, TypeScript, Python, FastAPI, LangChain, OpenAI, Vector DB", ctaHref: "/study-agents" },
  { id: "portfolio", imageCard: "/react.png", tech: "React, Next.js, TypeScript, TailwindCSS, Vercel", ctaHref: "" },
  { id: "shooter", imageCard: "/salmon2.png", tech: "Unreal Engine, Blender, Substance Painter, Photoshop, Networking, C++, Mixamo", ctaHref: "https://gamejolt.com/games/salmon_infinite/681208" },
  { id: "tire-inflator", imageCard: "/proteus.png", tech: "Proteus, C, Microcontroller Simulation, Embedded Systems", ctaHref: "" },
  { id: "fiblab", imageCard: "/fiblab.png", tech: "Unity, Photoshop", ctaHref: "https://pa2005.itch.io/fib-lab" },
  { id: "circusvr", imageCard: "/circusvr.png", tech: "Unreal Engine VR, Blender, Photoshop, Git", ctaHref: "https://gamejambcn.com/" },
  { id: "vr-experience", imageCard: "/portada.png", tech: "Unreal Engine VR, Blender, Photoshop, MetaHumans", ctaHref: "https://gamejolt.com/games/realyexperience/728307" },
  { id: "drovo", imageCard: "/drovo.png", tech: "Unreal Engine, Blender, Photoshop, Mixamo", ctaHref: "https://gamejolt.com/games/drovo/726952" },
  { id: "salmon1", imageCard: "/salmon1.png", tech: "Unreal Engine, Blender, Substance Painter, Photoshop, Networking, C++, Mixamo", ctaHref: "https://gamejolt.com/games/salmon_infinite_experimental/712867" },
  { id: "3dprinting", imageCard: "/impresora3D.jpg", tech: "FreeCad, Blender, UltiMaker Cura, Photoshop, FDM Printers", ctaHref: "" },
] as const;

export default function ProjectsPage() {
  const t = useTranslations("projects");
  const tData = useTranslations("projectsData");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const effectOptions = useMemo(() => hyperspeedPresets.one, []);

  const projects = useMemo(
    () =>
      PROJECTS_CONFIG.map((config) => ({
        id: config.id,
        title: tData(`${config.id}.title`),
        title2: tData(`${config.id}.title2`),
        kicker: tData(`${config.id}.kicker`),
        subtitle: tData(`${config.id}.subtitle`),
        imageCard: config.imageCard,
        tech: config.tech,
        ctaText: tData(`${config.id}.ctaText`),
        ctaHref: config.ctaHref,
      })),
    [tData]
  );

  return (
    <>
      {/* Hero Section */}
      <section 
        className="hero-section proyectos-hero" 
        style={{ position: 'relative', overflow: 'hidden', background: '#000' }}
      >
        {/* Hyperspeed background - above ::before, below content */}
        {mounted && (
          <div 
            className="absolute inset-0 w-full h-full z-0"
            style={{ minHeight: '100%' }}
          >
            <Hyperspeed effectOptions={effectOptions} />
          </div>
        )}

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
              <span style={{ position: 'relative', zIndex: 1 }}>{t("badge")}</span>
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
            className={`${leagueSpartan.className} hero-title ${mounted ? 'animate-fade-in-up' : ''}`}
            style={{ 
              animationDelay: '0.2s',
              animationFillMode: 'both'
            }}
          >
            <span style={{ color: '#ffffff' }}>{t("title")}</span>
          </h1>

          <p 
            className={`hero-tagline ${mounted ? 'animate-fade-in-up' : ''}`}
            style={{ 
              fontFamily: 'var(--font-body)',
              color: 'rgba(255,255,255,0.85)',
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
            <ScrollButton targetId="projects" color="transparent" iconColor="rgba(255,255,255,0.9)" />
          </div>
        </div>
      </section>

      {/* Projects - dark section with League Spartan titles */}
      <div id="projects" className="projects-dark-section">
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
            imageMaxW="100%"
            imageAspect="auto"
            midText={`${t("used")}: ${project.tech}`}
            ctaText={project.ctaText}
            ctaHref={project.ctaHref}
            solidBg={index % 2 === 0 ? "#08080c" : "#0a0a10"}
            textColor="#f8fafc"
          />
        ))}
      </div>
    </>
  );
}
