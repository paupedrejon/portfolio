const FALLBACK_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-flash-lite-latest",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
  "gemini-3.5-flash",
];

type GeminiPart = { text?: string };
type GeminiCandidate = {
  content?: { parts?: GeminiPart[] };
  finishReason?: string;
};
type GeminiResponse = {
  candidates?: GeminiCandidate[];
  error?: { message?: string; code?: number; status?: string };
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function shouldSkipModel(message: string): boolean {
  return /no longer available|not found|is not supported|not supported for|INVALID_ARGUMENT/i.test(
    message,
  );
}

function isBusy(message: string, status: number): boolean {
  if (status === 429 || status === 503) return true;
  return /high demand|temporarily|try again|unavailable|overloaded|resource.exhausted/i.test(
    message,
  );
}

async function callModel(
  apiKey: string,
  model: string,
  system: string,
  user: string,
  options?: { temperature?: number; maxOutputTokens?: number },
): Promise<
  | { text: string }
  | { kind: "busy" | "skip" | "fatal"; message: string; status: number }
> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: {
        temperature: options?.temperature ?? 0.85,
        maxOutputTokens: options?.maxOutputTokens ?? 8192,
      },
    }),
  });

  const data = (await res.json()) as GeminiResponse;
  const msg = data.error?.message || `Gemini HTTP ${res.status}`;

  if (!res.ok) {
    if (msg.includes("RESOURCE_EXHAUSTED") || res.status === 429) {
      // Daily quota vs transient busy — both mean try another model / retry
      if (/quota|limit: 0|exceeded your current quota/i.test(msg)) {
        return { kind: "busy", message: "GEMINI_QUOTA", status: 429 };
      }
      return { kind: "busy", message: msg, status: res.status };
    }
    if (shouldSkipModel(msg) || res.status === 404) {
      return { kind: "skip", message: msg, status: res.status };
    }
    if (isBusy(msg, res.status)) {
      return { kind: "busy", message: msg, status: res.status };
    }
    return { kind: "fatal", message: msg, status: res.status };
  }

  const text = data.candidates?.[0]?.content?.parts
    ?.map((p) => p.text || "")
    .join("")
    .trim();

  if (!text) {
    return { kind: "busy", message: "GEMINI_EMPTY", status: 502 };
  }

  return { text };
}

export async function generateGeminiText(
  system: string,
  user: string,
  options?: {
    temperature?: number;
    maxOutputTokens?: number;
    /** Attempts per model (default 2). */
    attemptsPerModel?: number;
    /** Cap how many models to try (default all). */
    maxModels?: number;
  },
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY_MISSING");
  }

  const preferred = process.env.GEMINI_TRAVEL_MODEL;
  const models = [
    ...(preferred ? [preferred] : []),
    ...FALLBACK_MODELS.filter((m) => m !== preferred),
  ].slice(0, options?.maxModels ?? FALLBACK_MODELS.length + 1);

  const attemptsPerModel = options?.attemptsPerModel ?? 2;
  let sawQuota = false;
  let lastBusy = "Gemini está saturado. Reintenta en unos segundos.";

  for (const model of models) {
    for (let attempt = 0; attempt < attemptsPerModel; attempt++) {
      if (attempt > 0) await sleep(900 * attempt);
      const result = await callModel(apiKey, model, system, user, options);
      if ("text" in result) return result.text;

      if (result.kind === "skip" || result.kind === "fatal") break; // next model
      if (result.message === "GEMINI_QUOTA") sawQuota = true;
      lastBusy = result.message;
    }
  }

  if (sawQuota) throw new Error("GEMINI_QUOTA");
  throw new Error(lastBusy);
}

/** Extract a full HTML document from model output (strips fences). */
export function extractHtmlDocument(raw: string): string {
  const fenced = raw.match(/```html\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] || raw).trim();
  const start = candidate.search(/<!DOCTYPE html>|<html[\s>]/i);
  if (start >= 0) {
    const slice = candidate.slice(start);
    const end = slice.toLowerCase().lastIndexOf("</html>");
    if (end >= 0) return slice.slice(0, end + 7).trim();
    return `${slice}\n</html>`.trim();
  }
  if (/<(body|main|section|div|style|h1)\b/i.test(candidate)) {
    return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>Guía de viaje</title></head><body>${candidate}</body></html>`;
  }
  return candidate;
}

export function extractGuideTitle(html: string, fallback: string): string {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return (m?.[1] || fallback).trim().slice(0, 120);
}
