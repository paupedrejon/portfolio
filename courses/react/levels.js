/** @typedef {{ type: 'file' | 'code' | 'tip' | 'action'; text: string; path?: string; code?: string }} HintStep */
/** @typedef {{ id: string; label: string; assert: string; hint?: string; hintSteps?: HintStep[] }} Checkpoint */
/** @typedef {{ title: string; description: string }} LevelPreview */
/** @typedef {{ id: number; slug: string; title: string; block: string; description: string; objective: string; preview: LevelPreview; instructions?: string; checkpoints: Checkpoint[] }} Level */

/** @type {Level[]} */
export const levels = [
  {
    id: 1,
    slug: "hello-world",
    title: "Hello World",
    block: "Fundamentos",
    description: "Crea tu primera página y un hero con un título centrado.",
    objective:
      "Crea una página con fondo oscuro y un hero que tenga un único título <h1> centrado con el texto Hello World.",
    preview: {
      title: "Así debería verse tu página",
      description:
        "Fondo oscuro a pantalla completa. En el centro, un solo título grande que dice Hello World.",
    },
    checkpoints: [
      {
        id: "page-renders",
        label: "La página carga sin errores",
        assert: "app loads at base URL with HTTP 200 and no console errors",
        hintSteps: [
          { type: "action", text: "En la terminal del proyecto: npm install (solo la 1ª vez)" },
          { type: "action", text: "Luego: npm run dev" },
          { type: "tip", text: "Abre http://localhost:5173 en el navegador" },
          { type: "action", text: "Pulsa F12 → Consola: no debe haber líneas rojas" },
          { type: "tip", text: "Guarda cualquier cambio en src/ y este paso se actualiza solo" },
        ],
      },
      {
        id: "h1-exists",
        label: "Existe un <h1> en la página",
        assert: "page has exactly one visible <h1>",
        hintSteps: [
          { type: "file", text: "Abre el archivo", path: "src/App.jsx" },
          { type: "action", text: "Busca la palabra return y los paréntesis ( )" },
          { type: "action", text: "Dentro del return, crea un <div> y dentro un <h1> vacío" },
          {
            type: "code",
            text: "Por ahora solo esto (sin texto dentro del h1):",
            code: "return (\n  <div>\n    <h1></h1>\n  </div>\n);",
          },
          { type: "tip", text: "Guarda (Ctrl+S). Debes ver un título vacío o muy pequeño — solo 1 h1 en la página" },
        ],
      },
      {
        id: "h1-text",
        label: 'El título dice "Hello World"',
        assert: "the <h1> textContent includes 'Hello World' (case-insensitive)",
        hintSteps: [
          { type: "file", text: "Mismo archivo", path: "src/App.jsx" },
          { type: "action", text: "No cambies el <div>. Solo edita lo que va DENTRO del <h1>" },
          {
            type: "code",
            text: "Sustituye el h1 vacío por:",
            code: "<h1>Hello World</h1>",
          },
          { type: "tip", text: "Guarda y mira el navegador: debe decir Hello World" },
        ],
      },
      {
        id: "h1-centered",
        label: "El título está centrado",
        assert: "computed text-align of the <h1> (or its container) is 'center'",
        hintSteps: [
          { type: "file", text: "Sigue en", path: "src/App.jsx" },
          { type: "action", text: "Mantén <h1>Hello World</h1> — solo añadimos una clase" },
          {
            type: "code",
            text: 'Añade className="text-center" al h1 (nada más por ahora):',
            code: '<h1 className="text-center">Hello World</h1>',
          },
          { type: "tip", text: "Guarda: el texto debe quedar centrado en horizontal" },
          {
            type: "tip",
            text: "Opcional después: className=\"text-white text-4xl\" en el h1 y bg oscuro en el div",
          },
        ],
      },
    ],
  },
  {
    id: 2,
    slug: "hero-completo",
    title: "Hero completo",
    block: "Fundamentos",
    description: "Añade subtítulo y un botón CTA con buen estilo.",
    objective:
      "Mantén el h1 Hello World centrado. Añade un subtítulo <p> debajo y un botón CTA con buen estilo (padding y bordes redondeados).",
    preview: {
      title: "Así debería verse tu hero",
      description:
        "Hello World centrado, un párrafo debajo presentándote, y un botón llamativo (por ejemplo «Ver proyectos»).",
    },
    checkpoints: [
      {
        id: "h1-still-present",
        label: "El h1 Hello World sigue presente",
        assert: "page has visible <h1> with Hello World",
        hintSteps: [
          { type: "file", text: "Abre", path: "src/App.jsx" },
          { type: "tip", text: "Comprueba que tu h1 del nivel 1 sigue ahí" },
          { type: "code", text: "Debe incluir:", code: '<h1 className="text-center">Hello World</h1>' },
        ],
      },
      {
        id: "subtitle-exists",
        label: "Existe un subtítulo <p> en el hero",
        assert: "hero section has a visible <p> with at least 10 characters",
        hintSteps: [
          { type: "action", text: "Justo DEBAJO del </h1>, en la misma columna, añade una línea nueva" },
          { type: "code", text: "Primero un párrafo simple:", code: "<p>Desarrollador web en formación</p>" },
          { type: "action", text: "Guarda y comprueba que se ve debajo del título" },
          {
            type: "tip",
            text: 'Luego puedes añadir clases: className="text-gray-300 mt-4"',
          },
        ],
      },
      {
        id: "cta-button-exists",
        label: "Existe un botón CTA",
        assert: "page has a visible <button> or <a> styled as CTA in hero",
        hintSteps: [
          { type: "action", text: "Debajo del <p>, añade un botón sin estilos todavía" },
          { type: "code", text: "Mínimo:", code: '<button type="button">Ver proyectos</button>' },
          { type: "tip", text: "Guarda: debe verse un botón clicable en la página" },
        ],
      },
      {
        id: "cta-button-styled",
        label: "El botón CTA tiene padding y border-radius",
        assert: "CTA has padding >= 8px and border-radius >= 4px",
        hintSteps: [
          { type: "action", text: "No cambies el texto del botón. Solo añade className" },
          { type: "action", text: "Paso 1: añade padding → className=\"px-6 py-3\"" },
          { type: "action", text: "Paso 2: añade bordes redondos → rounded-full" },
          {
            type: "code",
            text: "Ejemplo completo:",
            code: 'className="px-6 py-3 rounded-full bg-[#2a8ca0] text-white"',
          },
          { type: "tip", text: "Guarda: el botón debe verse más grande y con esquinas redondas" },
        ],
      },
    ],
  },
  {
    id: 3,
    slug: "sobre-mi",
    title: 'Sección "Sobre mí"',
    block: "Fundamentos",
    description: 'Añade una sección "Sobre mí" debajo del hero.',
    objective:
      'Debajo del hero, crea una sección "Sobre mí" con h2, párrafos de bio (50+ caracteres) y diseño legible en móvil.',
    preview: {
      title: "Así debería verse con «Sobre mí»",
      description:
        "El hero de arriba se mantiene. Debajo, una sección con título Sobre mí y varias líneas de texto de presentación.",
    },
    checkpoints: [
      {
        id: "about-section-exists",
        label: 'Existe una sección "Sobre mí"',
        assert: "page has section#about or section with h2 containing 'Sobre mí'",
        hintSteps: [
          { type: "file", text: "Abre", path: "src/App.jsx" },
          { type: "action", text: "Debajo de todo el hero (h1, p, botón), añade una sección nueva" },
          { type: "code", text: "Empieza vacía:", code: '<section id="about">\n</section>' },
          { type: "tip", text: "Guarda: aún puede estar vacía por dentro, pero la sección debe existir" },
        ],
      },
      {
        id: "about-heading",
        label: 'Hay un <h2> con "Sobre mí"',
        assert: "section has visible h2 with 'Sobre mí' (case-insensitive)",
        hintSteps: [
          { type: "action", text: "Dentro de <section id=\"about\">, primera línea:" },
          { type: "code", text: "Añade solo el título:", code: "<h2>Sobre mí</h2>" },
          { type: "tip", text: "Guarda y comprueba que se lee Sobre mí" },
        ],
      },
      {
        id: "about-paragraph",
        label: "Hay al menos un párrafo con bio",
        assert: "about section has <p> with at least 50 characters",
        hintSteps: [
          { type: "action", text: "Debajo del h2, añade un <p> con tu presentación" },
          { type: "tip", text: "Escribe 2 o 3 frases sobre ti (mínimo 50 letras en total)" },
          { type: "code", text: "Ejemplo:", code: "<p>Soy estudiante de desarrollo web. Me gusta React y construir proyectos.</p>" },
        ],
      },
      {
        id: "about-mobile-readable",
        label: "La sección es legible en móvil (375px)",
        assert: "about section visible at 375px viewport without horizontal overflow",
        hintSteps: [
          { type: "action", text: "F12 → icono móvil → elige 375px de ancho" },
          { type: "action", text: "A la sección about añade: className=\"px-4 max-w-2xl mx-auto\"" },
          { type: "tip", text: "No debe aparecer barra de scroll horizontal" },
        ],
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

const DEFAULT_HINT_STEPS = [
  { type: "tip", text: "Edita tu proyecto y guarda (Ctrl+S)" },
  { type: "tip", text: "Este paso se marca solo al cumplir el requisito" },
];

for (const level of levels) {
  if (!level.objective) {
    level.objective = level.description;
  }
  if (!level.preview) {
    level.preview = {
      title: "Resultado esperado",
      description: level.description,
    };
  }
  for (const cp of level.checkpoints) {
    if (!cp.hintSteps?.length) cp.hintSteps = DEFAULT_HINT_STEPS;
  }
}

export function getLevelById(id) {
  return levels.find((l) => l.id === id) ?? null;
}

export function getLevelIds() {
  return levels.map((l) => l.id);
}
