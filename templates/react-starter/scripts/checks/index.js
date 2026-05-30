import {
  getTextAlign,
  hasHorizontalOverflow,
  getHeroVerticalStack,
  getHeroColumnCentered,
} from "./helpers.js";
import { level1Checks } from "./level1.js";
import { level2Checks } from "./level2.js";
import { extendedChecks } from "./extended.js";

/** @type {Record<string, (page: import('@playwright/test').Page) => Promise<{ passed: boolean; hint?: string; skipped?: boolean }>>} */
export const checks = {
  // —— Nivel 1 ——
  "page-renders": async (page) => {
    const errors = [];
    const handler = (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    };
    page.on("console", handler);
    await page.reload({ waitUntil: "networkidle" });
    page.off("console", handler);
    if (errors.length > 0) {
      return { passed: false, hint: `Errores en consola: ${errors[0]}` };
    }
    return { passed: true };
  },

  "h1-exists": async (page) => {
    const h1 = page.locator("h1").first();
    const count = await page.locator("h1").count();
    if (count !== 1) {
      return { passed: false, hint: `Encontrados ${count} h1 (se esperaba 1)` };
    }
    if (!(await h1.isVisible())) {
      return { passed: false, hint: "h1 no visible" };
    }
    return { passed: true };
  },

  "h1-text": async (page) => {
    const text = await page.locator("h1").first().textContent();
    if (!text?.toLowerCase().includes("hello world")) {
      return { passed: false, hint: `Encontrado: "${text?.trim() ?? ""}"` };
    }
    return { passed: true };
  },

  "h1-centered": async (page) => {
    const align = await getTextAlign(page, "h1");
    if (align !== "center") {
      return { passed: false, hint: `text-align: ${align ?? "desconocido"}` };
    }
    return { passed: true };
  },

  ...level1Checks,

  // —— Nivel 2 ——
  "h1-still-present": async (page) => {
    const text = await page.locator("h1").first().textContent();
    if (!text?.toLowerCase().includes("hello world")) {
      return { passed: false, hint: `h1: "${text?.trim() ?? "ausente"}"` };
    }
    const align = await getTextAlign(page, "h1");
    if (align !== "center") {
      return { passed: false, hint: `h1 no centrado (text-align: ${align})` };
    }
    return { passed: true };
  },

  "hero-layout-column": async (page) => {
    const col = await getHeroColumnCentered(page);
    if (!col.ok) return { passed: false, hint: col.reason };
    return { passed: true };
  },

  ...level2Checks,

  // Compatibilidad con ids antiguos
  "subtitle-exists": async (page) => {
    const fn = level2Checks["subtitle-text-length"];
    return fn(page);
  },
  "cta-button-exists": async (page) => {
    const fn = level2Checks["cta-plain-exists"];
    return fn(page);
  },
  "cta-button-styled": async (page) => {
    const pad = await level2Checks["cta-padding"](page);
    if (!pad.passed) return pad;
    const round = await level2Checks["cta-rounded"](page);
    if (!round.passed) return round;
    return level2Checks["cta-teal-style"](page);
  },
  "hero-vertical-stack": async (page) => {
    const fn = level2Checks["hero-vertical-stack-final"];
    return fn(page);
  },

  // —— Nivel 3 ——
  "about-section-exists": async (page) => {
    const byId = page.locator("section#about");
    if (await byId.count()) return { passed: true };
    const byHeading = page.locator("section").filter({ has: page.locator("h2") });
    const count = await byHeading.count();
    for (let i = 0; i < count; i++) {
      const h2 = await byHeading.nth(i).locator("h2").first().textContent();
      if (h2?.toLowerCase().includes("sobre mí")) return { passed: true };
    }
    return { passed: false, hint: 'Falta section#about o sección con h2 "Sobre mí"' };
  },

  "about-heading": async (page) => {
    const h2 = page.locator("h2").filter({ hasText: /sobre mí/i }).first();
    if (!(await h2.count()) || !(await h2.isVisible())) {
      return { passed: false, hint: 'No hay h2 visible "Sobre mí"' };
    }
    return { passed: true };
  },

  "about-paragraph": async (page) => {
    const section = page.locator("section#about, section").filter({
      has: page.locator("h2"),
    }).first();
    const p = section.locator("p").first();
    const text = await p.textContent().catch(() => "");
    if (!text || text.trim().length < 50) {
      return {
        passed: false,
        hint: `Bio demasiado corta (${text?.trim().length ?? 0} chars, mín. 50)`,
      };
    }
    return { passed: true };
  },

  "about-mobile-readable": async (page) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload({ waitUntil: "networkidle" });
    const overflow = await hasHorizontalOverflow(page);
    if (overflow) {
      return { passed: false, hint: "Scroll horizontal en 375px" };
    }
    const about = page.locator("section#about, section h2").filter({ hasText: /sobre mí/i });
    if (!(await about.count())) {
      return { passed: false, hint: "Sección about no visible en móvil" };
    }
    return { passed: true };
  },

  "hero-from-level2-intact": async (page) => {
    const text = await page.locator("h1").first().textContent();
    if (!text?.toLowerCase().includes("hello world")) {
      return { passed: false, hint: "falta h1 Hello World del hero" };
    }
    const stack = await getHeroVerticalStack(page);
    if (!stack.ok) return { passed: false, hint: stack.reason };
    const paragraphs = await page.locator("p").count();
    if (paragraphs < 1) {
      return { passed: false, hint: "falta el subtítulo del nivel 2" };
    }
    const btnCount = await page.locator("button, a").count();
    if (btnCount < 1) {
      return { passed: false, hint: "falta el botón CTA del nivel 2" };
    }
    return { passed: true };
  },

  ...extendedChecks,
};

export function getCheck(checkpointId) {
  if (checks[checkpointId]) return checks[checkpointId];
  return async () => ({
    passed: false,
    skipped: true,
    hint: "Check pendiente de implementar (nivel en desarrollo)",
  });
}
