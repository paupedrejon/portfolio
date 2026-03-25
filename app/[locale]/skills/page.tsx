"use client";

import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import ScrollButton from "@/components/ScrollButton";
import CurriculumButton from "@/components/CurriculumButton";
import { leagueSpartan } from "@/app/fonts";
import { SkillCard } from "@/components/SkillCard";

const Orb = dynamic(() => import("@/components/Orb"), { ssr: false });

interface SkillItem {
  name: string;
  category: string;
  icon: string;
  description: string;
  abbreviation?: string;
}

const CATEGORY_KEYS = [
  "programmingLanguages",
  "frontEnd",
  "backEnd",
  "artificialIntelligence",
  "gameCreative",
  "versionControl",
  "hardware3d",
] as const;

const SKILLS_CONFIG: Array<{
  key: string;
  categoryKey: (typeof CATEGORY_KEYS)[number];
  icon: string;
  abbreviation?: string;
}> = [
  { key: "c_cpp", categoryKey: "programmingLanguages", icon: "https://cdn.simpleicons.org/cplusplus/ffffff" },
  { key: "java", categoryKey: "programmingLanguages", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/java/java-original.svg" },
  { key: "python", categoryKey: "programmingLanguages", icon: "https://cdn.simpleicons.org/python/ffffff" },
  { key: "sql", categoryKey: "programmingLanguages", icon: "https://cdn.simpleicons.org/mysql/ffffff" },
  { key: "r", categoryKey: "programmingLanguages", icon: "https://cdn.simpleicons.org/r/ffffff" },
  { key: "html_css", categoryKey: "frontEnd", icon: "https://cdn.simpleicons.org/html5/ffffff" },
  { key: "react_nextjs", categoryKey: "frontEnd", icon: "https://cdn.simpleicons.org/react/ffffff" },
  { key: "tailwindcss", categoryKey: "frontEnd", icon: "https://cdn.simpleicons.org/tailwindcss/ffffff" },
  { key: "nodejs", categoryKey: "backEnd", icon: "https://cdn.simpleicons.org/nodedotjs/ffffff" },
  { key: "postgresql", categoryKey: "backEnd", icon: "https://cdn.simpleicons.org/postgresql/ffffff" },
  { key: "mongodb", categoryKey: "backEnd", icon: "https://cdn.simpleicons.org/mongodb/ffffff" },
  { key: "llm", categoryKey: "artificialIntelligence", icon: "", abbreviation: "LLM" },
  { key: "rag", categoryKey: "artificialIntelligence", icon: "", abbreviation: "RAG" },
  { key: "nlp", categoryKey: "artificialIntelligence", icon: "", abbreviation: "NLP" },
  { key: "neural_networks", categoryKey: "artificialIntelligence", icon: "https://cdn.simpleicons.org/tensorflow/ffffff" },
  { key: "exp", categoryKey: "artificialIntelligence", icon: "", abbreviation: "ExP" },
  { key: "autonomous_agents", categoryKey: "artificialIntelligence", icon: "https://cdn.simpleicons.org/probot/ffffff" },
  { key: "unreal_engine", categoryKey: "gameCreative", icon: "https://cdn.simpleicons.org/unrealengine/ffffff" },
  { key: "unity", categoryKey: "gameCreative", icon: "https://cdn.simpleicons.org/unity/ffffff" },
  { key: "blender", categoryKey: "gameCreative", icon: "https://cdn.simpleicons.org/blender/ffffff" },
  { key: "photoshop", categoryKey: "gameCreative", icon: "", abbreviation: "Ps" },
  { key: "substance", categoryKey: "gameCreative", icon: "", abbreviation: "Su" },
  { key: "after_effects", categoryKey: "gameCreative", icon: "", abbreviation: "Ae" },
  { key: "git", categoryKey: "versionControl", icon: "https://cdn.simpleicons.org/git/ffffff" },
  { key: "jira", categoryKey: "versionControl", icon: "https://cdn.simpleicons.org/jira/ffffff" },
  { key: "trello", categoryKey: "versionControl", icon: "https://cdn.simpleicons.org/trello/ffffff" },
  { key: "3d_printing", categoryKey: "hardware3d", icon: "https://cdn.simpleicons.org/printables/ffffff" },
  { key: "proteus", categoryKey: "hardware3d", icon: "https://cdn.simpleicons.org/proteus/ffffff" },
  { key: "computer_systems", categoryKey: "hardware3d", icon: "https://cdn.simpleicons.org/linux/ffffff" },
];

export default function SkillsPage() {
  const t = useTranslations("skills");
  const [mounted, setMounted] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<SkillItem | null>(null);

  const skills = useMemo(
    () =>
      SKILLS_CONFIG.map((config) => {
        const item = t.raw(`items.${config.key}`) as { name: string; description: string };
        return {
          name: item.name,
          category: t(`categories.${config.categoryKey}`),
          categoryKey: config.categoryKey,
          icon: config.icon,
          description: item.description,
          abbreviation: config.abbreviation,
        };
      }) as Array<SkillItem & { categoryKey: string }>,
    [t]
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      {/* Hero Section */}
      <section
        className="hero-section skills-hero w-full max-w-[100vw] overflow-x-hidden"
        style={{ position: "relative", overflow: "hidden", background: "#000000" }}
      >
        {mounted && (
          <div
            className="absolute inset-0 w-full h-full z-0"
            style={{ minHeight: "100%" }}
          >
            <Orb
              hoverIntensity={0.58}
              rotateOnHover
              hue={333}
              forceHoverState={false}
              backgroundColor="#000000"
            />
          </div>
        )}

        <div
          className={`relative z-10 flex w-full min-w-0 flex-col items-center text-center px-4 sm:px-6 ${mounted ? "opacity-100" : "opacity-0"}`}
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
                background:
                  "linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)",
                border: "1px solid rgba(99, 102, 241, 0.2)",
                borderRadius: "50px",
                backdropFilter: "blur(10px)",
                boxShadow:
                  "0 4px 20px rgba(99, 102, 241, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <span style={{ position: "relative", zIndex: 1 }}>
                {t("heroBadge")}
              </span>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.1), transparent)",
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
              color: "rgba(255, 255, 255, 0.85)",
              animationDelay: "0.3s",
              animationFillMode: "both",
            }}
          >
            {t("tagline")}
          </p>

          <div
            className={`flex flex-wrap gap-4 justify-center mt-8 ${mounted ? "animate-fade-in-up" : ""}`}
            style={{ animationDelay: "0.4s", animationFillMode: "both" }}
          >
            <CurriculumButton href="/PauPedrejonCV.pdf" />
          </div>

          <div
            className={`scroll-wrap ${mounted ? "animate-fade-in" : ""}`}
            style={{
              animationDelay: "0.6s",
              animationFillMode: "both",
              marginTop: "3rem",
            }}
          >
            <ScrollButton
              targetId="skills"
              color="transparent"
              iconColor="rgba(255, 255, 255, 0.9)"
            />
          </div>
        </div>

        {/* Suavizado: gradiente de transición hero → skills */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: "clamp(200px, 45vh, 55vh)",
            minHeight: "min(360px, 50vh)",
            background: "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.3) 25%, rgba(0,0,0,0.7) 55%, #000000 75%, #000000 100%)",
            pointerEvents: "none",
            zIndex: 4,
          }}
        />
      </section>

      {/* Skills Content */}
      <section
        id="skills"
        className="skills-dark-section"
        style={{
          background: "#000000",
          padding: "clamp(2.5rem, 8vw, 5rem) clamp(1rem, 4vw, 2rem)",
          marginTop: "-1px",
        }}
      >
        <div className="mx-auto w-full min-w-0 max-w-[1100px]">
          {CATEGORY_KEYS.map((categoryKey, idx) => {
            const categoryTitle = t(`categories.${categoryKey}`);
            const categorySkills = skills.filter((s) => s.categoryKey === categoryKey);
            if (categorySkills.length === 0) return null;
            return (
              <div key={categoryKey} style={{ marginBottom: "4rem" }}>
                <div
                  style={{
                    textAlign: "center",
                    marginBottom: "32px",
                    marginTop: idx === 0 ? 0 : 64,
                  }}
                >
                  <div
                    style={{
                      display: "inline-block",
                      color: "rgba(139,92,246,0.8)",
                      fontSize: "11px",
                      letterSpacing: "4px",
                      textTransform: "uppercase",
                      marginBottom: "10px",
                    }}
                  >
                    {t("categoryLabel")}
                  </div>
                  <h2
                    style={{
                      color: "white",
                      fontSize: "clamp(28px, 4vw, 42px)",
                      fontWeight: "800",
                      letterSpacing: "-1px",
                      margin: 0,
                    }}
                  >
                    {categoryTitle}
                  </h2>
                </div>
                <div className="skills-cards-grid w-full">
                  {categorySkills.map((skill) => (
                    <SkillCard
                      key={skill.name}
                      skill={skill}
                      onOpen={setSelectedSkill}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Modal */}
      {selectedSkill && (
        <div
          onClick={() => setSelectedSkill(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            backgroundColor: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              backgroundColor: "#0c0c14",
              border: "1px solid rgba(139,92,246,0.3)",
              borderRadius: "clamp(16px, 4vw, 28px)",
              padding: "clamp(1.25rem, 5vw, 4rem)",
              maxWidth: "620px",
              width: "100%",
              maxHeight: "min(90vh, 720px)",
              overflowY: "auto",
              overflowX: "hidden",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {/* Top glow */}
            <div
              style={{
                position: "absolute",
                top: "-80px",
                right: "-80px",
                width: "280px",
                height: "280px",
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 65%)",
                filter: "blur(50px)",
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: "-60px",
                left: "-60px",
                width: "200px",
                height: "200px",
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 65%)",
                filter: "blur(40px)",
                pointerEvents: "none",
              }}
            />

            {/* Header row */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "1rem",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "clamp(1rem, 3vw, 2rem)",
                position: "relative",
                zIndex: 1,
              }}
            >
              {/* Icon box */}
              <div
                style={{
                  width: "clamp(72px, 18vw, 96px)",
                  height: "clamp(72px, 18vw, 96px)",
                  backgroundColor: "rgba(139,92,246,0.12)",
                  border: "1px solid rgba(139,92,246,0.3)",
                  borderRadius: "24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {selectedSkill.icon ? (
                  <img
                    src={selectedSkill.icon}
                    alt={selectedSkill.name}
                    style={{
                      width: "clamp(40px, 10vw, 56px)",
                      height: "clamp(40px, 10vw, 56px)",
                      objectFit: "contain",
                      filter: "brightness(0) invert(1)",
                    }}
                  />
                ) : (
                  <span
                    style={{
                      color: "white",
                      fontSize: "16px",
                      fontWeight: "800",
                      letterSpacing: "-0.5px",
                    }}
                  >
                    {selectedSkill.abbreviation}
                  </span>
                )}
              </div>

              {/* Close button */}
              <button
                onClick={() => setSelectedSkill(null)}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "50%",
                  width: "40px",
                  height: "40px",
                  color: "rgba(255,255,255,0.5)",
                  fontSize: "18px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 0.2s",
                }}
              >
                ✕
              </button>
            </div>

            {/* Category pill */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                backgroundColor: "rgba(139,92,246,0.12)",
                border: "1px solid rgba(139,92,246,0.3)",
                borderRadius: "999px",
                padding: "5px 14px",
                color: "rgba(139,92,246,1)",
                fontSize: "11px",
                letterSpacing: "2.5px",
                textTransform: "uppercase",
                fontWeight: "600",
                marginBottom: "14px",
                position: "relative",
                zIndex: 1,
              }}
            >
              {selectedSkill.category}
            </div>

            {/* Skill name */}
            <h2
              style={{
                color: "white",
                fontSize: "clamp(1.5rem, 7vw, 3rem)",
                fontWeight: "800",
                margin: "0 0 20px",
                letterSpacing: "-1px",
                lineHeight: 1.1,
                position: "relative",
                zIndex: 1,
                wordBreak: "break-word",
              }}
            >
              {selectedSkill.name}
            </h2>

            {/* Divider */}
            <div
              style={{
                height: "1px",
                background:
                  "linear-gradient(90deg, rgba(139,92,246,0.3), transparent)",
                marginBottom: "20px",
                position: "relative",
                zIndex: 1,
              }}
            />

            {/* Description */}
            <p
              style={{
                color: "rgba(255,255,255,0.75)",
                fontSize: "clamp(0.95rem, 3.5vw, 1.25rem)",
                lineHeight: "1.75",
                margin: 0,
                fontWeight: "400",
                position: "relative",
                zIndex: 1,
              }}
            >
              {selectedSkill.description}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
