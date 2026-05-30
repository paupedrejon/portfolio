/** @typedef {{ type: 'file' | 'code' | 'tip' | 'action'; text: string; path?: string; code?: string }} HintStep */
/** @typedef {{ id: string; label: string; assert: string; hint?: string; hintSteps?: HintStep[] }} Checkpoint */
/** @typedef {{ title: string; description: string }} LevelPreview */
/** @typedef {{ id: number; slug: string; title: string; block: string; description: string; objective: string; preview: LevelPreview; instructions?: string; checkpoints: Checkpoint[] }} Level */

import { levels4to30 } from "./levels-4-30.js";

/** @type {Level[]} */
export const levels = [
  {
    id: 1,
    slug: "hello-world",
    title: "Hello World",
    block: "Fundamentos",
    description: "Crea tu primera página y un hero con un título centrado.",
    objective:
      "Crea una página con fondo oscuro a pantalla completa y un único <h1> centrado que diga Hello World, grande, en blanco y en negrita (como en la vista previa).",
    preview: {
      title: "Así debería verse tu web al finalizar este nivel",
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
            text: 'Añade className="text-center" al h1:',
            code: '<h1 className="text-center">Hello World</h1>',
          },
          { type: "tip", text: "Guarda: el texto debe quedar centrado en horizontal" },
        ],
      },
      {
        id: "hero-no-placeholder",
        label: "Has quitado el texto de ayuda del template",
        assert: "starter placeholder paragraph removed",
        hintSteps: [
          { type: "action", text: "Borra por completo el <p> que dice «Empieza por el nivel 1…»" },
          { type: "tip", text: "Solo debe quedar tu <h1> (y luego el <main> contenedor)" },
        ],
      },
      {
        id: "hero-bg-dark",
        label: "El fondo del hero es oscuro",
        assert: "main container has dark background color",
        hintSteps: [
          { type: "action", text: "Envuelve el h1 en <main> si aún no lo hiciste" },
          { type: "code", text: "Añade fondo oscuro al main:", code: '<main className="bg-[#0a0a0f]">' },
          { type: "tip", text: "También vale bg-gray-950 o bg-black" },
        ],
      },
      {
        id: "hero-min-h-screen",
        label: "El hero ocupa toda la pantalla (min-h-screen)",
        assert: "container min-height covers viewport",
        hintSteps: [
          { type: "action", text: "En el mismo <main>, añade la clase min-h-screen" },
          { type: "code", text: "Ejemplo:", code: '<main className="min-h-screen bg-[#0a0a0f]">' },
          { type: "tip", text: "Guarda: el fondo oscuro debe llegar abajo del todo" },
        ],
      },
      {
        id: "hero-flex-center",
        label: "El título está centrado en medio de la pantalla",
        assert: "flex center vertically and horizontally",
        hintSteps: [
          { type: "action", text: "Añade flex y centrado al <main>" },
          {
            type: "code",
            text: "Clases:",
            code: 'className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center"',
          },
        ],
      },
      {
        id: "h1-text-large",
        label: "El título es grande (text-4xl o más)",
        assert: "h1 font-size >= 28px",
        hintSteps: [
          { type: "action", text: "En el <h1>, añade tamaño grande" },
          { type: "code", text: "Ejemplo:", code: 'className="text-center text-4xl md:text-5xl"' },
        ],
      },
      {
        id: "h1-text-white",
        label: "El título es blanco (text-white)",
        assert: "h1 color is light/white",
        hintSteps: [
          { type: "action", text: "Añade text-white al h1" },
          { type: "code", text: "Ejemplo:", code: 'className="text-center text-white text-4xl"' },
        ],
      },
      {
        id: "h1-font-bold",
        label: "El título está en negrita (font-bold)",
        assert: "h1 font-weight >= 700",
        hintSteps: [
          { type: "action", text: "Añade font-bold al h1" },
          {
            type: "code",
            text: "Resultado final del h1:",
            code: '<h1 className="text-center text-white text-4xl md:text-5xl font-bold">Hello World</h1>',
          },
          { type: "tip", text: "Compara con la vista previa del curso" },
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
      title: "Así debería verse tu web al finalizar este nivel",
      description:
        "Hello World centrado, un párrafo debajo presentándote, y un botón llamativo (por ejemplo «Ver proyectos»). Todo en columna, sin solaparse.",
    },
    checkpoints: [
      {
        id: "h1-still-present",
        label: "El h1 Hello World sigue presente y centrado",
        assert: "page has visible centered <h1> with Hello World",
        hintSteps: [
          { type: "file", text: "Abre", path: "src/App.jsx" },
          { type: "tip", text: "Comprueba que tu h1 del nivel 1 sigue ahí" },
          { type: "code", text: "Debe incluir:", code: '<h1 className="text-center">Hello World</h1>' },
        ],
      },
      {
        id: "hero-layout-column",
        label: "El hero usa columna centrada (flex flex-col items-center)",
        assert: "hero wrapper uses flex column with centered items",
        hintSteps: [
          { type: "action", text: "Envuelve h1, p y botón en un <div> contenedor" },
          {
            type: "code",
            text: "Añade al contenedor (no al h1 suelto):",
            code: 'className="flex flex-col items-center justify-center min-h-screen bg-gray-950"',
          },
          { type: "tip", text: "Guarda: los elementos deben alinearse en columna al centro, no en fila" },
        ],
      },
      {
        id: "subtitle-exists",
        label: "Existe un subtítulo <p> debajo del h1",
        assert: "hero has visible <p> with at least 10 characters below h1",
        hintSteps: [
          { type: "action", text: "Justo DEBAJO del </h1>, en la misma columna, añade una línea nueva" },
          { type: "code", text: "Primero un párrafo simple:", code: "<p>Desarrollador web en formación</p>" },
          { type: "action", text: "Guarda y comprueba que se ve debajo del título (no al lado)" },
          { type: "tip", text: 'Opcional: className="text-gray-300 mt-4 text-center"' },
        ],
      },
      {
        id: "cta-button-exists",
        label: "Existe un botón CTA debajo del párrafo",
        assert: "page has a visible CTA button below subtitle",
        hintSteps: [
          { type: "action", text: "Debajo del <p>, añade un botón (nueva línea, no al lado del h1)" },
          { type: "code", text: "Mínimo:", code: '<button type="button">Ver proyectos</button>' },
          { type: "tip", text: "Guarda: el botón debe quedar bajo el texto, no pegado a Hello World" },
        ],
      },
      {
        id: "hero-vertical-stack",
        label: "h1, párrafo y botón van en vertical (sin solaparse)",
        assert: "h1, p and CTA are stacked vertically without horizontal overlap",
        hintSteps: [
          { type: "tip", text: "Si el botón tapa el título, falta flex-col o hay elementos en la misma fila" },
          { type: "action", text: "Orden correcto dentro del div: h1 → p → button" },
          { type: "code", text: "Estructura:", code: "<div className=\"flex flex-col items-center ...\">\n  <h1>...</h1>\n  <p>...</p>\n  <button>...</button>\n</div>" },
        ],
      },
      {
        id: "cta-button-styled",
        label: "El botón CTA tiene padding y border-radius",
        assert: "CTA has padding >= 8px and border-radius >= 4px",
        hintSteps: [
          { type: "action", text: "No cambies el texto del botón. Solo añade className" },
          { type: "action", text: "Paso 1: padding → className=\"px-6 py-3\"" },
          { type: "action", text: "Paso 2: bordes redondos → rounded-full" },
          {
            type: "code",
            text: "Ejemplo completo:",
            code: 'className="px-6 py-3 rounded-full bg-[#2a8ca0] text-white mt-6"',
          },
          { type: "tip", text: "Guarda: botón grande, redondo y separado del párrafo" },
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
      title: "Así debería verse tu web al finalizar este nivel",
      description:
        "El hero completo del nivel 2 se mantiene arriba. Debajo, una sección clara con título Sobre mí y varias líneas de presentación.",
    },
    checkpoints: [
      {
        id: "hero-from-level2-intact",
        label: "El hero del nivel 2 sigue intacto (h1, p y botón en columna)",
        assert: "hero from level 2 still present with vertical stack",
        hintSteps: [
          { type: "tip", text: "No borres el hero al añadir «Sobre mí». Solo añade contenido debajo." },
          { type: "action", text: "Comprueba: Hello World, subtítulo y botón CTA siguen visibles y centrados" },
        ],
      },
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
  ...levels4to30,
];

const DEFAULT_HINT_STEPS = [
  { type: "tip", text: "Edita tu proyecto y guarda (Ctrl+S)" },
  { type: "tip", text: "Este paso se marca solo al cumplir el requisito" },
];

const PAGE_RENDERS_CHECKPOINT = {
  id: "page-renders",
  label: "La página carga sin errores",
  assert: "app loads at base URL with HTTP 200 and no console errors",
  hintSteps: [
    { type: "action", text: "Abre la carpeta del zip en la terminal del proyecto" },
    { type: "action", text: "Ejecuta npm install (solo la primera vez)" },
    { type: "action", text: "Luego npm run dev y abre http://localhost:5173" },
    { type: "tip", text: "F12 → Consola: no debe haber errores en rojo" },
    { type: "tip", text: "Al guardar en src/, este paso se actualiza solo" },
  ],
};

for (const level of levels) {
  if (!level.objective) {
    level.objective = level.description;
  }
  if (!level.preview) {
    level.preview = {
      title: "Así debería verse tu web al finalizar este nivel",
      description: level.description,
    };
  }
  if (!level.checkpoints.some((c) => c.id === "page-renders")) {
    level.checkpoints.unshift({ ...PAGE_RENDERS_CHECKPOINT });
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
