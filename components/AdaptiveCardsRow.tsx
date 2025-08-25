"use client";
import { useEffect, useRef, useState } from "react";

type Props = {
  /** número de columnas cuando caben todas */
  cols?: number;           // default 4
  /** ancho mínimo real que necesita cada tarjeta (en px) */
  minCardPx?: number;      // default 260 (ajústalo a tu pill)
  /** separación horizontal entre tarjetas (en px) */
  gapPx?: number;          // default 16 (el que usas ahora)
  /** children = las tarjetas */
  children: React.ReactNode;
};

export default function AdaptiveCardsRow({
  cols = 4,
  minCardPx = 260,
  gapPx = 16,
  children,
}: Props) {
  const contRef = useRef<HTMLDivElement | null>(null);
  const [stacked, setStacked] = useState(false);

  useEffect(() => {
    const el = contRef.current;
    if (!el) return;

    const measure = () => {
      const available = el.clientWidth;
      const needed = cols * minCardPx + (cols - 1) * gapPx;
      setStacked(available < needed);
    };

    // medir con rAF (suave) + ResizeObserver
    let raf: number | null = null;
    const schedule = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };

    const ro = new ResizeObserver(schedule);
    ro.observe(el);
    window.addEventListener("resize", schedule);
    schedule();

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [cols, minCardPx, gapPx]);

  // grid dinámico: 4 columnas o 1 columna
  const gridStyle: React.CSSProperties = {
    display: "grid",
    gap: `${gapPx}px`,
    gridTemplateColumns: stacked ? "1fr" : `repeat(${cols}, minmax(0, 1fr))`,
  };

  return <div ref={contRef} style={gridStyle}>{children}</div>;
}
