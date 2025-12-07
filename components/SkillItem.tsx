"use client";
import React from "react";

type SkillItemProps = {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  percent?: number;
  color?: "indigo" | "emerald" | "rose" | "amber";
  showScroll?: boolean;
  href?: string;
  external?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  ariaLabel?: string;
};

const colorStyles = {
  indigo: {
    gradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    border: "rgba(99, 102, 241, 0.3)",
    bg: "rgba(99, 102, 241, 0.1)",
  },
  emerald: {
    gradient: "linear-gradient(135deg, #10b981, #059669)",
    border: "rgba(16, 185, 129, 0.3)",
    bg: "rgba(16, 185, 129, 0.1)",
  },
  rose: {
    gradient: "linear-gradient(135deg, #f43f5e, #e11d48)",
    border: "rgba(244, 63, 94, 0.3)",
    bg: "rgba(244, 63, 94, 0.1)",
  },
  amber: {
    gradient: "linear-gradient(135deg, #f59e0b, #d97706)",
    border: "rgba(245, 158, 11, 0.3)",
    bg: "rgba(245, 158, 11, 0.1)",
  },
};

export default function SkillItem({
  icon,
  title,
  percent = 0,
  showScroll = false,
  subtitle,
  color = "indigo",
  href,
  external = false,
  onClick,
  ariaLabel,
}: SkillItemProps) {
  const pct = Math.max(0, Math.min(100, percent));
  const styles = colorStyles[color];

  const cardContent = (
    <>
      <div className="skill-card__header">
        <div 
          className="skill-card__icon"
          style={{ background: styles.gradient }}
        >
          {icon}
        </div>
        <div className="skill-card__text">
          {subtitle && (
            <p 
              className="skill-card__kicker"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {subtitle}
            </p>
          )}
          <h3 
            className="skill-card__title"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            {title}
          </h3>
        </div>
      </div>

      {showScroll && (
        <div className="skill-card__bar">
          <div className="skill-card__barTrack">
            <div 
              className="skill-card__barFill" 
              style={{ 
                width: `${pct}%`,
                background: styles.gradient,
              }} 
            />
          </div>
        </div>
      )}
    </>
  );

  const cardStyles: React.CSSProperties = {
    width: "100%",
    borderColor: styles.border,
  };

  const hoverStyles = `
    transition: all 0.3s ease;
  `;

  if (href) {
    return (
      <div className="skill-cell">
        <a
          href={href}
          className="skill-card"
          style={cardStyles}
          target={external ? "_blank" : undefined}
          rel={external ? "noopener noreferrer" : undefined}
          aria-label={ariaLabel ?? title}
        >
          {cardContent}
          <svg 
            className="ml-auto opacity-40"
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
      </div>
    );
  }

  if (onClick) {
    return (
      <div className="skill-cell">
        <button
          type="button"
          className="skill-card cursor-pointer"
          style={cardStyles}
          onClick={onClick}
          aria-label={ariaLabel ?? title}
        >
          {cardContent}
        </button>
      </div>
    );
  }

  return (
    <div className="skill-cell">
      <div 
        className="skill-card"
        style={cardStyles}
        aria-label={ariaLabel ?? title}
      >
        {cardContent}
      </div>
    </div>
  );
}
