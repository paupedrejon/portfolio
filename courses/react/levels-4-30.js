/** @typedef {{ type: 'file' | 'code' | 'tip' | 'action'; text: string; path?: string; code?: string }} HintStep */
/** @typedef {{ id: string; label: string; assert: string; hint?: string; hintSteps?: HintStep[] }} Checkpoint */

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
    "Hook useFetch reutilizable.",
    "Extrae la lógica fetch a hooks/useFetch.js.",
    "Hook reutilizable para peticiones.",
    [
      cp("file-usefetch", "Existe hooks/useFetch.js", [
        { type: "file", text: "Crea", path: "src/hooks/useFetch.js" },
      ]),
      cp("usefetch-used", "useFetch usado en un componente", [
        { type: "tip", text: "const { data, loading, error } = useFetch(url)" },
      ]),
    ]
  ),
  level(
    18,
    "context-tema",
    "Context (tema global)",
    "Routing y calidad",
    "ThemeContext para tema global.",
    "Mueve el tema a React Context.",
    "Tema disponible en toda la app.",
    [
      cp("file-theme-context", "Existe ThemeContext.jsx", [
        { type: "file", text: "Crea", path: "src/context/ThemeContext.jsx" },
      ]),
      cp("theme-provider-wraps", "ThemeProvider envuelve la app", [
        { type: "code", text: "Provider con value={{ dark, toggle }}", code: "<ThemeProvider><App /></ThemeProvider>" },
      ]),
    ]
  ),
  level(
    19,
    "accesibilidad-seo",
    "Accesibilidad + SEO básico",
    "Routing y calidad",
    "Semántica HTML, alt, meta tags.",
    "Mejora semántica, alt en imágenes y meta description.",
    "HTML accesible y meta tags.",
    [
      cp("semantic-main", "Usas <main>", [
        { type: "tip", text: "El contenido principal dentro de <main>" },
      ]),
      cp("images-have-alt", "Todas las imágenes tienen alt", [
        { type: "action", text: 'Añade alt="descripción" a cada <img>' },
      ]),
      cp("meta-description", "Meta description en index.html", [
        { type: "file", text: "Edita", path: "index.html" },
        { type: "code", text: "Meta:", code: '<meta name="description" content="Portfolio de ..." />' },
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
    "Proyectos desde Supabase en la app del alumno.",
    "Conecta Supabase y lista proyectos (opcional con .env).",
    "Datos desde Supabase.",
    [
      cp("env-example-exists", "Existe .env.example", [
        { type: "file", text: "Crea .env.example con VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY" },
      ]),
      cp("no-hardcoded-secrets", "Sin keys pegadas en el código", [
        { type: "tip", text: "Usa import.meta.env.VITE_..." },
      ]),
    ]
  ),
  level(
    22,
    "crud-proyectos",
    "CRUD de proyectos",
    "Backend real",
    "Panel privado para añadir/editar proyectos.",
    "Formulario para crear proyecto (demo local o Supabase).",
    "Puedes añadir un proyecto nuevo.",
    [
      cp("contact-section-exists", "Hay formulario para nuevo proyecto", [
        { type: "tip", text: "Panel admin o formulario en /admin" },
      ]),
    ]
  ),
  level(
    23,
    "subida-imagenes",
    "Subida de imágenes",
    "Backend real",
    "Upload de imágenes para proyectos.",
    "Input type=file para subir imagen de proyecto.",
    "Campo para subir imagen.",
    [
      cp("file-input-image", "Input type=file para imagen", [
        { type: "code", text: "Input:", code: '<input type="file" name="image" accept="image/*" />' },
      ]),
    ]
  ),
  level(
    24,
    "contacto-real",
    "Contacto que guarda/envía",
    "Backend real",
    "Formulario de contacto persistente.",
    "El formulario de contacto envía o guarda el mensaje.",
    "Contacto funcional.",
    [
      cp("contact-controlled-inputs", "Formulario de contacto completo", [
        { type: "tip", text: "Conecta submit a API o Supabase" },
      ]),
    ]
  ),
  level(
    25,
    "env-seguridad",
    "Variables de entorno",
    "Backend real",
    "Env vars y seguridad básica.",
    "Documenta variables en .env.example.",
    "Secrets en .env, no en código.",
    [
      cp("env-example-exists", "Archivo .env.example", [
        { type: "file", text: "Lista todas las VITE_ necesarias" },
      ]),
      cp("no-hardcoded-secrets", "Sin secrets en el código fuente", [
        { type: "tip", text: "Revisa App.jsx y lib/" },
      ]),
    ]
  ),
  level(
    26,
    "tests-vitest",
    "Tests con Vitest",
    "Backend real",
    "Tests de un componente con RTL.",
    "Añade Vitest y un test de ProjectCard.",
    "npm test pasa.",
    [
      cp("test-file-exists", "Archivo .test.jsx", [
        { type: "action", text: "npm install -D vitest @testing-library/react" },
        { type: "file", text: "Crea test", path: "src/components/ProjectCard.test.jsx" },
      ]),
    ]
  ),
  level(
    27,
    "optimizacion",
    "Optimización",
    "Pro y despliegue",
    "Lazy loading, imágenes, Lighthouse.",
    "React.lazy para una ruta o componente pesado.",
    "Carga bajo demanda.",
    [
      cp("lazy-suspense", "React.lazy + Suspense", [
        { type: "code", text: "Ejemplo:", code: 'const Admin = lazy(() => import("./pages/Admin"));' },
      ]),
    ]
  ),
  level(
    28,
    "dominio-analytics",
    "Dominio + analytics",
    "Pro y despliegue",
    "Analytics básico integrado.",
    "Añade script de analytics o componente.",
    "Analytics documentado.",
    [
      cp("readme-deploy-url", "README con URL del sitio", [
        { type: "tip", text: "Documenta también analytics si lo usas" },
      ]),
    ]
  ),
  level(
    29,
    "ci-github",
    "CI con GitHub Actions",
    "Pro y despliegue",
    "Workflow build + tests.",
    "Crea .github/workflows/ci.yml con npm ci && npm test && npm run build.",
    "CI en GitHub.",
    [
      cp("ci-workflow-exists", "Workflow ci.yml", [
        { type: "file", text: "Crea", path: ".github/workflows/ci.yml" },
      ]),
    ]
  ),
  level(
    30,
    "deploy",
    "Deploy a la nube",
    "Pro y despliegue",
    "Deploy en Vercel u otra plataforma.",
    "Despliega y documenta la URL en README.",
    "Sitio público en la nube.",
    [
      cp("readme-deploy-url", "URL de deploy en README.md", [
        { type: "action", text: "Despliega en Vercel/Netlify" },
        { type: "action", text: "Pega la URL en README.md" },
      ]),
      cp("ci-workflow-exists", "npm run build pasa en local", [
        { type: "action", text: "Ejecuta npm run build en la terminal del proyecto" },
        { type: "tip", text: "Si falla, corrige errores antes de desplegar" },
      ]),
    ]
  ),
];
