/** @typedef {{ type: 'file' | 'code' | 'tip' | 'action' | 'concept'; text: string; path?: string; code?: string }} HintStep */
/** @typedef {{ id: string; label: string; assert: string; concept?: string; hint?: string; hintSteps?: HintStep[] }} Checkpoint */

/** @param {string} id @param {string} label @param {HintStep[]} steps */
function cp(id, label, steps) {
  return { id, label, assert: label, hintSteps: steps };
}

/** @param {number} id @param {string} slug @param {string} title @param {string} block @param {string} desc @param {string} objective @param {string} previewDesc @param {Checkpoint[]} checkpoints */
function level(id, slug, title, block, desc, objective, previewDesc, checkpoints) {
  return {
    id,
    slug,
    title,
    block,
    description: desc,
    objective,
    preview: {
      title: "Así debería verse tu web al finalizar este nivel",
      description: previewDesc,
    },
    checkpoints,
  };
}

export const levels4to30 = [
  level(
    4,
    "navbar-fija",
    "Header / navbar fija",
    "Fundamentos",
    "Navbar fija arriba con enlaces de navegación.",
    "Añade una barra de navegación fija con tu nombre y enlaces a las secciones.",
    "Navbar oscura fija arriba; el hero y «Sobre mí» siguen debajo.",
    [
      cp("nav-element-exists", "Existe un <nav> visible", [
        { type: "file", text: "Abre", path: "src/App.jsx" },
        { type: "action", text: "Antes del <main>, crea un <header> con <nav> dentro" },
        { type: "code", text: "Esqueleto:", code: "<header>\n  <nav className=\"...\">\n  </nav>\n</header>" },
      ]),
      cp("nav-position-fixed", "La navbar es fija (fixed o sticky)", [
        { type: "action", text: "Al <header> o <nav> añade: fixed top-0 w-full z-50" },
        { type: "tip", text: "Guarda y haz scroll: la barra debe quedarse arriba" },
      ]),
      cp("nav-brand-exists", "Hay un enlace con tu nombre o logo", [
        { type: "code", text: "Ejemplo:", code: '<a href="#" className="font-bold text-white">Mi Portfolio</a>' },
      ]),
      cp("nav-link-count", "Hay al menos 2 enlaces de sección", [
        { type: "action", text: "Añade enlaces con href=\"#about\" y href=\"#projects\"" },
      ]),
      cp("nav-anchor-links", "Los enlaces apuntan a secciones (#)", [
        { type: "tip", text: "Al pulsar, la página debe saltar a la sección" },
      ]),
    ]
  ),
  level(
    5,
    "responsive",
    "Responsive (mobile-first)",
    "Fundamentos",
    "Diseño mobile-first con breakpoints.",
    "Ajusta padding y clases md: para que se vea bien en móvil y desktop.",
    "Mismo contenido, legible en móvil sin scroll horizontal.",
    [
      cp("responsive-mobile-padding", "Sin scroll horizontal en móvil (375px)", [
        { type: "action", text: "F12 → modo móvil 375px" },
        { type: "action", text: "Añade px-4 a las secciones about y projects" },
      ]),
      cp("responsive-mobile-readable", "El hero se lee bien en móvil", [
        { type: "tip", text: "Comprueba que Hello World no se sale de pantalla" },
      ]),
      cp("responsive-md-breakpoint", "Usas clases md: de Tailwind", [
        { type: "code", text: "Ejemplo en h1:", code: 'className="text-4xl md:text-5xl"' },
      ]),
      cp("responsive-desktop-layout", "Layout correcto en desktop (1280px)", [
        { type: "tip", text: "Amplía la ventana y comprueba que nada se rompe" },
      ]),
    ]
  ),
  level(
    6,
    "componentizar",
    "Componentizar",
    "Fundamentos",
    "Extrae Hero, Navbar y About como componentes.",
    "Separa Hero, Navbar y About en archivos dentro de src/components/.",
    "Misma página, código organizado en componentes.",
    [
      cp("file-hero-component", "Existe src/components/Hero.jsx", [
        { type: "action", text: "Crea la carpeta src/components si no existe" },
        { type: "action", text: "Mueve el bloque del hero a Hero.jsx y expórtalo" },
      ]),
      cp("app-imports-hero", "App.jsx importa Hero", [
        { type: "code", text: "En App.jsx:", code: 'import Hero from "./components/Hero";\n// ...\n<Hero />' },
      ]),
      cp("file-navbar-component", "Existe src/components/Navbar.jsx", [
        { type: "action", text: "Extrae el header/nav a Navbar.jsx" },
      ]),
      cp("app-imports-navbar", "App.jsx importa Navbar", [
        { type: "code", text: "import Navbar from \"./components/Navbar\";" },
      ]),
      cp("file-about-component", "Existe src/components/About.jsx", [
        { type: "action", text: "Mueve la sección #about a About.jsx" },
      ]),
      cp("app-imports-about", "App.jsx importa About", [
        { type: "code", text: "import About from \"./components/About\";" },
      ]),
      cp("page-still-renders-hero", "La página sigue mostrando Hello World", [
        { type: "tip", text: "Guarda y comprueba que no hay pantalla en blanco" },
      ]),
    ]
  ),
  level(
    7,
    "props-tarjeta",
    "Props: tarjeta de proyecto",
    "Fundamentos",
    "Componente ProjectCard reutilizable con props.",
    "Crea ProjectCard que reciba title y description por props.",
    "Una tarjeta de proyecto con título y descripción.",
    [
      cp("file-project-card", "Existe ProjectCard.jsx", [
        { type: "file", text: "Crea", path: "src/components/ProjectCard.jsx" },
        { type: "code", text: "Plantilla:", code: 'export default function ProjectCard({ title, description }) {\n  return (\n    <article data-testid="project-card" className="border rounded-lg p-4">\n      <h3>{title}</h3>\n      <p>{description}</p>\n    </article>\n  );\n}' },
      ]),
      cp("project-card-accepts-props", "ProjectCard usa props title y description", [
        { type: "tip", text: "No escribas el título a mano — usa {title}" },
      ]),
      cp("project-card-renders", "Se ve al menos una tarjeta en la página", [
        { type: "action", text: "En App o Projects, renderiza <ProjectCard title=\"...\" description=\"...\" />" },
      ]),
    ]
  ),
  level(
    8,
    "listas-map",
    "Listas con .map",
    "Fundamentos",
    "Grid de proyectos renderizado con .map().",
    "Crea un array de proyectos y renderízalos con .map() en un grid.",
    "Varias tarjetas de proyecto en grid.",
    [
      cp("projects-data-file", "Existe archivo de datos de proyectos", [
        { type: "file", text: "Crea", path: "src/data/projects.js" },
        { type: "code", text: "Ejemplo:", code: "export const projects = [\n  { id: 1, title: 'Proyecto 1', description: '...' },\n  { id: 2, title: 'Proyecto 2', description: '...' },\n];" },
      ]),
      cp("projects-grid-exists", 'Existe sección <section id="projects">', [
        { type: "action", text: "Añade la sección con un div grid" },
        { type: "code", text: "Grid:", code: 'className="grid gap-4 md:grid-cols-2"' },
      ]),
      cp("projects-map-used", "Los proyectos se renderizan con .map()", [
        { type: "code", text: "Ejemplo:", code: "{projects.map((p) => (\n  <ProjectCard key={p.id} title={p.title} description={p.description} />\n))}" },
      ]),
      cp("projects-min-count", "Hay al menos 2 proyectos en pantalla", [
        { type: "tip", text: "Añade más objetos al array si solo ves uno" },
      ]),
    ]
  ),
  level(
    9,
    "toggle-tema",
    "useState: toggle de tema",
    "Interactividad",
    "Toggle claro/oscuro con useState.",
    "Añade un botón que cambie entre tema claro y oscuro con useState.",
    "Botón de tema que cambia los colores de la página.",
    [
      cp("theme-usestate", "Usas useState para el tema", [
        { type: "action", text: "import { useState } from 'react'" },
        { type: "code", text: "Estado:", code: 'const [dark, setDark] = useState(true);' },
      ]),
      cp("theme-toggle-button", "Hay un botón para cambiar el tema", [
        { type: "code", text: "Botón con icono sol/luna:", code: '<button type="button" data-testid="theme-toggle" aria-label="Cambiar tema">…</button>' },
      ]),
      cp("theme-changes-on-click", "Al pulsar, cambia el aspecto de la página", [
        { type: "action", text: "En App.jsx: useEffect que ponga data-theme en document.documentElement" },
        { type: "action", text: "En index.css: variables --text-primary, --page-bg para dark y light" },
        { type: "tip", text: "Los componentes deben usar var(--text-primary), no text-white fijo" },
      ]),
    ]
  ),
  level(
    10,
    "formulario-contacto",
    "Formulario de contacto controlado",
    "Interactividad",
    "Formulario con inputs controlados.",
    "Crea formulario de contacto con nombre, email y mensaje controlados.",
    "Sección contacto con formulario.",
    [
      cp("contact-section-exists", 'Existe <section id="contact"> con formulario', [
        { type: "action", text: "Añade la sección debajo de proyectos" },
      ]),
      cp("contact-input-name", "Input de nombre", [
        { type: "code", text: "Input:", code: '<input name="name" id="contact-name" className="border rounded px-3 py-2 w-full" />' },
      ]),
      cp("contact-input-email", "Input de email", [
        { type: "code", text: "Input:", code: '<input type="email" name="email" className="border rounded px-3 py-2 w-full" />' },
      ]),
      cp("contact-textarea-message", "Textarea de mensaje", [
        { type: "code", text: "Textarea:", code: '<textarea name="message" rows={4} className="border rounded px-3 py-2 w-full" />' },
      ]),
      cp("contact-controlled-inputs", "Inputs controlados (value + onChange)", [
        { type: "tip", text: "Crea un componente ContactForm.jsx con useState por campo" },
      ]),
      cp("contact-submit-button", "Botón enviar", [
        { type: "code", text: "Botón:", code: '<button type="submit">Enviar</button>' },
      ]),
    ]
  ),
  level(
    11,
    "validacion-formulario",
    "Validación del formulario",
    "Interactividad",
    "Validación en cliente con mensajes de error.",
    "Valida campos vacíos y email antes de enviar.",
    "Mensajes de error en rojo bajo los campos.",
    [
      cp("validation-error-ui", "Muestra error si envías vacío", [
        { type: "action", text: "Al submit, si falta algo, muestra <p className=\"text-red-500\">" },
      ]),
      cp("validation-email-format", "Valida formato de email", [
        { type: "tip", text: "Comprueba que el email incluya @" },
      ]),
    ]
  ),
  level(
    12,
    "useeffect-fetch",
    "useEffect: cargar proyectos",
    "Interactividad",
    "Cargar proyectos desde JSON/fetch.",
    "Carga proyectos desde public/projects.json con useEffect.",
    "Proyectos cargados desde un JSON.",
    [
      cp("projects-json-exists", "Existe public/projects.json", [
        { type: "file", text: "Crea", path: "public/projects.json" },
        { type: "code", text: "Contenido:", code: '[{"id":1,"title":"App","description":"..."}]' },
      ]),
      cp("useeffect-fetch", "useEffect + fetch", [
        { type: "code", text: "Patrón:", code: "useEffect(() => {\n  fetch('/projects.json').then(r => r.json()).then(setProjects);\n}, []);" },
      ]),
    ]
  ),
  level(
    13,
    "loading-error",
    "Estados de carga y error",
    "Interactividad",
    "UI para loading y error states.",
    "Muestra Cargando… y mensaje si falla el fetch.",
    "Estados loading y error visibles.",
    [
      cp("loading-indicator", "Texto o spinner de carga", [
        { type: "code", text: "Ejemplo:", code: '{loading && <p data-testid="loading">Cargando…</p>}' },
      ]),
      cp("error-state-ui", "Mensaje si hay error", [
        { type: "code", text: "Ejemplo:", code: '{error && <p data-testid="error">Error al cargar</p>}' },
      ]),
    ]
  ),
  level(
    14,
    "scroll-animaciones",
    "Animaciones al scroll",
    "Interactividad",
    "IntersectionObserver para animaciones.",
    "Anima secciones al entrar en pantalla.",
    "Secciones que aparecen al hacer scroll.",
    [
      cp("scroll-reveal-class", "CSS o JS de animación al scroll", [
        { type: "action", text: "Añade clase .reveal en index.css o usa IntersectionObserver" },
      ]),
      cp("scroll-section-animated", "Al menos una sección animada", [
        { type: "tip", text: "Haz scroll y comprueba el efecto" },
      ]),
    ]
  ),
  level(
    15,
    "modal-proyecto",
    "Modal de detalle de proyecto",
    "Interactividad",
    "Modal al hacer clic en un proyecto.",
    "Al clic en tarjeta, abre modal con detalle.",
    "Modal con detalle del proyecto.",
    [
      cp("modal-component-exists", "Existe ProjectModal.jsx", [
        { type: "file", text: "Crea", path: "src/components/ProjectModal.jsx" },
      ]),
      cp("modal-opens-on-click", "Modal se abre al clic", [
        { type: "action", text: "useState open + onClick en ProjectCard" },
      ]),
      cp("modal-closes", "Se puede cerrar el modal", [
        { type: "action", text: "Botón Cerrar que pone open en false" },
      ]),
    ]
  ),
  level(
    16,
    "routing",
    "Routing",
    "Routing y calidad",
    "Rutas /, /proyectos, /proyecto/:id.",
    "Instala react-router-dom y crea rutas.",
    "Navegación entre páginas con URLs distintas.",
    [
      cp("router-package", "react-router-dom instalado", [
        { type: "action", text: "npm install react-router-dom" },
      ]),
      cp("router-browser", "BrowserRouter en main.jsx", [
        { type: "code", text: "main.jsx:", code: 'import { BrowserRouter } from "react-router-dom";\n// <BrowserRouter><App /></BrowserRouter>' },
      ]),
      cp("route-home", "Ruta / funciona", [
        { type: "tip", text: "Crea Routes con Route path=\"/\"" },
      ]),
      cp("route-projects-page", "Ruta /proyectos funciona", [
        { type: "code", text: "Route:", code: '<Route path="/proyectos" element={<ProjectsPage />} />' },
      ]),
    ]
  ),
  level(
    17,
    "custom-hooks",
    "Custom hooks (useFetch)",
    "Routing y calidad",
    "Hook useFetch + store local para proyectos extra.",
    "Extrae el fetch a useFetch.js, crea projectsStore.js y refactoriza Projects.jsx.",
    "Projects carga con loading/error y mezcla datos del JSON con localStorage.",
    [
      cp("file-usefetch", "Creas src/hooks/useFetch.js", [
        { type: "file", text: "Crea la carpeta hooks si no existe", path: "src/hooks/useFetch.js" },
        { type: "action", text: "Importa useEffect y useState de React" },
        { type: "code", text: "Firma:", code: "export default function useFetch(url) { … }" },
      ]),
      cp("usefetch-hook-states", "useFetch devuelve data, loading y error", [
        { type: "action", text: "Estado inicial: data null, loading true si hay url, error null" },
        { type: "code", text: "Return:", code: "return { data, loading, error };" },
        { type: "tip", text: "En el catch guarda e.message en error" },
      ]),
      cp("file-projects-store", "Creas src/lib/projectsStore.js", [
        { type: "file", text: "Crea", path: "src/lib/projectsStore.js" },
        { type: "action", text: "Exporta getExtraProjects() leyendo localStorage" },
        { type: "code", text: "Clave demo:", code: 'const STORAGE_KEY = "portfolio-projects-extra";' },
      ]),
      cp("usefetch-used", "Projects.jsx importa y usa useFetch", [
        { type: "file", text: "Edita", path: "src/components/Projects.jsx" },
        { type: "code", text: "Uso:", code: 'const { data: base, loading, error } = useFetch("/projects.json");' },
        { type: "action", text: "Elimina el useEffect con fetch manual si lo tenías" },
      ]),
      cp("projects-loading-ui", "Muestras estados loading y error", [
        { type: "action", text: "Si loading, muestra un párrafo con data-testid=\"loading\"" },
        { type: "action", text: "Si error, muestra data-testid=\"error\" en rojo" },
        { type: "tip", text: "Solo renderiza el grid cuando !loading && !error" },
      ]),
      cp("projects-merge-extras", "Mezclas JSON + proyectos extra de localStorage", [
        { type: "action", text: "Importa getExtraProjects desde projectsStore.js" },
        { type: "code", text: "Merge:", code: "const extras = getExtraProjects();\nconst projects = base ? [...base, ...extras] : extras;" },
        { type: "tip", text: "Los proyectos del admin (nivel 22) aparecerán aquí" },
      ]),
    ]
  ),
  level(
    18,
    "context-tema",
    "Context (tema global)",
    "Routing y calidad",
    "ThemeContext elimina props de tema en Navbar.",
    "Crea ThemeContext, envuelve la app y usa useTheme() en Navbar.",
    "El toggle sol/luna funciona sin pasar props desde App.",
    [
      cp("file-theme-context", "Creas src/context/ThemeContext.jsx", [
        { type: "file", text: "Crea", path: "src/context/ThemeContext.jsx" },
        { type: "action", text: "createContext(null) para el contexto del tema" },
      ]),
      cp("theme-create-provider", "ThemeProvider guarda dark y toggle", [
        { type: "action", text: "useState(true) para dark; toggle invierte el valor" },
        { type: "code", text: "useEffect:", code: 'document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");' },
        { type: "action", text: "Provider value={{ dark, toggle }}" },
      ]),
      cp("theme-hook-export", "Exportas hook useTheme()", [
        { type: "code", text: "Hook:", code: "export function useTheme() {\n  const ctx = useContext(ThemeContext);\n  if (!ctx) throw new Error(...);\n  return ctx;\n}" },
        { type: "tip", text: "Así cualquier componente accede al tema sin props" },
      ]),
      cp("theme-provider-wraps", "ThemeProvider envuelve App en main.jsx", [
        { type: "file", text: "Edita", path: "src/main.jsx" },
        { type: "code", text: "Árbol:", code: "<BrowserRouter>\n  <ThemeProvider>\n    <App />\n  </ThemeProvider>\n</BrowserRouter>" },
      ]),
      cp("navbar-use-theme", "Navbar usa useTheme() en lugar de props", [
        { type: "file", text: "Edita", path: "src/components/Navbar.jsx" },
        { type: "action", text: "const { dark, toggle } = useTheme();" },
        { type: "action", text: "Quita props dark y onToggleTheme del componente" },
      ]),
      cp("app-no-theme-props", "App ya no pasa props de tema a Navbar", [
        { type: "file", text: "Edita", path: "src/App.jsx" },
        { type: "action", text: "Elimina useState del tema y props en <Navbar />" },
        { type: "tip", text: "Debe quedar simplemente <Navbar />" },
      ]),
    ]
  ),
  level(
    19,
    "accesibilidad-seo",
    "Accesibilidad + SEO básico",
    "Routing y calidad",
    "Semántica <main>, alt en imágenes y meta description.",
    "Envuelve cada página en <main>, mejora index.html y revisa alt.",
    "HTML accesible, lang=es y meta description en el head.",
    [
      cp("page-home-main", "HomePage usa <main>", [
        { type: "file", text: "Edita", path: "src/pages/HomePage.jsx" },
        { type: "code", text: "Estructura:", code: "<main>\n  <Hero />\n  <About />\n</main>" },
      ]),
      cp("page-projects-main", "ProjectsPage usa <main>", [
        { type: "file", text: "Edita", path: "src/pages/ProjectsPage.jsx" },
        { type: "action", text: "PageHero + Projects dentro de <main>" },
      ]),
      cp("page-contact-main", "ContactPage usa <main>", [
        { type: "file", text: "Edita", path: "src/pages/ContactPage.jsx" },
        { type: "action", text: "PageHero + formulario dentro de <main>" },
      ]),
      cp("meta-description", "Meta description en index.html", [
        { type: "file", text: "Edita", path: "index.html" },
        { type: "code", text: "Meta:", code: '<meta name="description" content="Portfolio de desarrollo web — proyectos React y contacto." />' },
      ]),
      cp("index-lang-es", "Atributo lang=\"es\" en <html>", [
        { type: "file", text: "Edita", path: "index.html" },
        { type: "code", text: "Ejemplo:", code: '<html lang="es" data-theme="dark">' },
        { type: "tip", text: "Ayuda a lectores de pantalla y buscadores" },
      ]),
      cp("images-have-alt", "Todas las imágenes tienen alt descriptivo", [
        { type: "action", text: "Revisa ProjectCard, ProjectModal y Admin (si existe)" },
        { type: "code", text: "Ejemplo:", code: '<img src={image} alt={imageAlt ?? title} />' },
        { type: "tip", text: "Nunca dejes alt vacío en imágenes de contenido" },
      ]),
    ]
  ),
  level(
    20,
    "login-app",
    "Login con backend real",
    "Backend real",
    "Servidor Node local + proxy Vite + formulario que autentica contra la API.",
    "Crea server/auth-api.mjs, configura el proxy y una página /login que haga POST a /api/login.",
    "Login funcional con demo@curso.dev / curso123 y redirección a /admin.",
    [
      cp("login-page-exists", "Ruta /login con formulario email y password", [
        { type: "file", text: "Crea", path: "src/pages/LoginPage.jsx" },
        { type: "action", text: 'Añade <Route path="/login" element={<LoginPage />} /> en App.jsx' },
        {
          type: "code",
          text: "Campos mínimos:",
          code: '<input type="email" id="login-email" />\n<input type="password" id="login-password" />',
        },
      ]),
      cp("file-auth-api", "Servidor local server/auth-api.mjs", [
        { type: "file", text: "Crea", path: "server/auth-api.mjs" },
        { type: "action", text: "Implementa POST /api/login que valide email y password" },
        { type: "tip", text: "Credenciales demo: demo@curso.dev / curso123" },
        { type: "code", text: "Puerto por defecto:", code: "8787 (variable AUTH_API_PORT)" },
      ]),
      cp("vite-proxy-auth", "Proxy /api en vite.config.js", [
        { type: "file", text: "Edita", path: "vite.config.js" },
        {
          type: "code",
          text: "Dentro de server:",
          code: 'proxy: {\n  "/api": { target: "http://localhost:8787", changeOrigin: true },\n}',
        },
        { type: "tip", text: 'Así fetch("/api/login") desde el navegador llega al servidor Node' },
      ]),
      cp("login-fetch-post", "LoginPage hace fetch POST a /api/login", [
        { type: "action", text: "En handleSubmit, envía email y password con fetch POST" },
        {
          type: "code",
          text: "Ejemplo:",
          code: 'const res = await fetch("/api/login", {\n  method: "POST",\n  headers: { "Content-Type": "application/json" },\n  body: JSON.stringify({ email, password }),\n});',
        },
        { type: "action", text: "Si res.ok, guarda data.token en localStorage y navega a /admin" },
      ]),
      cp("login-api-works", "Login demo funciona con credenciales correctas", [
        { type: "action", text: "Ejecuta npm run dev (arranca Vite y auth-api juntos)" },
        { type: "action", text: "En /login usa demo@curso.dev y curso123" },
        { type: "tip", text: "Debes acabar en /admin sin alert de demo" },
      ]),
    ]
  ),
  level(
    21,
    "supabase-proyectos",
    "Conectar Supabase",
    "Backend real",
    "Preparar cliente Supabase con variables de entorno.",
    "Crea .env.example y lib/supabase.js sin pegar keys en el código.",
    "Variables documentadas y stub listo para conectar Supabase.",
    [
      cp("env-example-exists", "Creas .env.example en la raíz", [
        { type: "file", text: "Crea", path: ".env.example" },
        { type: "tip", text: "Copia a .env.local en tu máquina (no lo subas a git)" },
      ]),
      cp("env-supabase-url", "VITE_SUPABASE_URL en .env.example", [
        { type: "code", text: "Variable:", code: "VITE_SUPABASE_URL=https://tu-proyecto.supabase.co" },
        { type: "action", text: "Sustituye tu-proyecto por el ID real cuando tengas Supabase" },
      ]),
      cp("env-supabase-key", "VITE_SUPABASE_ANON_KEY en .env.example", [
        { type: "code", text: "Variable:", code: "VITE_SUPABASE_ANON_KEY=tu-anon-key" },
        { type: "tip", text: "La anon key es pública en el front; la service key nunca va aquí" },
      ]),
      cp("file-supabase-lib", "Creas src/lib/supabase.js", [
        { type: "file", text: "Crea", path: "src/lib/supabase.js" },
        { type: "action", text: "Lee url y anonKey desde import.meta.env" },
        { type: "action", text: "Exporta isSupabaseConfigured() y fetchProjectsFromSupabase()" },
      ]),
      cp("supabase-uses-import-meta", "supabase.js usa import.meta.env (no keys fijas)", [
        { type: "code", text: "Ejemplo:", code: "const url = import.meta.env.VITE_SUPABASE_URL;" },
        { type: "tip", text: "Vite solo expone variables con prefijo VITE_" },
      ]),
      cp("no-hardcoded-secrets", "Ninguna key JWT pegada en el código", [
        { type: "action", text: "Busca eyJ en src/ — no debe aparecer en strings" },
        { type: "tip", text: "Si conectas Supabase de verdad: npm install @supabase/supabase-js" },
      ]),
    ]
  ),
  level(
    22,
    "crud-proyectos",
    "CRUD de proyectos",
    "Backend real",
    "Panel /admin para añadir proyectos a localStorage.",
    "Crea AdminPage, ruta /admin y formulario que llama addProject().",
    "Puedes añadir un proyecto y verlo en /proyectos.",
    [
      cp("file-admin-page", "Creas src/pages/AdminPage.jsx", [
        { type: "file", text: "Crea", path: "src/pages/AdminPage.jsx" },
        { type: "action", text: "PageHero + formulario con título y descripción" },
      ]),
      cp("admin-route-app", "Ruta /admin en App.jsx", [
        { type: "file", text: "Edita", path: "src/App.jsx" },
        { type: "code", text: "Route:", code: '<Route path="/admin" element={<AdminPage />} />' },
        { type: "action", text: "Importa AdminPage al inicio del archivo" },
      ]),
      cp("admin-form-title", "Formulario admin con campos título y descripción", [
        { type: "action", text: "input id=\"admin-name\" controlado con useState" },
        { type: "action", text: "textarea id=\"admin-desc\" para la descripción" },
      ]),
      cp("admin-uses-add-project", "Submit llama addProject de projectsStore", [
        { type: "code", text: "Import:", code: 'import { addProject } from "../lib/projectsStore.js";' },
        { type: "action", text: "En handleSubmit: addProject({ title, description, … })" },
        { type: "tip", text: "Tras guardar, el proyecto debe aparecer en /proyectos" },
      ]),
      cp("admin-submit-button", "Botón Guardar proyecto en el formulario", [
        { type: "action", text: "button type=\"submit\" con texto claro" },
        { type: "tip", text: "Prueba en /admin: rellena y envía" },
      ]),
      cp("admin-page-renders", "La ruta /admin carga el panel", [
        { type: "action", text: "Ve a http://localhost:5173/admin" },
        { type: "tip", text: "Debes ver el formulario sin errores en consola" },
      ]),
    ]
  ),
  level(
    23,
    "subida-imagenes",
    "Subida de imágenes",
    "Backend real",
    "Input file + vista previa en el panel admin.",
    "Añade type=file, accept image/* y preview con URL.createObjectURL.",
    "Al elegir imagen ves la miniatura antes de guardar.",
    [
      cp("admin-file-input", "Input type=file en AdminPage", [
        { type: "file", text: "Edita", path: "src/pages/AdminPage.jsx" },
        { type: "code", text: "Input:", code: '<input id="admin-image" type="file" name="image" accept="image/*" />' },
      ]),
      cp("admin-file-accept", "accept=\"image/*\" en el input file", [
        { type: "action", text: "Solo permite imágenes en el selector del SO" },
        { type: "tip", text: "Evita PDFs o vídeos por error" },
      ]),
      cp("admin-file-handler", "handleFileChange guarda el archivo en estado", [
        { type: "code", text: "Handler:", code: "const file = event.target.files?.[0];\nsetImageFile(file ?? null);" },
        { type: "action", text: "onChange={handleFileChange} en el input file" },
      ]),
      cp("admin-image-preview", "Vista previa con URL.createObjectURL", [
        { type: "code", text: "Preview:", code: "setPreview(file ? URL.createObjectURL(file) : \"\");" },
        { type: "action", text: "Si preview existe, muestra <img src={preview} … />" },
      ]),
      cp("admin-preview-alt", "La imagen preview tiene alt descriptivo", [
        { type: "code", text: "Alt:", code: 'alt="Vista previa del proyecto"' },
        { type: "tip", text: "Accesibilidad también en previews temporales" },
      ]),
    ]
  ),
  level(
    24,
    "contacto-real",
    "Contacto que guarda/envía",
    "Backend real",
    "contactStore.js persiste mensajes en localStorage.",
    "Conecta ContactForm a saveContactMessage al enviar.",
    "El contacto guarda mensajes (demo local) y muestra confirmación.",
    [
      cp("file-contact-store", "Creas src/lib/contactStore.js", [
        { type: "file", text: "Crea", path: "src/lib/contactStore.js" },
        { type: "action", text: "Exporta saveContactMessage({ name, email, message })" },
      ]),
      cp("contact-store-localstorage", "Los mensajes se guardan en localStorage", [
        { type: "code", text: "Patrón:", code: "const list = JSON.parse(localStorage.getItem(KEY) ?? \"[]\");\nlist.push({ ...msg, at: Date.now() });\nlocalStorage.setItem(KEY, JSON.stringify(list));" },
      ]),
      cp("contact-form-save-import", "ContactForm importa saveContactMessage", [
        { type: "file", text: "Edita", path: "src/components/ContactForm.jsx" },
        { type: "code", text: "Import:", code: 'import { saveContactMessage } from "../lib/contactStore.js";' },
      ]),
      cp("contact-form-on-submit", "handleSubmit llama saveContactMessage si valida", [
        { type: "action", text: "Tras validate() OK: saveContactMessage({ name, email, message })" },
        { type: "action", text: "Limpia los campos y muestra mensaje de éxito" },
      ]),
      cp("contact-sent-feedback", "Mensaje de confirmación tras enviar", [
        { type: "code", text: "Estado:", code: 'const [sent, setSent] = useState(false);' },
        { type: "action", text: "Muestra texto verde con role=\"status\" cuando sent es true" },
      ]),
      cp("contact-controlled-inputs", "Inputs controlados con value y onChange", [
        { type: "tip", text: "name, email y message con useState + value={…} onChange={…}" },
      ]),
    ]
  ),
  level(
    25,
    "env-seguridad",
    "Variables de entorno",
    "Backend real",
    "Documentar todas las VITE_ del proyecto.",
    "Amplía .env.example con SITE_URL y ANALYTICS; revisa que no haya secrets en código.",
    "Todas las variables listadas; secrets solo en .env.local.",
    [
      cp("env-site-url", "VITE_SITE_URL en .env.example", [
        { type: "file", text: "Edita", path: ".env.example" },
        { type: "code", text: "Variable:", code: "VITE_SITE_URL=http://localhost:5173" },
      ]),
      cp("env-analytics-var", "VITE_ANALYTICS_ID documentada (opcional)", [
        { type: "code", text: "Variable:", code: "VITE_ANALYTICS_ID=" },
        { type: "tip", text: "Déjala vacía en el ejemplo; rellénala en producción" },
      ]),
      cp("env-example-complete", ".env.example lista todas las VITE_ usadas", [
        { type: "action", text: "Debe incluir: SUPABASE_URL, SUPABASE_ANON_KEY, SITE_URL, ANALYTICS_ID" },
        { type: "tip", text: "Añade comentarios explicando cada variable" },
      ]),
      cp("env-example-exists", "El archivo .env.example existe", [
        { type: "action", text: "Verifica que .env.local está en .gitignore (Vite lo ignora por defecto)" },
      ]),
      cp("no-hardcoded-secrets", "Revisión: sin keys en src/ ni en App.jsx", [
        { type: "action", text: "grep o busca eyJ, sb_secret, service_role en el código" },
        { type: "tip", text: "Solo import.meta.env.VITE_* en archivos del front" },
      ]),
    ]
  ),
  level(
    26,
    "tests-vitest",
    "Tests con Vitest",
    "Backend real",
    "Vitest + Testing Library para ProjectCard.",
    "Instala Vitest, crea vitest.config.js y un test que renderice ProjectCard.",
    "npm test pasa en local.",
    [
      cp("vitest-config-exists", "Creas vitest.config.js", [
        { type: "file", text: "Crea", path: "vitest.config.js" },
        { type: "code", text: "Mínimo:", code: 'test: { environment: "jsdom", globals: true }' },
      ]),
      cp("package-test-script", "Script test en package.json", [
        { type: "file", text: "Edita", path: "package.json" },
        { type: "action", text: "npm install -D vitest @testing-library/react jsdom" },
        { type: "code", text: "Script:", code: '"test": "vitest run"' },
      ]),
      cp("test-file-exists", "Creas ProjectCard.test.jsx", [
        { type: "file", text: "Crea", path: "src/components/ProjectCard.test.jsx" },
      ]),
      cp("test-imports-vitest", "El test importa describe, it, expect", [
        { type: "code", text: "Imports:", code: 'import { describe, it, expect } from "vitest";' },
        { type: "code", text: "RTL:", code: 'import { render, screen } from "@testing-library/react";' },
      ]),
      cp("test-render-projectcard", "El test renderiza ProjectCard y comprueba texto", [
        { type: "code", text: "Assert:", code: 'expect(screen.getByText("Demo")).toBeTruthy();' },
        { type: "action", text: "Ejecuta npm test — debe pasar en verde" },
      ]),
    ]
  ),
  level(
    27,
    "optimizacion",
    "Optimización",
    "Pro y despliegue",
    "React.lazy + Suspense para Login y Admin.",
    "Carga bajo demanda las rutas pesadas con fallback de loading.",
    "Login y Admin se descargan solo al visitar esas rutas.",
    [
      cp("lazy-import-login", "LoginPage con React.lazy", [
        { type: "file", text: "Edita", path: "src/App.jsx" },
        { type: "code", text: "Lazy:", code: 'const LoginPage = lazy(() => import("./pages/LoginPage.jsx"));' },
        { type: "action", text: "Importa lazy desde react" },
      ]),
      cp("lazy-import-admin", "AdminPage con React.lazy", [
        { type: "code", text: "Lazy:", code: 'const AdminPage = lazy(() => import("./pages/AdminPage.jsx"));' },
        { type: "tip", text: "Quita los imports estáticos de LoginPage y AdminPage" },
      ]),
      cp("lazy-suspense", "Routes envueltos en <Suspense>", [
        { type: "code", text: "Estructura:", code: "<Suspense fallback={…}>\n  <Routes>…</Routes>\n</Suspense>" },
      ]),
      cp("lazy-fallback-ui", "Fallback visible mientras carga la ruta", [
        { type: "code", text: "Fallback:", code: 'fallback={<p className="…">Cargando…</p>}' },
        { type: "tip", text: "Al ir a /login verás un instante el fallback" },
      ]),
      cp("lazy-routes-load", "Las rutas lazy cargan sin error", [
        { type: "action", text: "Navega a /login y /admin en el navegador" },
        { type: "tip", text: "No debe haber error de chunk failed en consola" },
      ]),
    ]
  ),
  level(
    28,
    "dominio-analytics",
    "Dominio + analytics",
    "Pro y despliegue",
    "README con URL pública y hook de analytics comentado.",
    "Documenta scripts, URL de deploy y placeholder de analytics en index.html.",
    "README completo y analytics preparado para producción.",
    [
      cp("readme-exists", "Creas o completas README.md", [
        { type: "file", text: "Crea", path: "README.md" },
        { type: "action", text: "Título, descripción breve y sección Scripts" },
      ]),
      cp("readme-npm-scripts", "README documenta npm run dev, test y build", [
        { type: "code", text: "Bloque:", code: "npm install\nnpm run dev\nnpm test\nnpm run build" },
      ]),
      cp("readme-deploy-url", "README incluye URL pública del deploy", [
        { type: "action", text: "Pega https://tu-portfolio.vercel.app (o la URL real)" },
        { type: "tip", text: "Actualízala tras desplegar en el nivel 30" },
      ]),
      cp("index-analytics-comment", "Comentario de analytics en index.html", [
        { type: "file", text: "Edita", path: "index.html" },
        { type: "code", text: "Ejemplo:", code: "<!-- Analytics: Plausible, GA, etc. -->" },
        { type: "tip", text: "Deja el script comentado hasta tener dominio real" },
      ]),
      cp("readme-env-docs", "README explica copiar .env.example", [
        { type: "action", text: "Sección Variables de entorno con .env.local" },
      ]),
    ]
  ),
  level(
    29,
    "ci-github",
    "CI con GitHub Actions",
    "Pro y despliegue",
    "Workflow que ejecuta npm ci, test y build.",
    "Crea .github/workflows/ci.yml con Node 20.",
    "CI verde en cada push a main.",
    [
      cp("ci-workflow-exists", "Creas .github/workflows/ci.yml", [
        { type: "file", text: "Crea carpetas .github/workflows si no existen", path: ".github/workflows/ci.yml" },
      ]),
      cp("ci-triggers-push", "Workflow se dispara en push y pull_request", [
        { type: "code", text: "on:", code: "push:\n  branches: [main]\npull_request:\n  branches: [main]" },
      ]),
      cp("ci-node-20", "Usa Node.js 20 en el workflow", [
        { type: "code", text: "Setup:", code: 'node-version: "20"' },
      ]),
      cp("ci-runs-test", "El workflow ejecuta npm test", [
        { type: "action", text: "Paso: run: npm ci y luego run: npm test" },
      ]),
      cp("ci-runs-build", "El workflow ejecuta npm run build", [
        { type: "action", text: "Último paso: run: npm run build" },
        { type: "tip", text: "Si build falla, CI debe fallar también" },
      ]),
    ]
  ),
  level(
    30,
    "deploy",
    "Deploy a la nube",
    "Pro y despliegue",
    "Despliega en Vercel/Netlify y verifica build local.",
    "npm run build OK, README con URL real y variables en el panel del hosting.",
    "Sitio público accesible con la URL en README.",
    [
      cp("package-build-script", "Script build en package.json", [
        { type: "file", text: "Verifica", path: "package.json" },
        { type: "code", text: "Script:", code: '"build": "vite build"' },
      ]),
      cp("build-passes-local", "npm run build pasa sin errores", [
        { type: "action", text: "En terminal: npm run build" },
        { type: "tip", text: "Corrige errores de TypeScript/imports antes de desplegar" },
      ]),
      cp("readme-deploy-url", "README.md tiene la URL pública final", [
        { type: "action", text: "Despliega en Vercel o Netlify conectando el repo" },
        { type: "action", text: "Copia la URL generada al README" },
      ]),
      cp("deploy-env-vars", "Variables VITE_ configuradas en el hosting", [
        { type: "action", text: "En Vercel: Settings → Environment Variables" },
        { type: "tip", text: "Mismas claves que .env.example (sin commitear valores reales)" },
      ]),
      cp("deploy-preview-check", "La URL pública carga la home sin error 404", [
        { type: "action", text: "Abre la URL en el navegador y comprueba /proyectos y /contacto" },
        { type: "tip", text: "SPA: configura rewrite /* → index.html si hace falta" },
      ]),
    ]
  ),
];
