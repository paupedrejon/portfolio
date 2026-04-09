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
].join(", ");

export default function HapticFeedback() {
  useEffect(() => {
    const trigger = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return;
      if (target.closest("[data-no-haptic]")) return;
      const el = target.closest(ACTION_SELECTOR);
      if (!el) return;
      hapticTap();
      flashTouchTarget(el);
    };

    /**
     * Android Chrome: hardware buzz often only fires reliably from touchstart,
     * not pointerdown. Desktop uses pointerdown (mouse / pen).
     */
    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      trigger(event.target);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      if (event.pointerType === "touch") return;
      trigger(event.target);
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
