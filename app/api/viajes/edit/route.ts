import { NextResponse } from "next/server";
import {
  extractGuideTitle,
  extractHtmlDocument,
  generateGeminiText,
} from "@/lib/viajes/gemini";
import {
  EDIT_SYSTEM_PROMPT,
  buildEditUserPrompt,
} from "@/lib/viajes/prompts";
import { clientIp, consumeRateLimit } from "@/lib/viajes/rate-limit";
import { sanitizeGuideHtml } from "@/lib/viajes/sanitize";
import { searchTravelContext } from "@/lib/viajes/tavily";
import { parseTripPlanInput, wantsPriceResearch } from "@/lib/viajes/validate";
import type { SearchSnippet } from "@/lib/viajes/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const ip = clientIp(request);
    const limit = consumeRateLimit(`viajes:edit:${ip}`, 20);
    if (!limit.ok) {
      return NextResponse.json(
        {
          error: "RATE_LIMIT",
          message:
            "Límite diario de ediciones alcanzado (demo gratis). Prueba mañana.",
          retryAfterSec: limit.retryAfterSec,
        },
        { status: 429 },
      );
    }

    const body = await request.json();
    const html =
      typeof body?.html === "string" ? body.html.slice(0, 200000) : "";
    const instruction =
      typeof body?.instruction === "string"
        ? body.instruction.trim().slice(0, 800)
        : "";

    if (html.length < 50 || instruction.length < 2) {
      return NextResponse.json(
        {
          error: "INVALID_INPUT",
          message: "Necesito la guía actual y una instrucción de edición.",
        },
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

    if (wantsPriceResearch(instruction) && process.env.TAVILY_API_KEY) {
      const trip = parseTripPlanInput(body.trip || body);
      if (trip) {
        try {
          snippets = await searchTravelContext(trip);
        } catch (err) {
          if (err instanceof Error && err.message === "TAVILY_QUOTA") {
            return NextResponse.json(
              {
                error: "TAVILY_QUOTA",
                message:
                  "Cuota gratuita de búsqueda agotada este mes. Edita sin rebuscar precios.",
              },
              { status: 429 },
            );
          }
        }
      }
    }

    const raw = await generateGeminiText(
      EDIT_SYSTEM_PROMPT,
      buildEditUserPrompt({ html, instruction, snippets, consultedAt }),
      { temperature: 0.55, maxOutputTokens: 8192 },
    );

    const nextHtml = sanitizeGuideHtml(extractHtmlDocument(raw));
    if (nextHtml.length < 200 || !/<html[\s>]/i.test(nextHtml)) {
      return NextResponse.json(
        {
          error: "GENERATION_FAILED",
          message: "La edición no devolvió HTML válido. Reintenta.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      html: nextHtml,
      title: extractGuideTitle(nextHtml, "Guía de viaje"),
      sources: snippets.slice(0, 12),
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
    console.error("[viajes/edit]", err);
    return NextResponse.json(
      {
        error: "SERVER",
        message: "No se pudo editar la guía. Inténtalo de nuevo.",
      },
      { status: 500 },
    );
  }
}
