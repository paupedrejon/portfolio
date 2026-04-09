"use client";

import { useEffect, useRef, useState } from "react";

const INTERACTIVE_SELECTOR =
  'a, button, input, textarea, select, label, [role="button"], [tabindex]:not([tabindex="-1"]), .btn-primary, .btn-secondary, .cta-btn';

export default function CustomCursor() {
  const ringRef = useRef<HTMLDivElement | null>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (coarse || reducedMotion) return;

    setEnabled(true);
    document.body.classList.add("custom-cursor-enabled");

    let pointerX = window.innerWidth / 2;
    let pointerY = window.innerHeight / 2;
    let hoveringInteractive = false;
    let mouseDown = false;
    let currentHoverElement: Element | null = null;
    let rafId = 0;

    const setHoverElement = (element: Element | null) => {
      if (currentHoverElement === element) return;

      if (currentHoverElement) {
        currentHoverElement.classList.remove("custom-cursor-target");
      }

      currentHoverElement = element;

      if (currentHoverElement) {
        currentHoverElement.classList.add("custom-cursor-target");
      }

      const ring = ringRef.current;
      if (!ring) return;
      ring.classList.add("custom-cursor-no-lerp");
      window.requestAnimationFrame(() => {
        ring.classList.remove("custom-cursor-no-lerp");
      });

      if (!currentHoverElement) {
        ring.classList.remove("custom-cursor-wrap-mode");
        ring.style.width = "34px";
        ring.style.height = "34px";
        ring.style.marginLeft = "-17px";
        ring.style.marginTop = "-17px";
        ring.style.borderRadius = "999px";
      }
    };

    const updateRing = () => {
      const ring = ringRef.current;
      if (!ring) return;

      if (currentHoverElement) {
        const rect = currentHoverElement.getBoundingClientRect();
        const extra = mouseDown ? 4 : 8;
        const width = Math.max(28, rect.width + extra * 2);
        const height = Math.max(28, rect.height + extra * 2);
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        const computed = window.getComputedStyle(currentHoverElement);
        const radius = computed.borderRadius || "14px";

        ring.classList.add("custom-cursor-wrap-mode");
        ring.style.width = `${width}px`;
        ring.style.height = `${height}px`;
        ring.style.marginLeft = `${-width / 2}px`;
        ring.style.marginTop = `${-height / 2}px`;
        ring.style.borderRadius = radius;
        ring.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${mouseDown ? 0.98 : 1})`;
        ring.style.opacity = "0.98";
        return;
      }

      ring.classList.remove("custom-cursor-wrap-mode");
      ring.style.width = "34px";
      ring.style.height = "34px";
      ring.style.marginLeft = "-17px";
      ring.style.marginTop = "-17px";
      ring.style.borderRadius = "999px";
      ring.style.transform = `translate3d(${pointerX}px, ${pointerY}px, 0) scale(${mouseDown ? 0.9 : 1})`;
      ring.style.opacity = "0.85";
    };

    const updateHoverState = (element: Element | null) => {
      const interactive = element?.closest(INTERACTIVE_SELECTOR) ?? null;
      hoveringInteractive = !!interactive;
      setHoverElement(interactive);
    };

    const onMouseMove = (event: MouseEvent) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
    };

    const onMouseDown = () => {
      mouseDown = true;
      document.body.classList.add("custom-cursor-clicking");
      updateRing();
    };

    const onMouseUp = () => {
      mouseDown = false;
      document.body.classList.remove("custom-cursor-clicking");
      updateRing();
    };

    const onMouseLeave = () => {
      const ring = ringRef.current;
      if (ring) ring.style.opacity = "0";
    };

    const onMouseEnter = () => {
      const ring = ringRef.current;
      if (ring) ring.style.opacity = hoveringInteractive ? "0.95" : "0.75";
      updateRing();
    };

    const onViewportChange = () => {
      updateRing();
    };

    const tick = () => {
      const hovered = document.elementFromPoint(pointerX, pointerY);
      updateHoverState(hovered);
      updateRing();
      rafId = window.requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mousedown", onMouseDown, { passive: true });
    window.addEventListener("mouseup", onMouseUp, { passive: true });
    window.addEventListener("scroll", onViewportChange, { passive: true });
    window.addEventListener("resize", onViewportChange, { passive: true });
    document.addEventListener("mouseleave", onMouseLeave, { passive: true });
    document.addEventListener("mouseenter", onMouseEnter, { passive: true });

    rafId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("scroll", onViewportChange);
      window.removeEventListener("resize", onViewportChange);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseenter", onMouseEnter);
      setHoverElement(null);
      document.body.classList.remove("custom-cursor-enabled");
      document.body.classList.remove("custom-cursor-clicking");
    };
  }, []);

  if (!enabled) return null;

  return (
    <>
      <div ref={ringRef} className="custom-cursor-ring" aria-hidden="true" />
    </>
  );
}
