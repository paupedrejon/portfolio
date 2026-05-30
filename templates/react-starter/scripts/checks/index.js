import { getTextAlign, hasHorizontalOverflow } from "./helpers.js";

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

  // —— Nivel 2 ——
  "h1-still-present": async (page) => {
    const text = await page.locator("h1").first().textContent();
    if (!text?.toLowerCase().includes("hello world")) {
      return { passed: false, hint: `h1: "${text?.trim() ?? "ausente"}"` };
    }
    return { passed: true };
  },

  "subtitle-exists": async (page) => {
    const main = page.locator("main, [class*='hero'], body").first();
    const paragraphs = main.locator("p");
    const count = await paragraphs.count();
    for (let i = 0; i < count; i++) {
      const t = await paragraphs.nth(i).textContent();
      if (t && t.trim().length >= 10) return { passed: true };
    }
    return { passed: false, hint: "No hay <p> con al menos 10 caracteres en el hero" };
  },

  "cta-button-exists": async (page) => {
    const btn = page.locator("main button, main a[class*='btn'], main a.rounded, button, a.inline-block").first();
    if ((await page.locator("button, a").count()) === 0) {
      return { passed: false, hint: "No hay botón ni enlace CTA" };
    }
    const visible = await page.locator("button, a").filter({ hasText: /.+/ }).first().isVisible().catch(() => false);
    if (!visible) {
      return { passed: false, hint: "CTA no visible" };
    }
    return { passed: true };
  },

  "cta-button-styled": async (page) => {
    const el = page.locator("button, a").filter({ hasText: /.+/ }).first();
    if (!(await el.count())) {
      return { passed: false, hint: "Sin botón CTA" };
    }
    const styles = await el.evaluate((node) => {
      const s = window.getComputedStyle(node);
      return {
        paddingTop: parseFloat(s.paddingTop) || 0,
        paddingBottom: parseFloat(s.paddingBottom) || 0,
        borderRadius: parseFloat(s.borderRadius) || 0,
      };
    });
    const pad = styles.paddingTop + styles.paddingBottom;
    if (pad < 8) {
      return { passed: false, hint: `padding vertical: ${pad}px (mín. 8)` };
    }
    if (styles.borderRadius < 4) {
      return { passed: false, hint: `border-radius: ${styles.borderRadius}px (mín. 4)` };
    }
    return { passed: true };
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
};

/** Stubs para niveles 4+ */
const TODO_PREFIXES = [
  "nav-",
  "mobile-",
  "hero-component",
  "navbar-component",
  "about-component",
  "project-",
  "projects-",
  "theme-",
  "contact-",
  "validation-",
  "fetch-",
  "loading-",
  "scroll-",
  "modal-",
  "home-route",
  "usefetch-",
  "theme-context",
  "semantic-",
  "alt-",
  "meta-",
  "login-",
  "auth-",
  "supabase-",
  "create-",
  "edit-",
  "image-",
  "env-",
  "no-hardcoded",
  "test-",
  "lazy-",
  "image-optimization",
  "analytics",
  "ci-",
  "deploy-",
  "build-",
];

for (const prefix of TODO_PREFIXES) {
  if (!checks[prefix] && !Object.keys(checks).some((k) => k.startsWith(prefix.replace(/-$/, "")))) {
    /* filled below */
  }
}

// Register stubs for any checkpoint id not yet implemented
export function getCheck(checkpointId) {
  if (checks[checkpointId]) return checks[checkpointId];
  return async () => ({
    passed: false,
    skipped: true,
    hint: "Check pendiente de implementar (nivel en desarrollo)",
  });
}
