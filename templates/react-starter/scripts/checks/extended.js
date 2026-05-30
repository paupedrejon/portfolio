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

  // —— Nivel 17: useFetch ——
  "file-usefetch": async () => {
    if (!fileExists("src/hooks/useFetch.js") && !fileExists("src/hooks/useFetch.jsx")) {
      return { passed: false, hint: "crea src/hooks/useFetch.js" };
    }
    return { passed: true };
  },
  "usefetch-hook-states": async () => {
    const src = readProjectFile("src/hooks/useFetch.js") ?? readProjectFile("src/hooks/useFetch.jsx") ?? "";
    if (!src.includes("loading") || !src.includes("error")) {
      return { passed: false, hint: "useFetch debe devolver { data, loading, error }" };
    }
    if (!src.includes("useEffect")) {
      return { passed: false, hint: "usa useEffect para el fetch" };
    }
    return { passed: true };
  },
  "file-projects-store": async () => {
    if (!fileExists("src/lib/projectsStore.js")) {
      return { passed: false, hint: "crea src/lib/projectsStore.js con getExtraProjects()" };
    }
    const src = readProjectFile("src/lib/projectsStore.js") ?? "";
    if (!src.includes("getExtraProjects") || !src.includes("localStorage")) {
      return { passed: false, hint: "projectsStore debe leer/escribir localStorage" };
    }
    return { passed: true };
  },
  "usefetch-used": async () => {
    const projects = readProjectFile("src/components/Projects.jsx") ?? "";
    if (!projects.includes("useFetch")) {
      return { passed: false, hint: "importa y usa useFetch en Projects.jsx" };
    }
    return { passed: true };
  },
  "projects-loading-ui": async (page) => {
    const src = readProjectFile("src/components/Projects.jsx") ?? "";
    if (!src.includes("loading")) {
      return { passed: false, hint: "muestra estado loading en Projects.jsx" };
    }
    if (!src.includes('data-testid="loading"') && !src.includes("data-testid='loading'")) {
      return { passed: false, hint: 'añade data-testid="loading" al texto de carga' };
    }
    return { passed: true };
  },
  "projects-merge-extras": async () => {
    const src = readProjectFile("src/components/Projects.jsx") ?? "";
    if (!src.includes("getExtraProjects")) {
      return { passed: false, hint: "mezcla getExtraProjects() con los datos del fetch" };
    }
    return { passed: true };
  },

  // —— Nivel 18: ThemeContext ——
  "file-theme-context": async () => {
    if (!fileExists("src/context/ThemeContext.jsx")) {
      return { passed: false, hint: "crea ThemeContext.jsx" };
    }
    return { passed: true };
  },
  "theme-create-provider": async () => {
    const src = readProjectFile("src/context/ThemeContext.jsx") ?? "";
    if (!src.includes("createContext")) {
      return { passed: false, hint: "usa createContext en ThemeContext.jsx" };
    }
    if (!src.includes("ThemeProvider") || !src.includes("toggle")) {
      return { passed: false, hint: "ThemeProvider debe exponer dark y toggle" };
    }
    if (!src.includes("data-theme")) {
      return { passed: false, hint: "actualiza data-theme en documentElement" };
    }
    return { passed: true };
  },
  "theme-hook-export": async () => {
    const src = readProjectFile("src/context/ThemeContext.jsx") ?? "";
    if (!src.includes("useTheme")) {
      return { passed: false, hint: "exporta function useTheme()" };
    }
    return { passed: true };
  },
  "theme-provider-wraps": async () => {
    const main = readProjectFile("src/main.jsx") ?? "";
    if (!main.includes("ThemeProvider")) {
      return { passed: false, hint: "envuelve la app con <ThemeProvider> en main.jsx" };
    }
    return { passed: true };
  },
  "navbar-use-theme": async () => {
    const nav = readProjectFile("src/components/Navbar.jsx") ?? "";
    if (!nav.includes("useTheme")) {
      return { passed: false, hint: "Navbar debe importar useTheme()" };
    }
    return { passed: true };
  },
  "app-no-theme-props": async () => {
    const app = readProjectFile("src/App.jsx") ?? "";
    if (/dark=\{|onToggleTheme=|toggleTheme=/.test(app)) {
      return { passed: false, hint: "App no debe pasar props de tema a Navbar" };
    }
    if (!app.includes("<Navbar")) {
      return { passed: false, hint: "App debe renderizar <Navbar /> sin props de tema" };
    }
    return { passed: true };
  },

  // —— Nivel 19: a11y + SEO ——
  "page-home-main": async () => {
    const src = readProjectFile("src/pages/HomePage.jsx") ?? "";
    if (!/<main[\s>]/.test(src)) {
      return { passed: false, hint: "HomePage debe envolver contenido en <main>" };
    }
    return { passed: true };
  },
  "page-projects-main": async () => {
    const src = readProjectFile("src/pages/ProjectsPage.jsx") ?? "";
    if (!/<main[\s>]/.test(src)) {
      return { passed: false, hint: "ProjectsPage debe usar <main>" };
    }
    return { passed: true };
  },
  "page-contact-main": async () => {
    const src = readProjectFile("src/pages/ContactPage.jsx") ?? "";
    if (!/<main[\s>]/.test(src)) {
      return { passed: false, hint: "ContactPage debe usar <main>" };
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
  "index-lang-es": async () => {
    const html = readProjectFile("index.html") ?? "";
    if (!/lang=["']es["']/i.test(html)) {
      return { passed: false, hint: 'añade lang="es" al tag <html>' };
    }
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
  "env-supabase-url": async () => {
    const env = readProjectFile(".env.example") ?? "";
    if (!env.includes("VITE_SUPABASE_URL")) {
      return { passed: false, hint: "añade VITE_SUPABASE_URL a .env.example" };
    }
    return { passed: true };
  },
  "env-supabase-key": async () => {
    const env = readProjectFile(".env.example") ?? "";
    if (!env.includes("VITE_SUPABASE_ANON_KEY")) {
      return { passed: false, hint: "añade VITE_SUPABASE_ANON_KEY a .env.example" };
    }
    return { passed: true };
  },
  "file-supabase-lib": async () => {
    if (!fileExists("src/lib/supabase.js")) {
      return { passed: false, hint: "crea src/lib/supabase.js" };
    }
    return { passed: true };
  },
  "supabase-uses-import-meta": async () => {
    const src = readProjectFile("src/lib/supabase.js") ?? "";
    if (!src.includes("import.meta.env")) {
      return { passed: false, hint: "lee variables con import.meta.env en supabase.js" };
    }
    return { passed: true };
  },
  "no-hardcoded-secrets": async () => {
    const files = ["src/App.jsx", "src/lib/supabase.js", "src/pages/AdminPage.jsx"];
    for (const f of files) {
      const src = readProjectFile(f) ?? "";
      if (/eyJ[A-Za-z0-9_-]{10,}/.test(src)) {
        return { passed: false, hint: `no pegues JWT keys en ${f} — usa import.meta.env` };
      }
    }
    return { passed: true };
  },

  // —— Nivel 22: Admin ——
  "file-admin-page": async () => {
    if (!fileExists("src/pages/AdminPage.jsx")) {
      return { passed: false, hint: "crea src/pages/AdminPage.jsx" };
    }
    return { passed: true };
  },
  "admin-route-app": async () => {
    const app = readProjectFile("src/App.jsx") ?? "";
    if (!app.includes("/admin") && !app.includes('path="/admin"')) {
      return { passed: false, hint: 'añade Route path="/admin" en App.jsx' };
    }
    return { passed: true };
  },
  "admin-form-title": async () => {
    const src = readProjectFile("src/pages/AdminPage.jsx") ?? "";
    if (!src.includes("admin-name") && !src.includes('name="name"')) {
      return { passed: false, hint: "formulario admin con input de título" };
    }
    if (!src.includes("textarea") && !src.includes("admin-desc")) {
      return { passed: false, hint: "añade textarea de descripción en AdminPage" };
    }
    return { passed: true };
  },
  "admin-uses-add-project": async () => {
    const src = readProjectFile("src/pages/AdminPage.jsx") ?? "";
    if (!src.includes("addProject")) {
      return { passed: false, hint: "AdminPage debe llamar addProject() al enviar" };
    }
    return { passed: true };
  },
  "admin-submit-button": async (page) => {
    const origin = new URL(page.url()).origin;
    await page.goto(`${origin}/admin`, { waitUntil: "domcontentloaded" });
    try {
      await page.waitForSelector('form button[type="submit"]', { timeout: 8000 });
    } catch {
      return { passed: false, hint: "botón submit en formulario /admin" };
    }
    return { passed: true };
  },
  "admin-page-renders": async (page) => {
    const origin = new URL(page.url()).origin;
    await page.goto(`${origin}/admin`, { waitUntil: "domcontentloaded" });
    try {
      await page.waitForSelector("#admin-name, input[name='name']", { timeout: 8000 });
    } catch {
      return { passed: false, hint: "/admin debe cargar el formulario del panel" };
    }
    return { passed: true };
  },

  // —— Nivel 23: upload ——
  "admin-file-input": async (page) => {
    const origin = new URL(page.url()).origin;
    await page.goto(`${origin}/admin`, { waitUntil: "domcontentloaded" });
    try {
      await page.waitForSelector('input[type="file"]', { timeout: 8000 });
    } catch {
      return { passed: false, hint: "añade input type=file en AdminPage" };
    }
    return { passed: true };
  },
  "admin-file-accept": async () => {
    const src = readProjectFile("src/pages/AdminPage.jsx") ?? "";
    if (!src.includes('type="file"') && !src.includes("type='file'")) {
      return { passed: false, hint: "input file en AdminPage" };
    }
    if (!src.includes("accept=") || !src.includes("image")) {
      return { passed: false, hint: 'accept="image/*" en el input file' };
    }
    return { passed: true };
  },
  "admin-file-handler": async () => {
    const src = readProjectFile("src/pages/AdminPage.jsx") ?? "";
    if (!/handleFileChange|onChange.*file|files\?\.\[0\]/.test(src)) {
      return { passed: false, hint: "handler onChange para el input file" };
    }
    return { passed: true };
  },
  "admin-image-preview": async () => {
    const src = readProjectFile("src/pages/AdminPage.jsx") ?? "";
    if (!src.includes("createObjectURL") && !src.includes("preview")) {
      return { passed: false, hint: "vista previa con URL.createObjectURL o estado preview" };
    }
    return { passed: true };
  },
  "admin-preview-alt": async () => {
    const src = readProjectFile("src/pages/AdminPage.jsx") ?? "";
    if (src.includes("<img") && src.includes("preview") && !/alt=/.test(src)) {
      return { passed: false, hint: "la imagen preview necesita atributo alt" };
    }
    return { passed: true };
  },
  "file-input-image": async (page) => {
    const origin = new URL(page.url()).origin;
    await page.goto(`${origin}/admin`, { waitUntil: "domcontentloaded" });
    if (!(await page.locator('input[type="file"]').count())) {
      return { passed: false, hint: 'añade <input type="file" accept="image/*" /> en /admin' };
    }
    return { passed: true };
  },

  // —— Nivel 24: contacto persist ——
  "file-contact-store": async () => {
    if (!fileExists("src/lib/contactStore.js")) {
      return { passed: false, hint: "crea src/lib/contactStore.js" };
    }
    return { passed: true };
  },
  "contact-store-localstorage": async () => {
    const src = readProjectFile("src/lib/contactStore.js") ?? "";
    if (!src.includes("localStorage") || !src.includes("saveContactMessage")) {
      return { passed: false, hint: "contactStore guarda mensajes en localStorage" };
    }
    return { passed: true };
  },
  "contact-form-save-import": async () => {
    const src = readProjectFile("src/components/ContactForm.jsx") ?? "";
    if (!src.includes("saveContactMessage")) {
      return { passed: false, hint: "ContactForm importa saveContactMessage" };
    }
    return { passed: true };
  },
  "contact-form-on-submit": async () => {
    const src = readProjectFile("src/components/ContactForm.jsx") ?? "";
    if (!src.includes("handleSubmit") || !src.includes("saveContactMessage")) {
      return { passed: false, hint: "handleSubmit debe llamar saveContactMessage" };
    }
    return { passed: true };
  },
  "contact-sent-feedback": async () => {
    const src = readProjectFile("src/components/ContactForm.jsx") ?? "";
    if (!src.includes("sent") && !src.includes("role=\"status\"") && !src.includes("role='status'")) {
      return { passed: false, hint: "muestra confirmación tras enviar (sent + role=status)" };
    }
    return { passed: true };
  },

  // —— Nivel 25: env ——
  "env-site-url": async () => {
    const env = readProjectFile(".env.example") ?? "";
    if (!env.includes("VITE_SITE_URL")) {
      return { passed: false, hint: "añade VITE_SITE_URL a .env.example" };
    }
    return { passed: true };
  },
  "env-analytics-var": async () => {
    const env = readProjectFile(".env.example") ?? "";
    if (!env.includes("VITE_ANALYTICS_ID")) {
      return { passed: false, hint: "añade VITE_ANALYTICS_ID a .env.example" };
    }
    return { passed: true };
  },
  "env-example-complete": async () => {
    const env = readProjectFile(".env.example") ?? "";
    const required = ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY", "VITE_SITE_URL"];
    for (const key of required) {
      if (!env.includes(key)) {
        return { passed: false, hint: `falta ${key} en .env.example` };
      }
    }
    return { passed: true };
  },

  // —— Nivel 26: Vitest ——
  "vitest-config-exists": async () => {
    if (!fileExists("vitest.config.js") && !fileExists("vitest.config.ts")) {
      return { passed: false, hint: "crea vitest.config.js" };
    }
    return { passed: true };
  },
  "package-test-script": async () => {
    const pkg = readProjectFile("package.json") ?? "";
    if (!/"test"\s*:/.test(pkg)) {
      return { passed: false, hint: 'añade "test": "vitest run" en package.json' };
    }
    if (!pkg.includes("vitest")) {
      return { passed: false, hint: "instala vitest como devDependency" };
    }
    return { passed: true };
  },
  "test-file-exists": async () => {
    if (!fileExists("src/components/ProjectCard.test.jsx") && !fileExists("src/App.test.jsx")) {
      return { passed: false, hint: "crea un archivo .test.jsx con Vitest" };
    }
    return { passed: true };
  },
  "test-imports-vitest": async () => {
    const test =
      readProjectFile("src/components/ProjectCard.test.jsx") ??
      readProjectFile("src/App.test.jsx") ??
      "";
    if (!test.includes("describe") || !test.includes("expect")) {
      return { passed: false, hint: "importa describe, it, expect de vitest" };
    }
    if (!test.includes("@testing-library/react") && !test.includes("render")) {
      return { passed: false, hint: "usa @testing-library/react para render" };
    }
    return { passed: true };
  },
  "test-render-projectcard": async () => {
    const test = readProjectFile("src/components/ProjectCard.test.jsx") ?? "";
    if (!test.includes("ProjectCard")) {
      return { passed: false, hint: "el test debe renderizar ProjectCard" };
    }
    if (!test.includes("getByText") && !test.includes("screen")) {
      return { passed: false, hint: "comprueba texto visible con screen.getByText" };
    }
    return { passed: true };
  },

  // —— Nivel 27: lazy ——
  "lazy-import-login": async () => {
    const app = readProjectFile("src/App.jsx") ?? "";
    if (!/lazy\s*\(\s*\(\)\s*=>\s*import\s*\(\s*["'].*LoginPage/.test(app)) {
      return { passed: false, hint: "LoginPage debe cargarse con lazy(() => import(...))" };
    }
    return { passed: true };
  },
  "lazy-import-admin": async () => {
    const app = readProjectFile("src/App.jsx") ?? "";
    if (!/lazy\s*\(\s*\(\)\s*=>\s*import\s*\(\s*["'].*AdminPage/.test(app)) {
      return { passed: false, hint: "AdminPage debe cargarse con lazy(() => import(...))" };
    }
    return { passed: true };
  },
  "lazy-suspense": async () => {
    const app = readProjectFile("src/App.jsx") ?? "";
    if (!app.includes("Suspense")) {
      return { passed: false, hint: "envuelve Routes en <Suspense>" };
    }
    if (!app.includes("lazy(") && !app.includes("React.lazy")) {
      return { passed: false, hint: "usa React.lazy para Login o Admin" };
    }
    return { passed: true };
  },
  "lazy-fallback-ui": async () => {
    const app = readProjectFile("src/App.jsx") ?? "";
    if (!app.includes("fallback")) {
      return { passed: false, hint: "Suspense necesita prop fallback={…}" };
    }
    return { passed: true };
  },
  "lazy-routes-load": async (page) => {
    const origin = new URL(page.url()).origin;
    await page.goto(`${origin}/login`, { waitUntil: "domcontentloaded" });
    try {
      await page.waitForSelector("#login-email, form input[type='email']", { timeout: 12000 });
    } catch {
      return { passed: false, hint: "ruta lazy /login no carga correctamente" };
    }
    return { passed: true };
  },

  // —— Nivel 28: README ——
  "readme-exists": async () => {
    if (!fileExists("README.md")) {
      return { passed: false, hint: "crea README.md" };
    }
    return { passed: true };
  },
  "readme-npm-scripts": async () => {
    const readme = readProjectFile("README.md") ?? "";
    if (!readme.includes("npm run dev") || !readme.includes("npm run build")) {
      return { passed: false, hint: "README debe documentar npm run dev y npm run build" };
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
  "index-analytics-comment": async () => {
    const html = readProjectFile("index.html") ?? "";
    if (!/analytics|plausible|gtag/i.test(html)) {
      return { passed: false, hint: "añade comentario o script de analytics en index.html" };
    }
    return { passed: true };
  },
  "readme-env-docs": async () => {
    const readme = readProjectFile("README.md") ?? "";
    if (!/\.env|variables de entorno|VITE_/i.test(readme)) {
      return { passed: false, hint: "README debe explicar .env.example / .env.local" };
    }
    return { passed: true };
  },

  // —— Nivel 29: CI ——
  "ci-workflow-exists": async () => {
    if (!fileExists(".github/workflows/ci.yml")) {
      return { passed: false, hint: "crea .github/workflows/ci.yml" };
    }
    return { passed: true };
  },
  "ci-triggers-push": async () => {
    const yml = readProjectFile(".github/workflows/ci.yml") ?? "";
    if (!yml.includes("push:") || !yml.includes("main")) {
      return { passed: false, hint: "CI debe dispararse en push a main" };
    }
    return { passed: true };
  },
  "ci-node-20": async () => {
    const yml = readProjectFile(".github/workflows/ci.yml") ?? "";
    if (!yml.includes('"20"') && !yml.includes("'20'")) {
      return { passed: false, hint: 'usa node-version: "20" en el workflow' };
    }
    return { passed: true };
  },
  "ci-runs-test": async () => {
    const yml = readProjectFile(".github/workflows/ci.yml") ?? "";
    if (!yml.includes("npm test")) {
      return { passed: false, hint: "el workflow debe ejecutar npm test" };
    }
    return { passed: true };
  },
  "ci-runs-build": async () => {
    const yml = readProjectFile(".github/workflows/ci.yml") ?? "";
    if (!yml.includes("npm run build")) {
      return { passed: false, hint: "el workflow debe ejecutar npm run build" };
    }
    return { passed: true };
  },

  // —— Nivel 30: deploy ——
  "package-build-script": async () => {
    const pkg = readProjectFile("package.json") ?? "";
    if (!/"build"\s*:/.test(pkg)) {
      return { passed: false, hint: 'añade script "build": "vite build"' };
    }
    return { passed: true };
  },
  "build-passes-local": async () => {
    if (!fileExists("dist/index.html")) {
      return {
        passed: false,
        hint: "ejecuta npm run build — debe generar carpeta dist/",
      };
    }
    return { passed: true };
  },
  "deploy-env-vars": async () => {
    const readme = readProjectFile("README.md") ?? "";
    const env = readProjectFile(".env.example") ?? "";
    if (!env.includes("VITE_")) {
      return { passed: false, hint: "documenta variables VITE_ para el hosting" };
    }
    if (!/vercel|netlify|environment variable|variables de entorno/i.test(readme + env)) {
      return { passed: false, hint: "README o .env.example deben mencionar config en el hosting" };
    }
    return { passed: true };
  },
  "deploy-preview-check": async () => {
    const readme = readProjectFile("README.md") ?? "";
    if (!/https?:\/\//.test(readme)) {
      return { passed: false, hint: "añade URL pública desplegada al README" };
    }
    return { passed: true };
  },
};
