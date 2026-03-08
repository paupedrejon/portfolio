// components/SectionPage.tsx
"use client";

import { ReactNode } from "react";
import ScrollReveal from "./ScrollReveal";
import TechLogosMarquee from "./TechLogosMarquee";

type Align = "center" | "left" | "right";

interface SectionPageProps {
  id?: string;
  title: ReactNode;
  title2?: ReactNode;
  subtitle?: ReactNode;

  /** === HERO (imagen de fondo a pantalla completa) === */
  background?: string;
  darken?: number;
  gradient?: boolean;

  /** === SPLIT (fondo sólido + imagen enmarcada) === */
  solidBg?: string;
  imageCard?: string;
  imageSide?: "left" | "right";
  imageMaxW?: string;
  imageAspect?: string;
  showSeparator?: boolean;
  separatorColor?: string;

  /** Comunes */
  textColor?: string;
  ctaText?: string;
  ctaHref?: string;
  align?: Align;
  className?: string;
  kicker?: string;

  /** Texto intermedio entre título y descripción */
  midText?: ReactNode;
  midTextColor?: string;
}

export default function SectionPage({
  id,
  title,
  title2,
  subtitle,
  background = "",
  darken = 0.8,
  gradient = false,
  solidBg,
  imageCard,
  imageSide = "right",
  imageMaxW = "clamp(300px, 45vw, 600px)",
  imageAspect = "16/10",
  showSeparator = true,
  separatorColor = "var(--border-subtle)",
  textColor,
  ctaText,
  ctaHref,
  align = "left",
  className = "",
  kicker,
  midText,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  midTextColor,
}: SectionPageProps) {
  const useSplit = !!solidBg || !!imageCard;

  // Normalize background URL
  let bg = background?.trim() || "";
  if (bg) {
    const isUrlWrapped = bg.startsWith("url(");
    const isAbsolute = /^https?:\/\//i.test(bg);
    if (!isUrlWrapped) {
      if (!isAbsolute && !bg.startsWith("/")) bg = "/" + bg;
      bg = `url(${bg})`;
    }
  }

  const overlayOpacity = Math.max(0, Math.min(1, darken));
  const effectiveTextColor = textColor ?? "var(--text-primary)";

  // Parse technologies from midText
  const parseTechnologies = (text: string | ReactNode): string[] => {
    if (typeof text !== 'string') return [];
    const cleaned = text.replace(/^USED:\s*/i, '').trim();
    return cleaned.split(',').map(t => t.trim()).filter(t => t.length > 0);
  };

  const technologies = midText ? parseTechnologies(midText) : [];

  // Content Block
  const ContentBlock = (
    <div className={`${align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left"}`}>
      {kicker && (
          <p 
            className="text-sm tracking-[0.2em] uppercase mb-4"
            style={{ 
              fontFamily: 'var(--font-mono)',
              color: 'var(--accent-primary)',
              fontWeight: 600,
            }}
          >
          {kicker}
        </p>
      )}

      {typeof title === "string" ? (
        <ScrollReveal
          baseOpacity={0.1}
          enableBlur
          baseRotation={3}
          blurStrength={4}
          as="h2"
          containerClassName="font-extrabold tracking-tight scroll-reveal-tight"
          textClassName="font-extrabold tracking-tight"
          style={{
            fontFamily: "var(--font-display)",
            color: effectiveTextColor,
            fontSize: "clamp(2.75rem, 6.5vw, 4.75rem)",
            lineHeight: 1,
            fontWeight: 800,
            margin: 0,
            marginBottom: title2 ? "0.5rem" : "0",
          }}
        >
          {title}
        </ScrollReveal>
      ) : (
        <h2
          className="font-extrabold tracking-tight"
          style={{
            fontFamily: "var(--font-display)",
            color: effectiveTextColor,
            fontSize: "clamp(2.75rem, 6.5vw, 4.75rem)",
            lineHeight: 1,
            margin: 0,
            marginBottom: title2 ? "0.5rem" : "0",
          }}
        >
          {title}
        </h2>
      )}

      {title2 &&
        (typeof title2 === "string" ? (
          <ScrollReveal
            baseOpacity={0.1}
            enableBlur
            baseRotation={2}
            blurStrength={3}
            as="h3"
            containerClassName="font-bold tracking-tight scroll-reveal-tight"
            textClassName="font-bold tracking-tight"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--text-secondary)",
              fontSize: "clamp(1.65rem, 4vw, 2.75rem)",
              lineHeight: 1.1,
              margin: 0,
              marginBottom: "1.5rem",
            }}
          >
            {title2}
          </ScrollReveal>
        ) : (
          <h3
            className="font-bold tracking-tight"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--text-secondary)",
              fontSize: "clamp(1.65rem, 4vw, 2.75rem)",
              lineHeight: 1.1,
              margin: 0,
              marginBottom: "1.5rem",
            }}
          >
            {title2}
          </h3>
        ))}

      {subtitle &&
        (typeof subtitle === "string" ? (
          <ScrollReveal
            baseOpacity={0.15}
            enableBlur
            baseRotation={1}
            blurStrength={3}
            as="p"
            containerClassName="leading-relaxed mb-6"
            textClassName=""
            style={{
              fontFamily: "var(--font-body)",
              color: "var(--text-secondary)",
              maxWidth: align === "center" ? "none" : "720px",
              fontSize: "clamp(1.1rem, 2.2vw, 1.45rem)",
              lineHeight: 1.6,
              fontWeight: 400,
            }}
          >
            {subtitle}
          </ScrollReveal>
        ) : (
          <p
            className="leading-relaxed mb-6"
            style={{
              fontFamily: "var(--font-body)",
              color: "var(--text-secondary)",
              maxWidth: align === "center" ? "none" : "720px",
              fontSize: "clamp(1.1rem, 2.2vw, 1.45rem)",
              lineHeight: 1.6,
            }}
          >
            {subtitle}
          </p>
        ))}

      {/* Technologies Section - CSS marquee (lightweight) */}
      {technologies.length > 0 && (
        <div style={{ marginTop: "2rem", marginBottom: "1.5rem" }}>
          <p
            className="text-sm tracking-[0.15em] uppercase mb-3"
            style={{
              fontFamily: "var(--font-mono)",
              color: "var(--text-muted)",
              fontWeight: 500,
            }}
          >
            Technologies Used
          </p>
          <div
            style={{
              height: 48,
              display: "flex",
              alignItems: "center",
              maxWidth: align === "center" ? "none" : "100%",
            }}
          >
            <TechLogosMarquee
              techString={typeof midText === "string" ? midText : ""}
            />
          </div>
        </div>
      )}

      {ctaText && ctaHref && (
        <div className="mt-8">
          <a 
            href={ctaHref} 
            className="btn-primary"
            target="_blank"
            rel="noopener noreferrer"
          >
            {ctaText}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        </div>
      )}
    </div>
  );

  // ================== SPLIT MODE (Project Sections) ==================
  if (useSplit) {
    return (
      <section
        id={id}
        className={`project-section ${className}`}
        style={{
          borderBottom: showSeparator ? `1px solid ${separatorColor}` : undefined,
          background: solidBg,
        }}
      >
        <div className="project-content" style={{ padding: '0' }}>
          {/* Text Content */}
          <div className={`${imageSide === "left" ? "order-2 lg:order-2" : "order-2 lg:order-1"}`}>
            {ContentBlock}
          </div>

          {/* Image */}
          <div className={`${imageSide === "left" ? "order-1 lg:order-1" : "order-1 lg:order-2"}`}>
            {imageCard && (
              <div
                className="project-image"
                style={{
                  maxWidth: imageMaxW,
                  aspectRatio: imageAspect,
                  position: 'relative',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageCard.startsWith("/") ? imageCard : `/${imageCard}`}
                  alt=""
                  loading="lazy"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '1rem',
                    transition: 'transform 0.6s ease',
                  }}
                />
                {/* Gradient overlay on hover */}
                <div 
                  className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 rounded-xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), transparent)',
                    pointerEvents: 'none',
                  }}
                />
                {/* Border glow */}
                <div
                  className="absolute inset-0 rounded-xl pointer-events-none"
                  style={{
                    border: '1px solid rgba(96, 165, 250, 0.2)',
                    boxShadow: 'inset 0 0 30px rgba(96, 165, 250, 0.1)',
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  // ================== HERO MODE ==================
  return (
    <section
      id={id}
      className={`relative w-full overflow-hidden flex items-center justify-center ${className}`}
      style={{
        minHeight: "80vh",
        backgroundImage: bg,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        borderBottom: showSeparator ? `1px solid ${separatorColor}` : undefined,
      }}
    >
      {/* Overlay */}
      {gradient ? (
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            background: `linear-gradient(to bottom, rgba(10,10,15,${overlayOpacity}), rgba(10,10,15,${Math.min(1, overlayOpacity + 0.1)}))`,
          }}
        />
      ) : (
        <div 
          className="absolute inset-0 z-10 pointer-events-none" 
          style={{ backgroundColor: "var(--bg-primary)", opacity: overlayOpacity }} 
        />
      )}

      {/* Content */}
      <div className="relative z-20 w-full max-w-6xl mx-auto px-6 md:px-12">
        {ContentBlock}
      </div>
    </section>
  );
}
