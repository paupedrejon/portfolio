"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";

type ProjectDetailHeroProps = {
  kicker: string;
  title: string;
  title2?: string;
  summary: string;
  imageSrc: string;
  imageAlt: string;
  backLabel: string;
  ctaHref?: string;
  ctaLabel?: string;
};

/** Hero: captura como fondo + gradiente home encima, copy a la izquierda. */
export default function ProjectDetailHero({
  kicker,
  title,
  title2,
  summary,
  imageSrc,
  imageAlt,
  backLabel,
  ctaHref,
  ctaLabel,
}: ProjectDetailHeroProps) {
  const isExternal = Boolean(ctaHref?.startsWith("http"));

  return (
    <header className="project-detail-hero">
      <div className="project-detail-hero__image-bg" aria-hidden>
        <Image
          src={imageSrc}
          alt=""
          fill
          priority
          sizes="100vw"
          className="project-detail-hero__image-bg-img"
        />
      </div>
      <div className="project-detail-hero__overlay" aria-hidden />

      <div className="project-detail-hero__inner">
        <Link href="/proyectos" className="project-detail-hero__back">
          <span aria-hidden>←</span> {backLabel}
        </Link>

        <p className="project-detail-hero__kicker">{kicker}</p>

        <h1 className="project-detail-hero__title">{title}</h1>

        {title2 ? <p className="project-detail-hero__headline">{title2}</p> : null}

        <p className="project-detail-hero__summary">{summary}</p>

        {ctaHref && ctaLabel ? (
          <div className="project-detail-hero__actions">
            {isExternal ? (
              <a
                href={ctaHref}
                className="home-btn--cv project-detail-hero__cta"
                target={ctaHref.includes(".apk") ? undefined : "_blank"}
                rel={ctaHref.includes(".apk") ? undefined : "noopener noreferrer"}
                download={ctaHref.includes(".apk") ? "" : undefined}
              >
                {ctaLabel}
              </a>
            ) : (
              <Link href={ctaHref} className="home-btn--cv project-detail-hero__cta">
                {ctaLabel}
              </Link>
            )}
          </div>
        ) : null}
      </div>
    </header>
  );
}
