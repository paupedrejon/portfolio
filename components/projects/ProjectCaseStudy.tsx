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

  const metrics = t.has("caseStudyMetrics")
    ? (t.raw("caseStudyMetrics") as { label: string; value: string }[])
    : [];

  return (
    <section className="project-case-study" aria-labelledby="case-study-heading">
      <div className="project-case-study__inner">
        <header className="project-case-study__header">
          <h2 id="case-study-heading" className="project-case-study__title">
            {t("caseStudyTitle")}
          </h2>
          <p className="project-case-study__intro">{t("caseStudyIntro")}</p>
        </header>

        <div className="project-case-study__sections">
          {sections.map(({ key, titleKey, bodyKey }) => (
            <article key={key} className="project-panel project-case-study__panel">
              <h3 className="project-case-study__section-title">{t(titleKey)}</h3>
              <p className="project-panel__text">{t(bodyKey)}</p>
            </article>
          ))}
        </div>

        {metrics.length > 0 ? (
          <ul className="project-case-study__metrics">
            {metrics.map((metric) => (
              <li key={metric.label} className="project-case-study__metric">
                <span className="project-case-study__metric-label">{metric.label}</span>
                <span className="project-case-study__metric-value">{metric.value}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
