const DEFAULT_MODEL = "gemini-3.5-flash-lite";

type GeminiPart = { text?: string };
type GeminiCandidate = {
  content?: { parts?: GeminiPart[] };
};
type GeminiResponse = {
  candidates?: GeminiCandidate[];
  error?: { message?: string; code?: number };
};

export async function generateGeminiText(
  system: string,
  user: string,
  options?: { temperature?: number; maxOutputTokens?: number },
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY_MISSING");
  }

  const model = process.env.GEMINI_TRAVEL_MODEL || DEFAULT_MODEL;
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

  if (res.status === 429) {
    throw new Error("GEMINI_QUOTA");
  }

  const data = (await res.json()) as GeminiResponse;
  if (!res.ok) {
    const msg = data.error?.message || `Gemini HTTP ${res.status}`;
    throw new Error(msg);
  }

  const text = data.candidates?.[0]?.content?.parts
    ?.map((p) => p.text || "")
    .join("")
    .trim();

  if (!text) {
    throw new Error("GEMINI_EMPTY");
  }

  return text;
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
    return slice.trim();
  }
  return candidate;
}

export function extractGuideTitle(html: string, fallback: string): string {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return (m?.[1] || fallback).trim().slice(0, 120);
}
