import ProjectDetailView from "@/components/projects/ProjectDetailView";
import ProjectCaseStudy from "@/components/projects/ProjectCaseStudy";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";
import JsonLd from "@/components/seo/JsonLd";
import { creativeWorkSchema } from "@/lib/seo/json-ld";
import { localizedUrl } from "@/lib/seo/paths";
import { projectDetailMetadata } from "@/lib/seo/sections";
import { getVisibleProjects, isProjectSlug, PROJECTS_CONFIG, type ProjectSlug } from "@/lib/projects/config";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { SITE_NAME, SITE_URL } from "@/lib/seo/config";

type PageProps = {
  params: Promise<{ slug: string; locale: string }>;
};

export function generateStaticParams() {
  return getVisibleProjects().map((project) => ({ slug: project.slug }));
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

  const tProjects = await getTranslations({ locale, namespace: "projects" });
  const homeUrl = localizedUrl(locale, "/");
  const projectsUrl = localizedUrl(locale, "/proyectos");

  const schema = creativeWorkSchema({
    name,
    description: tPage("heroSummary"),
    url,
    image,
    datePublished: config.sortDate ? `${config.sortDate}-01` : undefined,
    keywords: config.tech.split(",").map((k) => k.trim()),
    programmingLanguage: config.tech
      .split(",")
      .map((k) => k.trim())
      .filter((k) =>
        ["React", "TypeScript", "Node.js", "Python", "Rust", "JavaScript"].some((lang) =>
          k.includes(lang),
        ),
      ),
    demoUrl: config.externalHref?.startsWith("http") ? config.externalHref : undefined,
  });

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: SITE_NAME, url: homeUrl },
          { name: tProjects("title"), url: projectsUrl },
          { name, url },
        ]}
      />
      <JsonLd data={schema} />
      <ProjectDetailView
        slug={slug as ProjectSlug}
        caseStudy={<ProjectCaseStudy slug={slug} locale={locale} />}
      />
    </>
  );
}
