import { fileExists, fileMatches, readProjectFile } from "./fs.js";
import { hasHorizontalOverflow, getHeroVerticalStack, getHeroColumnCentered, getTextAlign } from "./helpers.js";

/** @type {Record<string, (page: import('@playwright/test').Page) => Promise<{ passed: boolean; hint?: string; skipped?: boolean }>>} */
export const extendedChecks = {
  // —— Nivel 4: Navbar ——
  "nav-element-exists": async (page) => {
    const nav = page.locator("nav, header nav").first();
    if (!(await nav.count()) || !(await nav.isVisible())) {
      return { passed: false, hint: "crea un <nav> o <header> con navegación" };
    }
    return { passed: true };
  },
  "nav-position-fixed": async (page) => {
    const pos = await page.evaluate(() => {
      const el = document.querySelector("nav, header");
      if (!el) return null;
      const s = window.getComputedStyle(el);
      return s.position;
    });
    if (pos !== "fixed" && pos !== "sticky") {
      return { passed: false, hint: "usa fixed o sticky en la navbar (fixed top-0 w-full z-50)" };
    }
    return { passed: true };
  },
  "nav-brand-exists": async (page) => {
    const brand = page.locator("nav a, header a").first();
    if (!(await brand.count())) {
      return { passed: false, hint: "añade un enlace o logo con tu nombre en la navbar" };
    }
    return { passed: true };
  },
  "nav-link-count": async (page) => {
    const count = await page.locator("nav a, header nav a").count();
    if (count < 3) {
      return { passed: false, hint: `hay ${count} enlaces en nav (necesitas al menos 3: marca + 2 secciones)` };
    }
    return { passed: true };
  },
  "nav-anchor-links": async (page) => {
    const hrefs = await page.evaluate(() =>
      Array.from(document.querySelectorAll("nav a[href], header nav a[href]")).map((a) =>
        a.getAttribute("href")
      )
    );
    const hash = hrefs.filter((h) => h?.startsWith("#"));
    if (hash.length < 2) {
      return { passed: false, hint: "añade enlaces con href=\"#about\" etc. hacia secciones" };
    }
    return { passed: true };
  },

  // —— Nivel 5: Responsive ——
  "responsive-mobile-padding": async (page) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload({ waitUntil: "domcontentloaded" });
    const overflow = await hasHorizontalOverflow(page);
    if (overflow) return { passed: false, hint: "scroll horizontal en móvil — añade px-4 en secciones" };
    return { passed: true };
  },
  "responsive-mobile-readable": async (page) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const h1 = page.locator("h1").first();
    if (!(await h1.isVisible())) return { passed: false, hint: "h1 no visible en 375px" };
    return { passed: true };
  },
  "responsive-desktop-layout": async (page) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.reload({ waitUntil: "domcontentloaded" });
    const w = await page.evaluate(() => document.body.scrollWidth);
    if (w > 1400) return { passed: false, hint: "layout demasiado ancho en desktop" };
    return { passed: true };
  },
  "responsive-md-breakpoint": async (page) => {
    const hasMd = await page.evaluate(() => {
      const el = document.querySelector("[class*='md:']");
      return !!el;
    });
    if (!hasMd) {
      return { passed: false, hint: "usa clases md: (ej. md:text-5xl o md:grid-cols-2)" };
    }
    return { passed: true };
  },

  // —— Nivel 6: Componentizar ——
  "file-hero-component": async () => {
    if (!fileExists("src/components/Hero.jsx")) {
      return { passed: false, hint: "crea src/components/Hero.jsx" };
    }
    return { passed: true };
  },
  "file-navbar-component": async () => {
    if (!fileExists("src/components/Navbar.jsx")) {
      return { passed: false, hint: "crea src/components/Navbar.jsx" };
    }
    return { passed: true };
  },
  "file-about-component": async () => {
    if (!fileExists("src/components/About.jsx")) {
      return { passed: false, hint: "crea src/components/About.jsx" };
    }
    return { passed: true };
  },
  "app-imports-hero": async () => {
    if (!fileMatches("src/App.jsx", /import\s+Hero\s+from/)) {
      return { passed: false, hint: "importa Hero en App.jsx" };
    }
    return { passed: true };
  },
  "app-imports-navbar": async () => {
    if (!fileMatches("src/App.jsx", /import\s+Navbar\s+from/)) {
      return { passed: false, hint: "importa Navbar en App.jsx" };
    }
    return { passed: true };
  },
  "app-imports-about": async () => {
    if (!fileMatches("src/App.jsx", /import\s+About\s+from/)) {
      return { passed: false, hint: "importa About en App.jsx" };
    }
    return { passed: true };
  },
  "page-still-renders-hero": async (page) => {
    const text = await page.locator("h1").first().textContent();
    if (!text?.toLowerCase().includes("hello world")) {
      return { passed: false, hint: "Hero debe seguir mostrando Hello World" };
    }
    return { passed: true };
  },

  // —— Nivel 7: ProjectCard ——
  "file-project-card": async () => {
    if (!fileExists("src/components/ProjectCard.jsx")) {
      return { passed: false, hint: "crea src/components/ProjectCard.jsx" };
    }
    return { passed: true };
  },
  "project-card-accepts-props": async () => {
    const src = readProjectFile("src/components/ProjectCard.jsx");
    if (!src?.includes("title") || !src.includes("function") && !src.includes("=>")) {
      return { passed: false, hint: "ProjectCard debe recibir props (title, description…)" };
    }
    if (!src.includes("title")) {
      return { passed: false, hint: "usa la prop title dentro del componente" };
    }
    return { passed: true };
  },
  "project-card-renders": async (page) => {
    const card = page.locator("[data-testid='project-card'], article").first();
    if (!(await card.count())) {
      return { passed: false, hint: "renderiza al menos una ProjectCard en App" };
    }
    return { passed: true };
  },

  // —— Nivel 8: .map ——
  "projects-data-file": async () => {
    if (!fileExists("src/data/projects.js") && !fileExists("src/data/projects.json")) {
      return { passed: false, hint: "crea src/data/projects.js con un array de proyectos" };
    }
    return { passed: true };
  },
  "projects-grid-exists": async (page) => {
    const grid = page.locator("#projects, section#projects, [data-testid='projects-grid']");
    if (!(await grid.count())) {
      return { passed: false, hint: 'añade <section id="projects"> con un grid' };
    }
    return { passed: true };
  },
  "projects-map-used": async () => {
    const app = readProjectFile("src/App.jsx") ?? "";
    const projects = readProjectFile("src/components/Projects.jsx") ?? app;
    if (!projects.includes(".map(")) {
      return { passed: false, hint: "renderiza la lista con array.map()" };
    }
    return { passed: true };
  },
  "projects-min-count": async (page) => {
    const cards = await page.locator("[data-testid='project-card'], #projects article").count();
    if (cards < 2) {
      return { passed: false, hint: `hay ${cards} proyectos (añade al menos 2 en el array)` };
    }
    return { passed: true };
  },

  // —— Nivel 9: Tema ——
  "theme-toggle-button": async (page) => {
    const btn = page.locator("[data-testid='theme-toggle']");
    if (!(await btn.count())) {
      return { passed: false, hint: "añade un botón con data-testid=\"theme-toggle\" para cambiar tema" };
    }
    return { passed: true };
  },
  "theme-usestate": async () => {
    const app = readProjectFile("src/App.jsx") ?? "";
    if (!app.includes("useState")) {
      return { passed: false, hint: "usa useState para guardar el tema" };
    }
    return { passed: true };
  },
  "theme-changes-on-click": async (page) => {
    const readTheme = () =>
      page.evaluate(
        () =>
          document.documentElement.getAttribute("data-theme") ??
          document.querySelector("[data-theme]")?.getAttribute("data-theme") ??
          ""
      );
    const before = await readTheme();
    const btn = page.locator("[data-testid='theme-toggle']").first();
    if (!(await btn.count())) return { passed: false, hint: "falta botón de tema" };
    await btn.click();
    await page.waitForTimeout(300);
    const after = await readTheme();
    if (!after || before === after) {
      return {
        passed: false,
        hint: "al pulsar, debe cambiar data-theme (dark/light) — también revisa que textos y fondos usen variables CSS, no text-white fijo",
      };
    }
    return { passed: true };
  },

  // —— Nivel 10-11: Formulario ——
  "contact-section-exists": async (page) => {
    const form = page.locator("form, section#contact");
    if (!(await form.count())) {
      return { passed: false, hint: 'añade <section id="contact"> con un <form>' };
    }
    return { passed: true };
  },
  "contact-input-name": async (page) => {
    if (!(await page.locator("input[name='name'], #contact-name").count())) {
      return { passed: false, hint: "input para nombre (name=\"name\")" };
    }
    return { passed: true };
  },
  "contact-input-email": async (page) => {
    if (!(await page.locator("input[type='email'], input[name='email']").count())) {
      return { passed: false, hint: "input type=\"email\"" };
    }
    return { passed: true };
  },
  "contact-textarea-message": async (page) => {
    if (!(await page.locator("textarea").count())) {
      return { passed: false, hint: "textarea para el mensaje" };
    }
    return { passed: true };
  },
  "contact-controlled-inputs": async () => {
    const src = readProjectFile("src/components/ContactForm.jsx") ?? readProjectFile("src/App.jsx") ?? "";
    if (!src.includes("value=") || !src.includes("onChange")) {
      return { passed: false, hint: "inputs controlados: value={...} onChange={...}" };
    }
    return { passed: true };
  },
  "contact-submit-button": async (page) => {
    if (!(await page.locator("form button[type='submit'], form button").count())) {
      return { passed: false, hint: "botón Enviar en el formulario" };
    }
    return { passed: true };
  },
  "validation-error-ui": async (page) => {
    const form = page.locator("form").first();
    await form.locator("button[type='submit'], button").first().click();
    await page.waitForTimeout(200);
    const err = page.locator("[role='alert'], .text-red-500, [data-testid='form-error']");
    if (!(await err.count())) {
      return { passed: false, hint: "muestra mensaje de error si envías vacío" };
    }
    return { passed: true };
  },
  "validation-email-format": async () => {
    const src = readProjectFile("src/components/ContactForm.jsx") ?? readProjectFile("src/App.jsx") ?? "";
    if (!/email|@/.test(src) || !/test|valid|regex|includes/i.test(src)) {
      return { passed: false, hint: "valida que el email contenga @" };
    }
    return { passed: true };
  },

  // —— Nivel 12-13: fetch ——
  "projects-json-exists": async () => {
    if (!fileExists("public/projects.json") && !fileExists("src/data/projects.json")) {
      return { passed: false, hint: "crea public/projects.json con datos" };
    }
    return { passed: true };
  },
  "useeffect-fetch": async () => {
    const src = readProjectFile("src/App.jsx") ?? readProjectFile("src/components/Projects.jsx") ?? "";
    if (!src.includes("useEffect")) {
      return { passed: false, hint: "usa useEffect para cargar datos" };
    }
    if (!src.includes("fetch")) {
      return { passed: false, hint: "usa fetch() dentro del useEffect" };
    }
    return { passed: true };
  },
  "loading-indicator": async (page) => {
    const loading = page.locator("[data-testid='loading'], .loading, text=/cargando/i");
    if (!(await loading.count())) {
      return { passed: false, hint: "muestra «Cargando…» mientras fetch" };
    }
    return { passed: true };
  },
  "error-state-ui": async (page) => {
    const err = page.locator("[data-testid='error'], text=/error/i");
    if (!(await err.count())) {
      return { passed: false, hint: "muestra mensaje si fetch falla (estado error)" };
    }
    return { passed: true };
  },

  // —— Nivel 14: scroll ——
  "scroll-reveal-class": async () => {
    const css = readProjectFile("src/index.css") ?? "";
    const app = readProjectFile("src/App.jsx") ?? "";
    if (!css.includes("opacity") && !app.includes("IntersectionObserver") && !app.includes("scroll")) {
      return { passed: false, hint: "añade animación al scroll (clase .reveal o IntersectionObserver)" };
    }
    return { passed: true };
  },
  "scroll-section-animated": async (page) => {
    const section = page.locator("section").nth(1);
    if (!(await section.count())) return { passed: false, hint: "falta sección para animar" };
    return { passed: true };
  },

  // —— Nivel 15: Modal ——
  "modal-component-exists": async () => {
    if (!fileExists("src/components/ProjectModal.jsx")) {
      return { passed: false, hint: "crea ProjectModal.jsx" };
    }
    return { passed: true };
  },
  "modal-opens-on-click": async (page) => {
    const card = page.locator("[data-testid='project-card'], #projects article").first();
    if (!(await card.count())) return { passed: false, hint: "necesitas tarjetas de proyecto" };
    await card.click();
    await page.waitForTimeout(300);
    const modal = page.locator("[role='dialog'], [data-testid='project-modal'], .modal");
    if (!(await modal.count()) || !(await modal.first().isVisible())) {
      return { passed: false, hint: "al clic en proyecto debe abrirse el modal" };
    }
    return { passed: true };
  },
  "modal-closes": async (page) => {
    const card = page.locator("[data-testid='project-card']").first();
    if (await card.count()) await card.click();
    const close = page.locator("[data-testid='modal-close'], button").filter({ hasText: /cerrar|×|close/i });
    if (!(await close.count())) {
      return { passed: false, hint: "botón para cerrar el modal" };
    }
    await close.first().click();
    await page.waitForTimeout(200);
    const modal = page.locator("[role='dialog'][data-open='true'], [data-testid='project-modal']:visible");
    if (await modal.count()) {
      return { passed: false, hint: "el modal debe ocultarse al cerrar" };
    }
    return { passed: true };
  },

  // —— Nivel 16: Routing ——
  "router-package": async () => {
    const pkg = readProjectFile("package.json") ?? "";
    if (!pkg.includes("react-router")) {
      return { passed: false, hint: "npm install react-router-dom" };
    }
    return { passed: true };
  },
  "router-browser": async () => {
    const main = readProjectFile("src/main.jsx") ?? "";
    if (!main.includes("BrowserRouter")) {
      return { passed: false, hint: "envuelve la app con BrowserRouter en main.jsx" };
    }
    return { passed: true };
  },
  "route-home": async (page) => {
    await page.goto(page.url().split("#")[0].replace(/\/$/, "") + "/");
    const h1 = await page.locator("h1").count();
    if (!h1) return { passed: false, hint: "ruta / debe mostrar el home" };
    return { passed: true };
  },
  "route-projects-page": async (page) => {
    const base = page.url().split("#")[0].replace(/\/$/, "");
    await page.goto(`${base}/proyectos`);
    await page.waitForTimeout(400);
    const ok = await page.locator("#projects, h1, h2").filter({ hasText: /proyecto/i }).count();
    if (!ok) return { passed: false, hint: "ruta /proyectos debe existir" };
    return { passed: true };
  },

  // —— Nivel 17-30: archivos y patrones ——
  "file-usefetch": async () => {
    if (!fileExists("src/hooks/useFetch.js") && !fileExists("src/hooks/useFetch.jsx")) {
      return { passed: false, hint: "crea src/hooks/useFetch.js" };
    }
    return { passed: true };
  },
  "usefetch-used": async () => {
    const projects = readProjectFile("src/components/Projects.jsx") ?? "";
    const app = readProjectFile("src/App.jsx") ?? "";
    const src = projects + app;
    if (!src.includes("useFetch")) {
      return { passed: false, hint: "importa y usa useFetch en Projects u otro componente" };
    }
    return { passed: true };
  },
  "file-theme-context": async () => {
    if (!fileExists("src/context/ThemeContext.jsx")) {
      return { passed: false, hint: "crea ThemeContext.jsx" };
    }
    return { passed: true };
  },
  "theme-provider-wraps": async () => {
    const main = readProjectFile("src/main.jsx") ?? readProjectFile("src/App.jsx") ?? "";
    if (!main.includes("ThemeProvider")) {
      return { passed: false, hint: "envuelve la app con <ThemeProvider>" };
    }
    return { passed: true };
  },
  "semantic-main": async (page) => {
    if (!(await page.locator("main").count())) {
      return { passed: false, hint: "usa <main> para el contenido principal" };
    }
    return { passed: true };
  },
  "images-have-alt": async (page) => {
    const missing = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll("img"));
      return imgs.filter((img) => !img.getAttribute("alt")?.trim()).length;
    });
    if (missing > 0) {
      return { passed: false, hint: `${missing} imagen(es) sin atributo alt` };
    }
    return { passed: true };
  },
  "meta-description": async (page) => {
    const desc = await page.locator("meta[name='description']").count();
    if (!desc) return { passed: false, hint: "añade <meta name=\"description\" …> en index.html" };
    return { passed: true };
  },
  "login-page-exists": async (page) => {
    const app = readProjectFile("src/App.jsx") ?? "";
    if (!app.includes("/login") && !app.includes('path="/login"') && !app.includes("path='/login'")) {
      return { passed: false, hint: 'añade Route path="/login" en App.jsx' };
    }
    await page.goto(new URL("/login", page.url()).href, { waitUntil: "domcontentloaded" });
    try {
      await page.waitForSelector("form input[type='email'], form input[type='password']", {
        timeout: 10000,
      });
    } catch {
      return { passed: false, hint: "página /login con formulario email y password" };
    }
    return { passed: true };
  },
  "file-auth-api": async () => {
    if (!fileExists("server/auth-api.mjs")) {
      return { passed: false, hint: "crea server/auth-api.mjs con POST /api/login" };
    }
    const src = readProjectFile("server/auth-api.mjs") ?? "";
    if (!src.includes("/api/login")) {
      return { passed: false, hint: "implementa la ruta POST /api/login" };
    }
    if (!src.includes("demo@curso.dev")) {
      return { passed: false, hint: "usa usuario demo demo@curso.dev / curso123" };
    }
    return { passed: true };
  },
  "vite-proxy-auth": async () => {
    const cfg = readProjectFile("vite.config.js") ?? "";
    if (!cfg.includes("proxy") || !cfg.includes("/api")) {
      return { passed: false, hint: "añade proxy /api en vite.config.js" };
    }
    if (!cfg.includes("8787")) {
      return { passed: false, hint: "el proxy debe apuntar a http://localhost:8787" };
    }
    return { passed: true };
  },
  "login-fetch-post": async () => {
    const login = readProjectFile("src/pages/LoginPage.jsx") ?? "";
    if (!login.includes("fetch") || !login.includes("/api/login")) {
      return { passed: false, hint: 'LoginPage debe hacer fetch("/api/login", …)' };
    }
    if (!/method:\s*["']POST["']/.test(login)) {
      return { passed: false, hint: 'usa method: "POST" en el fetch' };
    }
    if (!login.includes("localStorage") || !login.includes("auth-token")) {
      return { passed: false, hint: "guarda data.token en localStorage como auth-token" };
    }
    return { passed: true };
  },
  "login-api-works": async (page) => {
    const origin = new URL(page.url()).origin;
    await page.goto(`${origin}/login`, { waitUntil: "domcontentloaded" });
    try {
      await page.waitForSelector("#login-email", { timeout: 10000 });
      await page.waitForSelector("#login-password", { timeout: 5000 });
    } catch {
      return { passed: false, hint: "añade id login-email y login-password a los inputs" };
    }
    await page.locator("#login-email").fill("demo@curso.dev");
    await page.locator("#login-password").fill("curso123");
    await page.locator('form button[type="submit"]').click();
    await page.waitForURL(/\/admin/, { timeout: 8000 }).catch(() => null);
    if (page.url().includes("/admin")) return { passed: true };
    const token = await page.evaluate(() => localStorage.getItem("auth-token"));
    if (token) return { passed: true };
    const err = await page
      .locator("[role='alert']")
      .first()
      .textContent()
      .catch(() => null);
    return {
      passed: false,
      hint:
        err?.trim() ||
        "login falló — ¿auth-api en marcha? Usa npm run dev (no dev:only)",
    };
  },
  "env-example-exists": async () => {
    if (!fileExists(".env.example")) {
      return { passed: false, hint: "crea .env.example con variables VITE_" };
    }
    return { passed: true };
  },
  "no-hardcoded-secrets": async () => {
    const app = readProjectFile("src/App.jsx") ?? "";
    if (/supabase.*key.*=.*['"]eyJ/.test(app)) {
      return { passed: false, hint: "no pegues keys en el código — usa import.meta.env" };
    }
    return { passed: true };
  },
  "file-input-image": async (page) => {
    if (!(await page.locator('input[type="file"]').count())) {
      return { passed: false, hint: 'añade <input type="file" accept="image/*" />' };
    }
    return { passed: true };
  },
  "test-file-exists": async () => {
    if (!fileExists("src/components/ProjectCard.test.jsx") && !fileExists("src/App.test.jsx")) {
      return { passed: false, hint: "crea un archivo .test.jsx con Vitest" };
    }
    return { passed: true };
  },
  "lazy-suspense": async () => {
    const app = readProjectFile("src/App.jsx") ?? "";
    if (!app.includes("lazy(") && !app.includes("React.lazy")) {
      return { passed: false, hint: "usa React.lazy para cargar una ruta o componente" };
    }
    return { passed: true };
  },
  "ci-workflow-exists": async () => {
    if (!fileExists(".github/workflows/ci.yml")) {
      return { passed: false, hint: "crea .github/workflows/ci.yml" };
    }
    return { passed: true };
  },
  "readme-deploy-url": async () => {
    const readme = readProjectFile("README.md") ?? "";
    if (!/https?:\/\//.test(readme)) {
      return { passed: false, hint: "documenta la URL de deploy en README.md" };
    }
    return { passed: true };
  },
};
