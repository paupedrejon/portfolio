import { getTranslations } from "next-intl/server";
import { getProjectBySlug, type ProjectSlug } from "@/lib/projects/config";
import { buildPageMetadata } from "./metadata";
import { DEFAULT_OG_IMAGE, SITE_NAME } from "./config";

const SITE_SUFFIX = ` | ${SITE_NAME}`;

export async function homeMetadata(locale: string) {
  const t = await getTranslations({ locale, namespace: "home" });
  return buildPageMetadata({
    locale,
    pathname: "/",
    title: t("seoTitle"),
    description: t("seoDescription"),
    keywords: t.raw("seoKeywords") as string[],
  });
}

export async function projectsMetadata(locale: string) {
  const t = await getTranslations({ locale, namespace: "projects" });
  return buildPageMetadata({
    locale,
    pathname: "/proyectos",
    title: `${t("title")}${SITE_SUFFIX}`,
    description: t("tagline"),
  });
}

export async function skillsMetadata(locale: string) {
  const t = await getTranslations({ locale, namespace: "skills" });
  return buildPageMetadata({
    locale,
    pathname: "/skills",
    title: `${t("title")}${SITE_SUFFIX}`,
    description: t("tagline"),
  });
}

export async function experienceMetadata(locale: string) {
  const t = await getTranslations({ locale, namespace: "experience" });
  return buildPageMetadata({
    locale,
    pathname: "/experience",
    title: `${t("title")}${SITE_SUFFIX}`,
    description: t("seoDescription"),
    keywords: t.raw("seoKeywords") as string[],
  });
}

export async function educationMetadata(locale: string) {
  const t = await getTranslations({ locale, namespace: "education" });
  return buildPageMetadata({
    locale,
    pathname: "/education",
    title: `${t("title")}${SITE_SUFFIX}`,
    description: t("tagline"),
  });
}

export async function aboutMetadata(locale: string) {
  const t = await getTranslations({ locale, namespace: "about" });
  return buildPageMetadata({
    locale,
    pathname: "/about-me",
    title: `${t("title")}${SITE_SUFFIX}`,
    description: t("tagline"),
  });
}

export async function contactMetadata(locale: string) {
  const t = await getTranslations({ locale, namespace: "contact" });
  return buildPageMetadata({
    locale,
    pathname: "/contact",
    title: `${t("title")}${SITE_SUFFIX}`,
    description: t("seoDescription"),
    keywords: t.raw("seoKeywords") as string[],
  });
}

export async function egoPageMetadata(locale: string) {
  const tData = await getTranslations({ locale, namespace: "projectsData" });
  const tPage = await getTranslations({ locale, namespace: "projectPages.ego" });
  const title = tData("ego.title");
  const title2 = tData("ego.title2");
  const name = title2 ? `${title} — ${title2}` : title;
  const config = getProjectBySlug("ego")!;
  return buildPageMetadata({
    locale,
    pathname: "/ego",
    title: `${name}${SITE_SUFFIX}`,
    description: tPage("heroSummary"),
    image: config.imageCard,
  });
}

export async function projectDetailMetadata(locale: string, slug: ProjectSlug) {
  const tData = await getTranslations({ locale, namespace: "projectsData" });
  const tPage = await getTranslations({
    locale,
    namespace: `projectPages.${slug}` as "projectPages.study-agents",
  });
  const config = getProjectBySlug(slug)!;
  const title = tData(`${slug}.title`);
  const title2 = tData(`${slug}.title2`);
  const name = title2?.trim() ? `${title} — ${title2}` : title;
  return buildPageMetadata({
    locale,
    pathname: `/proyectos/${slug}`,
    title: `${name}${SITE_SUFFIX}`,
    description: tPage("heroSummary"),
    image: config.imageCard ?? DEFAULT_OG_IMAGE,
  });
}
