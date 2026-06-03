"use client";

interface HeroBadgeProps {
  children: React.ReactNode;
  className?: string;
}

/** Pill del héroe (mismo estilo que la home). */
export default function HeroBadge({ children, className = "" }: HeroBadgeProps) {
  return (
    <div className={`hero-badge-wrap ${className}`.trim()}>
      <div className="hero-badge">
        <span className="hero-badge__text">{children}</span>
        <div className="hero-badge__shimmer" aria-hidden />
      </div>
    </div>
  );
}
