"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { LayoutGrid } from "lucide-react";
import "../home.css";
import "../proyectos/proyectos.css";
import "./skills.css";
import PortfolioPageHero from "@/components/portfolio/PortfolioPageHero";
import { SkillCard, type SkillCardItem } from "@/components/SkillCard";
import SkillDetailModal from "@/components/skills/SkillDetailModal";
import {
  SkillCategoryFilterIcon,
  type SkillCategoryKey,
} from "@/lib/skills/category-filter-icons";

const Orb = dynamic(() => import("@/components/Orb"), { ssr: false });

const CATEGORY_KEYS = [
  "programmingLanguages",
  "frontEnd",
  "backEnd",
  "artificialIntelligence",
  "gameCreative",
  "versionControl",
  "hardware3d",
] as const satisfies readonly SkillCategoryKey[];

const SKILLS_CONFIG: Array<{
  key: string;
  categoryKey: SkillCategoryKey;
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
  { key: "react_native_expo_router", categoryKey: "frontEnd", icon: "https://cdn.simpleicons.org/expo/ffffff" },
  { key: "nodejs", categoryKey: "backEnd", icon: "https://cdn.simpleicons.org/nodedotjs/ffffff" },
  { key: "postgresql", categoryKey: "backEnd", icon: "https://cdn.simpleicons.org/postgresql/ffffff" },
  { key: "mongodb", categoryKey: "backEnd", icon: "https://cdn.simpleicons.org/mongodb/ffffff" },
  { key: "aws_cloud", categoryKey: "backEnd", icon: "https://cdn.simpleicons.org/amazonwebservices/ffffff" },
  { key: "backend_dockerization", categoryKey: "backEnd", icon: "https://cdn.simpleicons.org/docker/ffffff" },
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
  { key: "github_actions_ci", categoryKey: "versionControl", icon: "https://cdn.simpleicons.org/githubactions/ffffff" },
  { key: "3d_printing", categoryKey: "hardware3d", icon: "https://cdn.simpleicons.org/printables/ffffff" },
  { key: "proteus", categoryKey: "hardware3d", icon: "https://cdn.simpleicons.org/proteus/ffffff" },
  { key: "computer_systems", categoryKey: "hardware3d", icon: "https://cdn.simpleicons.org/linux/ffffff" },
];

type SkillItem = SkillCardItem & { categoryKey: SkillCategoryKey };

function isSkillCategoryKey(value: string): value is SkillCategoryKey {
  return (CATEGORY_KEYS as readonly string[]).includes(value);
}

export default function SkillsPage() {
  const t = useTranslations("skills");
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<SkillItem | null>(null);
  const skipFilterScrollRef = useRef(true);

  const activeCategory = useMemo((): SkillCategoryKey | null => {
    const raw = searchParams.get("category");
    if (!raw || !isSkillCategoryKey(raw)) return null;
    return raw;
  }, [searchParams]);

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
      }),
    [t],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredSkills = useMemo(() => {
    if (activeCategory === null) return skills;
    return skills.filter((s) => s.categoryKey === activeCategory);
  }, [skills, activeCategory]);

  const categoriesToShow = useMemo(() => {
    if (activeCategory !== null) return [activeCategory];
    return CATEGORY_KEYS.filter((key) => skills.some((s) => s.categoryKey === key));
  }, [activeCategory, skills]);

  useEffect(() => {
    if (skipFilterScrollRef.current) {
      skipFilterScrollRef.current = false;
      return;
    }
    const id = requestAnimationFrame(() => {
      document.getElementById("skills")?.scrollIntoView({ behavior: "smooth" });
    });
    return () => cancelAnimationFrame(id);
  }, [activeCategory]);

  const handleOpenSkill = (skill: SkillCardItem) => {
    setSelectedSkill(skill as SkillItem);
  };

  const setFilter = (category: SkillCategoryKey | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (category) params.set("category", category);
    else params.delete("category");
    const q = params.toString();
    router.replace(q ? `${pathname}?${q}` : pathname);
  };

  return (
    <div className="portfolio-page">
      <PortfolioPageHero
        className="skills-hero"
        kicker={t("heroBadge")}
        title={t("title")}
        tagline={t("tagline")}
        scrollTargetId="skills"
        mounted={mounted}
        background={
          mounted ? (
            <Orb
              variant="portfolio"
              hoverIntensity={0.58}
              rotateOnHover
              forceHoverState={false}
              backgroundColor="#030d14"
            />
          ) : null
        }
      />

      <div id="skills" className="skills-dark-section skills-list-section">
        <div className="portfolio-filters skills-filters">
          <div className="portfolio-filters__bar">
            <h2 className="portfolio-filters__title">{t("filterByCategory")}</h2>
            <div className="portfolio-filters__group" role="group" aria-label={t("filterByCategory")}>
              <button
                type="button"
                onClick={() => setFilter(null)}
                className={`portfolio-filters__btn${activeCategory === null ? " is-active" : ""}`}
              >
                <LayoutGrid className="portfolio-filters__btn-icon" size={16} strokeWidth={2} aria-hidden />
                <span>{t("filterAll")}</span>
              </button>
              {CATEGORY_KEYS.map((categoryKey) => (
                <button
                  key={categoryKey}
                  type="button"
                  onClick={() => setFilter(categoryKey)}
                  className={`portfolio-filters__btn${activeCategory === categoryKey ? " is-active" : ""}`}
                >
                  <SkillCategoryFilterIcon
                    categoryKey={categoryKey}
                    className="portfolio-filters__btn-icon"
                  />
                  <span>{t(`filterCategories.${categoryKey}`)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="skills-content">
          {filteredSkills.length === 0 ? (
            <p className="skills-empty">{t("filterEmpty")}</p>
          ) : activeCategory !== null ? (
            <ul className="skills-grid">
              {filteredSkills.map((skill) => (
                <li key={skill.name}>
                  <SkillCard skill={skill} onOpen={handleOpenSkill} />
                </li>
              ))}
            </ul>
          ) : (
            categoriesToShow.map((categoryKey) => {
              const categorySkills = skills.filter((s) => s.categoryKey === categoryKey);
              if (categorySkills.length === 0) return null;
              return (
                <section key={categoryKey} className="skills-category">
                  <header className="skills-category__head">
                    <span className="skills-category__label">{t("categoryLabel")}</span>
                    <h2 className="skills-category__title">{t(`categories.${categoryKey}`)}</h2>
                  </header>
                  <ul className="skills-grid">
                    {categorySkills.map((skill) => (
                      <li key={skill.name}>
                        <SkillCard skill={skill} onOpen={handleOpenSkill} />
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })
          )}
        </div>
      </div>

      {selectedSkill ? (
        <SkillDetailModal skill={selectedSkill} onClose={() => setSelectedSkill(null)} />
      ) : null}
    </div>
  );
}
