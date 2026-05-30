/**
 * @param {import('@playwright/test').Page} page
 */
export async function getComputedStyle(page, selector, prop) {
  return page.evaluate(
    ({ sel, property }) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      return window.getComputedStyle(el).getPropertyValue(property);
    },
    { sel: selector, property: prop }
  );
}

/**
 * @param {import('@playwright/test').Page} page
 */
export async function getTextAlign(page, selector) {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const style = window.getComputedStyle(el);
    if (style.textAlign && style.textAlign !== "start") return style.textAlign;
    const parent = el.parentElement;
    if (parent) {
      const ps = window.getComputedStyle(parent);
      if (ps.textAlign && ps.textAlign !== "start") return ps.textAlign;
    }
    return style.textAlign || "left";
  }, selector);
}

/**
 * @param {import('@playwright/test').Page} page
 */
export async function hasHorizontalOverflow(page) {
  return page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
}

/**
 * @param {import('@playwright/test').Page} page
 */
export async function getHeroVerticalStack(page) {
  return page.evaluate(() => {
    const h1 = document.querySelector("h1");
    if (!h1) return { ok: false, reason: "no h1" };
    const h1r = h1.getBoundingClientRect();
    const p = document.querySelector("p");
    const btn =
      document.querySelector("main button, button, main a[href], a.rounded-full") ||
      Array.from(document.querySelectorAll("button, a")).find((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 40 && r.height > 24;
      });

    if (p) {
      const pr = p.getBoundingClientRect();
      if (pr.top < h1r.bottom - 8) {
        return { ok: false, reason: "el párrafo no está debajo del h1" };
      }
      if (btn) {
        const br = btn.getBoundingClientRect();
        if (br.top < pr.bottom - 8) {
          return { ok: false, reason: "el botón no está debajo del párrafo" };
        }
      }
    }

    if (btn) {
      const br = btn.getBoundingClientRect();
      if (br.top < h1r.bottom - 8 && Math.abs(br.top - h1r.top) < h1r.height * 0.6) {
        return { ok: false, reason: "el botón está al lado del título (debe ir debajo)" };
      }
      const overlapX = br.left < h1r.right && br.right > h1r.left;
      const sameRow = Math.abs(br.top - h1r.top) < Math.min(h1r.height, br.height) * 0.5;
      if (overlapX && sameRow) {
        return { ok: false, reason: "el botón se solapa con el h1 en horizontal" };
      }
    }

    return { ok: true };
  });
}

/**
 * @param {import('@playwright/test').Page} page
 */
export async function getHeroColumnCentered(page) {
  return page.evaluate(() => {
    const h1 = document.querySelector("h1");
    if (!h1) return { ok: false, reason: "no h1" };
    let el = h1.parentElement;
    for (let i = 0; i < 5 && el; i++) {
      const s = window.getComputedStyle(el);
      const display = s.display;
      const flexCol =
        (display === "flex" || display === "inline-flex") &&
        (s.flexDirection === "column" || s.flexDirection === "column-reverse");
      const centered =
        s.alignItems === "center" || s.textAlign === "center";
      if (flexCol && centered) return { ok: true };
      if (flexCol && s.alignItems === "center") return { ok: true };
      el = el.parentElement;
    }
    const align = window.getComputedStyle(h1).textAlign;
    if (align === "center") return { ok: true };
    return {
      ok: false,
      reason: "usa flex flex-col items-center (o text-center) en el contenedor del hero",
    };
  });
}
