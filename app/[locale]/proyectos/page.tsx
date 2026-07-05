"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Building2,
  CalendarRange,
  LayoutGrid,
  Shapes,
} from "lucide-react";

import "../home.css";
import "./proyectos.css";

import PortfolioPageHero from "@/components/portfolio/PortfolioPageHero";
import HomeHeroBackground from "@/components/home/HomeHeroBackground";
import Hyperspeed from "@/components/Hyperspeed";
import { hyperspeedPresets } from "@/components/hyperspeed-presets";
import { usePathname, useRouter } from "@/i18n/navigation";
import { isExpertiseAreaId, type ExpertiseAreaId } from "@/components/expertise/types";
import ProjectsList from "@/components/projects/ProjectsList";
import ProjectsGroupedView from "@/components/projects/ProjectsGroupedView";
import { getProjectEntityId, getVisibleProjects } from "@/lib/projects/config";
import { ExpertiseAreaFilterIcon } from "@/lib/expertise/area-filter-icons";
import {
  buildListOrderMap,
  groupProjectsByCategory,
  groupProjectsByEntity,
  groupProjectsByTimeline,
  isProjectViewMode,
  sortProjectsForListView,
  type ProjectViewMode,
} from "@/lib/projects/views";
import { trackPortfolioEvent } from "@/lib/analytics/track-client";

const PROJECT_FILTER_AREAS: { id: ExpertiseAreaId; titleKey: string }[] = [
  { id: "web-development", titleKey: "areas.web.title" },
  { id: "ai", titleKey: "areas.ai.title" },
  { id: "mobile", titleKey: "areas.mobile.title" },
  { id: "videogames", titleKey: "areas.games.title" },
  { id: "hardware", titleKey: "areas.hardware.title" },
];

const VIEW_MODES: {
  id: ProjectViewMode;
  labelKey: "viewList" | "viewTimeline" | "viewEntity" | "viewCategory";
  icon: typeof LayoutGrid;
}[] = [
  { id: "list", labelKey: "viewList", icon: LayoutGrid },
  { id: "timeline", labelKey: "viewTimeline", icon: CalendarRange },
  { id: "entity", labelKey: "viewEntity", icon: Building2 },
  { id: "category", labelKey: "viewCategory", icon: Shapes },
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
  const [weakDevice, setWeakDevice] = useState(false);
  const skipFilterScrollRef = useRef(true);

  const activeSection = useMemo((): ExpertiseAreaId | null => {
    const raw = searchParams.get("section");
    if (!raw || !isExpertiseAreaId(raw)) return null;
    return raw;
  }, [searchParams]);

  const activeView = useMemo((): ProjectViewMode => {
    const raw = searchParams.get("view");
    return isProjectViewMode(raw) ? raw : "list";
  }, [searchParams]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    trackPortfolioEvent("projects_view_change", { view: activeView });
  }, [mounted, activeView]);

  useEffect(() => {
    if (!mounted) return;
    trackPortfolioEvent("project_filter", {
      section: activeSection ?? "all",
    });
  }, [mounted, activeSection]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setReducedMotion(media.matches);
      const lowCpu = (navigator.hardwareConcurrency || 8) < 6;
      const lowMem =
        "deviceMemory" in navigator &&
        (navigator as Navigator & { deviceMemory?: number }).deviceMemory! <= 4;
      setWeakDevice(lowCpu || !!lowMem);
    };

    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const effectOptions = useMemo(() => hyperspeedPresets.one, []);
  const showHeroFx = mounted && !reducedMotion && !weakDevice;

  const listOrder = useMemo(
    () => buildListOrderMap(getVisibleProjects().map((project) => project.slug)),
    [],
  );

  const projects = useMemo(
    () =>
      getVisibleProjects().map((config) => ({
        slug: config.slug,
        title: tData(`${config.slug}.title`),
        title2: tData(`${config.slug}.title2`),
        kicker: tData(`${config.slug}.kicker`),
        subtitle: tData(`${config.slug}.subtitle`),
        imageCard: config.imageCard,
        tech: config.tech,
        sections: config.sections,
        sortDate: config.sortDate,
        entityId: getProjectEntityId(config),
        company: config.company,
      })),
    [tData],
  );

  const filteredProjects = useMemo(() => {
    if (activeSection === null) return projects;
    return projects.filter((project) => project.sections.includes(activeSection));
  }, [projects, activeSection]);

  const groupedView = useMemo(() => {
    switch (activeView) {
      case "timeline":
        return {
          variant: "timeline" as const,
          groups: groupProjectsByTimeline(filteredProjects),
        };
      case "entity":
        return {
          variant: "entity" as const,
          groups: groupProjectsByEntity(filteredProjects),
        };
      case "category":
        return {
          variant: "category" as const,
          groups: groupProjectsByCategory(filteredProjects),
        };
      default:
        return null;
    }
  }, [activeView, filteredProjects]);

  const listProjects = useMemo(
    () => sortProjectsForListView(filteredProjects, listOrder),
    [filteredProjects, listOrder],
  );

  useEffect(() => {
    if (skipFilterScrollRef.current) {
      skipFilterScrollRef.current = false;
      return;
    }

    const id = requestAnimationFrame(() => {
      document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" });
    });

    return () => cancelAnimationFrame(id);
  }, [activeSection, activeView]);

  const replaceQuery = (mutate: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    const q = params.toString();
    router.replace(q ? `${pathname}?${q}` : pathname);
  };

  const setFilter = (section: ExpertiseAreaId | null) => {
    replaceQuery((params) => {
      if (section) params.set("section", section);
      else params.delete("section");
    });
  };

  const setView = (view: ProjectViewMode) => {
    replaceQuery((params) => {
      if (view === "list") params.delete("view");
      else params.set("view", view);
    });
  };

  const hasResults = activeView === "list"
    ? listProjects.length > 0
    : (groupedView?.groups.length ?? 0) > 0;

  return (
    <div className="portfolio-page">
      <PortfolioPageHero
        className="proyectos-hero"
        kicker={t("badge")}
        title={t("title")}
        tagline={t("tagline")}
        scrollTargetId="projects"
        mounted={mounted}
        background={
          showHeroFx ? <Hyperspeed effectOptions={effectOptions} /> : <HomeHeroBackground />
        }
      />

      <div id="projects" className="projects-dark-section projects-list-section">
        <div className="portfolio-filters">
          <div className="portfolio-filters__bar">
            <h2 className="portfolio-filters__title">{t("viewBy")}</h2>
            <div className="portfolio-filters__group" role="group" aria-label={t("viewBy")}>
              {VIEW_MODES.map(({ id, labelKey, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setView(id)}
                  className={`portfolio-filters__btn${activeView === id ? " is-active" : ""}`}
                >
                  <Icon className="portfolio-filters__btn-icon" size={16} strokeWidth={2} aria-hidden />
                  <span>{t(labelKey)}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="portfolio-filters__bar portfolio-filters__bar--secondary">
            <h2 className="portfolio-filters__title">{t("filterByArea")}</h2>
            <div className="portfolio-filters__group" role="group" aria-label={t("filterByArea")}>
              <button
                type="button"
                onClick={() => setFilter(null)}
                className={`portfolio-filters__btn${activeSection === null ? " is-active" : ""}`}
              >
                <LayoutGrid className="portfolio-filters__btn-icon" size={16} strokeWidth={2} aria-hidden />
                <span>{t("filterAll")}</span>
              </button>

              {PROJECT_FILTER_AREAS.map(({ id, titleKey }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFilter(id)}
                  className={`portfolio-filters__btn${activeSection === id ? " is-active" : ""}`}
                >
                  <ExpertiseAreaFilterIcon areaId={id} className="portfolio-filters__btn-icon" />
                  <span>{tExpertise(titleKey)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="portfolio-projects-list">
          {!hasResults ? (
            <p className="portfolio-projects-list__empty">{t("filterEmpty")}</p>
          ) : activeView === "list" ? (
            <ProjectsList projects={listProjects} />
          ) : groupedView ? (
            <ProjectsGroupedView groups={groupedView.groups} variant={groupedView.variant} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
