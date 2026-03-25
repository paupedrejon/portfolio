"use client";

import "./TechLogosMarquee.css";
import { getTechLogoItems } from "@/lib/tech-logo-loop";

interface TechLogosMarqueeProps {
  techString: string;
  className?: string;
  /** Accessibility label for the marquee region (should be translated). */
  ariaLabel?: string;
}

/**
 * Lightweight CSS-only marquee for tech logos. No RAF, no ResizeObserver.
 * Uses GPU-accelerated transform animation for smooth 60fps.
 */
export default function TechLogosMarquee({
  techString,
  className = "",
  ariaLabel = "Technologies used",
}: TechLogosMarqueeProps) {
  const items = getTechLogoItems(techString);
  if (items.length === 0) return null;

  return (
    <div
      className={`tech-logos-marquee ${className}`}
      style={{
        overflow: "hidden",
        maskImage: "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
        WebkitMaskImage: "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
      }}
      aria-label={ariaLabel}
    >
      <div className="tech-logos-marquee__track">
        <div className="tech-logos-marquee__list">
          {items.map((item, i) => (
            <span key={`a-${i}`} className="tech-logos-marquee__item" title={item.title}>
              {item.href ? (
                <a
                  href={item.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={item.title}
                  style={{ color: "inherit", display: "flex", alignItems: "center" }}
                >
                  {item.node}
                </a>
              ) : (
                item.node
              )}
            </span>
          ))}
        </div>
        <div className="tech-logos-marquee__list" aria-hidden>
          {items.map((item, i) => (
            <span key={`b-${i}`} className="tech-logos-marquee__item">
              {item.node}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
