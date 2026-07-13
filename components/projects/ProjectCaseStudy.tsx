import { getTranslations } from "next-intl/server";

const CASE_STUDY_SLUGS = new Set(["tealcode", "study-agents", "turelojya"]);

type Props = {
  slug: string;
  locale: string;
};

export default async function ProjectCaseStudy({ slug, locale }: Props) {
  if (!CASE_STUDY_SLUGS.has(slug)) return null;

  const t = await getTranslations({
    locale,
    namespace: `projectPages.${slug}` as "projectPages.study-agents",
  });

  if (!t.has("caseStudyTitle")) return null;

  const sections = [
    { key: "problem", titleKey: "caseStudyProblemTitle", bodyKey: "caseStudyProblem" },
    { key: "solution", titleKey: "caseStudySolutionTitle", bodyKey: "caseStudySolution" },
    { key: "results", titleKey: "caseStudyResultsTitle", bodyKey: "caseStudyResults" },
  ] as const;

  return (
    <article
      className="project-case-study mx-auto w-full max-w-3xl px-4 py-10 sm:px-6"
      aria-labelledby="case-study-heading"
    >
      <h2 id="case-study-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">
        {t("caseStudyTitle")}
      </h2>
      <p className="mt-4 text-base leading-relaxed opacity-90">{t("caseStudyIntro")}</p>
      <div className="mt-8 space-y-8">
        {sections.map(({ key, titleKey, bodyKey }) => (
          <section key={key}>
            <h3 className="text-lg font-semibold">{t(titleKey)}</h3>
            <p className="mt-2 text-sm leading-relaxed opacity-85 sm:text-base">{t(bodyKey)}</p>
          </section>
        ))}
      </div>
      {t.has("caseStudyMetrics") && (
        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {(t.raw("caseStudyMetrics") as { label: string; value: string }[]).map((metric) => (
            <li
              key={metric.label}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-3"
            >
              <span className="block text-xs uppercase tracking-wider opacity-60">
                {metric.label}
              </span>
              <span className="mt-1 block text-lg font-semibold">{metric.value}</span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
