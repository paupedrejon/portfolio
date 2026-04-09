"use client";

import { useEffect } from "react";
import { flashTouchTarget, hapticTap } from "@/lib/haptics";

const ACTION_SELECTOR = [
  'button:not([disabled]):not([aria-disabled="true"])',
  'a[href]',
  'input[type="submit"]:not([disabled])',
  'input[type="button"]:not([disabled])',
  'input[type="reset"]:not([disabled])',
  '[role="button"]:not([aria-disabled="true"])',
  "[data-haptic]",
].join(", ");

/** Touch/click target can be a Text node in some browsers — closest() needs an Element. */
function eventToElement(target: EventTarget | null): Element | null {
  if (!target) return null;
  if (target instanceof Element) return target;
  if (target instanceof Text && target.parentElement) return target.parentElement;
  return null;
}

function findActionElement(event: Event): Element | null {
  const start = eventToElement(event.target);
  if (start?.closest("[data-no-haptic]")) return null;

  const path =
    typeof event.composedPath === "function" ? event.composedPath() : [];

  for (const node of path) {
    if (!(node instanceof Element)) continue;
    if (node.closest("[data-no-haptic]")) continue;
    const hit = node.closest(ACTION_SELECTOR);
    if (hit) return hit;
  }

  if (start) {
    return start.closest(ACTION_SELECTOR);
  }
  return null;
}

export default function HapticFeedback() {
  useEffect(() => {
    const trigger = (event: Event) => {
      const el = findActionElement(event);
      if (!el) return;
      hapticTap();
      flashTouchTarget(el);
    };

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      trigger(event);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      if (event.pointerType === "touch") return;
      trigger(event);
    };

    document.addEventListener("touchstart", onTouchStart, { capture: true, passive: true });
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      document.removeEventListener("touchstart", onTouchStart, true);
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, []);

  return null;
}
