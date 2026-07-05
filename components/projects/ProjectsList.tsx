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

import type { ProjectEntityId } from "@/lib/projects/config";

export type ProjectListItem = {
  slug: string;
  title: string;
  title2?: string;
  kicker: string;
  subtitle: string;
  imageCard: string;
  tech: string;
  sections: ExpertiseAreaId[];
  sortDate: string;
  entityId: ProjectEntityId;
  company?: {
    id: ProjectEntityId;
    name: string;
    logo: string;
    href: string;
    logoStyle?: "round" | "blend" | "warm";
  };
};

type ProjectsListProps = {
  projects: ProjectListItem[];
};

function orgClassName(style?: "round" | "blend" | "warm"): string {
  return [
    "projects-card__org",
    style === "round" ? "projects-card__org--round" : "projects-card__org--mark",
  ].join(" ");
}

/** Año o kicker completo si es prácticas — el logo identifica la institución. */
function formatCardKicker(kicker: string, hasCompany: boolean): string {
  if (!hasCompany) return kicker;
  if (/prácticas|internship|tirocinio/i.test(kicker)) return kicker;
  const year = kicker.match(/^(\d{4})/)?.[1];
  return year ?? kicker;
}

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
              <div className="projects-card__meta">
                <p className="projects-card__kicker">
                  {formatCardKicker(project.kicker, Boolean(project.company))}
                </p>
                {project.company ? (
                  <a
                    href={project.company.href}
                    className={orgClassName(project.company.logoStyle)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={project.company.name}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Image
                      src={project.company.logo}
                      alt=""
                      width={project.company.logoStyle === "round" ? 48 : 130}
                      height={project.company.logoStyle === "round" ? 48 : 32}
                      className="projects-card__org-logo"
                    />
                  </a>
                ) : null}
              </div>
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
