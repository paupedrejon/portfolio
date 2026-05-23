"use client";

import { Link } from "@/i18n/navigation";
import type { ReactNode } from "react";
import "./ego-pill.css";

type Variant = "primary" | "ghost";

type Props = {
  variant?: Variant;
  href?: string;
  localeHref?: string;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
  download?: boolean;
};

/** Botón pill: primary = blanco (descarga / ver proyecto); ghost = solo texto con borde. */
export default function EgoPillButton({
  variant = "primary",
  href,
  localeHref,
  onClick,
  children,
  className = "",
  download,
}: Props) {
  const innerClass =
    variant === "primary" ? "ego-pill-btn__inner ego-pill-btn__inner--primary" : "ego-pill-btn__inner ego-pill-btn__inner--ghost";

  const content = <span className={innerClass}>{children}</span>;

  return (
    <span className={`ego-pill-wrap ${className}`.trim()}>
      {localeHref ? (
        <Link href={localeHref} className="ego-pill-btn" onClick={onClick}>
          {content}
        </Link>
      ) : href ? (
        <a
          href={href}
          download={download || undefined}
          className="ego-pill-btn"
          onClick={onClick}
        >
          {content}
        </a>
      ) : (
        <button type="button" className="ego-pill-btn" onClick={onClick}>
          {content}
        </button>
      )}
    </span>
  );
}
