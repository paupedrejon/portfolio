"use client";

import { useEffect, useMemo, useState } from "react";
import DOMPurify from "dompurify";
import { outfit, spaceGrotesk } from "@/app/fonts";
import StudyAgentsBotAvatar from "@/components/study-agents/StudyAgentsBotAvatar";
import { SA_PRIMARY } from "@/lib/study-agents/brand";
import "@/components/study-agents/study-agents-chat.css";
import "@/components/study-agents/study-agents-bot.css";

export type PlanQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correct_index: number;
  feedback_ok?: string;
  feedback_bad?: string;
};

export type PlanBlock = {
  id?: string;
  kind: string;
  text?: string;
  title?: string;
  body?: string;
  word?: string;
  sub?: string;
  items?: Array<string | { n?: number; label?: string }>;
  left?: { title?: string; body?: string };
  right?: { title?: string; body?: string };
  label?: string;
  code?: string;
  html?: string;
  prompt?: string;
  options?: string[];
  correct_index?: number;
  feedback_ok?: string;
  feedback_bad?: string;
};

/** Una pantalla Duolingo: bot + visual + (opcional) check en la misma vista. */
export type LessonSlide = {
  id: string;
  phase: "intro" | "learn";
  bot: string;
  visual?: PlanBlock | null;
  html?: string;
  check?: {
    prompt: string;
    options: string[];
    correct_index: number;
    feedback_ok?: string;
    feedback_bad?: string;
  } | null;
};

export type PlanDay = {
  day: number;
  title: string;
  focus: string;
  minutes: number;
  intro?: PlanBlock[];
  teach?: PlanBlock[];
  slides?: LessonSlide[];
  questions: PlanQuestion[];
};

export type InteractivePlan = {
  format?: string;
  topic: string;
  xp_per_correct?: number;
  minutes_per_day?: number;
  started_at?: string;
  days: PlanDay[];
};

type Progress = {
  unlockedDay: number;
  completedDays: number[];
  xp: number;
  startedAt: string;
  lastCompletedDate?: string;
};

type Props = {
  plan: InteractivePlan;
  storageKey?: string;
};

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(fromISO: string, toISO: string): number {
  const a = new Date(fromISO + "T12:00:00");
  const b = new Date(toISO + "T12:00:00");
  return Math.max(0, Math.floor((b.getTime() - a.getTime()) / 86400000));
}

function loadProgress(key: string, maxDay: number, startedAt?: string): Progress {
  const fallbackStart = startedAt || todayISO();
  if (typeof window === "undefined") {
    return { unlockedDay: 1, completedDays: [], xp: 0, startedAt: fallbackStart };
  }
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { unlockedDay: 1, completedDays: [], xp: 0, startedAt: fallbackStart };
    const p = JSON.parse(raw) as Progress;
    return {
      unlockedDay: Math.min(Math.max(1, p.unlockedDay || 1), maxDay),
      completedDays: Array.isArray(p.completedDays) ? p.completedDays : [],
      xp: Number(p.xp) || 0,
      startedAt: p.startedAt || fallbackStart,
      lastCompletedDate: p.lastCompletedDate,
    };
  } catch {
    return { unlockedDay: 1, completedDays: [], xp: 0, startedAt: fallbackStart };
  }
}

function normalizePrompt(s: string): string {
  return s
    .toLowerCase()
    .replace(/[¿?¡!.,;:"']/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
}

function dedupeQuestions(questions: PlanQuestion[], seen: Set<string>): PlanQuestion[] {
  const out: PlanQuestion[] = [];
  for (const q of questions || []) {
    const key = normalizePrompt(q.prompt || "");
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(q);
  }
  return out;
}

function sanitizeLessonHtml(html: string): string {
  if (typeof window === "undefined") return "";
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["div", "span", "strong", "em", "code", "pre", "ul", "ol", "li", "p", "br", "b", "i"],
    ALLOWED_ATTR: ["class"],
  });
}

function isWeakBot(text: string): boolean {
  const t = (text || "").trim();
  if (t.length < 28) return true;
  // frases cortadas típicas del LLM truncado
  if (/^(vamos|hola|ok|sí|si|ahora|hoy)[.!]?$/i.test(t)) return true;
  if (/\bes\s*$/i.test(t) || /\bes\s+[a-záéíóú]{1,3}$/i.test(t)) return true;
  return false;
}

/** Currículo real por tema (no meta sobre “cómo estudiar”). */
function qualitySlidesForDay(topic: string, day: PlanDay): LessonSlide[] {
  const t = topic.trim() || "el tema";
  const tl = t.toLowerCase();
  const d = day.day;
  const unit = ((d - 1) % 7) + 1;

  if (tl.includes("react")) {
    const units: LessonSlide[][] = [
      // 1 Qué es React
      [
        {
          id: `r${d}-1`,
          phase: "intro",
          bot: "React es una biblioteca de JavaScript para construir interfaces de usuario con piezas reutilizables.",
          visual: { kind: "big_word", word: "React", sub: "UI con componentes" },
          html: `<div class="viz"><div class="row"><span class="pill">biblioteca</span><span class="pill">JavaScript</span><span class="pill">UI</span></div><p>No es un framework completo: se centra en la vista.</p></div>`,
          check: {
            prompt: "React sirve principalmente para…",
            options: [
              "Construir interfaces de usuario",
              "Gestionar bases de datos SQL",
              "Enviar emails del servidor",
              "Compilar código C++",
            ],
            correct_index: 0,
            feedback_ok: "Sí: UI con componentes.",
            feedback_bad: "React está en la capa de interfaz.",
          },
        },
        {
          id: `r${d}-2`,
          phase: "learn",
          bot: "La unidad básica es el componente: una función que describe un trozo de UI.",
          visual: {
            kind: "vs",
            left: { title: "Página entera", body: "HTML mezclado" },
            right: { title: "Componente", body: "Pieza reutilizable" },
          },
          check: {
            prompt: "¿Qué es un componente en React?",
            options: [
              "Una pieza reutilizable de UI",
              "Un archivo CSS obligatorio",
              "Una tabla de base de datos",
              "Un servidor Node",
            ],
            correct_index: 0,
            feedback_ok: "Exacto.",
            feedback_bad: "Piensa en piezas de LEGO de interfaz.",
          },
        },
        {
          id: `r${d}-3`,
          phase: "learn",
          bot: "JSX parece HTML, pero es JavaScript: se transforma a llamadas que crean elementos.",
          visual: {
            kind: "code",
            label: "JSX",
            code: "function App() {\n  return <h1>Hola React</h1>;\n}",
          },
          check: {
            prompt: "¿Qué devuelve App en este ejemplo?",
            options: [
              "Un elemento UI con un título",
              "Una consulta SQL",
              "Un archivo .exe",
              "Nada: es solo un comentario",
            ],
            correct_index: 0,
            feedback_ok: "Devuelve UI descrita en JSX.",
            feedback_bad: "Mira el return <h1>…",
          },
        },
      ],
      // 2 JSX
      [
        {
          id: `r${d}-1`,
          phase: "intro",
          bot: "JSX te deja escribir UI con una sintaxis parecida a HTML dentro de JavaScript.",
          visual: { kind: "big_word", word: "JSX", sub: "HTML en JS" },
          check: {
            prompt: "JSX se usa para…",
            options: [
              "Describir la UI en el código",
              "Sustituir CSS por completo",
              "Crear tablas SQL",
              "Configurar el DNS",
            ],
            correct_index: 0,
            feedback_ok: "Correcto.",
            feedback_bad: "JSX describe interfaz.",
          },
        },
        {
          id: `r${d}-2`,
          phase: "learn",
          bot: "En JSX, class se escribe className y las expresiones van entre llaves { }.",
          visual: {
            kind: "code",
            label: "className + { }",
            code: 'const name = "Ana";\nreturn <p className="hi">Hola {name}</p>;',
          },
          check: {
            prompt: "En JSX, ¿cómo pones una clase CSS?",
            options: ["className", "class", "cssClass", "styleName"],
            correct_index: 0,
            feedback_ok: "className, porque class es reservada en JS.",
            feedback_bad: "Usa className.",
          },
        },
        {
          id: `r${d}-3`,
          phase: "learn",
          bot: "Un componente debe devolver un único raíz (o un Fragment <>…</>).",
          visual: {
            kind: "vs",
            left: { title: "Mal", body: "Dos roots sueltos" },
            right: { title: "Bien", body: "Un padre o <>…</>" },
          },
          check: {
            prompt: "Si devuelves dos <div> hermanos sin padre…",
            options: [
              "Hay error: hace falta un contenedor",
              "React lo une solo",
              "Se convierte en CSS",
              "Se ignora el segundo",
            ],
            correct_index: 0,
            feedback_ok: "Necesitas un único padre.",
            feedback_bad: "Envuelve en un div o Fragment.",
          },
        },
      ],
      // 3 Props
      [
        {
          id: `r${d}-1`,
          phase: "intro",
          bot: "Las props pasan datos de un componente padre a un hijo (como argumentos de función).",
          visual: { kind: "big_word", word: "props", sub: "datos de entrada" },
          check: {
            prompt: "Las props sirven para…",
            options: [
              "Pasar datos al componente hijo",
              "Guardar secretos del servidor",
              "Reemplazar el bundler",
              "Crear la base de datos",
            ],
            correct_index: 0,
            feedback_ok: "De padre a hijo.",
            feedback_bad: "Props = parámetros del componente.",
          },
        },
        {
          id: `r${d}-2`,
          phase: "learn",
          bot: "Así se ven las props en JSX y en la función.",
          visual: {
            kind: "code",
            label: "Props",
            code: "function Hi({ name }) {\n  return <p>Hola {name}</p>;\n}\n<Hi name=\"Luis\" />",
          },
          check: {
            prompt: "En <Hi name=\"Luis\" />, name es…",
            options: ["Una prop", "Un hook", "Un reducer", "Un CSS module"],
            correct_index: 0,
            feedback_ok: "Es una prop.",
            feedback_bad: "name se pasa como prop.",
          },
        },
        {
          id: `r${d}-3`,
          phase: "learn",
          bot: "Las props son de solo lectura: el hijo no debe mutarlas; pide cambios al padre.",
          visual: {
            kind: "steps",
            items: [
              { n: 1, label: "Padre pasa props" },
              { n: 2, label: "Hijo las muestra" },
              { n: 3, label: "Cambios vía callback" },
            ],
          },
          check: {
            prompt: "Si el hijo necesita cambiar un dato…",
            options: [
              "Llama a una función prop del padre",
              "Modifica la prop directamente",
              "Borra el componente",
              "Usa solo CSS",
            ],
            correct_index: 0,
            feedback_ok: "Flujo de datos hacia abajo; eventos hacia arriba.",
            feedback_bad: "No mutes props: avisa al padre.",
          },
        },
      ],
      // 4 useState
      [
        {
          id: `r${d}-1`,
          phase: "intro",
          bot: "useState guarda datos que cambian con el tiempo y provocan un re-render.",
          visual: { kind: "big_word", word: "useState", sub: "estado local" },
          check: {
            prompt: "useState se usa para…",
            options: [
              "Estado que cambia en el componente",
              "Consultas SQL",
              "Rutas del servidor",
              "Fuentes tipográficas",
            ],
            correct_index: 0,
            feedback_ok: "Estado local reactivo.",
            feedback_bad: "Es el hook de estado.",
          },
        },
        {
          id: `r${d}-2`,
          phase: "learn",
          bot: "Devuelve el valor actual y una función para actualizarlo.",
          visual: {
            kind: "code",
            label: "Contador",
            code: "const [n, setN] = useState(0);\n<button onClick={() => setN(n + 1)}>{n}</button>",
          },
          check: {
            prompt: "Al hacer clic, ¿qué actualiza el número?",
            options: ["setN", "useState otra vez", "document.write", "innerHTML"],
            correct_index: 0,
            feedback_ok: "Siempre el setter.",
            feedback_bad: "Usa setN, no mutes n a mano.",
          },
        },
        {
          id: `r${d}-3`,
          phase: "learn",
          bot: "Si el nuevo valor depende del anterior, usa la forma funcional: setN(prev => prev + 1).",
          visual: {
            kind: "vs",
            left: { title: "Frágil", body: "setN(n + 1) en cadena" },
            right: { title: "Seguro", body: "setN(p => p + 1)" },
          },
          check: {
            prompt: "La forma funcional del setter sirve cuando…",
            options: [
              "El valor nuevo depende del anterior",
              "No hay estado",
              "Solo usas CSS",
              "Renderizas en el servidor sin JS",
            ],
            correct_index: 0,
            feedback_ok: "Evita estados obsoletos.",
            feedback_bad: "Usa prev => …",
          },
        },
      ],
      // 5 Eventos
      [
        {
          id: `r${d}-1`,
          phase: "intro",
          bot: "Los eventos en React se escriben en camelCase: onClick, onChange, onSubmit.",
          visual: { kind: "big_word", word: "onClick", sub: "eventos React" },
          check: {
            prompt: "El click en React se declara como…",
            options: ["onClick", "onclick", "on-click", "click="],
            correct_index: 0,
            feedback_ok: "camelCase: onClick.",
            feedback_bad: "Es onClick.",
          },
        },
        {
          id: `r${d}-2`,
          phase: "learn",
          bot: "Pasas una función, no el resultado de llamarla: onClick={fn} y no onClick={fn()}.",
          visual: {
            kind: "code",
            label: "Handler",
            code: "function save() { /* … */ }\n<button onClick={save}>Guardar</button>",
          },
          check: {
            prompt: "onClick={save()} (con paréntesis)…",
            options: [
              "Ejecuta save al renderizar (casi siempre mal)",
              "Es la forma recomendada",
              "Desactiva el botón",
              "Solo funciona en CSS",
            ],
            correct_index: 0,
            feedback_ok: "Pasa la función, no la llamada.",
            feedback_bad: "Sin () al asignar el handler.",
          },
        },
        {
          id: `r${d}-3`,
          phase: "learn",
          bot: "En formularios, onChange + estado controlan el input (controlled component).",
          visual: {
            kind: "steps",
            items: [
              { n: 1, label: "Estado value" },
              { n: 2, label: "onChange → setValue" },
              { n: 3, label: "UI siempre sincronizada" },
            ],
          },
          check: {
            prompt: "Un input controlado toma su valor de…",
            options: ["El estado de React", "Solo el DOM nativo", "localStorage obligatorio", "El CSS"],
            correct_index: 0,
            feedback_ok: "value={estado}.",
            feedback_bad: "React manda con estado.",
          },
        },
      ],
      // 6 Listas
      [
        {
          id: `r${d}-1`,
          phase: "intro",
          bot: "Para pintar listas usas .map() y cada ítem necesita una key estable.",
          visual: { kind: "big_word", word: "key", sub: "listas en React" },
          check: {
            prompt: "La prop key ayuda a React a…",
            options: [
              "Identificar qué ítem cambió",
              "Sustituir CSS",
              "Conectar a MySQL",
              "Compilar TypeScript",
            ],
            correct_index: 0,
            feedback_ok: "Reconciliación eficiente.",
            feedback_bad: "key = identidad del ítem.",
          },
        },
        {
          id: `r${d}-2`,
          phase: "learn",
          bot: "Prefiere un id real como key; el índice del array solo si la lista es fija.",
          visual: {
            kind: "code",
            label: "map + key",
            code: "items.map(item => (\n  <li key={item.id}>{item.name}</li>\n))",
          },
          check: {
            prompt: "¿Qué key es mejor para usuarios?",
            options: ["user.id", "El índice 0,1,2 siempre", "Math.random()", "La clase CSS"],
            correct_index: 0,
            feedback_ok: "Ids estables.",
            feedback_bad: "Usa un id del dato.",
          },
        },
        {
          id: `r${d}-3`,
          phase: "learn",
          bot: "Si filtras o reordenas la lista, keys malas provocan bugs de estado en inputs.",
          visual: {
            kind: "vs",
            left: { title: "key={i}", body: "Frágil al reordenar" },
            right: { title: "key={id}", body: "Estable" },
          },
          check: {
            prompt: "Tras reordenar con key={index}, los inputs pueden…",
            options: [
              "Mostrar valores en el ítem equivocado",
              "Mejorar el SEO solos",
              "Borrar la base de datos",
              "Nada nunca",
            ],
            correct_index: 0,
            feedback_ok: "Por eso ids estables.",
            feedback_bad: "El estado se asocia mal sin buenas keys.",
          },
        },
      ],
      // 7 useEffect intro
      [
        {
          id: `r${d}-1`,
          phase: "intro",
          bot: "useEffect ejecuta código después del render: datos, suscripciones, timers.",
          visual: { kind: "big_word", word: "useEffect", sub: "efectos secundarios" },
          check: {
            prompt: "useEffect sirve para…",
            options: [
              "Efectos tras pintar la UI",
              "Definir el color del botón",
              "Crear el package.json",
              "Sustituir JSX",
            ],
            correct_index: 0,
            feedback_ok: "Efectos secundarios.",
            feedback_bad: "No es para el JSX principal.",
          },
        },
        {
          id: `r${d}-2`,
          phase: "learn",
          bot: "El array de dependencias decide cuándo se vuelve a ejecutar el efecto.",
          visual: {
            kind: "code",
            label: "deps",
            code: "useEffect(() => {\n  fetchUser(id);\n}, [id]);",
          },
          check: {
            prompt: "Si pones [id], el efecto corre cuando…",
            options: ["Cambia id", "Cambia cualquier estado", "Nunca", "Solo al cerrar la pestaña"],
            correct_index: 0,
            feedback_ok: "Deps = disparadores.",
            feedback_bad: "Mira el array [id].",
          },
        },
        {
          id: `r${d}-3`,
          phase: "learn",
          bot: "Si el efecto crea un timer o suscripción, devuelve una función de cleanup.",
          visual: {
            kind: "steps",
            items: [
              { n: 1, label: "Montas el efecto" },
              { n: 2, label: "Trabaja (fetch/timer)" },
              { n: 3, label: "Cleanup al desmontar" },
            ],
          },
          check: {
            prompt: "La función que retorna useEffect sirve para…",
            options: [
              "Limpiar al desmontar o antes de re-ejecutar",
              "Renderizar JSX",
              "Definir props",
              "Crear el Vite config",
            ],
            correct_index: 0,
            feedback_ok: "Cleanup.",
            feedback_bad: "Evita memory leaks.",
          },
        },
      ],
    ];
    return units[unit - 1] || units[0];
  }

  // Genérico: contenido del TEMA, nunca meta de estudio
  const focus = day.focus && !/unidad/i.test(day.focus) ? day.focus : `${t} · base ${unit}`;
  return [
    {
      id: `g${d}-1`,
      phase: "intro",
      bot: `Hoy aprendes ${focus}: qué es y para qué sirve en ${t}.`,
      visual: { kind: "big_word", word: focus.slice(0, 18), sub: t },
      html: `<div class="viz"><p><strong>${focus}</strong> dentro de <strong>${t}</strong></p><div class="row"><span class="pill">concepto</span><span class="pill">ejemplo</span><span class="pill">check</span></div></div>`,
      check: {
        prompt: `¿Qué practicas hoy?`,
        options: [
          focus,
          "Un tema no relacionado",
          "Solo el índice de un PDF",
          "Nada concreto",
        ],
        correct_index: 0,
        feedback_ok: `Sí: ${focus}.`,
        feedback_bad: `El foco es ${focus}.`,
      },
    },
    {
      id: `g${d}-2`,
      phase: "learn",
      bot: `Idea clave de ${focus}: recuérdala en una frase corta.`,
      visual: {
        kind: "vs",
        left: { title: "Confusión", body: "Definición vaga" },
        right: { title: "Claro", body: `${focus} con ejemplo` },
      },
      check: {
        prompt: `¿Qué describe mejor ${focus}?`,
        options: [
          `Una idea concreta de ${t}`,
          "Un detalle irrelevante",
          "Solo decoración",
          "Un error tipográfico",
        ],
        correct_index: 0,
        feedback_ok: "Bien.",
        feedback_bad: `Vuelve a ${focus}.`,
      },
    },
    {
      id: `g${d}-3`,
      phase: "learn",
      bot: `Ejemplo mínimo de ${focus}. Luego el test del día.`,
      visual: {
        kind: "code",
        label: "Ejemplo",
        code: `// ${focus}\n// aplica esto en ${t}`,
      },
      check: {
        prompt: `Este ejemplo ilustra…`,
        options: [
          focus,
          "Otro curso distinto",
          "Configuración de red",
          "Nada útil",
        ],
        correct_index: 0,
        feedback_ok: "Exacto.",
        feedback_bad: `Es sobre ${focus}.`,
      },
    },
  ];
}

/**
 * Empaqueta bloques sueltos en pantallas densas (bot + visual + check).
 * Si el contenido es débil, usa plantillas de calidad.
 */
function buildSlides(topic: string, day: PlanDay): LessonSlide[] {
  // Si el backend mandó fallbacks meta ("unidad N", PDF vs práctica), usa currículo real
  const focusBad =
    !day.focus ||
    /unidad\s*\d+/i.test(day.focus) ||
    /micro-pr[aá]ctica|p[aá]rrafos eternos|pasos cortos e interactivos/i.test(
      JSON.stringify(day.slides || day.intro || day.teach || []),
    );

  if (focusBad) {
    return qualitySlidesForDay(topic, day);
  }

  if (day.slides && day.slides.length >= 2) {
    const cleaned = day.slides
      .map((s, i) => ({
        ...s,
        id: s.id || `s-${day.day}-${i}`,
        bot: (s.bot || "").trim(),
        phase: s.phase === "learn" ? ("learn" as const) : ("intro" as const),
      }))
      .filter((s) => s.bot || s.visual || s.html || s.check);
    const metaish = cleaned.some(
      (s) =>
        /pdf largo|p[aá]rrafos eternos|pasos cortos e interactivos|leyendo un muro/i.test(
          `${s.bot} ${s.check?.prompt || ""} ${(s.check?.options || []).join(" ")}`,
        ),
    );
    const weak = cleaned.filter((s) => isWeakBot(s.bot)).length >= Math.ceil(cleaned.length / 2);
    if (!weak && !metaish && cleaned.length >= 2) return cleaned;
  }

  const rawBlocks = [...(day.intro || []), ...(day.teach || [])];
  const slides: LessonSlide[] = [];
  let i = 0;
  let phase: "intro" | "learn" = "intro";
  const introLen = day.intro?.length || 0;

  while (i < rawBlocks.length) {
    const block = rawBlocks[i];
    phase = i < introLen ? "intro" : "learn";
    const kind = (block.kind || "").toLowerCase();

    let bot = "";
    let visual: PlanBlock | null = null;
    let html: string | undefined;
    let check: LessonSlide["check"] = null;

    if (kind === "bot_say" || kind === "card") {
      bot = (block.text || block.body || "").trim();
      i += 1;
    }

    // absorber visual siguiente
    if (i < rawBlocks.length) {
      const n = rawBlocks[i];
      const nk = (n.kind || "").toLowerCase();
      if (["big_word", "chips", "vs", "steps", "code", "html", "card"].includes(nk) && nk !== "tap") {
        if (nk === "html") html = n.html;
        else if (nk === "card" && !bot) {
          bot = (n.body || n.text || "").trim();
          visual = { kind: "big_word", word: n.title || day.focus, sub: (n.body || "").slice(0, 60) };
        } else {
          visual = n;
        }
        i += 1;
      }
    }

    // absorber check
    if (i < rawBlocks.length && (rawBlocks[i].kind || "").toLowerCase() === "tap") {
      const t = rawBlocks[i];
      check = {
        prompt: t.prompt || "¿Qué es correcto?",
        options: t.options || [],
        correct_index: t.correct_index ?? 0,
        feedback_ok: t.feedback_ok,
        feedback_bad: t.feedback_bad,
      };
      i += 1;
    }

    // si empezamos con visual sin bot
    if (!bot && (visual || html)) {
      bot = `Mira esto sobre ${day.focus}.`;
    }
    if (!bot && check) {
      bot = check.prompt;
      check = { ...check };
    }

    if (bot || visual || html || check) {
      slides.push({
        id: `pack-${day.day}-${slides.length}`,
        phase,
        bot: bot || `Sobre ${day.focus}`,
        visual,
        html,
        check,
      });
    } else {
      i += 1;
    }
  }

  const weakBots = slides.filter((s) => isWeakBot(s.bot)).length;
  const orphanVisuals = slides.filter((s) => !s.check && s.visual && isWeakBot(s.bot)).length;
  const weak =
    slides.length < 2 ||
    weakBots >= Math.max(1, Math.ceil(slides.length / 2)) ||
    orphanVisuals >= slides.length; // solo palabras sueltas sin explicación

  if (weak) return qualitySlidesForDay(topic, day);
  return slides;
}

function VisualOnly({ block }: { block: PlanBlock }) {
  const kind = (block.kind || "card").toLowerCase();

  if (kind === "big_word") {
    return (
      <div className="sa-duo-bigword">
        <span className="sa-duo-bigword__word">{block.word || block.title}</span>
        {block.sub ? <span className="sa-duo-bigword__sub">{block.sub}</span> : null}
      </div>
    );
  }
  if (kind === "chips") {
    const items = (block.items || [])
      .map((it) => (typeof it === "string" ? it : it.label || ""))
      .filter(Boolean);
    return (
      <div className="sa-duo-chips">
        {items.map((item) => (
          <span key={item} className="sa-duo-chip">
            {item}
          </span>
        ))}
      </div>
    );
  }
  if (kind === "vs") {
    return (
      <div className="sa-duo-vs">
        <div className="sa-duo-vs__card sa-duo-vs__card--left">
          <strong>{block.left?.title || "A"}</strong>
          <p>{block.left?.body}</p>
        </div>
        <span className="sa-duo-vs__vs">VS</span>
        <div className="sa-duo-vs__card sa-duo-vs__card--right">
          <strong>{block.right?.title || "B"}</strong>
          <p>{block.right?.body}</p>
        </div>
      </div>
    );
  }
  if (kind === "steps") {
    const items = (block.items || [])
      .map((it, idx) =>
        typeof it === "string"
          ? { n: idx + 1, label: it }
          : { n: it.n || idx + 1, label: it.label || "" },
      )
      .filter((it) => it.label);
    return (
      <div className="sa-duo-steps">
        {items.map((it) => (
          <div key={`${it.n}-${it.label}`} className="sa-duo-step">
            <span className="sa-duo-step__n">{it.n}</span>
            <span>{it.label}</span>
          </div>
        ))}
      </div>
    );
  }
  if (kind === "code") {
    return (
      <div className="sa-duo-code">
        {block.label ? <span className="sa-duo-code__label">{block.label}</span> : null}
        <pre>
          <code>{block.code}</code>
        </pre>
      </div>
    );
  }
  if (kind === "html" && block.html) {
    return (
      <div
        className="sa-duo-html"
        dangerouslySetInnerHTML={{ __html: sanitizeLessonHtml(block.html) }}
      />
    );
  }
  return (
    <div className="sa-duo-bigword">
      <span className="sa-duo-bigword__word">{block.title || block.word || "Idea"}</span>
      <span className="sa-duo-bigword__sub">{block.body || block.text}</span>
    </div>
  );
}

function ChoiceList({
  options,
  correctIndex,
  picked,
  revealed,
  onPick,
}: {
  options: string[];
  correctIndex: number;
  picked: number | null;
  revealed: boolean;
  onPick: (idx: number) => void;
}) {
  return (
    <div className="sa-duo-choices">
      {options.map((opt, idx) => {
        let cls = "sa-choice";
        if (revealed) {
          if (idx === correctIndex) cls += " sa-duo-choice--ok";
          else if (idx === picked) cls += " sa-duo-choice--bad";
        } else if (picked === idx) {
          cls += " sa-choice--on";
        }
        return (
          <button
            key={`${opt}-${idx}`}
            type="button"
            disabled={revealed}
            className={cls}
            onClick={() => onPick(idx)}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Lección Duolingo densa: pantallas con bot + visual + check, luego test.
 */
export default function StudyPlanSession({ plan, storageKey }: Props) {
  const key = storageKey || `sa_plan_${plan.topic}`;
  const days = plan.days || [];
  const xpEach = plan.xp_per_correct ?? 10;

  const daysPrepared = useMemo(() => {
    const seen = new Set<string>();
    return days.map((d) => {
      const slides = buildSlides(plan.topic, d);
      let questions = dedupeQuestions(d.questions || [], seen);
      if (questions.length < 2) {
        const focus = d.focus || plan.topic;
        const extras: PlanQuestion[] = [
          {
            id: `${d.day}-fq1`,
            prompt: `¿Qué resume mejor ${focus}?`,
            options: [
              `La idea práctica de ${focus}`,
              "Un detalle sin importancia",
              "Memorizar el índice",
              "Ignorar ejemplos",
            ],
            correct_index: 0,
            feedback_ok: "Bien.",
            feedback_bad: `Repasa ${focus}.`,
          },
          {
            id: `${d.day}-fq2`,
            prompt: `Si aplicas ${focus}, ¿qué haces?`,
            options: [
              "Practicar con un ejemplo mínimo",
              "Leer sin tocar nada",
              "Copiar sin entender",
              "Saltar el test",
            ],
            correct_index: 0,
            feedback_ok: "Eso es.",
            feedback_bad: "Hay que practicar.",
          },
        ];
        questions = dedupeQuestions([...questions, ...extras], seen);
      }
      return { ...d, slides, questions };
    });
  }, [days, plan.topic]);

  const [progress, setProgress] = useState<Progress>(() =>
    loadProgress(key, days.length || 1, plan.started_at),
  );
  const [activeDay, setActiveDay] = useState<(typeof daysPrepared)[0] | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [inTest, setInTest] = useState(false);
  const [qIndex, setQIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [dayXp, setDayXp] = useState(0);
  const [dayDone, setDayDone] = useState(false);
  const [celebrateXp, setCelebrateXp] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(key, JSON.stringify(progress));
    }
  }, [key, progress]);

  const today = todayISO();
  const calendarDay = Math.min(daysPrepared.length, daysBetween(progress.startedAt, today) + 1);
  const todayLesson =
    daysPrepared.find(
      (d) =>
        d.day === calendarDay &&
        !progress.completedDays.includes(d.day) &&
        d.day <= progress.unlockedDay,
    ) ||
    daysPrepared.find(
      (d) => !progress.completedDays.includes(d.day) && d.day <= progress.unlockedDay,
    ) ||
    null;

  const slides = activeDay?.slides || [];
  const slide = slides[slideIndex];
  const currentQ = activeDay?.questions[qIndex];
  const totalSteps = slides.length + (activeDay?.questions.length || 0);
  const doneSteps = inTest ? slides.length + qIndex : slideIndex;
  const dayProgress = totalSteps ? ((doneSteps + (revealed ? 0.35 : 0)) / totalSteps) * 100 : 0;
  const phase = inTest ? "test" : slide?.phase === "learn" ? "learn" : "intro";

  const startDay = (d: (typeof daysPrepared)[0]) => {
    if (d.day > progress.unlockedDay) return;
    // Puedes hacer varias lecciones seguidas (sin bloqueo por calendario)
    setActiveDay(d);
    setSlideIndex(0);
    setInTest(false);
    setQIndex(0);
    setPicked(null);
    setRevealed(false);
    setDayXp(0);
    setDayDone(false);
  };

  const choose = (idx: number, correctIndex: number) => {
    if (revealed) return;
    setPicked(idx);
    setRevealed(true);
    if (idx === correctIndex) setDayXp((x) => x + xpEach);
  };

  const finishDay = () => {
    if (!activeDay) return;
    const already = progress.completedDays.includes(activeDay.day);
    const completed = already
      ? progress.completedDays
      : [...progress.completedDays, activeDay.day];
    const newXp = already ? progress.xp : progress.xp + dayXp;
    setCelebrateXp(newXp);
    setProgress({
      unlockedDay: Math.min(Math.max(progress.unlockedDay, activeDay.day + 1), daysPrepared.length),
      completedDays: completed,
      xp: newXp,
      startedAt: progress.startedAt,
      lastCompletedDate: today,
    });
    setDayDone(true);
  };

  const nextAfterSlide = () => {
    if (slideIndex >= slides.length - 1) {
      setInTest(true);
      setQIndex(0);
      setPicked(null);
      setRevealed(false);
      return;
    }
    setSlideIndex((i) => i + 1);
    setPicked(null);
    setRevealed(false);
  };

  const nextAfterTest = () => {
    if (!activeDay) return;
    if (qIndex >= activeDay.questions.length - 1) {
      finishDay();
      return;
    }
    setQIndex((i) => i + 1);
    setPicked(null);
    setRevealed(false);
  };

  const backToMap = () => {
    setActiveDay(null);
    setDayDone(false);
    setInTest(false);
    setPicked(null);
    setRevealed(false);
    setSlideIndex(0);
    setQIndex(0);
  };

  if (activeDay && dayDone) {
    return (
      <div className={`${outfit.className} sa-steps-card sa-duo-shell sa-pop`}>
        <div className="sa-duo-celebrate">
          <StudyAgentsBotAvatar size={80} color={SA_PRIMARY} state="idle" />
          <h3 className={spaceGrotesk.className}>¡Día {activeDay.day} listo!</h3>
          <p className="sa-duo-celebrate__xp">+{dayXp} XP</p>
          <p className="sa-duo-celebrate__sub">
            {activeDay.title} · Total {celebrateXp} XP
          </p>
          <p className="sa-duo-celebrate__hint">Puedes seguir con la siguiente lección ahora mismo.</p>
        </div>
        <button type="button" className="sa-btn sa-btn--primary" style={{ width: "100%" }} onClick={backToMap}>
          Volver al camino →
        </button>
      </div>
    );
  }

  if (activeDay && slide && !inTest) {
    const hasCheck = !!(slide.check && slide.check.options && slide.check.options.length >= 2);
    const botText = isWeakBot(slide.bot)
      ? `Hoy practicamos ${activeDay.focus}. Mira el visual y sigue.`
      : slide.bot;

    return (
      <div
        className={`${outfit.className} sa-steps-card sa-duo-shell sa-pop`}
        key={slide.id}
      >
        <div className="sa-duo-top">
          <button type="button" className="sa-chip" onClick={backToMap} style={{ borderRadius: 12 }}>
            ← Camino
          </button>
          <div className="sa-duo-phase">
            <span className={phase === "intro" ? "on" : ""}>1 Intro</span>
            <span className={phase === "learn" ? "on" : ""}>2 Aprende</span>
            <span className={phase === "test" ? "on" : ""}>3 Test</span>
          </div>
          <span className="sa-duo-xp">+{dayXp} XP</span>
        </div>
        <div className="sa-steps-progress">
          <span style={{ width: `${Math.max(8, dayProgress)}%` }} />
        </div>
        <p className="sa-duo-focus">
          {phase === "intro" ? "Intro" : "Aprende"} · {activeDay.focus}
        </p>

        <div className="sa-duo-screen">
          <div className="sa-duo-botrow sa-duo-botrow--lg">
            <StudyAgentsBotAvatar size={72} color={SA_PRIMARY} state="idle" />
            <div className="sa-duo-bubble">
              <p>{botText}</p>
            </div>
          </div>

          {slide.visual ? (
            <div className="sa-duo-visual">
              <VisualOnly block={slide.visual} />
            </div>
          ) : null}

          {slide.html ? (
            <div
              className="sa-duo-html sa-duo-visual"
              dangerouslySetInnerHTML={{ __html: sanitizeLessonHtml(slide.html) }}
            />
          ) : null}

          {hasCheck && (
            <div className="sa-duo-checkblock">
              <p className="sa-duo-checkblock__label">TOCA LA RESPUESTA</p>
              {!revealed || picked === null ? (
                <ChoiceList
                  options={slide.check!.options}
                  correctIndex={slide.check!.correct_index}
                  picked={picked}
                  revealed={revealed}
                  onPick={(idx) => choose(idx, slide.check!.correct_index)}
                />
              ) : (
                <>
                  <ChoiceList
                    options={slide.check!.options}
                    correctIndex={slide.check!.correct_index}
                    picked={picked}
                    revealed={revealed}
                    onPick={() => {}}
                  />
                  <div
                    className={`sa-duo-feedback ${picked === slide.check!.correct_index ? "ok" : "bad"}`}
                  >
                    <p className="sa-duo-feedback__title">
                      {picked === slide.check!.correct_index ? "¡Bien!" : "Casi"}
                    </p>
                    <p>
                      {picked === slide.check!.correct_index
                        ? slide.check!.feedback_ok
                        : slide.check!.feedback_bad}
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {(!hasCheck || revealed) && (
          <button
            type="button"
            className="sa-btn sa-btn--primary"
            style={{ width: "100%", marginTop: "1.1rem" }}
            onClick={nextAfterSlide}
          >
            {slideIndex >= slides.length - 1 ? "Ir al test →" : "Siguiente →"}
          </button>
        )}
      </div>
    );
  }

  if (activeDay && inTest && currentQ) {
    return (
      <div className={`${outfit.className} sa-steps-card sa-duo-shell sa-pop`} key={currentQ.id}>
        <div className="sa-duo-top">
          <button type="button" className="sa-chip" onClick={backToMap} style={{ borderRadius: 12 }}>
            ← Camino
          </button>
          <div className="sa-duo-phase">
            <span>1 Intro</span>
            <span>2 Aprende</span>
            <span className="on">3 Test</span>
          </div>
          <span className="sa-duo-xp">+{dayXp} XP</span>
        </div>
        <div className="sa-steps-progress">
          <span style={{ width: `${Math.max(8, dayProgress)}%` }} />
        </div>
        <p className="sa-duo-focus">
          Test · {qIndex + 1}/{activeDay.questions.length}
        </p>

        <div className="sa-duo-screen">
          <div className="sa-duo-botrow sa-duo-botrow--lg">
            <StudyAgentsBotAvatar size={72} color={SA_PRIMARY} state="thinking" />
            <div className="sa-duo-bubble sa-duo-bubble--test">
              <p className="sa-duo-test-label">TEST DEL DÍA</p>
              <p>{currentQ.prompt}</p>
            </div>
          </div>
          <ChoiceList
            options={currentQ.options}
            correctIndex={currentQ.correct_index}
            picked={picked}
            revealed={revealed}
            onPick={(idx) => choose(idx, currentQ.correct_index)}
          />
          {revealed && (
            <div className={`sa-duo-feedback ${picked === currentQ.correct_index ? "ok" : "bad"}`}>
              <p className="sa-duo-feedback__title">
                {picked === currentQ.correct_index ? "¡Correcto!" : "Casi — sigue"}
              </p>
              <p>{picked === currentQ.correct_index ? currentQ.feedback_ok : currentQ.feedback_bad}</p>
              <button
                type="button"
                className="sa-btn sa-btn--primary"
                style={{ width: "100%", marginTop: "0.75rem" }}
                onClick={nextAfterTest}
              >
                {qIndex >= activeDay.questions.length - 1 ? "Terminar día →" : "Siguiente →"}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (activeDay && inTest) {
    return (
      <div className={`${outfit.className} sa-steps-card`}>
        <button type="button" className="sa-btn sa-btn--primary" style={{ width: "100%" }} onClick={finishDay}>
          Terminar día →
        </button>
      </div>
    );
  }

  const allDone = daysPrepared.length > 0 && progress.completedDays.length >= daysPrepared.length;
  const streakHint =
    progress.completedDays.length === 0
      ? "Empieza hoy — 1 lección al día."
      : progress.lastCompletedDate === today
        ? "¡Lección de hoy hecha! Vuelve mañana."
        : `Llevas ${progress.completedDays.length} día(s). Hoy toca seguir.`;

  return (
    <div className={`${outfit.className} sa-steps-card sa-duo-shell sa-pop`}>
      <div className="sa-duo-maphead">
        <StudyAgentsBotAvatar size={52} color={SA_PRIMARY} state="idle" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 className={spaceGrotesk.className}>{plan.topic} · Diario</h3>
          <p>
            {plan.minutes_per_day || daysPrepared[0]?.minutes || 5} min/día · {streakHint}
          </p>
        </div>
        <span className="sa-duo-xp">{progress.xp} XP</span>
      </div>

      {!allDone && todayLesson && (
        <button type="button" className="sa-duo-today" onClick={() => startDay(todayLesson)}>
          <StudyAgentsBotAvatar size={48} color={SA_PRIMARY} state="idle" />
          <div style={{ flex: 1, textAlign: "left" }}>
            <p className="sa-duo-today__label">HOY · RECORDATORIO</p>
            <p className={spaceGrotesk.className} style={{ margin: "0.2rem 0 0", fontWeight: 800, fontSize: "1.05rem" }}>
              Día {todayLesson.day}: {todayLesson.title}
            </p>
            <p style={{ margin: "0.2rem 0 0", fontSize: "0.8rem", color: "#64748b" }}>
              Intro → Aprende → Test · ~{todayLesson.minutes} min
            </p>
          </div>
        </button>
      )}

      {allDone && <p className="sa-duo-donebanner">Curso completado. ¡Buen trabajo!</p>}

      <div className="sa-duo-path">
        {daysPrepared.map((d, i) => {
          const locked = d.day > progress.unlockedDay;
          const done = progress.completedDays.includes(d.day);
          const isToday = todayLesson?.day === d.day;
          return (
            <div key={d.day} className="sa-duo-path__item">
              {i > 0 && (
                <div className={`sa-duo-path__line ${done || d.day <= progress.unlockedDay ? "on" : ""}`} />
              )}
              <button
                type="button"
                disabled={locked}
                onClick={() => startDay(d)}
                className={`sa-duo-node ${locked ? "locked" : ""} ${done ? "done" : ""} ${isToday ? "today" : ""}`}
              >
                <span className="sa-duo-node__icon">{done ? "✓" : locked ? "·" : "▶"}</span>
                <span className="sa-duo-node__text">
                  <strong>
                    Día {d.day}: {d.title}
                  </strong>
                  <small>{d.focus}</small>
                </span>
                <span className="sa-duo-node__min">{d.minutes}m</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function parseInteractivePlan(raw: string): InteractivePlan | null {
  try {
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.days)) return null;
    if (
      data.format === "interactive_v1" ||
      data.format === "interactive_v2" ||
      data.format === "interactive_v3" ||
      data.format === "interactive_v4" ||
      data.topic
    ) {
      return data as InteractivePlan;
    }
  } catch {
    /* ignore */
  }
  return null;
}
