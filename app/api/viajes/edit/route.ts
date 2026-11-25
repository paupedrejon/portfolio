import { NextResponse } from "next/server";
import { interpretTripEdit } from "@/lib/viajes/edit-trip";
import { generateTravelGuide } from "@/lib/viajes/generate-guide";
import { clientIp, consumeRateLimit } from "@/lib/viajes/rate-limit";
import { parseTripPlanInput } from "@/lib/viajes/validate";
import { allDestinations } from "@/lib/viajes/types";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const ip = clientIp(request);
    const limit = consumeRateLimit(`viajes:edit:${ip}`, 12);
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
    const instruction =
      typeof body?.instruction === "string"
        ? body.instruction.trim().slice(0, 800)
        : "";

    if (instruction.length < 2) {
      return NextResponse.json(
        {
          error: "INVALID_INPUT",
          message: "Necesito una instrucción de edición.",
        },
        { status: 400 },
      );
    }

    const trip = parseTripPlanInput(body.trip || body);
    if (!trip) {
      return NextResponse.json(
        {
          error: "INVALID_INPUT",
          message: "Falta el viaje actual (origen y destino).",
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

    const currentCities = Array.isArray(body.cities)
      ? body.cities
          .filter((x: unknown): x is string => typeof x === "string")
          .map((x: string) => x.trim())
          .filter(Boolean)
          .slice(0, 6)
      : allDestinations(trip);

    const interpreted = await interpretTripEdit({
      trip,
      instruction,
      currentCities,
    });

    const guide = await generateTravelGuide(interpreted.trip, {
      extraJsonHint: `USER EDIT: ${instruction}\nApply this change in the itinerary (cities, days, stays, legs, videos themes). Cities in order should be: ${allDestinations(interpreted.trip).join(" → ")}.`,
    });

    return NextResponse.json({
      html: guide.html,
      title: guide.title,
      sources: guide.sources,
      cities: guide.cities,
      trip: guide.trip,
      summary: interpreted.summary,
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
            "No pude regenerar la guía con ese cambio. Reformula o reintenta.",
        },
        { status: 502 },
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
