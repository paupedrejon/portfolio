/**
 * Haptic feedback via the Vibration API (mainly Android Chrome).
 * iOS (Safari / Chrome / etc.): Apple does not expose navigator.vibrate — no hardware buzz.
 * Vibrations after async work (await fetch) often fail; use sync vibrate before await.
 * Visual flash is stronger when hardware vibrate is unavailable.
 */

let lastTapAt = 0;
const TAP_THROTTLE_MS = 80;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** True when the browser exposes navigator.vibrate (almost never on iOS). */
export function supportsVibrate(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
}

/** iOS / iPadOS: no Web Vibration API in any browser. */
export function isAppleTouchDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function vibrate(pattern: number | number[]): void {
  if (!supportsVibrate()) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // ignore
  }
}

export function hapticTap(): void {
  const now = Date.now();
  if (now - lastTapAt < TAP_THROTTLE_MS) return;
  lastTapAt = now;
  /* Single pulse ~50ms: short patterns are often imperceptible on some phones */
  vibrate(52);
}

/** Call synchronously in the same tick as the user tap, before any await. */
export function hapticPending(): void {
  vibrate(48);
}

export function hapticSuccess(): void {
  vibrate([12, 45, 18]);
}

export function hapticError(): void {
  vibrate([25, 35, 25, 35, 25]);
}

export function hapticSelection(): void {
  vibrate(10);
}

export function flashTouchTarget(el: Element | null): void {
  if (!el || !(el instanceof HTMLElement)) return;

  const noVibrate = !supportsVibrate();
  const strong = noVibrate || isAppleTouchDevice();

  if (prefersReducedMotion()) {
    el.classList.remove("haptic-touch-flash", "haptic-touch-flash-strong");
    void el.offsetWidth;
    el.classList.add("haptic-touch-muted");
    window.setTimeout(() => el.classList.remove("haptic-touch-muted"), 150);
    return;
  }

  el.classList.remove("haptic-touch-flash", "haptic-touch-flash-strong");
  void el.offsetWidth;
  el.classList.add(strong ? "haptic-touch-flash-strong" : "haptic-touch-flash");
  window.setTimeout(() => {
    el.classList.remove("haptic-touch-flash", "haptic-touch-flash-strong");
  }, 280);
}
