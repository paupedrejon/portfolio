import ProjectDetailView from "@/components/projects/ProjectDetailView";
import JsonLd from "@/components/seo/JsonLd";
import { creativeWorkSchema } from "@/lib/seo/json-ld";
import { localizedUrl } from "@/lib/seo/paths";
import { projectDetailMetadata } from "@/lib/seo/sections";
import { isProjectSlug, PROJECTS_CONFIG, type ProjectSlug } from "@/lib/projects/config";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { SITE_URL } from "@/lib/seo/config";

type PageProps = {
  params: Promise<{ slug: string; locale: string }>;
};

export function generateStaticParams() {
  return PROJECTS_CONFIG.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug, locale } = await params;
  if (!isProjectSlug(slug)) {
    return {};
  }
  return projectDetailMetadata(locale, slug);
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { slug, locale } = await params;
  setRequestLocale(locale);

  if (!isProjectSlug(slug)) {
    notFound();
  }

  const tData = await getTranslations({ locale, namespace: "projectsData" });
  const tPage = await getTranslations({
    locale,
    namespace: `projectPages.${slug}` as "projectPages.study-agents",
  });
  const title = tData(`${slug}.title`);
  const title2 = tData(`${slug}.title2`);
  const name = title2?.trim() ? `${title} — ${title2}` : title;
  const url = localizedUrl(locale, `/proyectos/${slug}`);
  const config = PROJECTS_CONFIG.find((p) => p.slug === slug)!;
  const image = config.imageCard.startsWith("http")
    ? config.imageCard
    : `${SITE_URL}${config.imageCard}`;

  const schema = creativeWorkSchema({
    name,
    description: tPage("heroSummary"),
    url,
    image,
  });

  return (
    <>
      <JsonLd data={schema} />
      <ProjectDetailView slug={slug as ProjectSlug} />
    </>
  );
}
