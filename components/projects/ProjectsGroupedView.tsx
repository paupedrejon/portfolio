"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import type { ExpertiseAreaId } from "@/components/expertise/types";
import { ExpertiseAreaFilterIcon } from "@/lib/expertise/area-filter-icons";
import type { ProjectEntityId } from "@/lib/projects/config";
import { formatTimelineMonth, type ProjectGroup } from "@/lib/projects/views";
import ProjectsList from "@/components/projects/ProjectsList";

const AREA_TITLE_KEYS: Record<ExpertiseAreaId, string> = {
  "web-development": "areas.web.title",
  ai: "areas.ai.title",
  mobile: "areas.mobile.title",
  videogames: "areas.games.title",
  hardware: "areas.hardware.title",
};

const ENTITY_LOGOS: Partial<
  Record<ProjectEntityId, { logo: string; href: string; logoStyle?: "round" | "blend" | "warm" }>
> = {
  owius: { logo: "/owius.avif", href: "https://owius.com/", logoStyle: "warm" },
  upc: { logo: "/logo_upc.webp", href: "https://www.upc.edu/", logoStyle: "round" },
  iia: { logo: "/IIA.png", href: "https://iia.es/", logoStyle: "blend" },
  itb: { logo: "/ITB.png", href: "https://www.itb.cat/", logoStyle: "blend" },
};

type ProjectsGroupedViewProps = {
  groups: ProjectGroup[];
  variant: "timeline" | "entity" | "category";
};

function orgClassName(style?: "round" | "blend" | "warm"): string {
  return [
    "projects-group__org",
    style === "round" ? "projects-group__org--round" : "projects-group__org--mark",
  ].join(" ");
}

function ProjectsTimeline({ groups }: { groups: ProjectGroup[] }) {
  const t = useTranslations("projects");
  const locale = useLocale();

  return (
    <div className="projects-timeline" role="list">
      <div className="projects-timeline__spine" aria-hidden />
      {groups.map((group, index) => {
        if (!group.monthKey) return null;

        const labels = formatTimelineMonth(group.monthKey, locale);
        const prevYear =
          index > 0 && groups[index - 1].monthKey
            ? groups[index - 1].monthKey!.slice(0, 4)
            : null;
        const showYear = labels.year !== prevYear;

        return (
          <article key={group.id} className="projects-timeline__entry" role="listitem">
            <div className="projects-timeline__marker" aria-hidden>
              <div className="projects-timeline__node">
                {showYear ? (
                  <span className="projects-timeline__year">{labels.year}</span>
                ) : null}
                <span className="projects-timeline__month">{labels.monthShort}</span>
              </div>
              <span className="projects-timeline__pulse" />
            </div>

            <div className="projects-timeline__panel">
              <header className="projects-timeline__head">
                <div className="projects-timeline__head-copy">
                  <p className="projects-timeline__kicker">{labels.year}</p>
                  <h3 className="projects-timeline__title">{labels.monthLong}</h3>
                </div>
                <span className="projects-timeline__count">
                  {t("timelineCount", { count: group.projects.length })}
                </span>
              </header>
              <ProjectsList projects={group.projects} />
            </div>
          </article>
        );
      })}
    </div>
  );
}

export default function ProjectsGroupedView({ groups, variant }: ProjectsGroupedViewProps) {
  const t = useTranslations("projects");
  const tExpertise = useTranslations("expertise");

  if (groups.length === 0) return null;

  if (variant === "timeline") {
    return <ProjectsTimeline groups={groups} />;
  }

  return (
    <div className="projects-grouped">
      {groups.map((group) => {
        const entityMeta = group.entityId ? ENTITY_LOGOS[group.entityId] : undefined;
        const title = group.areaId
          ? tExpertise(AREA_TITLE_KEYS[group.areaId])
          : group.entityId
            ? t(`entity.${group.entityId}`)
            : group.title ?? "";

        return (
          <section key={group.id} className="projects-group">
            <header className="projects-group__head">
              {variant === "category" && group.areaId ? (
                <span className="projects-group__icon" aria-hidden>
                  <ExpertiseAreaFilterIcon areaId={group.areaId} size={22} />
                </span>
              ) : null}
              {variant === "entity" && entityMeta ? (
                <a
                  href={entityMeta.href}
                  className={orgClassName(entityMeta.logoStyle)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={title}
                >
                  <Image
                    src={entityMeta.logo}
                    alt=""
                    width={entityMeta.logoStyle === "round" ? 40 : 110}
                    height={entityMeta.logoStyle === "round" ? 40 : 28}
                    className="projects-group__org-logo"
                  />
                </a>
              ) : null}
              <h3 className="projects-group__title">{title}</h3>
            </header>
            <ProjectsList projects={group.projects} />
          </section>
        );
      })}
    </div>
  );
}
