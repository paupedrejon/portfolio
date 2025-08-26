"use client";

import React, { useCallback, useRef } from "react";

type Props = {
  targetId: string;
  className?: string;
  color?: string;     // color del fondo del botón
  iconColor?: string; // color del icono (flecha)
};

export default function ScrollButton({ targetId, className, color, iconColor }: Props) {
  const ref = useRef<HTMLButtonElement>(null);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();

      const btn = ref.current;
      if (btn) {
        btn.classList.add("clicked");
        setTimeout(() => btn.classList.remove("clicked"), 450);
      }

      document.getElementById(targetId)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    },
    [targetId]
  );

  return (
    <div className="scroll-wrap">
      <button
        ref={ref}
        className={`scroll-btn ${className ?? ""}`}
        aria-label="Scroll to sections"
        onClick={handleClick}
        style={{
          background: color ?? "rgba(65, 90, 201, 0)", // color del fondo
        }}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 15.5 5 8.5l1.4-1.4L12 12.7l5.6-5.6L19 8.5z"
            fill={iconColor ?? "#fff"} // color de la flecha
          />
        </svg>
      </button>
    </div>
  );
}
