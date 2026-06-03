"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import type { ExpertiseAreaId } from "@/components/expertise/types";
import { ExpertiseAreaFilterIcon } from "@/lib/expertise/area-filter-icons";

const AREA_TITLE_KEYS: Record<ExpertiseAreaId, string> = {
  "web-development": "areas.web.title",
  ai: "areas.ai.title",
  mobile: "areas.mobile.title",
  videogames: "areas.games.title",
  hardware: "areas.hardware.title",
};

export type ProjectListItem = {
  slug: string;
  title: string;
  title2?: string;
  kicker: string;
  subtitle: string;
  imageCard: string;
  tech: string;
  sections: ExpertiseAreaId[];
};

type ProjectsListProps = {
  projects: ProjectListItem[];
};

export default function ProjectsList({ projects }: ProjectsListProps) {
  const t = useTranslations("projects");
  const tExpertise = useTranslations("expertise");

  return (
    <ul className="projects-grid">
      {projects.map((project) => (
        <li key={project.slug} className="projects-grid__item">
          <article className="projects-card">
            <Link
              href={`/proyectos/${project.slug}`}
              className="projects-card__image-link"
              aria-label={project.title}
            >
              <div className="projects-card__image-wrap">
                <Image
                  src={project.imageCard}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 33vw"
                  className="projects-card__image"
                />
              </div>
            </Link>

            <div className="projects-card__body">
              <p className="projects-card__kicker">{project.kicker}</p>
              <h3 className="projects-card__title">
                <Link href={`/proyectos/${project.slug}`}>{project.title}</Link>
              </h3>
              {project.title2 ? (
                <p className="projects-card__title2">{project.title2}</p>
              ) : null}

              {project.sections.length > 0 ? (
                <div className="projects-card__tags">
                  {project.sections.map((sectionId) => (
                    <span key={sectionId} className="projects-card__tag">
                      <ExpertiseAreaFilterIcon
                        areaId={sectionId}
                        className="projects-card__tag-icon"
                        size={13}
                      />
                      <span>{tExpertise(AREA_TITLE_KEYS[sectionId])}</span>
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="projects-card__actions">
                <Link
                  href={`/proyectos/${project.slug}`}
                  className="projects-card__btn home-btn--cv"
                >
                  {t("moreInfo")}
                </Link>
              </div>
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}
