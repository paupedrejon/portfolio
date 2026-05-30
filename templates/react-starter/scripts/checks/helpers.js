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
