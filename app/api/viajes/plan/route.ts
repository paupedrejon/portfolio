import { NextResponse } from "next/server";
import {
  extractGuideTitle,
  extractHtmlDocument,
  generateGeminiText,
} from "@/lib/viajes/gemini";
import {
  GUIDE_SYSTEM_PROMPT,
  buildPlanUserPrompt,
} from "@/lib/viajes/prompts";
import { clientIp, consumeRateLimit } from "@/lib/viajes/rate-limit";
import { sanitizeGuideHtml } from "@/lib/viajes/sanitize";
import { searchTravelContext } from "@/lib/viajes/tavily";
import { parseTripPlanInput } from "@/lib/viajes/validate";
import { fetchDestinationImages } from "@/lib/viajes/wikimedia";
import type { SearchSnippet } from "@/lib/viajes/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const ip = clientIp(request);
    const limit = consumeRateLimit(`viajes:plan:${ip}`, 5);
    if (!limit.ok) {
      return NextResponse.json(
        {
          error: "RATE_LIMIT",
          message:
            "Límite diario de guías alcanzado (demo gratis). Prueba mañana.",
          retryAfterSec: limit.retryAfterSec,
        },
        { status: 429 },
      );
    }

    const body = await request.json();
    const input = parseTripPlanInput(body);
    if (!input) {
      return NextResponse.json(
        { error: "INVALID_INPUT", message: "Origen y destino son obligatorios." },
        { status: 400 },
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        {
          error: "CONFIG",
          message: "Falta GEMINI_API_KEY en el servidor.",
        },
        { status: 503 },
      );
    }

    const consultedAt = new Date().toISOString();

    let snippets: SearchSnippet[] = [];
    try {
      if (process.env.TAVILY_API_KEY) {
        snippets = await searchTravelContext(input);
      }
    } catch (err) {
      if (err instanceof Error && err.message === "TAVILY_QUOTA") {
        return NextResponse.json(
          {
            error: "TAVILY_QUOTA",
            message:
              "Cuota gratuita de búsqueda agotada este mes. Prueba más adelante.",
          },
          { status: 429 },
        );
      }
    }

    const images = await fetchDestinationImages(input.destination, [
      ...input.interests.slice(0, 2),
    ]);

    const raw = await generateGeminiText(
      GUIDE_SYSTEM_PROMPT,
      buildPlanUserPrompt({ input, snippets, images, consultedAt }),
      { temperature: 0.9, maxOutputTokens: 8192 },
    );

    const html = sanitizeGuideHtml(extractHtmlDocument(raw));
    if (html.length < 200 || !/<html[\s>]/i.test(html)) {
      return NextResponse.json(
        {
          error: "GENERATION_FAILED",
          message: "La IA no devolvió una guía HTML válida. Reintenta.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      html,
      title: extractGuideTitle(
        html,
        `${input.destination} · ${input.origin}`,
      ),
      sources: snippets.slice(0, 24),
      images,
      consultedAt,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "UNKNOWN";
    if (message === "GEMINI_QUOTA") {
      return NextResponse.json(
        {
          error: "GEMINI_QUOTA",
          message: "Cuota gratuita de Gemini agotada hoy. Prueba mañana.",
        },
        { status: 429 },
      );
    }
    console.error("[viajes/plan]", err);
    return NextResponse.json(
      {
        error: "SERVER",
        message: "No se pudo generar la guía. Inténtalo de nuevo.",
      },
      { status: 500 },
    );
  }
}
