import ProjectCard from "@/components/ProjectCard";
import { projects } from "@/data/projects";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "projectsList" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function ProjectsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("projectsList");
  const codeLabel = t("code");
  const demoLabel = t("demo");

  return (
    <section className="mx-auto w-full max-w-7xl min-w-0 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <h1 className="text-2xl font-bold sm:text-3xl">{t("title")}</h1>
      <p className="mt-2 max-w-prose text-sm opacity-80 sm:text-base">{t("subtitle")}</p>
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
        {projects.map((p) => (
          <ProjectCard
            key={p.slug}
            project={p}
            codeLabel={codeLabel}
            demoLabel={demoLabel}
          />
        ))}
      </div>
    </section>
  );
}
