"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { FaUniversity, FaGraduationCap, FaCertificate } from "react-icons/fa";
import "../home.css";
import "../proyectos/proyectos.css";
import "./education.css";
import PortfolioPageHero from "@/components/portfolio/PortfolioPageHero";
import HomeHeroBackground from "@/components/home/HomeHeroBackground";

const LightPillar = dynamic(() => import("@/components/LightPillar"), {
  ssr: false,
});

type EduType = "certificate" | "degree" | "course" | "diploma";

type EducationItem = {
  key: string;
  icon: React.ReactNode;
  href: string;
  years: string;
  type: EduType;
  title: string;
  school: string;
  description: string;
};

const EDUCATION_CONFIG = [
  {
    key: "iia10x",
    icon: <FaCertificate size={22} />,
    href: "https://www.credential.net/9340a704-7896-4104-b745-d6e2c9605eb0#acc.zYw8lsuv",
    years: "2025–2026",
    type: "certificate" as const,
  },
  {
    key: "upcDegree",
    icon: <FaGraduationCap size={22} />,
    href: "https://www.upc.edu/ca/graus/enginyeria-informatica-barcelona-fib",
    years: "2023–2027*",
    type: "degree" as const,
  },
  {
    key: "unityCourse",
    icon: <FaCertificate size={22} />,
    href: "https://www.fib.upc.edu/es/noticias/cursos-vgafib-febrero-2022",
    years: "2024",
    type: "course" as const,
  },
  {
    key: "itbDiploma",
    icon: <FaUniversity size={22} />,
    href: "https://itecbcn.eu/portfolio/batxillerat-tecnologic-digital/",
    years: "2021–2023",
    type: "diploma" as const,
  },
] as const;

export default function EducationPage() {
  const t = useTranslations("education");
  const [mounted, setMounted] = useState(false);
  const [selectedEdu, setSelectedEdu] = useState<EducationItem | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [weakDevice, setWeakDevice] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const educationItems = useMemo(
    () =>
      EDUCATION_CONFIG.map((config) => {
        const item = t.raw(`items.${config.key}`) as {
          title: string;
          school: string;
          description: string;
        };
        return {
          ...config,
          title: item.title,
          school: item.school,
          description: item.description,
        };
      }),
    [t]
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setReducedMotion(media.matches);
      setIsMobile(window.innerWidth < 768);
      const lowCpu = (navigator.hardwareConcurrency || 8) < 6;
      const lowMem =
        "deviceMemory" in navigator &&
        (navigator as Navigator & { deviceMemory?: number }).deviceMemory! <= 4;
      setWeakDevice(lowCpu || !!lowMem);
    };
    update();
    media.addEventListener("change", update);
    window.addEventListener("resize", update);
    return () => {
      media.removeEventListener("change", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  useEffect(() => {
    if (!selectedEdu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedEdu(null);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [selectedEdu]);

  const showPillar = mounted && !reducedMotion && !weakDevice;

  return (
    <div className="portfolio-page portfolio-page--cherry">
      <PortfolioPageHero
        className="education-hero"
        kicker={t("badge")}
        title={t("title")}
        tagline={t("tagline")}
        scrollTargetId="education"
        mounted={mounted}
        background={
          showPillar ? (
            <LightPillar
              topColor="#f43f5e"
              bottomColor="#52131e"
              intensity={1}
              glowAmount={0.002}
              bloom={0.5}
              pillarWidth={3}
              pillarHeight={0.4}
              pillarRotation={25}
              rotationSpeed={0.3}
              interactive
              clickPulse
              intro
              quality={isMobile ? "medium" : "high"}
              mixBlendMode="screen"
              twist={0.4}
              detail={isMobile ? 3 : 4}
              flow={1}
              noiseIntensity={0.5}
              fade={0}
              lightMode={false}
            />
          ) : (
            <HomeHeroBackground />
          )
        }
      />

      <section id="education" className="education-section">
        <div className="education-section__inner">
          <header className="education-header">
            <p className="education-header__kicker">{t("academicBackground")}</p>
            <h2 className="education-header__title">{t("educationTimeline")}</h2>
          </header>

          <div className="education-timeline">
            <div className="education-timeline__line" aria-hidden />

            {educationItems.map((item) => (
              <article key={item.key} className="education-entry">
                <span className="education-entry__dot" aria-hidden />
                <button
                  type="button"
                  className="education-card"
                  onClick={() => setSelectedEdu(item)}
                  aria-label={item.title}
                >
                  <div className="education-card__row">
                    <span className="education-card__icon" aria-hidden>
                      {item.icon}
                    </span>
                    <div className="education-card__body">
                      <h3 className="education-card__title">{item.title}</h3>
                      <p className="education-card__school">{item.school}</p>
                      <span className="education-card__years">{item.years}</span>
                    </div>
                    <svg
                      className="education-card__arrow"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      {selectedEdu ? (
        <div
          className="education-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="education-modal-title"
          onClick={() => setSelectedEdu(null)}
        >
          <div
            className="education-modal__panel"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="education-modal__glow education-modal__glow--a" aria-hidden />
            <span className="education-modal__glow education-modal__glow--b" aria-hidden />

            <div className="education-modal__top">
              <span className="education-modal__icon" aria-hidden>
                {selectedEdu.icon}
              </span>
              <button
                type="button"
                className="education-modal__close"
                onClick={() => setSelectedEdu(null)}
                aria-label={t("close")}
              >
                ✕
              </button>
            </div>

            <span className="education-modal__type">
              {t(`types.${selectedEdu.type}`)}
            </span>
            <h2 id="education-modal-title" className="education-modal__title">
              {selectedEdu.title}
            </h2>
            <p className="education-modal__school">{selectedEdu.school}</p>
            {selectedEdu.description ? (
              <p className="education-modal__desc">{selectedEdu.description}</p>
            ) : null}

            <div className="education-modal__footer">
              <span className="education-modal__years">{selectedEdu.years}</span>
              {selectedEdu.href ? (
                <a
                  href={selectedEdu.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="education-modal__link"
                >
                  {t("viewMoreInfo")}
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden
                  >
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
