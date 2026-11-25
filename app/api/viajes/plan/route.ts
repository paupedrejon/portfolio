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
import { isItineraryDenseEnough } from "@/lib/viajes/itinerary-quality";
import { renderGuideHtml } from "@/lib/viajes/render-guide";
import { clientIp, consumeRateLimit } from "@/lib/viajes/rate-limit";
import { isGuideComplete, sanitizeGuideHtml } from "@/lib/viajes/sanitize";
import { searchTravelContext } from "@/lib/viajes/tavily";
import { parseTripPlanInput } from "@/lib/viajes/validate";
import { fetchDestinationImages, filterGuideImages } from "@/lib/viajes/wikimedia";
import { fetchTripVideos, type GuideVideo } from "@/lib/viajes/youtube";
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
    const dests = allDestinations(input);

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
      const landmarkExtras = [
        "skyline",
        "landmark",
        "bridge",
        "museum",
        "park",
        "night",
        "winter",
      ];
      const batches = await Promise.all(
        dests.slice(0, 4).map((d) =>
          fetchDestinationImages(d, [
            ...input.interests.slice(0, 2),
            ...landmarkExtras.slice(0, 4),
          ]),
        ),
      );
      images = filterGuideImages(batches.flat());
    } catch (imgErr) {
      console.warn("[viajes/plan] wikimedia", imgErr);
    }

    let videos: GuideVideo[] = [];
    try {
      if (process.env.TAVILY_API_KEY) {
        videos = await fetchTripVideos(input);
      }
    } catch (vidErr) {
      if (vidErr instanceof Error && vidErr.message === "TAVILY_QUOTA") {
        return NextResponse.json(
          {
            error: "TAVILY_QUOTA",
            message:
              "Cuota gratuita de búsqueda agotada este mes. Prueba más adelante.",
          },
          { status: 429 },
        );
      }
      console.warn("[viajes/plan] youtube", vidErr);
    }

    const booking = buildBookingLinks(input);
    const nights = Math.max(
      1,
      (booking.stays || []).reduce((a, s) => a + s.nights, 0) ||
        Math.round(
          (new Date(`${booking.tripEnd}T12:00:00`).getTime() -
            new Date(`${booking.tripStart}T12:00:00`).getTime()) /
            86400000,
        ),
    );

    let html = "";
    let usedFallback = false;

    const tryJsonPass = async (strictExtra: string) => {
      const rawJson = await generateGeminiText(
        JSON_SYSTEM_PROMPT,
        `${buildJsonUserPrompt({ input, snippets, consultedAt, booking })}\n${strictExtra}`,
        {
          temperature: 0.3,
          maxOutputTokens: 12288,
          attemptsPerModel: 2,
          maxModels: 3,
        },
      );
      return parseItineraryJson(rawJson);
    };

    // 1) Structured JSON → renderer (retry once if itinerary too thin)
    try {
      let plan = await tryJsonPass("");
      if (plan) {
        const quality = isItineraryDenseEnough(plan, { nights });
        if (!quality.ok) {
          console.warn("[viajes/plan] thin itinerary:", quality.reason);
          const retry = await tryJsonPass(
            `\nPREVIOUS DRAFT REJECTED: ${quality.reason}. Output ALL ${nights} days with ≥3 activities each across ${dests.join(", ")}.`,
          );
          if (retry) {
            const q2 = isItineraryDenseEnough(retry, { nights });
            if (q2.ok || (retry.days?.length || 0) > (plan.days?.length || 0)) {
              plan = retry;
            }
          }
        }
        html = sanitizeGuideHtml(
          renderGuideHtml({
            plan,
            images,
            videos,
            consultedAt,
            destination: dests.join(" · ") || input.destination,
            origin: input.origin,
            locale: input.locale,
            travelers: input.travelers,
            luxury: input.luxury,
            booking,
          }),
        );
        usedFallback = true;
      }
    } catch (jsonErr) {
      console.warn("[viajes/plan] json pass failed", jsonErr);
    }

    // 2) Optional art-directed HTML only if JSON path failed
    if (!html || html.length < 400) {
      try {
        const rawHtml = await generateGeminiText(
          GUIDE_SYSTEM_PROMPT,
          buildPlanUserPrompt({
            input,
            snippets,
            images,
            videos,
            consultedAt,
            booking,
          }),
          {
            temperature: 0.4,
            maxOutputTokens: 12288,
            attemptsPerModel: 1,
            maxModels: 2,
          },
        );
        const candidate = sanitizeGuideHtml(extractHtmlDocument(rawHtml));
        if (isGuideComplete(candidate, { minStays: Math.min(dests.length, 2) })) {
          html = candidate;
          usedFallback = false;
        } else {
          console.warn("[viajes/plan] html incomplete — rejected");
        }
      } catch (htmlErr) {
        console.warn("[viajes/plan] html pass failed", htmlErr);
      }
    }

    if (!html || html.length < 200 || !/<html[\s>]/i.test(html)) {
      return NextResponse.json(
        {
          error: "GENERATION_FAILED",
          message:
            "Gemini está saturado y no pudo armar la guía. Espera ~1 min y reintenta.",
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
      videos,
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
