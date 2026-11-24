import { NextResponse } from "next/server";
import {
  extractGuideTitle,
  extractHtmlDocument,
  generateGeminiText,
} from "@/lib/viajes/gemini";
import {
  GUIDE_SYSTEM_PROMPT,
  JSON_SYSTEM_PROMPT,
  buildJsonUserPrompt,
  buildPlanUserPrompt,
} from "@/lib/viajes/prompts";
import { parseItineraryJson } from "@/lib/viajes/itinerary-schema";
import { renderGuideHtml } from "@/lib/viajes/render-guide";
import { clientIp, consumeRateLimit } from "@/lib/viajes/rate-limit";
import { sanitizeGuideHtml } from "@/lib/viajes/sanitize";
import { searchTravelContext } from "@/lib/viajes/tavily";
import { parseTripPlanInput } from "@/lib/viajes/validate";
import { fetchDestinationImages, filterGuideImages } from "@/lib/viajes/wikimedia";
import { buildBookingLinks } from "@/lib/viajes/booking-links";
import { allDestinations, type SearchSnippet } from "@/lib/viajes/types";

export const runtime = "nodejs";
export const maxDuration = 120;

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

    let images: Awaited<ReturnType<typeof fetchDestinationImages>> = [];
    try {
      const dests = allDestinations(input);
      const batches = await Promise.all(
        dests.slice(0, 3).map((d) =>
          fetchDestinationImages(d, [...input.interests.slice(0, 2)]),
        ),
      );
      images = filterGuideImages(batches.flat());
    } catch (imgErr) {
      console.warn("[viajes/plan] wikimedia", imgErr);
    }

    const booking = buildBookingLinks(input);
    let html = "";
    let usedFallback = false;

    // 1) Prefer full art-directed HTML from Gemini
    try {
      const rawHtml = await generateGeminiText(
        GUIDE_SYSTEM_PROMPT,
        buildPlanUserPrompt({
          input,
          snippets,
          images,
          consultedAt,
          booking,
        }),
        {
          temperature: 0.7,
          maxOutputTokens: 12288,
          attemptsPerModel: 1,
          maxModels: 2,
        },
      );
      html = sanitizeGuideHtml(extractHtmlDocument(rawHtml));
    } catch (htmlErr) {
      console.warn("[viajes/plan] html pass failed", htmlErr);
    }

    // 2) Fallback: compact JSON + our destination-themed renderer
    if (html.length < 200 || !/<html[\s>]/i.test(html)) {
      usedFallback = true;
      const rawJson = await generateGeminiText(
        JSON_SYSTEM_PROMPT,
        buildJsonUserPrompt({ input, snippets, consultedAt }),
        {
          temperature: 0.45,
          maxOutputTokens: 4096,
          attemptsPerModel: 3,
          maxModels: 3,
        },
      );
      const plan = parseItineraryJson(rawJson);
      if (!plan) {
        return NextResponse.json(
          {
            error: "GENERATION_FAILED",
            message:
              "Gemini está saturado y no pudo armar la guía. Espera ~1 min y reintenta.",
          },
          { status: 502 },
        );
      }
      html = sanitizeGuideHtml(
        renderGuideHtml({
          plan,
          images,
          consultedAt,
          destination: input.destination,
          origin: input.origin,
          locale: input.locale,
          travelers: input.travelers,
          booking,
        }),
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
      fallback: usedFallback,
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
    const friendly =
      /high demand|try again later|unavailable|overloaded|saturad/i.test(
        message,
      )
        ? "Gemini está saturado ahora mismo. Espera unos segundos y vuelve a generar."
        : message === "GEMINI_EMPTY"
          ? "La IA no devolvió contenido. Reintenta."
          : message.startsWith("Gemini") || message.length < 160
            ? message
            : "No se pudo generar la guía. Inténtalo de nuevo.";
    return NextResponse.json(
      {
        error: "SERVER",
        message: friendly,
      },
      { status: 500 },
    );
  }
}
