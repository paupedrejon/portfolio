import { getHeroColumnCentered, getHeroVerticalStack } from "./helpers.js";

/** @param {import('@playwright/test').Page} page */
async function firstCtaButton(page) {
  return page.locator("main button, button").filter({ hasText: /.+/ }).first();
}

export const level2Checks = {
  "subtitle-p-exists": async (page) => {
    const count = await page.locator("main p").count();
    if (count < 1) {
      return { passed: false, hint: "añade un <p> dentro del <main>, debajo del h1" };
    }
    return { passed: true };
  },

  "subtitle-text-length": async (page) => {
    const paragraphs = page.locator("main p");
    const n = await paragraphs.count();
    for (let i = 0; i < n; i++) {
      const t = await paragraphs.nth(i).textContent();
      if (t && t.trim().length >= 10) return { passed: true };
    }
    return {
      passed: false,
      hint: "el párrafo debe tener al menos 10 caracteres (tu presentación)",
    };
  },

  "subtitle-below-h1": async (page) => {
    const ok = await page.evaluate(() => {
      const h1 = document.querySelector("main h1, h1");
      const p = document.querySelector("main p, p");
      if (!h1 || !p) return false;
      return p.getBoundingClientRect().top >= h1.getBoundingClientRect().bottom - 8;
    });
    if (!ok) {
      return { passed: false, hint: "el <p> debe ir debajo del h1, no al lado" };
    }
    return { passed: true };
  },

  "subtitle-styled": async (page) => {
    const styled = await page.evaluate(() => {
      const p = document.querySelector("main p");
      if (!p) return false;
      const s = window.getComputedStyle(p);
      const centered =
        s.textAlign === "center" ||
        window.getComputedStyle(p.parentElement).alignItems === "center";
      const hasMargin = parseFloat(s.marginTop) >= 8;
      const muted =
        s.color &&
        (() => {
          const rgb = s.color.match(/\d+/g);
          if (!rgb || rgb.length < 3) return false;
          const [r, g, b] = rgb.map(Number);
          return r + g + b < 600 && r + g + b > 100;
        })();
      return centered || hasMargin || muted;
    });
    if (!styled) {
      return {
        passed: false,
        hint: 'añade className="text-gray-300 mt-4 text-center" al párrafo',
      };
    }
    return { passed: true };
  },

  "cta-plain-exists": async (page) => {
    const btn = await firstCtaButton(page);
    if (!(await btn.count())) {
      return { passed: false, hint: 'añade <button type="button">Ver proyectos</button>' };
    }
    if (!(await btn.isVisible())) {
      return { passed: false, hint: "el botón no es visible" };
    }
    return { passed: true };
  },

  "cta-below-subtitle": async (page) => {
    const ok = await page.evaluate(() => {
      const p = document.querySelector("main p");
      const btn = document.querySelector("main button, button");
      if (!p || !btn) return false;
      return btn.getBoundingClientRect().top >= p.getBoundingClientRect().bottom - 8;
    });
    if (!ok) {
      return { passed: false, hint: "el botón debe ir debajo del párrafo" };
    }
    return { passed: true };
  },

  "cta-padding": async (page) => {
    const btn = await firstCtaButton(page);
    if (!(await btn.count())) return { passed: false, hint: "falta el botón CTA" };
    const pad = await btn.evaluate((node) => {
      const s = window.getComputedStyle(node);
      return (parseFloat(s.paddingTop) || 0) + (parseFloat(s.paddingBottom) || 0);
    });
    if (pad < 8) {
      return { passed: false, hint: `añade padding al botón (px-6 py-3). Ahora: ${pad}px` };
    }
    return { passed: true };
  },

  "cta-rounded": async (page) => {
    const btn = await firstCtaButton(page);
    if (!(await btn.count())) return { passed: false, hint: "falta el botón CTA" };
    const radius = await btn.evaluate((node) => {
      const s = window.getComputedStyle(node);
      return parseFloat(s.borderRadius) || 0;
    });
    if (radius < 4) {
      return { passed: false, hint: "añade rounded-full o rounded-lg al botón" };
    }
    return { passed: true };
  },

  "cta-teal-style": async (page) => {
    const btn = await firstCtaButton(page);
    if (!(await btn.count())) return { passed: false, hint: "falta el botón CTA" };
    const colors = await btn.evaluate((node) => {
      const s = window.getComputedStyle(node);
      const bg = s.backgroundColor.match(/\d+/g)?.map(Number) ?? [];
      const fg = s.color.match(/\d+/g)?.map(Number) ?? [];
      return { bg, fg };
    });
    const bgSum = colors.bg.slice(0, 3).reduce((a, b) => a + b, 0);
    const fgSum = colors.fg.slice(0, 3).reduce((a, b) => a + b, 0);
    if (fgSum < 500) {
      return { passed: false, hint: "texto del botón en blanco: text-white" };
    }
    if (bgSum > 400) {
      return {
        passed: false,
        hint: "fondo del botón en color marca: bg-[#2a8ca0]",
      };
    }
    return { passed: true };
  },

  "hero-vertical-stack-final": async (page) => {
    const col = await getHeroColumnCentered(page);
    if (!col.ok) return { passed: false, hint: col.reason };
    const stack = await getHeroVerticalStack(page);
    if (!stack.ok) return { passed: false, hint: stack.reason };
    return { passed: true };
  },
};
