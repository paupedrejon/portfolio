"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

const navCardKeys = [
  "projects",
  "skills",
  "experience",
  "education",
  "about",
  "contact",
] as const;

const navCardHrefs = [
  "/proyectos",
  "/skills",
  "/experience",
  "/education",
  "/about-me",
  "/contact",
];

const navCardIcons = [
  <svg key="0" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <path d="M8 21h8M12 17v4" />
  </svg>,
  <svg key="1" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>,
  <svg key="2" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>,
  <svg key="3" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c0 1.1.9 2 2 2h3" />
  </svg>,
  <svg key="4" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>,
  <svg key="5" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>,
];

/** Bloque “Explora mi trabajo” en la home. */
export default function ExploreWorkSection() {
  const t = useTranslations("home");
  const tCommon = useTranslations("common");

  return (
    <section id="sections" className="home-explore" aria-labelledby="home-explore-title">
      <header className="home-explore__header">
        <h2 id="home-explore-title" className="home-explore__title">
          {t("exploreWork")}
        </h2>
        <p className="home-explore__sub">{t("exploreSubtext")}</p>
      </header>

      <div className="home-explore__grid">
        {navCardKeys.map((key, index) => (
          <Link key={key} href={navCardHrefs[index]} className="home-explore__card">
            <span className="home-explore__card-index">{String(index + 1).padStart(2, "0")}</span>
            <div className="home-explore__card-icon">{navCardIcons[index]}</div>
            <h3 className="home-explore__card-title">{t(`navCards.${key}.title`)}</h3>
            <p className="home-explore__card-desc">{t(`navCards.${key}.description`)}</p>
            <span className="home-explore__card-link">
              {tCommon("explore")}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
