"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import DOMPurify from "dompurify";
import { outfit, spaceGrotesk } from "@/app/fonts";
import StudyAgentsBotAvatar from "@/components/study-agents/StudyAgentsBotAvatar";
import { SA_BOT_FACE } from "@/lib/study-agents/brand";
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
  if (/^(vamos|hola|ok|sí|si|ahora|hoy)[.!]?$/i.test(t)) return true;
  if (/\bes\s*$/i.test(t) || /\bes\s+[a-záéíóú]{1,3}$/i.test(t)) return true;
  return false;
}

function isMetaQuestion(q: PlanQuestion): boolean {
  const blob = `${q.prompt} ${(q.options || []).join(" ")}`.toLowerCase();
  return (
    /unidad\s*\d+/.test(blob) ||
    /concepto opuesto|uso t[ií]pico de|definici[oó]n de|ejemplo de .{0,40}unidad/.test(blob) ||
    /qu[eé] resume mejor|qu[eé] no encaja|detalle irrelevante|índice del pdf|indice del pdf/.test(blob) ||
    /idea pr[aá]ctica de|memorizar el [ií]ndice|saltar el test|copiar sin entender/.test(blob) ||
    /pasos cortos|leyendo un muro|pdf largo/.test(blob) ||
    /qu[eé] practicas hoy|tema no relacionado|nada concreto|nada [uú]til|detalle sin relaci[oó]n/.test(blob) ||
    /solo el [ií]ndice|solo leer sin practicar|ignorar el concepto|una idea concreta de/.test(blob) ||
    /sobre .{1,40}: \¿?qu[eé] es m[aá]s correcto/.test(blob)
  );
}

function isMetaFocus(focus?: string, title?: string): boolean {
  const blob = `${focus || ""} ${title || ""}`.toLowerCase().trim();
  if (!blob) return true;
  return (
    /concepto clave|unidad\s*\d+|micro-pr[aá]ctica|p[aá]rrafos eternos|pasos cortos/.test(blob) ||
    /idea central|piezas b[aá]sicas|c[oó]mo se escribe|acciones t[ií]picas|aplicar hoy/.test(blob) ||
    /base \d+|· base/.test(blob)
  );
}

type LangId = "it" | "en" | "fr" | "de" | "ja" | "pt" | "zh";

type LangPack = {
  id: LangId;
  name: string;
};

function detectLanguage(topic: string): LangPack | null {
  const tl = topic
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (/italian|italiano/.test(tl)) return { id: "it", name: "Italiano" };
  if (/\benglish\b|\bingles\b|\bingl[eé]s\b/.test(tl) || tl === "en") return { id: "en", name: "Inglés" };
  if (/franc[eé]s|frances|french|fran[cç]ais/.test(tl)) return { id: "fr", name: "Francés" };
  if (/alem[aá]n|aleman|german|deutsch/.test(tl)) return { id: "de", name: "Alemán" };
  if (/japon[eé]s|japones|japanese|nihongo/.test(tl)) return { id: "ja", name: "Japonés" };
  if (/portugu[eé]s|portugues|portuguese/.test(tl)) return { id: "pt", name: "Portugués" };
  if (/chino|chinese|mandarin|mandar[ií]n/.test(tl)) return { id: "zh", name: "Chino" };
  return null;
}

/** Vocabulario y lecciones reales por idioma (7 días). */
function languageDayMeta(lang: LangPack, dayNum: number): { title: string; focus: string } {
  const banks: Record<LangId, Array<{ title: string; focus: string }>> = {
    it: [
      { title: "Saludos", focus: "Ciao y Buongiorno" },
      { title: "Alfabeto", focus: "Sonidos italianos" },
      { title: "Artículos", focus: "il, la, un, una" },
      { title: "Presentarse", focus: "Mi chiamo / Sono" },
      { title: "Números", focus: "Uno a dieci" },
      { title: "Essere y avere", focus: "Verbos ser y tener" },
      { title: "Frases útiles", focus: "Grazie y Per favore" },
    ],
    en: [
      { title: "Greetings", focus: "Hello / Good morning" },
      { title: "Alphabet", focus: "Sounds and spelling" },
      { title: "Articles", focus: "a / an / the" },
      { title: "Introduce yourself", focus: "My name is / I am" },
      { title: "Numbers", focus: "One to ten" },
      { title: "To be / to have", focus: "am, is, are / have" },
      { title: "Useful phrases", focus: "Please and Thank you" },
    ],
    fr: [
      { title: "Salutations", focus: "Bonjour / Salut" },
      { title: "Alphabet", focus: "Sons français" },
      { title: "Articles", focus: "le, la, un, une" },
      { title: "Se présenter", focus: "Je m'appelle / Je suis" },
      { title: "Nombres", focus: "Un à dix" },
      { title: "Être et avoir", focus: "Verbos ser y tener" },
      { title: "Phrases utiles", focus: "Merci et S'il vous plaît" },
    ],
    de: [
      { title: "Begrüßung", focus: "Hallo / Guten Tag" },
      { title: "Alphabet", focus: "Sonidos alemanes" },
      { title: "Artikel", focus: "der, die, das" },
      { title: "Vorstellen", focus: "Ich heiße / Ich bin" },
      { title: "Zahlen", focus: "Eins bis zehn" },
      { title: "Sein und haben", focus: "sein / haben" },
      { title: "Nützliche Sätze", focus: "Danke und Bitte" },
    ],
    ja: [
      { title: "Saludos", focus: "こんにちは / おはよう" },
      { title: "Hiragana base", focus: "あいうえお" },
      { title: "Partículas", focus: "は / を / の" },
      { title: "Presentarse", focus: "〜です / 名前は" },
      { title: "Números", focus: "一〜十" },
      { title: "Desu / masu", focus: "Formas educadas" },
      { title: "Frases útiles", focus: "ありがとう / お願いします" },
    ],
    pt: [
      { title: "Saudações", focus: "Olá / Bom dia" },
      { title: "Alfabeto", focus: "Sons portugueses" },
      { title: "Artigos", focus: "o, a, um, uma" },
      { title: "Apresentar-se", focus: "Chamo-me / Sou" },
      { title: "Números", focus: "Um a dez" },
      { title: "Ser e ter", focus: "sou, é / tenho" },
      { title: "Frases úteis", focus: "Obrigado e Por favor" },
    ],
    zh: [
      { title: "Saludos", focus: "你好 / 早上好" },
      { title: "Tonos", focus: "4 tonos básicos" },
      { title: "Pronombres", focus: "我 / 你 / 他" },
      { title: "Presentarse", focus: "我叫… / 我是…" },
      { title: "Números", focus: "一到十" },
      { title: "Es / tener", focus: "是 / 有" },
      { title: "Frases útiles", focus: "谢谢 / 请" },
    ],
  };
  const list = banks[lang.id];
  return list[(dayNum - 1) % list.length];
}

function languageSlides(lang: LangPack, dayNum: number): LessonSlide[] {
  const name = lang.name;
  const d = dayNum;
  const unit = ((d - 1) % 7) + 1;
  const meta = languageDayMeta(lang, d);

  const packs: Record<LangId, LessonSlide[][]> = {
    it: [
      [
        {
          id: `it${d}-1`,
          phase: "intro",
          bot: "En italiano, Ciao sirve entre amigos; Buongiorno es el saludo formal de día.",
          visual: { kind: "big_word", word: "Ciao!", sub: "saludo informal" },
          html: `<div class="viz"><div class="row"><span class="pill">Ciao</span><span class="pill">Buongiorno</span><span class="pill">Buonasera</span></div><p>Arrivederci = hasta luego.</p></div>`,
          check: {
            prompt: "¿Qué usas con un amigo por la calle?",
            options: ["Ciao", "Buongiorno dottore", "Arrivederci signore", "Per favore"],
            correct_index: 0,
            feedback_ok: "Ciao = informal.",
            feedback_bad: "Con amigos: Ciao.",
          },
        },
        {
          id: `it${d}-2`,
          phase: "learn",
          bot: "Buongiorno (mañana/día) y Buonasera (tarde/noche) suenan más educados.",
          visual: {
            kind: "vs",
            left: { title: "Informal", body: "Ciao" },
            right: { title: "Formal", body: "Buongiorno / Buonasera" },
          },
          check: {
            prompt: "En una tienda por la mañana, lo más natural es…",
            options: ["Buongiorno", "Ciao a todos ya", "Solo silbar", "Good morning en inglés"],
            correct_index: 0,
            feedback_ok: "Buongiorno es el clásico.",
            feedback_bad: "Formal de día = Buongiorno.",
          },
        },
        {
          id: `it${d}-3`,
          phase: "learn",
          bot: "Para despedirte: Ciao (informal) o Arrivederci (más formal).",
          visual: {
            kind: "steps",
            items: [
              { n: 1, label: "Entras: Buongiorno" },
              { n: 2, label: "Hablas" },
              { n: 3, label: "Sales: Arrivederci" },
            ],
          },
          check: {
            prompt: "Arrivederci significa…",
            options: ["Hasta luego / adiós", "Por favor", "Gracias", "Me llamo"],
            correct_index: 0,
            feedback_ok: "Despedida.",
            feedback_bad: "Es una despedida.",
          },
        },
      ],
      [
        {
          id: `it${d}-1`,
          phase: "intro",
          bot: "El italiano se lee casi como se escribe. Cuidado: c + e/i suena como «ch» española.",
          visual: { kind: "big_word", word: "Ciao", sub: "se lee «chao»" },
          check: {
            prompt: "¿Cómo se lee Ciao?",
            options: ["Chao", "Kiao", "Siao", "Cee-ao"],
            correct_index: 0,
            feedback_ok: "Ciao ≈ chao.",
            feedback_bad: "C+i = sonido «ch».",
          },
        },
        {
          id: `it${d}-2`,
          phase: "learn",
          bot: "ch + e/i suena como «k»: che = ke. gli suena suave (familia: famiglia).",
          visual: {
            kind: "vs",
            left: { title: "ce / ci", body: "como che / chi" },
            right: { title: "che / chi", body: "como ke / ki" },
          },
          check: {
            prompt: "En italiano, «che» suena aproximadamente…",
            options: ["ke", "che (español)", "se", "ge"],
            correct_index: 0,
            feedback_ok: "che ≈ ke.",
            feedback_bad: "ch = sonido k.",
          },
        },
        {
          id: `it${d}-3`,
          phase: "learn",
          bot: "La g doble (gg) y la doble consonante se alargan: pizza, nonno.",
          visual: {
            kind: "code",
            label: "Ejemplos",
            code: "pizza  → pit-tsa\nnonno  → non-no\nfoglio → fo-llio (gli)",
          },
          check: {
            prompt: "En «pizza», la zz indica…",
            options: ["Sonido fuerte/alargado", "Que es plural", "Que es inglés", "Silencio"],
            correct_index: 0,
            feedback_ok: "Consonante doble = más marcada.",
            feedback_bad: "Las dobles se notan al hablar.",
          },
        },
      ],
      [
        {
          id: `it${d}-1`,
          phase: "intro",
          bot: "Artículos definidos: il (masculino), la (femenino). Plural: i / le (y gli en casos especiales).",
          visual: { kind: "big_word", word: "il / la", sub: "el / la" },
          check: {
            prompt: "«La casa» usa la porque…",
            options: ["casa es femenino", "casa es plural", "siempre se usa la", "es un verbo"],
            correct_index: 0,
            feedback_ok: "la + femenino singular.",
            feedback_bad: "Género: il/la.",
          },
        },
        {
          id: `it${d}-2`,
          phase: "learn",
          bot: "Indefinidos: un (masc.), una (fem.). Ejemplo: un libro, una penna.",
          visual: {
            kind: "vs",
            left: { title: "un", body: "un amico, un libro" },
            right: { title: "una", body: "una amica, una casa" },
          },
          check: {
            prompt: "«Una pizza» es correcto porque…",
            options: ["pizza es femenino", "pizza es masculino", "una = plural", "una es verbo"],
            correct_index: 0,
            feedback_ok: "una + femenino.",
            feedback_bad: "Mira el género de pizza.",
          },
        },
        {
          id: `it${d}-3`,
          phase: "learn",
          bot: "Delante de vocal a veces aparece l': l'amico, l'acqua.",
          visual: {
            kind: "steps",
            items: [
              { n: 1, label: "il + vocal → l'" },
              { n: 2, label: "la + vocal → l'" },
              { n: 3, label: "Ej: l'acqua" },
            ],
          },
          check: {
            prompt: "Antes de «acqua» escribes…",
            options: ["l'acqua", "il acqua", "la acqua siempre", "un acqua"],
            correct_index: 0,
            feedback_ok: "Apóstrofe: l'acqua.",
            feedback_bad: "Vocal → l'.",
          },
        },
      ],
      [
        {
          id: `it${d}-1`,
          phase: "intro",
          bot: "Para decir tu nombre: Mi chiamo Ana. También: Sono Ana.",
          visual: { kind: "big_word", word: "Mi chiamo…", sub: "Me llamo…" },
          check: {
            prompt: "«Mi chiamo Luca» significa…",
            options: ["Me llamo Luca", "Tengo hambre", "Soy de Roma", "Hasta luego"],
            correct_index: 0,
            feedback_ok: "Presentación del nombre.",
            feedback_bad: "chiamarsi = llamarse.",
          },
        },
        {
          id: `it${d}-2`,
          phase: "learn",
          bot: "Pregunta: Come ti chiami? Respuesta: Mi chiamo…",
          visual: {
            kind: "vs",
            left: { title: "Pregunta", body: "Come ti chiami?" },
            right: { title: "Respuesta", body: "Mi chiamo…" },
          },
          check: {
            prompt: "Para preguntar el nombre dices…",
            options: ["Come ti chiami?", "Come stai libro?", "Quanto costa?", "Dov'è il bagno?"],
            correct_index: 0,
            feedback_ok: "Come ti chiami?",
            feedback_bad: "Es la pregunta del nombre.",
          },
        },
        {
          id: `it${d}-3`,
          phase: "learn",
          bot: "Di dove sei? → Sono di Madrid. / Sono spagnolo/a.",
          visual: {
            kind: "code",
            label: "Mini diálogo",
            code: "A: Come ti chiami?\nB: Mi chiamo Sara.\nA: Di dove sei?\nB: Sono di Barcellona.",
          },
          check: {
            prompt: "«Sono di Roma» indica…",
            options: ["De dónde eres", "Qué edad tienes", "Qué comes", "La hora"],
            correct_index: 0,
            feedback_ok: "Origen / ciudad.",
            feedback_bad: "di + ciudad = origen.",
          },
        },
      ],
      [
        {
          id: `it${d}-1`,
          phase: "intro",
          bot: "Números 1–10: uno, due, tre, quattro, cinque, sei, sette, otto, nove, dieci.",
          visual: { kind: "big_word", word: "1 → 10", sub: "uno … dieci" },
          check: {
            prompt: "¿Cómo se dice 3 en italiano?",
            options: ["tre", "trois", "three", "drei"],
            correct_index: 0,
            feedback_ok: "tre.",
            feedback_bad: "3 = tre.",
          },
        },
        {
          id: `it${d}-2`,
          phase: "learn",
          bot: "Útiles: due caffè, tre amici, cinque euro.",
          visual: {
            kind: "steps",
            items: [
              { n: 1, label: "uno / una" },
              { n: 2, label: "due, tre, quattro" },
              { n: 3, label: "dieci = 10" },
            ],
          },
          check: {
            prompt: "«Due pizze» son…",
            options: ["Dos pizzas", "Diez pizzas", "Ninguna pizza", "Una pizza"],
            correct_index: 0,
            feedback_ok: "due = 2.",
            feedback_bad: "due = dos.",
          },
        },
        {
          id: `it${d}-3`,
          phase: "learn",
          bot: "Quattro y cinque se pronuncian con «cuá» y «chín-cue». Otto = 8.",
          visual: {
            kind: "code",
            label: "Lista",
            code: "4 quattro\n5 cinque\n6 sei\n7 sette\n8 otto\n9 nove\n10 dieci",
          },
          check: {
            prompt: "Dieci es…",
            options: ["10", "2", "12", "20"],
            correct_index: 0,
            feedback_ok: "dieci = 10.",
            feedback_bad: "Cuenta: …nove, dieci.",
          },
        },
      ],
      [
        {
          id: `it${d}-1`,
          phase: "intro",
          bot: "Essere (ser/estar): sono, sei, è, siamo, siete, sono.",
          visual: { kind: "big_word", word: "essere", sub: "sono / sei / è" },
          check: {
            prompt: "«Io sono stanco» usa…",
            options: ["sono (essere)", "ho (avere)", "chiamo", "voglio"],
            correct_index: 0,
            feedback_ok: "Io sono…",
            feedback_bad: "1ª persona de essere = sono.",
          },
        },
        {
          id: `it${d}-2`,
          phase: "learn",
          bot: "Avere (tener): ho, hai, ha, abbiamo, avete, hanno. Ho fame = tengo hambre.",
          visual: {
            kind: "vs",
            left: { title: "essere", body: "Sono italiano" },
            right: { title: "avere", body: "Ho una macchina" },
          },
          check: {
            prompt: "«Ho fame» significa…",
            options: ["Tengo hambre", "Soy hambre", "Estoy en Roma", "Me llamo Fame"],
            correct_index: 0,
            feedback_ok: "avere + fame.",
            feedback_bad: "ho = tengo.",
          },
        },
        {
          id: `it${d}-3`,
          phase: "learn",
          bot: "Lui è di Milano. Lei ha due fratelli.",
          visual: {
            kind: "code",
            label: "Frases",
            code: "Io sono studente.\nTu sei molto gentile.\nLui ha un cane.",
          },
          check: {
            prompt: "«Tu sei» corresponde a…",
            options: ["Tú eres/estás", "Yo tengo", "Ellos son", "Nosotros tenemos"],
            correct_index: 0,
            feedback_ok: "2ª persona de essere.",
            feedback_bad: "sei = tú eres.",
          },
        },
      ],
      [
        {
          id: `it${d}-1`,
          phase: "intro",
          bot: "Frases de supervivencia: Per favore, Grazie, Prego, Scusa / Mi scusi.",
          visual: { kind: "big_word", word: "Grazie!", sub: "gracias" },
          check: {
            prompt: "Para decir gracias…",
            options: ["Grazie", "Prego (como gracias)", "Ciao gracias", "Arrivederci gracias"],
            correct_index: 0,
            feedback_ok: "Grazie.",
            feedback_bad: "Grazie = gracias.",
          },
        },
        {
          id: `it${d}-2`,
          phase: "learn",
          bot: "Prego responde a Grazie (de nada) o invita a pasar. Per favore = por favor.",
          visual: {
            kind: "vs",
            left: { title: "Pides", body: "Un caffè, per favore" },
            right: { title: "Agradeces", body: "Grazie! → Prego" },
          },
          check: {
            prompt: "Tras «Grazie», la respuesta típica es…",
            options: ["Prego", "Ciao", "Dieci", "Sono"],
            correct_index: 0,
            feedback_ok: "Prego ≈ de nada.",
            feedback_bad: "Prego responde a Grazie.",
          },
        },
        {
          id: `it${d}-3`,
          phase: "learn",
          bot: "Scusa (informal) / Mi scusi (formal) = perdón. Dov'è…? = ¿dónde está…?",
          visual: {
            kind: "code",
            label: "Útiles",
            code: "Per favore…\nGrazie!\nScusa / Mi scusi\nDov'è il bagno?",
          },
          check: {
            prompt: "«Dov'è il bagno?» pregunta por…",
            options: ["Dónde está el baño", "Cuánto cuesta", "Tu nombre", "La hora"],
            correct_index: 0,
            feedback_ok: "Dov'è = dónde está.",
            feedback_bad: "dovere de lugar: Dov'è.",
          },
        },
      ],
    ],
    en: [],
    fr: [],
    de: [],
    ja: [],
    pt: [],
    zh: [],
  };

  // Plantilla genérica de idioma si aún no hay pack detallado
  const detailed = packs[lang.id];
  if (detailed && detailed[unit - 1]?.length) {
    return detailed[unit - 1];
  }

  // Fallback rico por meta del día (otros idiomas)
  const samples: Record<LangId, { w: string; sub: string; q: string; ok: string; bad: string[] }> = {
    it: { w: "Ciao", sub: "hola", q: "Ciao significa…", ok: "Hola (informal)", bad: ["Adiós formal", "Gracias", "Por favor"] },
    en: { w: "Hello", sub: "hola", q: "Hello significa…", ok: "Hola", bad: ["Adiós", "Gracias", "Por favor"] },
    fr: { w: "Bonjour", sub: "hola / buenos días", q: "Bonjour significa…", ok: "Hola / buenos días", bad: ["Adiós", "Gracias", "Por favor"] },
    de: { w: "Hallo", sub: "hola", q: "Hallo significa…", ok: "Hola", bad: ["Adiós", "Gracias", "Por favor"] },
    ja: { w: "こんにちは", sub: "hola", q: "こんにちは es…", ok: "Hola (formal-diario)", bad: ["Adiós", "Gracias", "Por favor"] },
    pt: { w: "Olá", sub: "hola", q: "Olá significa…", ok: "Hola", bad: ["Adiós", "Gracias", "Por favor"] },
    zh: { w: "你好", sub: "hola", q: "你好 significa…", ok: "Hola", bad: ["Adiós", "Gracias", "Por favor"] },
  };
  const s = samples[lang.id];
  return [
    {
      id: `lg${d}-1`,
      phase: "intro",
      bot: `Hoy en ${name}: ${meta.title}. Foco: ${meta.focus}.`,
      visual: { kind: "big_word", word: s.w, sub: s.sub },
      html: `<div class="viz"><p>Aprende y usa <strong>${meta.focus}</strong> en un ejemplo mínimo.</p></div>`,
      check: {
        prompt: s.q,
        options: [s.ok, ...s.bad],
        correct_index: 0,
        feedback_ok: s.ok,
        feedback_bad: `Recuerda: ${s.ok}.`,
      },
    },
    {
      id: `lg${d}-2`,
      phase: "learn",
      bot: `${meta.focus} es esencial en ${name}. Practica en voz alta.`,
      visual: {
        kind: "vs",
        left: { title: "Escuchar", body: "Repite el sonido" },
        right: { title: "Usar", body: `Di: ${s.w}` },
      },
      check: {
        prompt: `¿Qué practicas hoy en ${name}?`,
        options: [meta.focus, "Configurar el Wi‑Fi", "La tipografía del PDF", "Otro idioma al azar"],
        correct_index: 0,
        feedback_ok: meta.focus,
        feedback_bad: `El foco es ${meta.focus}.`,
      },
    },
    {
      id: `lg${d}-3`,
      phase: "learn",
      bot: `Mini práctica: usa «${s.w}» en una frase corta.`,
      visual: {
        kind: "code",
        label: meta.title,
        code: `${s.w}\n// ${meta.focus}`,
      },
      check: {
        prompt: `Esta lección de ${name} trabaja…`,
        options: [meta.title, "Red / DNS", "SQL joins", "CSS Grid"],
        correct_index: 0,
        feedback_ok: "Exacto.",
        feedback_bad: `Es ${meta.title}.`,
      },
    },
  ];
}

function languageQuestions(lang: LangPack, dayNum: number): PlanQuestion[] {
  const slides = languageSlides(lang, dayNum);
  const fromChecks = slides
    .filter((s) => s.check)
    .slice(0, 2)
    .map((s, i) => ({
      id: `lq${dayNum}-${i + 1}`,
      prompt: s.check!.prompt,
      options: s.check!.options,
      correct_index: s.check!.correct_index,
      feedback_ok: s.check!.feedback_ok,
      feedback_bad: s.check!.feedback_bad,
    }));
  if (fromChecks.length >= 2) return fromChecks;
  const meta = languageDayMeta(lang, dayNum);
  return [
    {
      id: `lq${dayNum}-1`,
      prompt: `En ${lang.name}, el foco «${meta.focus}» pertenece a…`,
      options: [meta.title, "Otro idioma", "CSS", "SQL"],
      correct_index: 0,
      feedback_ok: meta.title,
      feedback_bad: meta.title,
    },
    {
      id: `lq${dayNum}-2`,
      prompt: `Para practicar ${meta.title}…`,
      options: [`Usar ${meta.focus} en una frase`, "Solo leer el índice", "Cambiar de curso", "Ignorar el audio"],
      correct_index: 0,
      feedback_ok: "Practicar en frase.",
      feedback_bad: `Aplica ${meta.focus}.`,
    },
  ];
}

type DayKind = "intro" | "jsx" | "props" | "state" | "events" | "lists" | "effects" | "practice";

function dayKindFor(topic: string, dayNum: number): DayKind {
  const kinds: DayKind[] = ["intro", "jsx", "props", "state", "events", "lists", "effects"];
  return kinds[(dayNum - 1) % kinds.length];
}

function dayLabelFor(topic: string, dayNum: number, fallbackTitle?: string, fallbackFocus?: string): {
  title: string;
  focus: string;
  kind: DayKind;
} {
  const kind = dayKindFor(topic, dayNum);
  const tl = topic.toLowerCase();
  const lang = detectLanguage(topic);

  if (lang) {
    return { kind, ...languageDayMeta(lang, dayNum) };
  }

  if (tl.includes("react")) {
    const map: Record<DayKind, { title: string; focus: string }> = {
      intro: { title: "Qué es React", focus: "Componentes y UI" },
      jsx: { title: "JSX", focus: "Sintaxis de UI" },
      props: { title: "Props", focus: "Datos al hijo" },
      state: { title: "useState", focus: "Estado local" },
      events: { title: "Eventos", focus: "onClick y forms" },
      lists: { title: "Listas", focus: "map y key" },
      effects: { title: "useEffect", focus: "Efectos" },
      practice: { title: "Práctica", focus: "Repaso" },
    };
    return { ...map[kind], kind };
  }

  if (tl.includes("sql") || tl.includes("mysql") || tl.includes("postgres") || tl.includes("base de datos")) {
    const map: Record<DayKind, { title: string; focus: string }> = {
      intro: { title: "Qué es SQL", focus: "Consultas a tablas" },
      jsx: { title: "SELECT", focus: "Leer filas" },
      props: { title: "WHERE", focus: "Filtrar filas" },
      state: { title: "JOIN", focus: "Unir tablas" },
      events: { title: "INSERT", focus: "Añadir datos" },
      lists: { title: "GROUP BY", focus: "Agregar" },
      effects: { title: "Índices", focus: "Rendimiento" },
      practice: { title: "Práctica", focus: "Repaso SQL" },
    };
    return { ...map[kind], kind };
  }

  if (tl.includes("python")) {
    const map: Record<DayKind, { title: string; focus: string }> = {
      intro: { title: "Qué es Python", focus: "Lenguaje e intérprete" },
      jsx: { title: "Variables", focus: "Tipos básicos" },
      props: { title: "Funciones", focus: "def y return" },
      state: { title: "Listas", focus: "list y append" },
      events: { title: "Condicionales", focus: "if / else" },
      lists: { title: "Bucles", focus: "for / while" },
      effects: { title: "Módulos", focus: "import" },
      practice: { title: "Práctica", focus: "Repaso" },
    };
    return { ...map[kind], kind };
  }

  if (tl.includes("javascript") || tl.includes("js") || tl === "ts" || tl.includes("typescript")) {
    const map: Record<DayKind, { title: string; focus: string }> = {
      intro: { title: "Qué es JS", focus: "Lenguaje de la web" },
      jsx: { title: "Variables", focus: "let y const" },
      props: { title: "Funciones", focus: "Declarar y llamar" },
      state: { title: "Objetos", focus: "Claves y valores" },
      events: { title: "Arrays", focus: "map y filter" },
      lists: { title: "DOM", focus: "Seleccionar nodos" },
      effects: { title: "Async", focus: "Promises" },
      practice: { title: "Práctica", focus: "Repaso" },
    };
    return { ...map[kind], kind };
  }

  // Genérico con foco real (nunca "Concepto clave")
  const genericTitles = [
    { title: `Qué es ${topic}`, focus: "Idea central" },
    { title: "Fundamentos", focus: "Piezas básicas" },
    { title: "Sintaxis", focus: "Cómo se escribe" },
    { title: "Operaciones", focus: "Acciones típicas" },
    { title: "Estructura", focus: "Cómo se organiza" },
    { title: "Errores", focus: "Fallos frecuentes" },
    { title: "Práctica", focus: "Aplicar hoy" },
  ];
  const g = genericTitles[(dayNum - 1) % genericTitles.length];

  if (isMetaFocus(fallbackFocus, fallbackTitle)) {
    return { kind, ...g };
  }
  return {
    kind,
    title: (fallbackTitle || g.title).slice(0, 40),
    focus: (fallbackFocus || g.focus).slice(0, 48),
  };
}

/** Preguntas reales del test (nunca meta). */
function qualityQuestionsForDay(topic: string, dayNum: number): PlanQuestion[] {
  const tl = topic.toLowerCase();
  const unit = ((dayNum - 1) % 7) + 1;
  const lang = detectLanguage(topic);
  if (lang) {
    return languageQuestions(lang, dayNum);
  }
  if (tl.includes("react")) {
    const banks: PlanQuestion[][] = [
      [
        {
          id: `rq${dayNum}-1`,
          prompt: "React se usa sobre todo para…",
          options: [
            "Construir interfaces de usuario",
            "Administrar bases de datos",
            "Enviar correo SMTP",
            "Compilar binarios C",
          ],
          correct_index: 0,
          feedback_ok: "UI con componentes.",
          feedback_bad: "React está en la capa de interfaz.",
        },
        {
          id: `rq${dayNum}-2`,
          prompt: "¿Qué es un componente?",
          options: [
            "Una pieza reutilizable de UI",
            "Un archivo .sql",
            "Un servidor HTTP",
            "Una regla de CSS global",
          ],
          correct_index: 0,
          feedback_ok: "Piezas de UI.",
          feedback_bad: "Piensa en LEGO de interfaz.",
        },
      ],
      [
        {
          id: `rq${dayNum}-1`,
          prompt: "JSX sirve para…",
          options: [
            "Describir UI dentro de JavaScript",
            "Reemplazar el bundler",
            "Crear tablas SQL",
            "Configurar el DNS",
          ],
          correct_index: 0,
          feedback_ok: "UI en el código.",
          feedback_bad: "JSX describe interfaz.",
        },
        {
          id: `rq${dayNum}-2`,
          prompt: "En JSX, una clase CSS se escribe…",
          options: ["className", "class", "css", "styleName"],
          correct_index: 0,
          feedback_ok: "class es reservada en JS.",
          feedback_bad: "Usa className.",
        },
      ],
      [
        {
          id: `rq${dayNum}-1`,
          prompt: "Las props permiten…",
          options: [
            "Pasar datos del padre al hijo",
            "Guardar secretos del servidor",
            "Crear el package.json",
            "Sustituir TypeScript",
          ],
          correct_index: 0,
          feedback_ok: "De padre a hijo.",
          feedback_bad: "Props = argumentos del componente.",
        },
        {
          id: `rq${dayNum}-2`,
          prompt: "En <Hi name=\"Ana\" />, name es…",
          options: ["Una prop", "Un hook", "Un reducer", "Un CSS module"],
          correct_index: 0,
          feedback_ok: "Es una prop.",
          feedback_bad: "Se pasa como atributo JSX.",
        },
      ],
      [
        {
          id: `rq${dayNum}-1`,
          prompt: "useState sirve para…",
          options: [
            "Guardar estado que cambia y re-renderiza",
            "Hacer consultas SQL",
            "Definir rutas del servidor",
            "Instalar dependencias",
          ],
          correct_index: 0,
          feedback_ok: "Estado local reactivo.",
          feedback_bad: "Es el hook de estado.",
        },
        {
          id: `rq${dayNum}-2`,
          prompt: "Para sumar 1 a un contador usas…",
          options: ["setN(n + 1) o setN(p => p + 1)", "document.write", "innerHTML++", "useState otra vez sin setter"],
          correct_index: 0,
          feedback_ok: "Siempre el setter.",
          feedback_bad: "No mutes n a mano.",
        },
      ],
      [
        {
          id: `rq${dayNum}-1`,
          prompt: "El click en React se declara…",
          options: ["onClick", "onclick", "on-click", "click="],
          correct_index: 0,
          feedback_ok: "camelCase.",
          feedback_bad: "Es onClick.",
        },
        {
          id: `rq${dayNum}-2`,
          prompt: "onClick={save} vs onClick={save()}…",
          options: [
            "Con () se ejecuta al render (casi siempre mal)",
            "Con () es lo recomendado",
            "Da igual",
            "Solo funciona en CSS",
          ],
          correct_index: 0,
          feedback_ok: "Pasa la función, no la llamada.",
          feedback_bad: "Sin paréntesis al asignar.",
        },
      ],
      [
        {
          id: `rq${dayNum}-1`,
          prompt: "En una lista, key ayuda a…",
          options: [
            "Identificar qué ítem cambió",
            "Sustituir CSS",
            "Conectar MySQL",
            "Compilar TypeScript",
          ],
          correct_index: 0,
          feedback_ok: "Reconciliación.",
          feedback_bad: "key = identidad.",
        },
        {
          id: `rq${dayNum}-2`,
          prompt: "Mejor key para usuarios…",
          options: ["user.id", "El índice siempre", "Math.random()", "El color CSS"],
          correct_index: 0,
          feedback_ok: "Ids estables.",
          feedback_bad: "Evita index si reordenas.",
        },
      ],
      [
        {
          id: `rq${dayNum}-1`,
          prompt: "useEffect se usa para…",
          options: [
            "Efectos tras el render (fetch, timers…)",
            "Definir el color del botón",
            "Crear el Vite config",
            "Sustituir JSX",
          ],
          correct_index: 0,
          feedback_ok: "Efectos secundarios.",
          feedback_bad: "No es el return principal.",
        },
        {
          id: `rq${dayNum}-2`,
          prompt: "useEffect(..., [id]) corre cuando…",
          options: ["Cambia id", "Cambia cualquier estado", "Nunca", "Solo al cerrar la pestaña"],
          correct_index: 0,
          feedback_ok: "Deps = disparadores.",
          feedback_bad: "Mira el array [id].",
        },
      ],
    ];
    return banks[unit - 1] || banks[0];
  }

  if (tl.includes("sql") || tl.includes("mysql") || tl.includes("postgres") || tl.includes("base de datos")) {
    const banks: PlanQuestion[][] = [
      [
        {
          id: `sq${dayNum}-1`,
          prompt: "SQL sirve principalmente para…",
          options: [
            "Consultar y manipular datos en tablas",
            "Diseñar interfaces con CSS",
            "Compilar programas C++",
            "Enviar emails",
          ],
          correct_index: 0,
          feedback_ok: "SQL habla con bases de datos relacionales.",
          feedback_bad: "Piensa en tablas y consultas.",
        },
        {
          id: `sq${dayNum}-2`,
          prompt: "Una fila en una tabla representa…",
          options: ["Un registro / entidad", "Una hoja de estilo", "Un servidor", "Un archivo .js"],
          correct_index: 0,
          feedback_ok: "Cada fila es un registro.",
          feedback_bad: "Tabla = filas + columnas.",
        },
      ],
      [
        {
          id: `sq${dayNum}-1`,
          prompt: "SELECT nombre FROM users; ¿qué hace?",
          options: [
            "Lee la columna nombre de users",
            "Borra la tabla users",
            "Crea un índice",
            "Inserta una fila",
          ],
          correct_index: 0,
          feedback_ok: "SELECT lee datos.",
          feedback_bad: "FROM indica la tabla.",
        },
        {
          id: `sq${dayNum}-2`,
          prompt: "SELECT * FROM products; el * significa…",
          options: ["Todas las columnas", "Solo la clave primaria", "Solo 1 fila", "Borrar todo"],
          correct_index: 0,
          feedback_ok: "* = todas las columnas.",
          feedback_bad: "No borra nada.",
        },
      ],
      [
        {
          id: `sq${dayNum}-1`,
          prompt: "WHERE sirve para…",
          options: ["Filtrar filas", "Crear tablas", "Cambiar el color UI", "Unir CSS"],
          correct_index: 0,
          feedback_ok: "Condición de filtrado.",
          feedback_bad: "WHERE reduce el resultado.",
        },
        {
          id: `sq${dayNum}-2`,
          prompt: "SELECT * FROM users WHERE age > 18; devuelve…",
          options: ["Usuarios mayores de 18", "Todos los usuarios", "Solo columnas age", "Nada nunca"],
          correct_index: 0,
          feedback_ok: "Filtra por age.",
          feedback_bad: "Mira la condición WHERE.",
        },
      ],
      [
        {
          id: `sq${dayNum}-1`,
          prompt: "JOIN se usa para…",
          options: [
            "Combinar filas de varias tablas",
            "Borrar una base de datos",
            "Crear un PDF",
            "Definir CSS",
          ],
          correct_index: 0,
          feedback_ok: "Une tablas por una clave.",
          feedback_bad: "Piensa en pedidos + clientes.",
        },
        {
          id: `sq${dayNum}-2`,
          prompt: "ON a.id = b.user_id indica…",
          options: ["La condición de unión", "Un ORDER BY", "Un DELETE", "Un índice automático"],
          correct_index: 0,
          feedback_ok: "Cómo se relacionan las tablas.",
          feedback_bad: "ON = criterio del JOIN.",
        },
      ],
      [
        {
          id: `sq${dayNum}-1`,
          prompt: "INSERT INTO users (name) VALUES ('Ana'); …",
          options: ["Añade una fila", "Lee todas las filas", "Borra Ana", "Crea la base"],
          correct_index: 0,
          feedback_ok: "INSERT escribe datos.",
          feedback_bad: "No es un SELECT.",
        },
        {
          id: `sq${dayNum}-2`,
          prompt: "UPDATE users SET name='Luis' WHERE id=1; …",
          options: ["Modifica filas que cumplen WHERE", "Inserta 1 fila nueva", "Borra la tabla", "Solo cuenta filas"],
          correct_index: 0,
          feedback_ok: "UPDATE cambia datos existentes.",
          feedback_bad: "WHERE elige qué filas tocar.",
        },
      ],
      [
        {
          id: `sq${dayNum}-1`,
          prompt: "COUNT(*) con GROUP BY sirve para…",
          options: ["Contar filas por grupo", "Ordenar alfabéticamente", "Crear un índice", "Hacer JOIN"],
          correct_index: 0,
          feedback_ok: "Agregación por grupos.",
          feedback_bad: "GROUP BY agrupa; COUNT cuenta.",
        },
        {
          id: `sq${dayNum}-2`,
          prompt: "SELECT city, COUNT(*) FROM users GROUP BY city; …",
          options: ["Usuarios por ciudad", "Borra ciudades", "Una sola fila siempre", "Solo el máximo age"],
          correct_index: 0,
          feedback_ok: "Un conteo por city.",
          feedback_bad: "Agrupa por city.",
        },
      ],
      [
        {
          id: `sq${dayNum}-1`,
          prompt: "Un índice en SQL ayuda a…",
          options: ["Acelerar búsquedas", "Cambiar el tema UI", "Compilar JS", "Enviar email"],
          correct_index: 0,
          feedback_ok: "Más rápidas las consultas filtradas.",
          feedback_bad: "Como el índice de un libro.",
        },
        {
          id: `sq${dayNum}-2`,
          prompt: "PRIMARY KEY identifica…",
          options: ["Cada fila de forma única", "El color de la tabla", "Un JOIN obligatorio", "Un PDF"],
          correct_index: 0,
          feedback_ok: "Clave única por fila.",
          feedback_bad: "Una fila = una PK.",
        },
      ],
    ];
    return banks[unit - 1] || banks[0];
  }

  // Genérico con foco del día (nunca meta PDF / “idea concreta”)
  const label = dayLabelFor(topic, dayNum);
  return [
    {
      id: `gq${dayNum}-1`,
      prompt: `¿Qué define mejor “${label.focus}” en ${topic}?`,
      options: [
        `El concepto de ${label.title.toLowerCase()} aplicado a ${topic}`,
        "Un detalle de otro curso distinto",
        "La tipografía de un PDF",
        "Configurar el Wi‑Fi",
      ],
      correct_index: 0,
      feedback_ok: `Sí: ${label.focus}.`,
      feedback_bad: `El foco es ${label.focus}.`,
    },
    {
      id: `gq${dayNum}-2`,
      prompt: `Para practicar ${label.title} hoy, ¿qué haces?`,
      options: [
        `Hacer un ejemplo mínimo de ${label.focus}`,
        "Solo memorizar el índice",
        "Cambiar de tema al azar",
        "Ignorar la lección",
      ],
      correct_index: 0,
      feedback_ok: "Ejemplo mínimo > relleno.",
      feedback_bad: `Aplica ${label.focus}.`,
    },
  ];
}

function PathKindIcon({
  kind,
  done,
  locked,
  active,
}: {
  kind: DayKind;
  done: boolean;
  locked: boolean;
  active?: boolean;
}) {
  const stroke = "#ffffff";
  const common = {
    width: 30,
    height: 30,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke,
    strokeWidth: 2.4,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (done) {
    return (
      <svg {...common}>
        <path d="M20 6 9 17l-5-5" />
      </svg>
    );
  }
  if (locked) {
    return (
      <svg {...common} stroke="#ffffff" strokeWidth={2.6}>
        <rect x="5" y="11" width="14" height="10" rx="2" fill="rgba(255,255,255,0.18)" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </svg>
    );
  }
  switch (kind) {
    case "jsx":
    case "practice":
      return (
        <svg {...common}>
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      );
    case "props":
      return (
        <svg {...common}>
          <rect x="3" y="8" width="18" height="12" rx="2" />
          <path d="M12 8V4M8 4h8" />
        </svg>
      );
    case "state":
      return (
        <svg {...common}>
          <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      );
    case "events":
      return (
        <svg {...common}>
          <path d="M9 3h6l1 7H8L9 3z" />
          <path d="M12 10v11" />
          <path d="M8 21h8" />
        </svg>
      );
    case "lists":
      return (
        <svg {...common}>
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <circle cx="4" cy="6" r="1.2" fill={stroke} />
          <circle cx="4" cy="12" r="1.2" fill={stroke} />
          <circle cx="4" cy="18" r="1.2" fill={stroke} />
        </svg>
      );
    case "effects":
      return (
        <svg {...common}>
          <polyline points="23 4 23 10 17 10" />
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <polygon points="12 2 15 9 22 9 17 14 19 21 12 17 5 21 7 14 2 9 9 9" />
        </svg>
      );
  }
}

/** Currículo real por tema (no meta sobre “cómo estudiar”). */
function qualitySlidesForDay(topic: string, day: PlanDay): LessonSlide[] {
  const t = topic.trim() || "el tema";
  const tl = t.toLowerCase();
  const d = day.day;
  const unit = ((d - 1) % 7) + 1;
  const lang = detectLanguage(t);
  if (lang) {
    return languageSlides(lang, d);
  }

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

  if (tl.includes("sql") || tl.includes("mysql") || tl.includes("postgres") || tl.includes("base de datos")) {
    const units: LessonSlide[][] = [
      [
        {
          id: `s${d}-1`,
          phase: "intro",
          bot: "SQL es el lenguaje para consultar y modificar datos guardados en tablas (bases relacionales).",
          visual: { kind: "big_word", word: "SQL", sub: "Structured Query Language" },
          html: `<div class="viz"><div class="row"><span class="pill">tablas</span><span class="pill">filas</span><span class="pill">columnas</span></div><p>Leer, filtrar, unir y escribir datos.</p></div>`,
          check: {
            prompt: "SQL se usa para…",
            options: ["Trabajar con datos en tablas", "Diseñar tipografías", "Compilar C++", "Montar un DNS"],
            correct_index: 0,
            feedback_ok: "Consultas a bases de datos.",
            feedback_bad: "Piensa en tablas, no en CSS.",
          },
        },
        {
          id: `s${d}-2`,
          phase: "learn",
          bot: "Una tabla tiene columnas (campos) y filas (registros). Ejemplo: users(id, name, email).",
          visual: {
            kind: "vs",
            left: { title: "Columna", body: "name, email…" },
            right: { title: "Fila", body: "Un usuario concreto" },
          },
          check: {
            prompt: "Una fila representa…",
            options: ["Un registro", "Un archivo CSS", "Un servidor", "Un PDF"],
            correct_index: 0,
            feedback_ok: "Registro = fila.",
            feedback_bad: "Cada fila es una entidad.",
          },
        },
        {
          id: `s${d}-3`,
          phase: "learn",
          bot: "Las consultas empiezan casi siempre por SELECT … FROM …",
          visual: { kind: "code", label: "Esqueleto", code: "SELECT columnas\nFROM tabla;" },
          check: {
            prompt: "FROM indica…",
            options: ["De qué tabla lees", "El color del resultado", "Un JOIN obligatorio", "Borrar datos"],
            correct_index: 0,
            feedback_ok: "La tabla origen.",
            feedback_bad: "FROM = origen.",
          },
        },
      ],
      [
        {
          id: `s${d}-1`,
          phase: "intro",
          bot: "SELECT elige qué columnas quieres ver. FROM dice de qué tabla.",
          visual: { kind: "big_word", word: "SELECT", sub: "Leer datos" },
          check: {
            prompt: "SELECT name FROM users; devuelve…",
            options: ["La columna name de users", "Borra users", "Crea users", "Nada útil"],
            correct_index: 0,
            feedback_ok: "Lectura de name.",
            feedback_bad: "Es una lectura.",
          },
        },
        {
          id: `s${d}-2`,
          phase: "learn",
          bot: "El asterisco * pide todas las columnas de la tabla.",
          visual: { kind: "code", label: "Todas las columnas", code: "SELECT * FROM products;" },
          check: {
            prompt: "* en SELECT significa…",
            options: ["Todas las columnas", "Solo la PK", "Borrar filas", "Ordenar"],
            correct_index: 0,
            feedback_ok: "Todas las columnas.",
            feedback_bad: "No borra nada.",
          },
        },
        {
          id: `s${d}-3`,
          phase: "learn",
          bot: "Puedes limitar filas con LIMIT (útil al explorar).",
          visual: { kind: "code", label: "LIMIT", code: "SELECT * FROM users\nLIMIT 5;" },
          check: {
            prompt: "LIMIT 5…",
            options: ["Devuelve como máximo 5 filas", "Borra 5 filas", "Crea 5 tablas", "Obliga un JOIN"],
            correct_index: 0,
            feedback_ok: "Tope de filas.",
            feedback_bad: "No es DELETE.",
          },
        },
      ],
      [
        {
          id: `s${d}-1`,
          phase: "intro",
          bot: "WHERE filtra: solo pasan las filas que cumplen la condición.",
          visual: { kind: "big_word", word: "WHERE", sub: "Filtrar filas" },
          check: {
            prompt: "WHERE sirve para…",
            options: ["Filtrar filas", "Crear índices CSS", "Renombrar la base", "Hacer PDF"],
            correct_index: 0,
            feedback_ok: "Filtro.",
            feedback_bad: "Reduce el resultado.",
          },
        },
        {
          id: `s${d}-2`,
          phase: "learn",
          bot: "Comparadores típicos: =, <>, >, <, >=, <=. También AND / OR.",
          visual: {
            kind: "code",
            label: "Filtro",
            code: "SELECT * FROM users\nWHERE age >= 18\n  AND city = 'Madrid';",
          },
          check: {
            prompt: "age >= 18 AND city = 'Madrid' deja…",
            options: ["Mayores de edad en Madrid", "Todos los users", "Solo age", "Ninguna fila siempre"],
            correct_index: 0,
            feedback_ok: "Ambas condiciones.",
            feedback_bad: "AND exige las dos.",
          },
        },
        {
          id: `s${d}-3`,
          phase: "learn",
          bot: "LIKE busca patrones en texto: % es comodín.",
          visual: { kind: "code", label: "LIKE", code: "SELECT * FROM users\nWHERE name LIKE 'A%';" },
          check: {
            prompt: "name LIKE 'A%' busca…",
            options: ["Nombres que empiezan por A", "Solo Ana exacto", "Borrar nombres", "Ordenar por A"],
            correct_index: 0,
            feedback_ok: "Patrón de texto.",
            feedback_bad: "% = cualquier continuación.",
          },
        },
      ],
      [
        {
          id: `s${d}-1`,
          phase: "intro",
          bot: "JOIN combina tablas relacionadas (ej. pedidos + clientes) por una clave.",
          visual: { kind: "big_word", word: "JOIN", sub: "Unir tablas" },
          check: {
            prompt: "JOIN se usa para…",
            options: ["Combinar tablas", "Borrar la base", "Estilar HTML", "Compilar TS"],
            correct_index: 0,
            feedback_ok: "Unión de tablas.",
            feedback_bad: "Relaciona filas.",
          },
        },
        {
          id: `s${d}-2`,
          phase: "learn",
          bot: "INNER JOIN solo deja filas con match. ON define la relación.",
          visual: {
            kind: "code",
            label: "INNER JOIN",
            code: "SELECT o.id, u.name\nFROM orders o\nJOIN users u ON o.user_id = u.id;",
          },
          check: {
            prompt: "ON o.user_id = u.id es…",
            options: ["La condición de unión", "Un WHERE de borrado", "Un GROUP BY", "Un índice"],
            correct_index: 0,
            feedback_ok: "Cómo se enlazan.",
            feedback_bad: "ON = match del JOIN.",
          },
        },
        {
          id: `s${d}-3`,
          phase: "learn",
          bot: "LEFT JOIN mantiene todas las filas de la izquierda aunque no haya match a la derecha.",
          visual: {
            kind: "vs",
            left: { title: "INNER", body: "Solo matches" },
            right: { title: "LEFT", body: "Todas las izq." },
          },
          check: {
            prompt: "LEFT JOIN conserva…",
            options: ["Todas las filas de la tabla izquierda", "Solo matches", "Ninguna fila", "Solo la derecha"],
            correct_index: 0,
            feedback_ok: "Izquierda completa.",
            feedback_bad: "LEFT = left kept.",
          },
        },
      ],
      [
        {
          id: `s${d}-1`,
          phase: "intro",
          bot: "INSERT añade filas. UPDATE cambia filas existentes (casi siempre con WHERE).",
          visual: { kind: "big_word", word: "INSERT", sub: "Escribir datos" },
          check: {
            prompt: "INSERT INTO … VALUES …",
            options: ["Añade filas", "Solo lee", "Borra la tabla", "Crea un índice UI"],
            correct_index: 0,
            feedback_ok: "Escritura nueva.",
            feedback_bad: "No es SELECT.",
          },
        },
        {
          id: `s${d}-2`,
          phase: "learn",
          bot: "Sin WHERE, un UPDATE puede tocar todas las filas. ¡Cuidado!",
          visual: {
            kind: "code",
            label: "UPDATE seguro",
            code: "UPDATE users\nSET city = 'Bilbao'\nWHERE id = 42;",
          },
          check: {
            prompt: "UPDATE … WHERE id = 42 modifica…",
            options: ["La fila 42", "Todas las filas siempre", "Ninguna nunca", "Solo columnas"],
            correct_index: 0,
            feedback_ok: "WHERE acota.",
            feedback_bad: "Sin WHERE sería masivo.",
          },
        },
        {
          id: `s${d}-3`,
          phase: "learn",
          bot: "DELETE quita filas. También usa WHERE para no vaciar la tabla entera.",
          visual: { kind: "code", label: "DELETE", code: "DELETE FROM users\nWHERE id = 42;" },
          check: {
            prompt: "DELETE FROM users WHERE id=42…",
            options: ["Borra esa fila", "Borra la base", "Inserta 42", "Hace JOIN"],
            correct_index: 0,
            feedback_ok: "Borrado filtrado.",
            feedback_bad: "WHERE elige la fila.",
          },
        },
      ],
      [
        {
          id: `s${d}-1`,
          phase: "intro",
          bot: "GROUP BY agrupa filas; con COUNT/SUM/AVG obtienes totales por grupo.",
          visual: { kind: "big_word", word: "GROUP BY", sub: "Agregar" },
          check: {
            prompt: "COUNT(*) con GROUP BY…",
            options: ["Cuenta filas por grupo", "Ordena CSS", "Crea tablas", "Hace PDF"],
            correct_index: 0,
            feedback_ok: "Agregación.",
            feedback_bad: "Cuenta por grupo.",
          },
        },
        {
          id: `s${d}-2`,
          phase: "learn",
          bot: "Ejemplo: cuántos usuarios hay por ciudad.",
          visual: {
            kind: "code",
            label: "Agregación",
            code: "SELECT city, COUNT(*)\nFROM users\nGROUP BY city;",
          },
          check: {
            prompt: "Esa consulta devuelve…",
            options: ["Conteo por ciudad", "Una sola fila fija", "Borra ciudades", "Solo emails"],
            correct_index: 0,
            feedback_ok: "Una fila por city.",
            feedback_bad: "GROUP BY city.",
          },
        },
        {
          id: `s${d}-3`,
          phase: "learn",
          bot: "HAVING filtra grupos (después del GROUP BY); WHERE filtra filas antes.",
          visual: {
            kind: "vs",
            left: { title: "WHERE", body: "Antes de agrupar" },
            right: { title: "HAVING", body: "Sobre el grupo" },
          },
          check: {
            prompt: "HAVING se aplica…",
            options: ["A grupos ya agregados", "Solo al crear la DB", "A CSS", "Nunca con COUNT"],
            correct_index: 0,
            feedback_ok: "Filtro post-agregación.",
            feedback_bad: "Después de GROUP BY.",
          },
        },
      ],
      [
        {
          id: `s${d}-1`,
          phase: "intro",
          bot: "Un índice acelera búsquedas. PRIMARY KEY identifica cada fila de forma única.",
          visual: { kind: "big_word", word: "Índice", sub: "Más rápido" },
          check: {
            prompt: "Un índice ayuda a…",
            options: ["Acelerar consultas filtradas", "Cambiar el tema UI", "Enviar email", "Compilar JS"],
            correct_index: 0,
            feedback_ok: "Rendimiento de lectura.",
            feedback_bad: "No es cosmética.",
          },
        },
        {
          id: `s${d}-2`,
          phase: "learn",
          bot: "PRIMARY KEY: única y no nula. Suele ser id.",
          visual: {
            kind: "code",
            label: "PK",
            code: "CREATE TABLE users (\n  id INT PRIMARY KEY,\n  name TEXT\n);",
          },
          check: {
            prompt: "PRIMARY KEY…",
            options: ["Identifica filas de forma única", "Es un color", "Obliga JOIN", "Borra duplicados UI"],
            correct_index: 0,
            feedback_ok: "Identidad de fila.",
            feedback_bad: "Una PK por fila.",
          },
        },
        {
          id: `s${d}-3`,
          phase: "learn",
          bot: "FOREIGN KEY enlaza tablas (user_id → users.id) y mantiene integridad.",
          visual: {
            kind: "steps",
            items: [
              { n: 1, label: "Tabla padre (users)" },
              { n: 2, label: "Tabla hija (orders)" },
              { n: 3, label: "FK user_id" },
            ],
          },
          check: {
            prompt: "FOREIGN KEY expresa…",
            options: ["Relación entre tablas", "Un SELECT *", "Un tema CSS", "Un LIMIT"],
            correct_index: 0,
            feedback_ok: "Integridad referencial.",
            feedback_bad: "Enlace entre tablas.",
          },
        },
      ],
    ];
    return units[unit - 1] || units[0];
  }

  // Genérico con títulos reales del día (nunca “Concepto clave” / PDF)
  // Si es idioma, nunca caemos aquí (ya retornamos arriba).
  const label = dayLabelFor(t, d);
  const focus = label.focus;
  const title = label.title;
  return [
    {
      id: `g${d}-1`,
      phase: "intro",
      bot: `Hoy en ${t}: ${title}. Vamos a ${focus.toLowerCase()} con un ejemplo concreto.`,
      visual: { kind: "big_word", word: title.slice(0, 22), sub: t },
      html: `<div class="viz"><p>Objetivo: entender <strong>${focus}</strong> y usarlo en un ejemplo mínimo.</p></div>`,
      check: {
        prompt: `En ${t}, ¿qué trabajamos hoy?`,
        options: [title, "Un tema de otro curso", "Configurar el router", "Instalar un antivirus"],
        correct_index: 0,
        feedback_ok: `Sí: ${title}.`,
        feedback_bad: `Hoy: ${title}.`,
      },
    },
    {
      id: `g${d}-2`,
      phase: "learn",
      bot: `${focus} es una pieza central de ${t}. Si lo entiendes, el resto encaja.`,
      visual: {
        kind: "vs",
        left: { title: "Sin esto", body: "Solo memorizar nombres" },
        right: { title: "Con esto", body: `Usar ${focus}` },
      },
      check: {
        prompt: `¿Qué demuestra que entiendes ${focus}?`,
        options: [
          "Explicarlo y aplicar un ejemplo",
          "Repetir el índice del temario",
          "Cambiar de tema al azar",
          "Ignorar la práctica",
        ],
        correct_index: 0,
        feedback_ok: "Entender + aplicar.",
        feedback_bad: `Vuelve a ${focus}.`,
      },
    },
    {
      id: `g${d}-3`,
      phase: "learn",
      bot: `Ejemplo mínimo de ${focus} en ${t}. Luego el test del día.`,
      visual: {
        kind: "code",
        label: title,
        code: `// ${t} · ${focus}\n// escribe aquí un ejemplo mínimo`,
      },
      check: {
        prompt: `Este bloque practica…`,
        options: [focus, "Otro curso", "Red / DNS", "Nada relacionado"],
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
  // Idiomas: siempre currículo real (nunca plantilla «Idea central»)
  if (detectLanguage(topic)) {
    return qualitySlidesForDay(topic, day);
  }

  // Si el backend mandó fallbacks meta ("unidad N", PDF vs práctica), usa currículo real
  const focusBad =
    isMetaFocus(day.focus, day.title) ||
    /micro-pr[aá]ctica|p[aá]rrafos eternos|pasos cortos e interactivos|qu[eé] practicas hoy|tema no relacionado/i.test(
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
  comic,
}: {
  options: string[];
  correctIndex: number;
  picked: number | null;
  revealed: boolean;
  onPick: (idx: number) => void;
  comic?: boolean;
}) {
  return (
    <div className={`sa-duo-choices ${comic ? "sa-duo-choices--comic" : ""}`}>
      {options.map((opt, idx) => {
        let cls = "sa-choice";
        if (comic) cls += " sa-choice--comic";
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
            style={comic ? ({ ["--sa-i" as string]: idx } as CSSProperties) : undefined}
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
      const meta = dayLabelFor(plan.topic, d.day, d.title, d.focus);
      const slides = buildSlides(plan.topic, { ...d, title: meta.title, focus: meta.focus });
      let questions = dedupeQuestions(d.questions || [], new Set()).filter((q) => !isMetaQuestion(q));
      const topicL = plan.topic.toLowerCase();
      const knownBank =
        topicL.includes("react") ||
        topicL.includes("sql") ||
        topicL.includes("mysql") ||
        topicL.includes("postgres") ||
        topicL.includes("python") ||
        topicL.includes("javascript") ||
        topicL.includes("typescript");
      if (
        knownBank ||
        questions.length < 2 ||
        (d.questions || []).some(isMetaQuestion) ||
        isMetaFocus(meta.focus, meta.title)
      ) {
        questions = qualityQuestionsForDay(plan.topic, d.day);
      }
      for (const q of questions) seen.add(normalizePrompt(q.prompt));
      return {
        ...d,
        title: meta.title,
        focus: meta.focus,
        kind: meta.kind,
        slides,
        questions,
      };
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
          <StudyAgentsBotAvatar size={80} color={SA_BOT_FACE} state="idle" className="sa-bot-avatar--bright" />
          <h3 className={spaceGrotesk.className}>¡Día {activeDay.day} listo!</h3>
          <p className="sa-duo-celebrate__xp">+{dayXp} XP</p>
          <p className="sa-duo-celebrate__sub">
            {activeDay.title} · Total {celebrateXp} XP
          </p>
          <p className="sa-duo-celebrate__hint">Puedes seguir con la siguiente lección ahora mismo.</p>
        </div>
        <button type="button" className="sa-btn sa-btn--ghost" style={{ width: "100%" }} onClick={backToMap}>
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
          <button
            type="button"
            className="sa-chip sa-chip--icon"
            onClick={backToMap}
            title="Volver al camino"
            aria-label="Volver al camino"
          >
            ←
          </button>
          <div className="sa-duo-phase">
            <span className={phase === "intro" ? "on" : ""}>1</span>
            <span className={phase === "learn" ? "on" : ""}>2</span>
            <span className={phase === "test" ? "on" : ""}>3</span>
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
          <div className="sa-duo-botrow">
            <StudyAgentsBotAvatar size={52} color={SA_BOT_FACE} state="idle" className="sa-bot-avatar--bright" />
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
            <div className="sa-duo-checkblock sa-comic-pop">
              <p className="sa-duo-checkblock__label">COMPRUEBA</p>
              <p className="sa-duo-checkblock__prompt">{slide.check!.prompt}</p>
              {!revealed || picked === null ? (
                <ChoiceList
                  options={slide.check!.options}
                  correctIndex={slide.check!.correct_index}
                  picked={picked}
                  revealed={revealed}
                  comic
                  onPick={(idx) => choose(idx, slide.check!.correct_index)}
                />
              ) : (
                <>
                  <ChoiceList
                    options={slide.check!.options}
                    correctIndex={slide.check!.correct_index}
                    picked={picked}
                    revealed={revealed}
                    comic
                    onPick={() => {}}
                  />
                  <div
                    className={`sa-duo-feedback sa-comic-pop ${picked === slide.check!.correct_index ? "ok" : "bad"}`}
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
            className="sa-btn sa-btn--ghost sa-comic-pop sa-comic-pop--delay"
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
      <div className={`${outfit.className} sa-steps-card sa-duo-shell sa-duo-shell--test sa-pop`} key={currentQ.id}>
        <div className="sa-duo-top">
          <button
            type="button"
            className="sa-chip sa-chip--icon"
            onClick={backToMap}
            title="Volver al camino"
            aria-label="Volver al camino"
          >
            ←
          </button>
          <div className="sa-duo-phase">
            <span>1</span>
            <span>2</span>
            <span className="on">3</span>
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
          <div className="sa-duo-botrow sa-duo-botrow--comic">
            <StudyAgentsBotAvatar size={52} color={SA_BOT_FACE} state="thinking" className="sa-bot-avatar--bright" />
            <div className="sa-duo-bubble sa-duo-bubble--test sa-comic-pop">
              <p className="sa-duo-test-label">PREGUNTA</p>
              <p>{currentQ.prompt}</p>
            </div>
          </div>
          <div className="sa-duo-checkblock sa-comic-pop sa-comic-pop--delay">
            <p className="sa-duo-checkblock__label">ELIGE UNA OPCIÓN</p>
            <ChoiceList
              options={currentQ.options}
              correctIndex={currentQ.correct_index}
              picked={picked}
              revealed={revealed}
              comic
              onPick={(idx) => choose(idx, currentQ.correct_index)}
            />
          </div>
          {revealed && (
            <div className={`sa-duo-feedback ${picked === currentQ.correct_index ? "ok" : "bad"}`}>
              <p className="sa-duo-feedback__title">
                {picked === currentQ.correct_index ? "¡Correcto!" : "Casi — sigue"}
              </p>
              <p>{picked === currentQ.correct_index ? currentQ.feedback_ok : currentQ.feedback_bad}</p>
              <button
                type="button"
                className="sa-btn sa-btn--ghost"
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
  const unitTitle = todayLesson?.title || daysPrepared[0]?.title || plan.topic;
  const unitFocus = todayLesson?.focus || daysPrepared[0]?.focus || "Camino diario";

  return (
    <div className={`${outfit.className} sa-pathmap sa-pop`}>
      <div className="sa-pathmap__unit">
        <div className="sa-pathmap__unit-text">
          <span>SECCIÓN 1 · {plan.topic.toUpperCase()}</span>
          <strong className={spaceGrotesk.className}>{unitTitle}</strong>
          <em>{unitFocus}</em>
        </div>
        <div className="sa-pathmap__unit-stats">
          <span title="XP">{progress.xp} XP</span>
          <span title="Hechas">{progress.completedDays.length}/{daysPrepared.length}</span>
        </div>
      </div>

      {allDone && (
        <p className="sa-pathmap__done">Curso completado. ¡Buen trabajo!</p>
      )}

      <div className="sa-pathmap__trail" aria-label="Camino de lecciones">
        {daysPrepared.map((d, i) => {
          const locked = d.day > progress.unlockedDay;
          const done = progress.completedDays.includes(d.day);
          const isCurrent = todayLesson?.day === d.day;
          const side = i % 2 === 0 ? "left" : "right";
          const prevSide = (i - 1) % 2 === 0 ? "left" : "right";
          const showChest = (i + 1) % 3 === 0 && i < daysPrepared.length - 1;
          const wireOn = done || !locked;
          return (
            <div key={d.day} className="sa-pathmap__step">
              {i > 0 && (
                <div className={`sa-pathmap__bridge ${wireOn ? "on" : ""}`} aria-hidden>
                  <svg viewBox="0 0 200 36" preserveAspectRatio="none">
                    <path
                      d={
                        prevSide === "left"
                          ? "M52 2 C 52 18, 148 18, 148 34"
                          : "M148 2 C 148 18, 52 18, 52 34"
                      }
                      fill="none"
                      strokeWidth="5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              )}

              <div className={`sa-pathmap__row sa-pathmap__row--${side}`}>
                {isCurrent && (
                  <div className="sa-pathmap__bubble" aria-hidden>
                    START
                  </div>
                )}

                <button
                  type="button"
                  disabled={locked}
                  onClick={() => startDay(d)}
                  className={`sa-pathmap__node ${locked ? "locked" : ""} ${done ? "done" : ""} ${isCurrent ? "current" : ""}`}
                  title={`${d.title} — ${d.focus}`}
                >
                  <span className="sa-pathmap__ring" />
                  <span className="sa-pathmap__disc">
                    <PathKindIcon kind={d.kind} done={done} locked={locked} active={isCurrent} />
                  </span>
                </button>

                <div className={`sa-pathmap__caption ${locked ? "locked" : ""}`}>
                  <strong>{d.title}</strong>
                  <small>{d.focus}</small>
                </div>

                {showChest && (
                  <div className="sa-pathmap__extra">
                    <StudyAgentsBotAvatar size={48} color={SA_BOT_FACE} state="idle" className="sa-bot-avatar--bright" />
                  </div>
                )}
              </div>
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
