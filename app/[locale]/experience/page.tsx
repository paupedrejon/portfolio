"use client";

import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { Briefcase } from "lucide-react";
import "../home.css";
import "../proyectos/proyectos.css";
import "./experience.css";
import PortfolioPageHero from "@/components/portfolio/PortfolioPageHero";

const Prism = dynamic(() => import("@/components/Prism"), { ssr: false });

type WorkBlock = {
  title: string;
  points: string[];
};

type OwiusItem = {
  title: string;
  company: string;
  years: string;
  summary: string;
  workBlocksTitle: string;
  workBlocks: WorkBlock[];
};

export default function ExperiencePage() {
  const t = useTranslations("experience");
  const [mounted, setMounted] = useState(false);
  const [hoveredExp, setHoveredExp] = useState<number | null>(null);

  const owius = t.raw("items.owius") as OwiusItem;

  const experienceItems = useMemo(
    () => [
      {
        title: owius.title,
        company: owius.company,
        description: owius.summary,
        workBlocksTitle: owius.workBlocksTitle,
        workBlocks: owius.workBlocks,
        years: owius.years,
      },
    ],
    [owius],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="portfolio-page">
      <PortfolioPageHero
        className="experience-hero"
        kicker={t("badge")}
        title={t("title")}
        tagline={t("tagline")}
        scrollTargetId="experience"
        mounted={mounted}
        background={
          mounted ? (
            <Prism
              animationType="rotate"
              timeScale={0.5}
              height={3.5}
              baseWidth={5.5}
              scale={3.6}
              hueShift={0}
              colorFrequency={1}
              noise={0}
              glow={1}
            />
          ) : null
        }
      />

      <section id="experience" className="experience-section">
        <div className="portfolio-filters experience-filters">
          <div className="portfolio-filters__bar">
            <h2 className="portfolio-filters__title">{t("sectionTitle")}</h2>
          </div>
        </div>

        <div className="experience-section__inner">
          <div className="experience-timeline">
            <div className="experience-timeline__line" aria-hidden />

            {experienceItems.map((item, index) => (
              <article
                key={index}
                className={`experience-entry${hoveredExp === index ? " is-hovered" : ""}`}
                onMouseEnter={() => setHoveredExp(index)}
                onMouseLeave={() => setHoveredExp(null)}
              >
                <span className="experience-entry__dot" aria-hidden />

                <div className="experience-card">
                  <div className="experience-card__body">
                    <div className="experience-card__icon" aria-hidden>
                      <Briefcase size={24} strokeWidth={1.75} />
                    </div>

                    <div className="experience-card__content">
                      <h3 className="experience-card__role">{item.title}</h3>
                      <p className="experience-card__company">{item.company}</p>

                      <div className="experience-card__summary">
                        {item.description.split("\n\n").map((para, i) => (
                          <p key={i}>{para}</p>
                        ))}
                      </div>

                      <p className="experience-card__blocks-title">{item.workBlocksTitle}</p>

                      <div className="experience-card__blocks">
                        {item.workBlocks.map((block, bi) => (
                          <div key={bi} className="experience-block">
                            <h4 className="experience-block__title">{block.title}</h4>
                            <ul className="experience-block__list">
                              {block.points.map((pt, pi) => (
                                <li key={pi}>{pt}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>

                      <span className="experience-card__years">{item.years}</span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <p className="experience-section__footnote">{t("yearsFootnote")}</p>
        </div>
      </section>
    </div>
  );
}
