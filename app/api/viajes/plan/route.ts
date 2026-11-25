import { NextResponse } from "next/server";
import { generateTravelGuide } from "@/lib/viajes/generate-guide";
import { clientIp, consumeRateLimit } from "@/lib/viajes/rate-limit";
import { parseTripPlanInput } from "@/lib/viajes/validate";

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

    const guide = await generateTravelGuide(input);

    return NextResponse.json({
      html: guide.html,
      title: guide.title,
      sources: guide.sources,
      images: guide.images,
      videos: guide.videos,
      cities: guide.cities,
      trip: guide.trip,
      consultedAt: guide.consultedAt,
      fallback: guide.fallback,
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
    if (message === "TAVILY_QUOTA") {
      return NextResponse.json(
        {
          error: "TAVILY_QUOTA",
          message:
            "Cuota gratuita de búsqueda agotada este mes. Prueba más adelante.",
        },
        { status: 429 },
      );
    }
    if (message === "GENERATION_FAILED") {
      return NextResponse.json(
        {
          error: "GENERATION_FAILED",
          message:
            "Gemini está saturado y no pudo armar la guía. Espera ~1 min y reintenta.",
        },
        { status: 502 },
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
