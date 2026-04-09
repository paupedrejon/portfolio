/**
 * Haptic feedback via the Vibration API (mainly Android Chrome).
 * Optional subtle visual flash on the target for devices without vibrate.
 * Respects prefers-reduced-motion.
 */

let lastTapAt = 0;
const TAP_THROTTLE_MS = 80;

function skipMotion(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function vibrate(pattern: number | number[]): void {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") {
    return;
  }
  try {
    navigator.vibrate(pattern);
  } catch {
    // ignore
  }
}

export function hapticTap(): void {
  if (skipMotion()) return;
  const now = Date.now();
  if (now - lastTapAt < TAP_THROTTLE_MS) return;
  lastTapAt = now;
  vibrate(12);
}

export function hapticSuccess(): void {
  if (skipMotion()) return;
  vibrate([10, 40, 14]);
}

export function hapticError(): void {
  if (skipMotion()) return;
  vibrate([22, 32, 22, 32, 22]);
}

export function hapticSelection(): void {
  if (skipMotion()) return;
  vibrate(6);
}

/** Brief brightness pulse on the pressed element (no vibrate fallback noise). */
export function flashTouchTarget(el: Element | null): void {
  if (skipMotion() || !el || !(el instanceof HTMLElement)) return;
  el.classList.remove("haptic-touch-flash");
  // Re-trigger animation if same node pressed quickly
  void el.offsetWidth;
  el.classList.add("haptic-touch-flash");
  window.setTimeout(() => {
    el.classList.remove("haptic-touch-flash");
  }, 240);
}
