/** @typedef {{ id: string; label: string; assert: string; hint?: string }} Checkpoint */
/** @typedef {{ id: number; slug: string; title: string; block: string; description: string; instructions: string; checkpoints: Checkpoint[] }} Level */

/** @type {Level[]} */
export const levels = [
  {
    id: 1,
    slug: "hello-world",
    title: "Hello World",
    block: "Fundamentos",
    description: "Crea tu primera página y un hero con un título centrado.",
    instructions: `# Nivel 1 — Hello World

Bienvenido al curso. Vas a construir tu portfolio personal paso a paso.

## Objetivo
Crea una página con un **hero** que contenga un título \`<h1>\` centrado con el texto **Hello World**.

## Pasos
1. Abre \`src/App.jsx\` y renderiza un \`<h1>Hello World</h1>\` dentro de un contenedor.
2. Usa Tailwind para centrar el texto: \`text-center\` en el contenedor o en el h1.
3. Mantén el fondo oscuro (\`bg-[#0a0a0f]\` o similar) en toda la página.

## Comprobar
Ejecuta \`npm run check\` cuando hayas terminado. El corrector arrancará tu app automáticamente.
`,
    checkpoints: [
      {
        id: "page-renders",
        label: "La página carga sin errores",
        assert: "app loads at base URL with HTTP 200 and no console errors",
        hint: "1) Abre la carpeta del zip descargado.\n2) En la terminal: npm install\n3) Luego: npm run dev\n4) Abre la URL que te indique (suele ser localhost:5173).\n5) Si ves la página sin errores rojos en consola, este punto se marcará.",
      },
      {
        id: "h1-exists",
        label: "Existe un <h1>",
        assert: "page has exactly one visible <h1>",
        hint: "1) Abre src/App.jsx.\n2) Dentro del return, añade un único <h1>...</h1>.\n3) Guarda y mira el navegador: debe verse un solo título grande.",
      },
      {
        id: "h1-text",
        label: 'El título dice "Hello World"',
        assert: "the <h1> textContent includes 'Hello World' (case-insensitive)",
        hint: '1) En el <h1>, escribe exactamente: Hello World\n2) Puede ser mayúsculas o minúsculas, pero el texto debe incluir esas palabras.',
      },
      {
        id: "h1-centered",
        label: "El título está centrado",
        assert: "computed text-align of the <h1> (or its container) is 'center'",
        hint: "1) Al contenedor del h1 o al propio h1, añade la clase Tailwind text-center.\n2) Ejemplo: <div className=\"text-center\"><h1>Hello World</h1></div>",
      },
    ],
  },
  {
    id: 2,
    slug: "hero-completo",
    title: "Hero completo",
    block: "Fundamentos",
    description: "Añade subtítulo y un botón CTA con buen estilo.",
    instructions: `# Nivel 2 — Hero completo

Amplía el hero del nivel anterior.

## Objetivo
- Mantén el \`<h1>Hello World</h1>\` centrado.
- Añade un **subtítulo** (\`<p>\`) debajo del título con una frase sobre ti (ej. "Desarrollador web en formación").
- Añade un **botón CTA** con texto como "Ver proyectos" o "Contáctame".

## Estilo del botón
- Padding generoso (\`px-6 py-3\`)
- Bordes redondeados (\`rounded-full\` o \`rounded-lg\`)
- Color de acento (indigo/violeta)
- Hover sutil

## Comprobar
\`npm run check\`
`,
    checkpoints: [
      {
        id: "h1-still-present",
        label: "El h1 Hello World sigue presente",
        assert: "page has visible <h1> with Hello World",
        hint: "1) No borres el h1 del nivel anterior.\n2) Debe seguir visible con el texto Hello World.",
      },
      {
        id: "subtitle-exists",
        label: "Existe un subtítulo <p> en el hero",
        assert: "hero section has a visible <p> with at least 10 characters",
        hint: "1) Debajo del h1, añade un <p> con una frase sobre ti.\n2) Mínimo 10 caracteres, por ejemplo: \"Desarrollador web en formación\".",
      },
      {
        id: "cta-button-exists",
        label: "Existe un botón CTA",
        assert: "page has a visible <button> or <a> styled as CTA in hero",
        hint: "1) Añade un <button> o <a> en el hero.\n2) Texto ejemplo: \"Ver proyectos\" o \"Contáctame\".",
      },
      {
        id: "cta-button-styled",
        label: "El botón CTA tiene padding y border-radius",
        assert: "CTA has padding >= 8px and border-radius >= 4px",
        hint: "1) Al botón añade clases Tailwind: px-6 py-3 rounded-full (o rounded-lg).\n2) Opcional: color de fondo con bg-[#2a8ca0] text-white.",
      },
    ],
  },
  {
    id: 3,
    slug: "sobre-mi",
    title: 'Sección "Sobre mí"',
    block: "Fundamentos",
    description: 'Añade una sección "Sobre mí" debajo del hero.',
    instructions: `# Nivel 3 — Sobre mí

## Objetivo
Debajo del hero, crea una sección **Sobre mí** con:
- Un encabezado (\`<h2>\`) con texto "Sobre mí"
- Al menos un párrafo con tu bio (3+ frases)
- La sección debe ser legible en móvil (375px)

## Estructura sugerida
\`\`\`jsx
<section id="about">
  <h2>Sobre mí</h2>
  <p>...</p>
</section>
\`\`\`

## Comprobar
\`npm run check\`
`,
    checkpoints: [
      {
        id: "about-section-exists",
        label: 'Existe una sección "Sobre mí"',
        assert: "page has section#about or section with h2 containing 'Sobre mí'",
        hint: "1) Debajo del hero, crea <section id=\"about\">...</section>.\n2) Dentro irá el título y los párrafos de tu bio.",
      },
      {
        id: "about-heading",
        label: 'Hay un <h2> con "Sobre mí"',
        assert: "section has visible h2 with 'Sobre mí' (case-insensitive)",
        hint: "1) Dentro de la sección, añade <h2>Sobre mí</h2>.\n2) Debe ser visible en la página.",
      },
      {
        id: "about-paragraph",
        label: "Hay al menos un párrafo con bio",
        assert: "about section has <p> with at least 50 characters",
        hint: "1) Añade uno o más <p> con tu presentación.\n2) Escribe al menos 3 frases (50+ caracteres en total).",
      },
      {
        id: "about-mobile-readable",
        label: "La sección es legible en móvil (375px)",
        assert: "about section visible at 375px viewport without horizontal overflow",
        hint: "1) Redimensiona el navegador a móvil (375px) o usa DevTools.\n2) Evita anchos fijos grandes; usa max-w y padding (px-4).",
      },
    ],
  },
  {
    id: 4,
    slug: "navbar-fija",
    title: "Header / navbar fija",
    block: "Fundamentos",
    description: "Navbar fija arriba con enlaces de navegación.",
    instructions: "TODO: Instrucciones del nivel 4 — Navbar fija con position fixed/sticky, logo y enlaces.",
    checkpoints: [
      { id: "nav-exists", label: "Existe un <nav> o header", assert: "TODO: nav element visible" },
      { id: "nav-fixed", label: "La navbar es fija", assert: "TODO: position fixed or sticky" },
      { id: "nav-links", label: "Tiene al menos 2 enlaces", assert: "TODO: 2+ anchor links" },
    ],
  },
  {
    id: 5,
    slug: "responsive",
    title: "Responsive (mobile-first)",
    block: "Fundamentos",
    description: "Diseño mobile-first con breakpoints.",
    instructions: "TODO: Instrucciones del nivel 5 — Mobile-first con Tailwind breakpoints.",
    checkpoints: [
      { id: "mobile-layout", label: "Layout correcto en 375px", assert: "TODO: no horizontal scroll at 375px" },
      { id: "desktop-layout", label: "Layout correcto en 1024px", assert: "TODO: expanded layout at 1024px" },
    ],
  },
  {
    id: 6,
    slug: "componentizar",
    title: "Componentizar",
    block: "Fundamentos",
    description: "Extrae Hero, Navbar y About como componentes.",
    instructions: "TODO: Instrucciones del nivel 6 — components/Hero.jsx, Navbar.jsx, About.jsx.",
    checkpoints: [
      { id: "hero-component", label: "Hero es un componente separado", assert: "TODO: Hero component file exists" },
      { id: "navbar-component", label: "Navbar es un componente separado", assert: "TODO: Navbar component" },
      { id: "about-component", label: "About es un componente separado", assert: "TODO: About component" },
    ],
  },
  {
    id: 7,
    slug: "props-tarjeta",
    title: "Props: tarjeta de proyecto",
    block: "Fundamentos",
    description: "Componente ProjectCard reutilizable con props.",
    instructions: "TODO: Instrucciones del nivel 7 — ProjectCard con props title, description, image.",
    checkpoints: [
      { id: "project-card-exists", label: "Existe componente ProjectCard", assert: "TODO: ProjectCard component" },
      { id: "project-card-props", label: "ProjectCard usa props", assert: "TODO: renders title from props" },
    ],
  },
  {
    id: 8,
    slug: "listas-map",
    title: "Listas con .map",
    block: "Fundamentos",
    description: "Grid de proyectos renderizado con .map().",
    instructions: "TODO: Instrucciones del nivel 8 — Array de proyectos + .map() en grid.",
    checkpoints: [
      { id: "projects-grid", label: "Grid de proyectos visible", assert: "TODO: 3+ project cards in grid" },
      { id: "projects-map", label: "Proyectos renderizados con .map", assert: "TODO: dynamic list" },
    ],
  },
  {
    id: 9,
    slug: "toggle-tema",
    title: "useState: toggle de tema",
    block: "Interactividad",
    description: "Toggle claro/oscuro con useState.",
    instructions: "TODO: Instrucciones del nivel 9 — useState para tema claro/oscuro.",
    checkpoints: [
      { id: "theme-toggle", label: "Botón de cambio de tema", assert: "TODO: theme toggle button" },
      { id: "theme-changes", label: "El tema cambia al pulsar", assert: "TODO: background color changes" },
    ],
  },
  {
    id: 10,
    slug: "formulario-contacto",
    title: "Formulario de contacto controlado",
    block: "Interactividad",
    description: "Formulario con inputs controlados.",
    instructions: "TODO: Instrucciones del nivel 10 — Formulario controlado nombre, email, mensaje.",
    checkpoints: [
      { id: "contact-form", label: "Formulario de contacto existe", assert: "TODO: form with inputs" },
      { id: "controlled-inputs", label: "Inputs controlados", assert: "TODO: value + onChange" },
    ],
  },
  {
    id: 11,
    slug: "validacion-formulario",
    title: "Validación del formulario",
    block: "Interactividad",
    description: "Validación en cliente con mensajes de error.",
    instructions: "TODO: Instrucciones del nivel 11 — Validación email y campos requeridos.",
    checkpoints: [
      { id: "validation-errors", label: "Muestra errores de validación", assert: "TODO: error messages on invalid submit" },
      { id: "email-validation", label: "Valida formato de email", assert: "TODO: email format check" },
    ],
  },
  {
    id: 12,
    slug: "useeffect-fetch",
    title: "useEffect: cargar proyectos",
    block: "Interactividad",
    description: "Cargar proyectos desde JSON/fetch.",
    instructions: "TODO: Instrucciones del nivel 12 — useEffect + fetch de projects.json.",
    checkpoints: [
      { id: "fetch-projects", label: "Proyectos cargados con fetch", assert: "TODO: projects from API/JSON" },
      { id: "useeffect-used", label: "useEffect implementado", assert: "TODO: data fetched on mount" },
    ],
  },
  {
    id: 13,
    slug: "loading-error",
    title: "Estados de carga y error",
    block: "Interactividad",
    description: "UI para loading y error states.",
    instructions: "TODO: Instrucciones del nivel 13 — Loading spinner y mensaje de error.",
    checkpoints: [
      { id: "loading-state", label: "Estado de carga visible", assert: "TODO: loading indicator" },
      { id: "error-state", label: "Estado de error manejado", assert: "TODO: error message UI" },
    ],
  },
  {
    id: 14,
    slug: "scroll-animaciones",
    title: "Animaciones al scroll",
    block: "Interactividad",
    description: "IntersectionObserver para animaciones.",
    instructions: "TODO: Instrucciones del nivel 14 — Animaciones al entrar en viewport.",
    checkpoints: [
      { id: "scroll-animation", label: "Elementos animados al scroll", assert: "TODO: opacity/transform on scroll" },
    ],
  },
  {
    id: 15,
    slug: "modal-proyecto",
    title: "Modal de detalle de proyecto",
    block: "Interactividad",
    description: "Modal al hacer clic en un proyecto.",
    instructions: "TODO: Instrucciones del nivel 15 — Modal con detalle del proyecto.",
    checkpoints: [
      { id: "modal-opens", label: "Modal se abre al clic", assert: "TODO: modal visible on click" },
      { id: "modal-closes", label: "Modal se cierra", assert: "TODO: close button works" },
    ],
  },
  {
    id: 16,
    slug: "routing",
    title: "Routing",
    block: "Routing y calidad",
    description: "Rutas /, /proyectos, /proyecto/:id.",
    instructions: "TODO: Instrucciones del nivel 16 — React Router con 3 rutas.",
    checkpoints: [
      { id: "home-route", label: "Ruta / funciona", assert: "TODO: home at /" },
      { id: "projects-route", label: "Ruta /proyectos funciona", assert: "TODO: projects page" },
      { id: "project-detail-route", label: "Ruta /proyecto/:id funciona", assert: "TODO: dynamic route" },
    ],
  },
  {
    id: 17,
    slug: "custom-hooks",
    title: "Custom hooks (useFetch)",
    block: "Routing y calidad",
    description: "Hook useFetch reutilizable.",
    instructions: "TODO: Instrucciones del nivel 17 — hooks/useFetch.js.",
    checkpoints: [
      { id: "usefetch-hook", label: "Hook useFetch existe", assert: "TODO: useFetch hook file" },
      { id: "usefetch-used", label: "useFetch usado en componente", assert: "TODO: hook imported and used" },
    ],
  },
  {
    id: 18,
    slug: "context-tema",
    title: "Context (tema global)",
    block: "Routing y calidad",
    description: "ThemeContext para tema global.",
    instructions: "TODO: Instrucciones del nivel 18 — React Context para tema.",
    checkpoints: [
      { id: "theme-context", label: "ThemeContext implementado", assert: "TODO: context provider" },
      { id: "context-consumer", label: "Componentes consumen el contexto", assert: "TODO: useContext" },
    ],
  },
  {
    id: 19,
    slug: "accesibilidad-seo",
    title: "Accesibilidad + SEO básico",
    block: "Routing y calidad",
    description: "Semántica HTML, alt, meta tags.",
    instructions: "TODO: Instrucciones del nivel 19 — a11y y react-helmet/meta.",
    checkpoints: [
      { id: "semantic-html", label: "HTML semántico", assert: "TODO: main, nav, section" },
      { id: "alt-images", label: "Imágenes con alt", assert: "TODO: all img have alt" },
      { id: "meta-tags", label: "Meta tags básicos", assert: "TODO: title and description meta" },
    ],
  },
  {
    id: 20,
    slug: "login-app",
    title: "Login con backend real",
    block: "Routing y calidad",
    description: "Auth en la propia app del alumno.",
    instructions: "TODO: Instrucciones del nivel 20 — Login funcional en la app.",
    checkpoints: [
      { id: "login-form", label: "Formulario de login", assert: "TODO: login page" },
      { id: "auth-protected", label: "Ruta protegida", assert: "TODO: protected route" },
    ],
  },
  {
    id: 21,
    slug: "supabase-proyectos",
    title: "Conectar Supabase",
    block: "Backend real",
    description: "Proyectos desde Supabase en la app del alumno.",
    instructions: "TODO: Instrucciones del nivel 21 — Supabase client + fetch projects.",
    checkpoints: [
      { id: "supabase-connected", label: "Datos desde Supabase", assert: "TODO: projects from Supabase" },
    ],
  },
  {
    id: 22,
    slug: "crud-proyectos",
    title: "CRUD de proyectos",
    block: "Backend real",
    description: "Panel privado para añadir/editar proyectos.",
    instructions: "TODO: Instrucciones del nivel 22 — CRUD panel admin.",
    checkpoints: [
      { id: "create-project", label: "Crear proyecto", assert: "TODO: create form works" },
      { id: "edit-project", label: "Editar proyecto", assert: "TODO: edit form works" },
    ],
  },
  {
    id: 23,
    slug: "subida-imagenes",
    title: "Subida de imágenes",
    block: "Backend real",
    description: "Upload de imágenes para proyectos.",
    instructions: "TODO: Instrucciones del nivel 23 — Image upload to storage.",
    checkpoints: [
      { id: "image-upload", label: "Subida de imagen funciona", assert: "TODO: file input + upload" },
    ],
  },
  {
    id: 24,
    slug: "contacto-real",
    title: "Contacto que guarda/envía",
    block: "Backend real",
    description: "Formulario de contacto persistente.",
    instructions: "TODO: Instrucciones del nivel 24 — Contact form saves/sends.",
    checkpoints: [
      { id: "contact-persists", label: "Mensaje de contacto guardado", assert: "TODO: form submission persists" },
    ],
  },
  {
    id: 25,
    slug: "env-seguridad",
    title: "Variables de entorno",
    block: "Backend real",
    description: "Env vars y seguridad básica.",
    instructions: "TODO: Instrucciones del nivel 25 — .env.example, no secrets in code.",
    checkpoints: [
      { id: "env-example", label: "Existe .env.example", assert: "TODO: .env.example file" },
      { id: "no-hardcoded-secrets", label: "Sin secrets hardcodeados", assert: "TODO: env vars used" },
    ],
  },
  {
    id: 26,
    slug: "tests-vitest",
    title: "Tests con Vitest",
    block: "Backend real",
    description: "Tests de un componente con RTL.",
    instructions: "TODO: Instrucciones del nivel 26 — Vitest + React Testing Library.",
    checkpoints: [
      { id: "test-file", label: "Archivo de test existe", assert: "TODO: .test.jsx file" },
      { id: "test-passes", label: "Tests pasan", assert: "TODO: npm test passes" },
    ],
  },
  {
    id: 27,
    slug: "optimizacion",
    title: "Optimización",
    block: "Pro y despliegue",
    description: "Lazy loading, imágenes, Lighthouse.",
    instructions: "TODO: Instrucciones del nivel 27 — React.lazy, optimized images.",
    checkpoints: [
      { id: "lazy-loading", label: "Lazy loading implementado", assert: "TODO: React.lazy used" },
      { id: "image-optimization", label: "Imágenes optimizadas", assert: "TODO: lazy loading on images" },
    ],
  },
  {
    id: 28,
    slug: "dominio-analytics",
    title: "Dominio + analytics",
    block: "Pro y despliegue",
    description: "Analytics básico integrado.",
    instructions: "TODO: Instrucciones del nivel 28 — Analytics script.",
    checkpoints: [
      { id: "analytics", label: "Analytics integrado", assert: "TODO: analytics script or component" },
    ],
  },
  {
    id: 29,
    slug: "ci-github",
    title: "CI con GitHub Actions",
    block: "Pro y despliegue",
    description: "Workflow build + tests.",
    instructions: "TODO: Instrucciones del nivel 29 — .github/workflows/ci.yml.",
    checkpoints: [
      { id: "ci-workflow", label: "Workflow CI existe", assert: "TODO: .github/workflows file" },
    ],
  },
  {
    id: 30,
    slug: "deploy",
    title: "Deploy a la nube",
    block: "Pro y despliegue",
    description: "Deploy en Vercel u otra plataforma.",
    instructions: "TODO: Instrucciones del nivel 30 — Deploy y URL pública documentada en README.",
    checkpoints: [
      { id: "deploy-url", label: "URL de deploy documentada", assert: "TODO: README contains deploy URL" },
      { id: "build-passes", label: "Build de producción pasa", assert: "TODO: npm run build succeeds" },
    ],
  },
];

const DEFAULT_CHECKPOINT_HINT =
  "Sigue las instrucciones del nivel en tu proyecto. Cuando tu código cumpla este requisito, el punto se marcará automáticamente.";

for (const level of levels) {
  for (const cp of level.checkpoints) {
    if (!cp.hint) cp.hint = DEFAULT_CHECKPOINT_HINT;
  }
}

export function getLevelById(id) {
  return levels.find((l) => l.id === id) ?? null;
}

export function getLevelIds() {
  return levels.map((l) => l.id);
}
