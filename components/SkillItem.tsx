"use client";
import React from "react";
import { Poppins, Roboto_Mono } from "next/font/google";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "600", "800"] });
const robotoMono = Roboto_Mono({ subsets: ["latin"], weight: ["400", "700"] });

type SkillItemProps = {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  percent?: number;              // opcional por si no quieres barra
  color?: "indigo" | "emerald" | "rose" | "amber";
  showScroll?: boolean;          // si true muestra barra (progreso)
  /** Enlace click: soporta https://  mailto:  tel:  o rutas internas (/about) */
  href?: string;
  /** Si true, abre en nueva pestaña (sólo tiene efecto cuando hay href) */
  external?: boolean;
  /** Manejador opcional si quieres comportamiento personalizado */
  onClick?: (e: React.MouseEvent) => void;
  /** aria-label accesible (recomendado cuando sea click) */
  ariaLabel?: string;
};

export default function SkillItem({
  icon,
  title,
  percent = 0,
  showScroll = false,
  subtitle = "skill",
  color = "indigo",
  href,
  external = false,
  onClick,
  ariaLabel,
}: SkillItemProps) {
  const pct = Math.max(0, Math.min(100, percent));

  const colorClass =
    color === "emerald"
      ? "pill-card--emerald"
      : color === "rose"
      ? "pill-card--rose"
      : color === "amber"
      ? "pill-card--amber"
      : "pill-card--indigo";

  // Clase común de la tarjeta clickable (añado cursor y focus visible)
  const cardClass = `pill-card ${colorClass} skill-card focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 cursor-pointer`;

  // Contenido común de la tarjeta
  const content = (
    <>
      <div className="skill-card__header">
        <div className="pill-card__icon text-xl">{icon}</div>
        <div className="pill-card__text">
          <p className={`${robotoMono.className} pill-card__kicker`}>{subtitle}</p>
          <h3 className={`${robotoMono.className} pill-card__title`}>{title}</h3>
        </div>
      </div>

      {showScroll && (
        <div className="skill-card__bar">
          <div className="skill-card__barTrack">
            <div className="skill-card__barFill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="skill-cell">
      {/* 1) Si hay HREF => <a>  */}
      {href ? (
        <a
          href={href}
          className={cardClass}
          style={{ width: "100%", maxWidth: 520, height: 70, display: "flex", alignItems: "center" }}
          target={external ? "_blank" : undefined}
          rel={external ? "noopener noreferrer" : undefined}
          aria-label={ariaLabel ?? title}
        >
          {content}
        </a>
      ) : // 2) Si NO hay href pero sí onClick => <button>
      onClick ? (
        <button
          type="button"
          className={cardClass}
          style={{ width: "100%", maxWidth: 520, height: 70, display: "flex", alignItems: "center" }}
          onClick={onClick}
          aria-label={ariaLabel ?? title}
        >
          {content}
        </button>
      ) : (
        // 3) No clickable: <div>
        <div
          className={`pill-card ${colorClass} skill-card`}
          style={{ width: "100%", maxWidth: 520, height: 70, display: "flex", alignItems: "center" }}
          aria-label={ariaLabel ?? title}
        >
          {content}
        </div>
      )}
    </div>
  );
}
