"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { isLocaleFreePath } from "@/lib/i18n/locale-free-paths";
import { useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

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
  galleryImages?: string[];
  company?: {
    name: string;
    logo: string;
    href: string;
  };
};

const SWIPE_RATIO = 0.14;
const SWIPE_MIN_PX = 48;

/** Hero: captura como fondo + gradiente; con galería, carrusel horizontal deslizable. */
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
  galleryImages,
  company,
}: ProjectDetailHeroProps) {
  const t = useTranslations("projects");
  const heroRef = useRef<HTMLElement>(null);
  const dragRef = useRef({ startX: 0, width: 0, pointerId: -1 });

  const slides = useMemo(() => {
    if (galleryImages && galleryImages.length > 1) return galleryImages;
    return [imageSrc];
  }, [galleryImages, imageSrc]);

  const isCarousel = slides.length > 1;
  const [index, setIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const isExternal = Boolean(ctaHref?.startsWith("http"));
  const isLocaleFree = Boolean(ctaHref && isLocaleFreePath(ctaHref));
  const isDirectDownload = Boolean(
    ctaHref?.includes(".apk") ||
      ctaHref?.includes(".exe") ||
      ctaHref?.includes("/api/tealcode/installer"),
  );
  const isInternalDownload = Boolean(
    isDirectDownload && ctaHref && !ctaHref.startsWith("http"),
  );
  const usePlainAnchor = isExternal || isInternalDownload || isLocaleFree;

  const goTo = useCallback(
    (next: number) => {
      setIndex(Math.max(0, Math.min(slides.length - 1, next)));
    },
    [slides.length],
  );

  const finishDrag = useCallback(
    (clientX: number) => {
      const { startX, width } = dragRef.current;
      const delta = clientX - startX;
      const threshold = Math.max(SWIPE_MIN_PX, width * SWIPE_RATIO);

      if (delta <= -threshold) goTo(index + 1);
      else if (delta >= threshold) goTo(index - 1);

      setDragOffset(0);
      setIsDragging(false);
      dragRef.current.pointerId = -1;
    },
    [goTo, index],
  );

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isCarousel || event.button !== 0) return;
    if ((event.target as HTMLElement).closest("button, a")) return;
    const width = heroRef.current?.offsetWidth ?? 1;
    dragRef.current = { startX: event.clientX, width, pointerId: event.pointerId };
    setIsDragging(true);
    (event.currentTarget as HTMLDivElement).setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDragging || dragRef.current.pointerId !== event.pointerId) return;
    setDragOffset(event.clientX - dragRef.current.startX);
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDragging || dragRef.current.pointerId !== event.pointerId) return;
    (event.currentTarget as HTMLDivElement).releasePointerCapture(event.pointerId);
    finishDrag(event.clientX);
  };

  const onPointerCancel = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    if (dragRef.current.pointerId === event.pointerId) {
      (event.currentTarget as HTMLDivElement).releasePointerCapture(event.pointerId);
    }
    setDragOffset(0);
    setIsDragging(false);
    dragRef.current.pointerId = -1;
  };

  useEffect(() => {
    if (!isCarousel) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") goTo(index - 1);
      if (event.key === "ArrowRight") goTo(index + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo, index, isCarousel]);

  const trackTransform = isCarousel
    ? `translate3d(calc(${-index * 100}% + ${dragOffset}px), 0, 0)`
    : undefined;

  const showCopy = !isCarousel || index === 0;

  return (
    <header
      ref={heroRef}
      className={`project-detail-hero${isCarousel ? " project-detail-hero--carousel" : ""}${isDragging ? " is-dragging" : ""}`}
    >
      <div
        className="project-detail-hero__viewport"
        aria-live={isCarousel ? "polite" : undefined}
        onPointerDown={isCarousel ? onPointerDown : undefined}
        onPointerMove={isCarousel ? onPointerMove : undefined}
        onPointerUp={isCarousel ? onPointerUp : undefined}
        onPointerCancel={isCarousel ? onPointerCancel : undefined}
      >
        <div
          className="project-detail-hero__track"
          style={{
            transform: trackTransform,
            transition: isDragging ? "none" : "transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          {slides.map((src, slideIndex) => (
            <div
              key={`${src}-${slideIndex}`}
              className="project-detail-hero__slide"
              aria-hidden={isCarousel && slideIndex !== index}
            >
              <div className="project-detail-hero__image-bg" aria-hidden>
                <Image
                  src={src}
                  alt={slideIndex === 0 ? imageAlt : ""}
                  fill
                  priority={slideIndex <= 1}
                  sizes="100vw"
                  className={`project-detail-hero__image-bg-img${
                    slideIndex === 0 ? "" : " project-detail-hero__image-bg-img--photo"
                  }`}
                  draggable={false}
                />
              </div>
              {slideIndex === 0 ? (
                <div className="project-detail-hero__overlay" aria-hidden />
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div
        className={`project-detail-hero__inner${showCopy ? "" : " project-detail-hero__inner--hidden"}`}
        aria-hidden={!showCopy}
      >
        <Link href="/proyectos" className="project-detail-hero__back">
          <span aria-hidden>←</span> {backLabel}
        </Link>

        <div className="project-detail-hero__meta">
          <p className="project-detail-hero__kicker">
            <span>{kicker}</span>
            {company ? (
              <>
                <span className="project-detail-hero__kicker-dot" aria-hidden>
                  ·
                </span>
                <a
                  href={company.href}
                  className="project-detail-hero__company-link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {company.name}
                </a>
              </>
            ) : null}
          </p>
        </div>

        <h1 className="project-detail-hero__title">{title}</h1>

        {title2 ? <p className="project-detail-hero__headline">{title2}</p> : null}

        <p className="project-detail-hero__summary">{summary}</p>

        {ctaHref && ctaLabel ? (
          <div className="project-detail-hero__actions">
            {usePlainAnchor ? (
              <a
                href={ctaHref}
                className="home-btn--cv project-detail-hero__cta"
                target={isDirectDownload || isLocaleFree ? undefined : "_blank"}
                rel={
                  isDirectDownload || isLocaleFree ? undefined : "noopener noreferrer"
                }
                download={isDirectDownload ? "" : undefined}
              >
                {ctaLabel}
              </a>
            ) : (
              <Link href={ctaHref!} className="home-btn--cv project-detail-hero__cta">
                {ctaLabel}
              </Link>
            )}
          </div>
        ) : null}
      </div>

      {isCarousel ? (
        <>
          <div className="project-detail-hero__carousel-ui">
            <button
              type="button"
              className="project-detail-hero__carousel-btn project-detail-hero__carousel-btn--prev"
              onClick={() => goTo(index - 1)}
              disabled={index === 0}
              aria-label={t("carouselPrev")}
            >
              <span aria-hidden>‹</span>
            </button>
            <button
              type="button"
              className="project-detail-hero__carousel-btn project-detail-hero__carousel-btn--next"
              onClick={() => goTo(index + 1)}
              disabled={index === slides.length - 1}
              aria-label={t("carouselNext")}
            >
              <span aria-hidden>›</span>
            </button>
          </div>

          <div
            className="project-detail-hero__dots"
            role="tablist"
            aria-label={t("carouselDots")}
          >
            {slides.map((src, dotIndex) => (
              <button
                key={`dot-${src}-${dotIndex}`}
                type="button"
                role="tab"
                aria-selected={dotIndex === index}
                aria-label={`${t("carouselDots")} ${dotIndex + 1}/${slides.length}`}
                className={`project-detail-hero__dot${
                  dotIndex === index ? " project-detail-hero__dot--active" : ""
                }`}
                onClick={() => goTo(dotIndex)}
              />
            ))}
          </div>
        </>
      ) : null}
    </header>
  );
}
