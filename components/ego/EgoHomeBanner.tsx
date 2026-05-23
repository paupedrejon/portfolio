"use client";

import { useTranslations } from "next-intl";
import EgoDownloadButton from "./EgoDownloadButton";
import EgoPhoneCanvas from "./EgoPhoneScene";
import EgoPillButton from "./EgoPillButton";
import { IconZap } from "./EgoIcons";

/** Novedad e-Go justo debajo del hero de la home. */
export default function EgoHomeBanner() {
  const t = useTranslations("home.egoBanner");
  const stats = t.raw("stats") as { value: string; label: string }[];

  return (
    <section aria-labelledby="ego-banner-title" className="ego-home-banner">
      <div className="ego-home-banner__card">
        <div className="ego-home-banner__mesh" aria-hidden />
        <div className="ego-home-banner__grid" aria-hidden />
        <p className="ego-home-banner__watermark" aria-hidden>
          E-GO
        </p>

        <div className="ego-home-banner__layout">
          <div className="ego-home-banner__visual">
            <div className="ego-home-banner__phone-glow" aria-hidden />
            <EgoPhoneCanvas variant="banner" />
          </div>

          <div className="ego-home-banner__copy">
            <span className="ego-home-banner__badge">
              <IconZap width={14} height={14} aria-hidden />
              {t("badge")}
            </span>

            <p className="ego-home-banner__kicker">{t("headline")}</p>

            <h2 id="ego-banner-title" className="ego-home-banner__title">
              {t("title")}
            </h2>

            <p className="ego-home-banner__desc">{t("description")}</p>

            <ul className="ego-home-banner__stats">
              {stats.map((s) => (
                <li key={s.label}>
                  <strong>{s.value}</strong>
                  <span>{s.label}</span>
                </li>
              ))}
            </ul>

            <div className="ego-home-banner__actions">
              <EgoDownloadButton label={t("downloadCta")} className="ego-home-banner__cta" />
              <EgoPillButton variant="primary" localeHref="/ego" className="ego-home-banner__cta">
                {t("learnMore")}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </EgoPillButton>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .ego-home-banner {
          padding: clamp(1.5rem, 4vw, 3rem) clamp(1rem, 4vw, 4rem);
          background: #0a0a0f;
        }
        .ego-home-banner__card {
          position: relative;
          max-width: 72rem;
          margin: 0 auto;
          overflow: hidden;
          border-radius: 1.5rem;
          border: 1px solid rgba(42, 185, 130, 0.35);
          background: linear-gradient(
            145deg,
            rgba(42, 185, 130, 0.16) 0%,
            rgba(6, 20, 14, 0.98) 38%,
            #060908 100%
          );
          box-shadow:
            0 0 0 1px rgba(42, 185, 130, 0.08) inset,
            0 24px 80px rgba(0, 0, 0, 0.55),
            0 0 60px rgba(42, 185, 130, 0.08);
        }
        .ego-home-banner__mesh {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 90% 70% at 0% 50%, rgba(42, 185, 130, 0.22) 0%, transparent 55%),
            radial-gradient(ellipse 50% 60% at 100% 30%, rgba(16, 185, 129, 0.15) 0%, transparent 50%);
          pointer-events: none;
        }
        .ego-home-banner__grid {
          position: absolute;
          inset: 0;
          opacity: 0.35;
          background-image:
            linear-gradient(rgba(42, 185, 130, 0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(42, 185, 130, 0.06) 1px, transparent 1px);
          background-size: 32px 32px;
          mask-image: linear-gradient(180deg, black 0%, transparent 85%);
          pointer-events: none;
        }
        .ego-home-banner__watermark {
          position: absolute;
          right: -0.05em;
          bottom: -0.15em;
          margin: 0;
          font-family: "Lulo Clean", "Bebas Neue", var(--font-league-spartan), sans-serif;
          font-size: clamp(5rem, 18vw, 11rem);
          line-height: 0.85;
          letter-spacing: 0.04em;
          color: rgba(42, 185, 130, 0.06);
          pointer-events: none;
          user-select: none;
          display: none;
        }
        @media (min-width: 900px) {
          .ego-home-banner__watermark {
            display: block;
          }
        }
        .ego-home-banner__layout {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding: clamp(1.5rem, 4vw, 2.75rem);
        }
        @media (min-width: 900px) {
          .ego-home-banner__layout {
            display: grid;
            grid-template-columns: 1.2fr 1fr;
            align-items: center;
            gap: 0.5rem 1.5rem;
            min-height: 420px;
          }
        }
        .ego-home-banner__visual {
          position: relative;
          width: 100%;
          min-height: clamp(300px, 62vw, 420px);
          margin: 0 -0.75rem;
          order: 2;
        }
        @media (min-width: 900px) {
          .ego-home-banner__visual {
            order: 1;
            margin: 0;
            min-height: 400px;
            height: 100%;
          }
        }
        .ego-home-banner__copy {
          order: 1;
        }
        @media (min-width: 900px) {
          .ego-home-banner__copy {
            order: 2;
          }
        }
        .ego-home-banner__badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          margin-bottom: 0.85rem;
          padding: 0.35rem 0.85rem;
          border-radius: 999px;
          font-family: var(--font-mono);
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #6ee7b7;
          background: rgba(42, 185, 130, 0.18);
          border: 1px solid rgba(42, 185, 130, 0.45);
          box-shadow: 0 0 20px rgba(42, 185, 130, 0.2);
        }
        .ego-home-banner__kicker {
          margin: 0 0 0.35rem;
          font-family: var(--font-mono);
          font-size: 0.75rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(110, 231, 183, 0.85);
        }
        .ego-home-banner__title {
          margin: 0 0 0.65rem;
          font-family: "Lulo Clean", "Bebas Neue", var(--font-league-spartan), sans-serif;
          font-size: clamp(2.25rem, 8vw, 4.25rem);
          line-height: 0.95;
          letter-spacing: 0.04em;
          color: #fff;
          text-shadow: 0 0 40px rgba(42, 185, 130, 0.25);
        }
        .ego-home-banner__desc {
          margin: 0 0 1.15rem;
          max-width: 28rem;
          font-family: var(--font-body);
          font-size: clamp(0.95rem, 2.5vw, 1.1rem);
          line-height: 1.5;
          color: rgba(255, 255, 255, 0.72);
        }
        .ego-home-banner__stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.5rem;
          margin: 0 0 1.35rem;
          padding: 0;
          list-style: none;
        }
        @media (min-width: 480px) {
          .ego-home-banner__stats {
            display: flex;
            flex-wrap: wrap;
            gap: 0.65rem;
          }
          .ego-home-banner__stats li {
            flex: 0 1 auto;
          }
        }
        .ego-home-banner__stats li {
          display: flex;
          flex-direction: column;
          gap: 0.1rem;
          padding: 0.5rem 0.75rem;
          border-radius: 10px;
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid rgba(42, 185, 130, 0.22);
          min-width: 0;
        }
        @media (min-width: 480px) {
          .ego-home-banner__stats li {
            padding: 0.55rem 1rem;
            min-width: 5rem;
          }
        }
        .ego-home-banner__stats strong {
          font-family: "Lulo Clean", "Bebas Neue", var(--font-league-spartan), sans-serif;
          font-size: clamp(1.1rem, 4vw, 1.35rem);
          letter-spacing: 0.03em;
          color: #5eead4;
          font-weight: 400;
        }
        .ego-home-banner__stats span {
          font-size: 0.65rem;
          font-family: var(--font-mono);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: rgba(255, 255, 255, 0.45);
        }
        .ego-home-banner__actions {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          width: 100%;
        }
        @media (min-width: 520px) {
          .ego-home-banner__actions {
            flex-direction: row;
            flex-wrap: wrap;
            align-items: center;
          }
        }
        .ego-home-banner__actions :global(.ego-home-banner__cta) {
          width: 100%;
        }
        @media (min-width: 520px) {
          .ego-home-banner__actions :global(.ego-home-banner__cta) {
            width: auto;
          }
        }
        .ego-home-banner__phone-glow {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: min(420px, 95%);
          height: 260px;
          border-radius: 50%;
          background: radial-gradient(ellipse, rgba(42, 185, 130, 0.5) 0%, transparent 68%);
          filter: blur(40px);
          pointer-events: none;
          z-index: 0;
        }
        @media (min-width: 900px) {
          .ego-home-banner__phone-glow {
            width: 100%;
            height: 320px;
          }
        }
        .ego-home-banner__visual :global(.ego-phone-canvas) {
          position: relative;
          z-index: 1;
          height: 100%;
          min-height: inherit;
        }
        .ego-home-banner__visual :global(.ego-phone-canvas--banner) {
          min-height: clamp(300px, 62vw, 460px) !important;
        }
        @media (min-width: 900px) {
          .ego-home-banner__visual :global(.ego-phone-canvas--banner) {
            min-height: 400px !important;
          }
        }
      `}</style>
    </section>
  );
}
