"use client";

import { Link } from "@/i18n/navigation";
import { ProjectDetailIcon } from "@/lib/projects/detail-icons";
import { useTranslations } from "next-intl";

export type ProjectHighlight = {
  icon?: string;
  title: string;
  text: string;
};

export type ProjectStackItem = {
  name: string;
  role: string;
};

type ProjectDetailContentProps = {
  slug: string;
  techFallback: string;
};

function parseStack(raw: unknown): ProjectStackItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (item): item is ProjectStackItem =>
      typeof item === "object" &&
      item !== null &&
      "name" in item &&
      "role" in item &&
      typeof (item as ProjectStackItem).name === "string" &&
      typeof (item as ProjectStackItem).role === "string",
  );
}

function parseHighlights(raw: unknown): ProjectHighlight[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (item): item is ProjectHighlight =>
      typeof item === "object" &&
      item !== null &&
      "title" in item &&
      "text" in item &&
      typeof (item as ProjectHighlight).title === "string" &&
      typeof (item as ProjectHighlight).text === "string",
  );
}

function SectionHeading({
  icon,
  title,
}: {
  icon: string;
  title: string;
}) {
  return (
    <div className="project-section-head">
      <span className="project-section-head__icon" aria-hidden>
        <ProjectDetailIcon name={icon} size={32} />
      </span>
      <h2 className="project-section-head__title">{title}</h2>
    </div>
  );
}

export default function ProjectDetailContent({
  slug,
  techFallback,
}: ProjectDetailContentProps) {
  const t = useTranslations("projects");
  const tPage = useTranslations(`projectPages.${slug}` as "projectPages.study-agents");

  const hasContext = tPage.has("contextTitle") && tPage.has("context");
  const contextTitle = hasContext ? tPage("contextTitle") : "";
  const context = hasContext ? tPage("context") : "";

  const overview = tPage("overview");
  const highlights = parseHighlights(tPage.raw("highlights"));
  const stack = parseStack(tPage.raw("stack"));
  const stackIntro = tPage("stackIntro");
  const role = tPage("role");

  const stackItems =
    stack.length > 0
      ? stack
      : techFallback.split(",").map((name) => ({
          name: name.trim(),
          role: "",
        }));

  return (
    <div className="project-detail-body">
      <div className="project-detail-body__inner">
        {hasContext ? (
          <section className="project-panel project-panel--accent">
            <SectionHeading icon="graduation" title={contextTitle} />
            <p className="project-panel__text project-panel__text--large">{context}</p>
          </section>
        ) : null}

        <section className="project-panel">
          <SectionHeading icon="file" title={tPage("overviewTitle")} />
          <p className="project-panel__text project-panel__text--large">{overview}</p>
        </section>

        {highlights.length > 0 ? (
          <section className="project-panel">
            <SectionHeading icon="sparkles" title={tPage("highlightsTitle")} />
            <ul className="project-highlights">
              {highlights.map((item) => (
                <li key={item.title} className="project-highlights__item">
                  <article className="project-highlights__card">
                    <span className="project-highlights__icon" aria-hidden>
                      <ProjectDetailIcon name={item.icon ?? "sparkles"} size={36} />
                    </span>
                    <h3 className="project-highlights__card-title">{item.title}</h3>
                    <p className="project-highlights__card-text">{item.text}</p>
                  </article>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="project-panel">
          <SectionHeading icon="layers" title={t("stackTitle")} />
          {stackIntro ? (
            <p className="project-panel__text project-panel__intro">{stackIntro}</p>
          ) : null}
          <ul className="project-stack">
            {stackItems.map((item) => (
              <li key={item.name} className="project-stack__item">
                <span className="project-stack__icon" aria-hidden>
                  <ProjectDetailIcon name="code" size={22} />
                </span>
                <div className="project-stack__copy">
                  <span className="project-stack__name">{item.name}</span>
                  {item.role ? (
                    <span className="project-stack__role">{item.role}</span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </section>

        {role ? (
          <section className="project-panel project-panel--role">
            <SectionHeading icon="user" title={t("roleTitle")} />
            <p className="project-panel__text project-panel__text--large">{role}</p>
          </section>
        ) : null}

        <footer className="project-detail-body__footer">
          <Link href="/proyectos" className="project-detail-body__back-link">
            ← {t("backToProjects")}
          </Link>
        </footer>
      </div>
    </div>
  );
}
