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
    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest("[data-no-haptic]")) return;

      const el = target.closest(ACTION_SELECTOR);
      if (!el) return;

      hapticTap();
      flashTouchTarget(el);
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, []);

  return null;
}
