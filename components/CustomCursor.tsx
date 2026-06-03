"use client";

import { useEffect, useRef, useState } from "react";

const INTERACTIVE_SELECTOR =
  'a, button, input, textarea, select, label, [role="button"], [tabindex]:not([tabindex="-1"]), .btn-primary, .btn-secondary, .cta-btn';

export default function CustomCursor() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (coarse || reducedMotion) return;

    setEnabled(true);
    document.body.classList.add("custom-cursor-enabled");

    let hoveringInteractive = false;
    let mouseDown = false;

    const moveTo = (x: number, y: number) => {
      const root = rootRef.current;
      if (!root) return;
      root.style.left = `${x}px`;
      root.style.top = `${y}px`;
    };

    const applyState = () => {
      const ring = ringRef.current;
      if (!ring) return;

      const ringScale = hoveringInteractive ? (mouseDown ? 1.1 : 1.2) : mouseDown ? 0.94 : 1;
      ring.style.transform = `translate(-50%, -50%) scale(${ringScale})`;
      ring.dataset.hover = hoveringInteractive ? "true" : "false";
      ring.dataset.press = mouseDown ? "true" : "false";

      const dot = rootRef.current?.querySelector<HTMLElement>(".custom-cursor-dot");
      if (dot) {
        dot.style.transform = `translate(-50%, -50%) scale(${mouseDown ? 0.88 : 1})`;
      }
    };

    const updateHoverState = (element: Element | null) => {
      const interactive = element?.closest(INTERACTIVE_SELECTOR) ?? null;
      const next = !!interactive;
      if (next === hoveringInteractive) return;
      hoveringInteractive = next;
      applyState();
    };

    const onPointerMove = (event: PointerEvent) => {
      moveTo(event.clientX, event.clientY);
      const hovered = event.target instanceof Element ? event.target : null;
      updateHoverState(hovered);
    };

    const onMouseDown = () => {
      mouseDown = true;
      applyState();
    };

    const onMouseUp = () => {
      mouseDown = false;
      applyState();
    };

    const onMouseLeave = () => {
      const root = rootRef.current;
      if (root) root.style.opacity = "0";
    };

    const onMouseEnter = () => {
      const root = rootRef.current;
      if (root) root.style.opacity = "1";
    };

    moveTo(window.innerWidth / 2, window.innerHeight / 2);
    applyState();

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("mousedown", onMouseDown, { passive: true });
    window.addEventListener("mouseup", onMouseUp, { passive: true });
    document.addEventListener("mouseleave", onMouseLeave, { passive: true });
    document.addEventListener("mouseenter", onMouseEnter, { passive: true });

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseenter", onMouseEnter);
      document.body.classList.remove("custom-cursor-enabled");
    };
  }, []);

  if (!enabled) return null;

  return (
    <div ref={rootRef} className="custom-cursor-root" aria-hidden="true">
      <div ref={ringRef} className="custom-cursor-ring" />
      <div className="custom-cursor-dot" />
    </div>
  );
}
