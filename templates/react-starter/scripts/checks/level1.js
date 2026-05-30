/** Checks granulares — Nivel 1 Hello World */

/**
 * @param {import('@playwright/test').Page} page
 */
export async function getHeroShell(page) {
  return page.evaluate(() => {
    const h1 = document.querySelector("h1");
    if (!h1) return { shell: null, h1: null };
    const shell =
      document.querySelector("main") ||
      h1.closest("[class*='min-h']") ||
      h1.parentElement;
    return { shell, h1 };
  });
}

/**
 * @param {import('@playwright/test').Page} page
 */
export async function evalHeroShellStyles(page) {
  return page.evaluate(() => {
    const h1 = document.querySelector("h1");
    if (!h1) return { error: "no h1" };
    const shell =
      document.querySelector("main") ||
      h1.closest("[class*='min-h']") ||
      h1.parentElement;
    if (!shell) return { error: "envuelve el h1 en <main>" };
    return {
      shellStyle: window.getComputedStyle(shell),
      h1Style: window.getComputedStyle(h1),
      vh: window.innerHeight,
    };
  });
}

export const level1Checks = {
  "hero-no-placeholder": async (page) => {
    const has = await page.evaluate(() =>
      Array.from(document.querySelectorAll("p")).some((p) =>
        /empieza por el nivel/i.test(p.textContent || "")
      )
    );
    if (has) {
      return {
        passed: false,
        hint: "borra el párrafo gris «Empieza por el nivel 1…»",
      };
    }
    return { passed: true };
  },

  "hero-bg-dark": async (page) => {
    const data = await evalHeroShellStyles(page);
    if (data.error) return { passed: false, hint: data.error };
    const bg = data.shellStyle.backgroundColor.match(/\d+(\.\d+)?/g);
    if (!bg || bg.length < 3) {
      return { passed: false, hint: "añade fondo oscuro al <main> (bg-[#0a0a0f] o bg-gray-950)" };
    }
    const sum = bg.slice(0, 3).map(Number).reduce((a, b) => a + b, 0);
    if (sum > 180) {
      return { passed: false, hint: "el fondo sigue claro — usa un color oscuro en el contenedor" };
    }
    return { passed: true };
  },

  "hero-min-h-screen": async (page) => {
    const data = await evalHeroShellStyles(page);
    if (data.error) return { passed: false, hint: data.error };
    const minH = parseFloat(data.shellStyle.minHeight);
    if (!Number.isFinite(minH) || minH < data.vh * 0.85) {
      return { passed: false, hint: "añade min-h-screen al <main> para ocupar toda la pantalla" };
    }
    return { passed: true };
  },

  "hero-flex-center": async (page) => {
    const data = await evalHeroShellStyles(page);
    if (data.error) return { passed: false, hint: data.error };
    const ss = data.shellStyle;
    const isFlex = ss.display === "flex" || ss.display === "inline-flex";
    const centered =
      isFlex && ss.alignItems === "center" && ss.justifyContent === "center";
    const h1 = await page.locator("h1").first().boundingBox();
    const verticallyOk =
      h1 && Math.abs(h1.y + h1.height / 2 - data.vh / 2) < data.vh * 0.22;
    if (!centered && !verticallyOk) {
      return {
        passed: false,
        hint: "centra el contenido: flex flex-col items-center justify-center",
      };
    }
    return { passed: true };
  },

  "h1-text-large": async (page) => {
    const data = await evalHeroShellStyles(page);
    if (data.error) return { passed: false, hint: data.error };
    const fontSize = parseFloat(data.h1Style.fontSize);
    if (fontSize < 28) {
      return {
        passed: false,
        hint: `título pequeño (${Math.round(fontSize)}px). Añade text-4xl o text-5xl`,
      };
    }
    return { passed: true };
  },

  "h1-text-white": async (page) => {
    const data = await evalHeroShellStyles(page);
    if (data.error) return { passed: false, hint: data.error };
    const parts = data.h1Style.color.match(/\d+(\.\d+)?/g);
    if (parts && parts.length >= 3) {
      const sum = parts.slice(0, 3).map(Number).reduce((a, b) => a + b, 0);
      if (sum < 520) {
        return { passed: false, hint: "usa text-white en el h1" };
      }
    }
    return { passed: true };
  },

  "h1-font-bold": async (page) => {
    const data = await evalHeroShellStyles(page);
    if (data.error) return { passed: false, hint: data.error };
    const fw = parseInt(data.h1Style.fontWeight, 10) || 400;
    if (fw < 700) {
      return { passed: false, hint: "usa font-bold o font-extrabold en el h1" };
    }
    return { passed: true };
  },
};
