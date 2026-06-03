"use client";

import EgoPageSections from "@/components/ego/EgoPageSections";
import ProjectDetailContent from "@/components/projects/ProjectDetailContent";
import ProjectDetailHero from "@/components/projects/ProjectDetailHero";
import { getProjectBySlug, type ProjectSlug } from "@/lib/projects/config";
import { useTranslations } from "next-intl";
import "@/app/[locale]/home.css";
import "@/app/[locale]/proyectos/project-detail.css";

type ProjectDetailViewProps = {
  slug: ProjectSlug;
};

export default function ProjectDetailView({ slug }: ProjectDetailViewProps) {
  const config = getProjectBySlug(slug)!;
  const t = useTranslations("projects");
  const tData = useTranslations("projectsData");
  const tPage = useTranslations(`projectPages.${slug}` as "projectPages.study-agents");

  const title = tData(`${slug}.title`);
  const title2 = tData(`${slug}.title2`);
  const kicker = tData(`${slug}.kicker`);
  const ctaText = tData(`${slug}.ctaText`);
  const isEgo = config.extendedLayout === "ego";

  const ctaHref = config.externalHref;
  const ctaLabel = ctaText?.trim() ? ctaText : undefined;

  return (
    <main className={`project-detail-page${isEgo ? " project-detail-page--ego" : ""}`}>
      <ProjectDetailHero
        kicker={kicker}
        title={title}
        title2={title2}
        summary={tPage("heroSummary")}
        imageSrc={config.imageCard}
        imageAlt={title}
        backLabel={t("backToProjects")}
        ctaHref={ctaHref}
        ctaLabel={ctaLabel}
      />

      <ProjectDetailContent slug={slug} techFallback={config.tech} />

      {isEgo ? (
        <div className="project-detail-ego-extra">
          <EgoPageSections />
        </div>
      ) : null}
    </main>
  );
}
