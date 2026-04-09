"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    __portfolioHapticsInstalled?: boolean;
  }
}

const THROTTLE_MS = 110;

function findInteractiveFromPoint(clientX: number, clientY: number): HTMLElement | null {
  let el = document.elementFromPoint(clientX, clientY);
  if (!el) return null;
  if (el.nodeType === Node.TEXT_NODE) el = el.parentElement;
  if (!(el instanceof HTMLElement)) return null;

  let node: Element | null = el;
  for (let depth = 0; depth < 18 && node; depth++) {
    if (node.closest?.("[data-no-haptic]")) return null;

    const tag = node.tagName;
    if (tag === "BUTTON") {
      const b = node as HTMLButtonElement;
      if (!b.disabled && b.getAttribute("aria-disabled") !== "true") return b;
    }
    if (tag === "A") {
      const a = node as HTMLAnchorElement;
      if (a.href || a.hasAttribute("href")) return a;
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

function flash(el: HTMLElement) {
  try {
    el.classList.remove("haptic-touch-flash", "haptic-touch-flash-strong");
    void el.offsetWidth;
    el.classList.add("haptic-touch-flash-strong");
    window.setTimeout(() => el.classList.remove("haptic-touch-flash-strong"), 260);
  } catch {
    /* ignore */
  }
}

export default function HapticsRoot() {
  useEffect(() => {
    if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") {
      return;
    }
    if (window.__portfolioHapticsInstalled) return;
    window.__portfolioHapticsInstalled = true;

    let lastAt = 0;

    function buzz() {
      const now = Date.now();
      if (now - lastAt < THROTTLE_MS) return;
      lastAt = now;
      try {
        navigator.vibrate(70);
      } catch {
        /* ignore */
      }
    }

    const touchLike =
      typeof navigator !== "undefined" &&
      ((navigator as Navigator & { maxTouchPoints?: number }).maxTouchPoints ?? 0) > 0;

    function handleTouch(ev: TouchEvent) {
      const t = ev.touches?.[0] ?? ev.changedTouches?.[0];
      if (!t) return;
      const hit = findInteractiveFromPoint(t.clientX, t.clientY);
      if (!hit) return;
      buzz();
      flash(hit);
    }

    function onClick(ev: MouseEvent) {
      if (touchLike) return;
      const hit = findInteractiveFromPoint(ev.clientX, ev.clientY);
      if (!hit) return;
      buzz();
      flash(hit);
    }

    if (touchLike) {
      document.addEventListener("touchstart", handleTouch, { capture: true, passive: true });
      return () => {
        document.removeEventListener("touchstart", handleTouch, true);
        window.__portfolioHapticsInstalled = false;
      };
    }

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.__portfolioHapticsInstalled = false;
    };
  }, []);

  return null;
}
