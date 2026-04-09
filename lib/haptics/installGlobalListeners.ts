/**
 * Global haptic listeners (pure module, no React).
 * Android Chrome: vibrate() must run synchronously inside the user-gesture handler.
 */

export type InstallHapticsOptions = {
  /** First trusted gesture runs vibrate(200) once (diagnostics). */
  debug: boolean;
};

const THROTTLE_MS = 110;
const BUZZ_MS = 80;
const DEBUG_PATTERN_MS = 200;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function supportsVibrate(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
}

export function isAppleTouchDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function normalizeEventTarget(target: EventTarget | null): Element | null {
  if (!target) return null;
  if (target instanceof Element) return target;
  if (target instanceof Text && target.parentElement) return target.parentElement;
  return null;
}

function coordsFromEvent(ev: Event): { x: number; y: number } | null {
  if (ev instanceof TouchEvent) {
    const t = ev.touches?.[0] ?? ev.changedTouches?.[0];
    if (t) return { x: t.clientX, y: t.clientY };
    return null;
  }
  if (ev instanceof PointerEvent || ev instanceof MouseEvent) {
    return { x: ev.clientX, y: ev.clientY };
  }
  return null;
}

/** Walk up from `start` and return first interactive ancestor (or start if it matches). */
export function findInteractiveFromElement(start: Element | null): HTMLElement | null {
  let node: Element | null = start;
  for (let depth = 0; depth < 20 && node; depth++) {
    if (node.closest?.("[data-no-haptic]")) return null;

    const tag = node.tagName;
    if (tag === "BUTTON") {
      const b = node as HTMLButtonElement;
      if (!b.disabled && b.getAttribute("aria-disabled") !== "true") return b;
    }
    if (tag === "A") {
      const a = node as HTMLAnchorElement;
      if (a.hasAttribute("href") || a.href) return a;
    }
    if (tag === "INPUT") {
      const inp = node as HTMLInputElement;
      if (!inp.disabled) return inp;
    }
    if (tag === "SELECT" || tag === "TEXTAREA") {
      const f = node as HTMLSelectElement | HTMLTextAreaElement;
      if (!f.disabled) return f as HTMLElement;
    }
    if (tag === "SUMMARY") return node as HTMLElement;
    if (tag === "LABEL") return node as HTMLElement;

    const role = node.getAttribute("role");
    if (role === "button" || role === "link" || role === "tab" || role === "menuitem") {
      if (node.getAttribute("aria-disabled") === "true") return null;
      return node as HTMLElement;
    }
    if (node.hasAttribute("data-haptic")) return node as HTMLElement;

    node = node.parentElement;
  }
  return null;
}

/**
 * Walk the hit-test stack top-to-bottom. elementFromPoint alone misses links under
 * canvas/overlays; elementsFromPoint finds the first interactive layer below them.
 */
export function findInteractiveFromPoint(clientX: number, clientY: number): HTMLElement | null {
  if (typeof document.elementsFromPoint === "function") {
    const stack = document.elementsFromPoint(clientX, clientY);
    for (const raw of stack) {
      if (!(raw instanceof Element)) continue;
      const hit = findInteractiveFromElement(raw);
      if (hit) return hit;
    }
    return null;
  }

  let el = document.elementFromPoint(clientX, clientY);
  if (!el) return null;
  if (el.nodeType === Node.TEXT_NODE) el = el.parentElement;
  if (!(el instanceof Element)) return null;
  return findInteractiveFromElement(el);
}

export function pickInteractiveTarget(ev: Event): HTMLElement | null {
  const c = coordsFromEvent(ev);
  if (c) {
    const fromPoint = findInteractiveFromPoint(c.x, c.y);
    if (fromPoint) return fromPoint;
  }
  return findInteractiveFromElement(normalizeEventTarget(ev.target ?? null));
}

export function flashTouchTarget(el: HTMLElement): void {
  const strong = !supportsVibrate() || isAppleTouchDevice();

  if (prefersReducedMotion()) {
    try {
      el.classList.remove("haptic-touch-flash", "haptic-touch-flash-strong");
      void el.offsetWidth;
      el.classList.add("haptic-touch-muted");
      window.setTimeout(() => el.classList.remove("haptic-touch-muted"), 150);
    } catch {
      /* ignore */
    }
    return;
  }

  try {
    el.classList.remove("haptic-touch-flash", "haptic-touch-flash-strong");
    void el.offsetWidth;
    el.classList.add(strong ? "haptic-touch-flash-strong" : "haptic-touch-flash");
    window.setTimeout(() => {
      el.classList.remove("haptic-touch-flash", "haptic-touch-flash-strong");
    }, 280);
  } catch {
    /* ignore */
  }
}

function vibrateNow(pattern: number | number[]): boolean {
  if (!supportsVibrate()) return false;
  try {
    return navigator.vibrate(pattern) !== false;
  } catch {
    return false;
  }
}

/**
 * Installs capture-phase listeners on `window` only (avoid duplicate fires on document).
 * Listeners always attach (visual flash); vibrate only if supportsVibrate().
 */
export function installPortfolioHaptics(options: InstallHapticsOptions): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const canVibrate = supportsVibrate();
  let lastAt = 0;
  let debugFirstDone = !options.debug;

  function throttleOk(): boolean {
    const now = Date.now();
    if (now - lastAt < THROTTLE_MS) return false;
    lastAt = now;
    return true;
  }

  function onGesture(ev: Event) {
    if (!(ev as { isTrusted?: boolean }).isTrusted) return;

    if (options.debug && !debugFirstDone) {
      debugFirstDone = true;
      lastAt = Date.now();
      if (canVibrate) {
        const ok = vibrateNow(DEBUG_PATTERN_MS);
        if (process.env.NODE_ENV === "development") {
          console.log("[haptics:debug] one-shot vibrate", DEBUG_PATTERN_MS, "ms, ok=", ok);
        }
      }
      return;
    }

    const hit = pickInteractiveTarget(ev);
    if (!hit) {
      if (options.debug && process.env.NODE_ENV === "development") {
        console.log("[haptics:debug] no interactive target for", ev.type);
      }
      return;
    }
    if (!throttleOk()) return;
    if (canVibrate) {
      vibrateNow(BUZZ_MS);
    }
    flashTouchTarget(hit);
  }

  const optsCapture = { capture: true };
  const optsPassive = { capture: true, passive: true } as const;

  window.addEventListener("pointerdown", onGesture, optsCapture);
  window.addEventListener("touchstart", onGesture, optsPassive);

  return () => {
    window.removeEventListener("pointerdown", onGesture, true);
    window.removeEventListener("touchstart", onGesture, true);
  };
}
