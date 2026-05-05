"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import SectionPage from "@/components/SectionPage";
import ScrollButton from "@/components/ScrollButton";
import CurriculumButton from "@/components/CurriculumButton";
import Hyperspeed from "@/components/Hyperspeed";
import { hyperspeedPresets } from "@/components/hyperspeed-presets";
import { leagueSpartan } from "@/app/fonts";
import { usePathname, useRouter } from "@/i18n/navigation";
import { isExpertiseAreaId, type ExpertiseAreaId } from "@/components/expertise/types";

const PROJECT_FILTER_AREAS: { id: ExpertiseAreaId; titleKey: string }[] = [
  { id: "web-development", titleKey: "areas.web.title" },
  { id: "ai", titleKey: "areas.ai.title" },
  { id: "mobile", titleKey: "areas.mobile.title" },
  { id: "videogames", titleKey: "areas.games.title" },
  { id: "hardware", titleKey: "areas.hardware.title" },
];

const PROJECTS_CONFIG: {
  id: string;
  imageCard: string;
  tech: string;
  ctaHref: string;
  sections: ExpertiseAreaId[];
}[] = [
  {
    id: "study-agents",
    imageCard: "/react_study_agents.png",
    tech: "Next.js, React, TypeScript, Python, FastAPI, LangChain, OpenAI, Vector DB",
    ctaHref: "/study-agents",
    sections: ["ai", "web-development"],
  },
  {
    id: "portfolio",
    imageCard: "/react.png",
    tech: "React, Next.js, TypeScript, TailwindCSS, Vercel",
    ctaHref: "",
    sections: ["web-development"],
  },
  {
    id: "ego",
    imageCard: "/egoprojecte.png",
    tech: "React Native, Expo, Expo Router, TypeScript, Node.js, Express, PostgreSQL, Google OAuth 2.0, JWT, Stripe, AWS Lambda, AWS S3, GitHub Actions, Jest, Supertest, Docker",
    ctaHref: "",
    sections: ["mobile", "web-development"],
  },
  {
    id: "shooter",
    imageCard: "/salmon2.png",
    tech: "Unreal Engine, Blender, Substance Painter, Photoshop, Networking, C++, Mixamo",
    ctaHref: "https://gamejolt.com/games/salmon_infinite/681208",
    sections: ["videogames"],
  },
  {
    id: "tire-inflator",
    imageCard: "/proteus.png",
    tech: "Proteus, C, Microcontroller Simulation, Embedded Systems",
    ctaHref: "",
    sections: ["hardware"],
  },
  {
    id: "fiblab",
    imageCard: "/fiblab.png",
    tech: "Unity, Photoshop",
    ctaHref: "https://pa2005.itch.io/fib-lab",
    sections: ["videogames"],
  },
  {
    id: "circusvr",
    imageCard: "/circusvr.png",
    tech: "Unreal Engine VR, Blender, Photoshop, Git",
    ctaHref: "https://gamejambcn.com/",
    sections: ["videogames"],
  },
  {
    id: "vr-experience",
    imageCard: "/portada.png",
    tech: "Unreal Engine VR, Blender, Photoshop, MetaHumans",
    ctaHref: "https://gamejolt.com/games/realyexperience/728307",
    sections: ["videogames"],
  },
  {
    id: "drovo",
    imageCard: "/drovo.png",
    tech: "Unreal Engine, Blender, Photoshop, Mixamo",
    ctaHref: "https://gamejolt.com/games/drovo/726952",
    sections: ["videogames"],
  },
  {
    id: "salmon1",
    imageCard: "/salmon1.png",
    tech: "Unreal Engine, Blender, Substance Painter, Photoshop, Networking, C++, Mixamo",
    ctaHref: "https://gamejolt.com/games/salmon_infinite_experimental/712867",
    sections: ["videogames"],
  },
  {
    id: "3dprinting",
    imageCard: "/impresora3D.jpg",
    tech: "FreeCad, Blender, UltiMaker Cura, Photoshop, FDM Printers",
    ctaHref: "",
    sections: ["hardware"],
  },
];

export default function ProjectsPage() {
  const t = useTranslations("projects");
  const tExpertise = useTranslations("expertise");
  const tData = useTranslations("projectsData");
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [weakDevice, setWeakDevice] = useState(false);

  const activeSection = useMemo((): ExpertiseAreaId | null => {
    const raw = searchParams.get("section");
    if (!raw || !isExpertiseAreaId(raw)) return null;
    return raw;
  }, [searchParams]);

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

  const effectOptions = useMemo(() => hyperspeedPresets.one, []);
  const showHeroFx = mounted && !reducedMotion && !weakDevice;

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
        sections: config.sections,
      })),
    [tData],
  );

  const filteredProjects = useMemo(() => {
    if (activeSection === null) return projects;
    return projects.filter((p) => p.sections.includes(activeSection));
  }, [projects, activeSection]);

  useEffect(() => {
    if (activeSection === null) return;
    const id = requestAnimationFrame(() => {
      document.getElementById("projects")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => cancelAnimationFrame(id);
  }, [activeSection]);

  const setFilter = (section: ExpertiseAreaId | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (section) params.set("section", section);
    else params.delete("section");
    const q = params.toString();
    router.replace(q ? `${pathname}?${q}` : pathname);
  };

  return (
    <>
      {/* Hero Section */}
      <section
        className="hero-section proyectos-hero w-full max-w-[100vw] overflow-x-hidden"
        style={{ position: "relative", overflow: "hidden", background: "#000" }}
      >
        {showHeroFx && (
          <div className="absolute inset-0 z-0 h-full w-full" style={{ minHeight: "100%" }}>
            <Hyperspeed effectOptions={effectOptions} />
          </div>
        )}

        <div
          className={`relative z-10 flex w-full min-w-0 flex-col items-center px-4 text-center sm:px-6 ${mounted ? "opacity-100" : "opacity-0"}`}
          style={{ transition: "opacity 0.8s ease-out" }}
        >
          <div
            className={`${mounted ? "animate-fade-in-up" : ""}`}
            style={{
              fontFamily: "var(--font-mono)",
              animationDelay: "0.1s",
              animationFillMode: "both",
              marginBottom: "1.5rem",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 1.25rem",
                fontSize: "0.75rem",
                fontWeight: 500,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "rgba(99, 102, 241, 0.9)",
                background: "linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)",
                border: "1px solid rgba(99, 102, 241, 0.2)",
                borderRadius: "50px",
                backdropFilter: isMobile ? "none" : "blur(10px)",
                boxShadow:
                  "0 4px 20px rgba(99, 102, 241, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <span style={{ position: "relative", zIndex: 1 }}>{t("badge")}</span>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.1), transparent)",
                  animation: "shimmer 3s ease-in-out infinite",
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
            <span style={{ color: "#ffffff" }}>{t("title")}</span>
          </h1>

          <p
            className={`hero-tagline ${mounted ? "animate-fade-in-up" : ""}`}
            style={{
              fontFamily: "var(--font-body)",
              color: "rgba(255,255,255,0.85)",
              animationDelay: "0.3s",
              animationFillMode: "both",
            }}
          >
            {t("tagline")}
          </p>

          <div
            className={`mt-8 flex flex-wrap justify-center gap-4 ${mounted ? "animate-fade-in-up" : ""}`}
            style={{ animationDelay: "0.4s", animationFillMode: "both" }}
          >
            <CurriculumButton href="/PauPedrejonCV.pdf" />
          </div>

          <div
            className={`scroll-wrap ${mounted ? "animate-fade-in" : ""}`}
            style={{ animationDelay: "0.6s", animationFillMode: "both", marginTop: "3rem" }}
          >
            <ScrollButton targetId="projects" color="transparent" iconColor="rgba(255,255,255,0.9)" />
          </div>
        </div>
      </section>

      <div id="projects" className="projects-dark-section">
        <div
          className={`${leagueSpartan.className} mx-auto flex max-w-6xl flex-col items-center gap-10 px-4 pb-24 pt-20 text-center sm:gap-12 sm:px-6 sm:pb-28 sm:pt-24 md:pb-32 md:pt-28`}
          style={{
            borderBottom: "1px solid rgba(148, 163, 184, 0.12)",
            paddingTop: "7rem",
            paddingBottom: "7rem",
          }}
        >
          <h2
            className="max-w-3xl font-semibold uppercase tracking-[0.14em] text-[rgba(248,250,252,0.95)]"
            style={{ fontSize: "clamp(1.25rem, 2.6vw, 1.85rem)", lineHeight: 1.35 }}
          >
            {t("filterByArea")}
          </h2>
          <div
            className="flex max-w-5xl flex-wrap justify-center"
            role="group"
            aria-label={t("filterByArea")}
            style={{ marginTop: "2.75rem", columnGap: "2rem", rowGap: "1.25rem" }}
          >
            <button
              type="button"
              onClick={() => setFilter(null)}
              className={`border-0 bg-transparent font-semibold uppercase tracking-[0.08em] transition-colors duration-200 ${
                activeSection === null
                  ? "text-[#f8fafc] underline decoration-[rgba(165,180,252,0.95)] decoration-[3px] underline-offset-[12px]"
                  : "text-[rgba(248,250,252,0.4)] hover:text-[rgba(248,250,252,0.9)]"
              }`}
              style={{
                fontSize: "clamp(1.05rem, 2.1vw, 1.55rem)",
                padding: "0.85rem 2.25rem",
                outline: "none",
              }}
            >
              {t("filterAll")}
            </button>
            {PROJECT_FILTER_AREAS.map(({ id, titleKey }) => {
              const isActive = activeSection === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFilter(id)}
                  className={`border-0 bg-transparent font-semibold uppercase tracking-[0.08em] transition-colors duration-200 ${
                    isActive
                      ? "text-[#f8fafc] underline decoration-[rgba(165,180,252,0.95)] decoration-[3px] underline-offset-[12px]"
                      : "text-[rgba(248,250,252,0.4)] hover:text-[rgba(248,250,252,0.9)]"
                  }`}
                  style={{
                    fontSize: "clamp(1.05rem, 2.1vw, 1.55rem)",
                    padding: "0.85rem 2.25rem",
                    outline: "none",
                  }}
                >
                  {tExpertise(titleKey)}
                </button>
              );
            })}
          </div>
        </div>

        <div
          className="sm:pb-72"
          style={{
            marginTop: "1.5rem",
            paddingBottom: "14rem",
          }}
        >
          {filteredProjects.length === 0 ? (
            <p
              className="mx-auto max-w-6xl px-4 py-16 text-center text-slate-400 sm:px-6"
              style={{ fontFamily: "var(--font-body)" }}
            >
              {t("filterEmpty")}
            </p>
          ) : (
            filteredProjects.map((project, index) => (
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
                solidBg={`radial-gradient(circle at 18% 22%, rgba(99, 102, 241, 0.10) 0%, transparent 52%), radial-gradient(circle at 82% 70%, rgba(139, 92, 246, 0.10) 0%, transparent 55%), radial-gradient(ellipse 70% 55% at center, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 58%, rgba(0,0,0,0.85) 100%), var(--bg-primary)`}
                textColor="#f8fafc"
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}
