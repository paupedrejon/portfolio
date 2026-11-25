import { generateGeminiText } from "@/lib/viajes/gemini";
import {
  EDIT_TRIP_SYSTEM_PROMPT,
  buildEditTripUserPrompt,
} from "@/lib/viajes/prompts";
import type { TripPlanInput } from "@/lib/viajes/types";
import { parseTripPlanInput } from "@/lib/viajes/validate";

function extractJsonObject(raw: string): Record<string, unknown> | null {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const text = (fenced?.[1] || raw).trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function heuristicAddCity(
  trip: TripPlanInput,
  instruction: string,
): TripPlanInput | null {
  const m = instruction.match(
    /\b(?:a[nñ]ade|agrega|incluye|suma|add|include)\b\s+(?:tamb[ií]en\s+)?([A-Za-zÁÉÍÓÚÜÑáéíóúüñ][\wÁÉÍÓÚÜÑáéíóúüñ\-']*(?:\s+[A-Za-zÁÉÍÓÚÜÑáéíóúüñ][\wÁÉÍÓÚÜÑáéíóúüñ\-']*){0,2})/i,
  );
  if (!m?.[1]) return null;
  const rawCity = m[1].trim();
  if (rawCity.length < 2) return null;
  const city = rawCity.replace(/\b\w/g, (ch) => ch.toUpperCase());
  const existing = [trip.destination, ...(trip.destinations || [])].map((c) =>
    c.toLowerCase(),
  );
  if (existing.includes(city.toLowerCase())) return trip;
  return {
    ...trip,
    destinations: [...(trip.destinations || []), city].slice(0, 5),
  };
}

/**
 * Turn a chat instruction into an updated TripPlanInput.
 * Falls back to simple heuristics if the model fails.
 */
export async function interpretTripEdit(params: {
  trip: TripPlanInput;
  instruction: string;
  currentCities?: string[];
}): Promise<{ trip: TripPlanInput; summary: string }> {
  try {
    const raw = await generateGeminiText(
      EDIT_TRIP_SYSTEM_PROMPT,
      buildEditTripUserPrompt(params),
      {
        temperature: 0.2,
        maxOutputTokens: 2048,
        attemptsPerModel: 2,
        maxModels: 2,
      },
    );
    const data = extractJsonObject(raw);
    if (data) {
      const merged = parseTripPlanInput({
        ...params.trip,
        ...data,
        locale: params.trip.locale,
        transport: "flexible",
        destinations: Array.isArray(data.destinations)
          ? data.destinations
          : params.trip.destinations,
      });
      if (merged) {
        const summary =
          typeof data.summary === "string" && data.summary.trim()
            ? data.summary.trim().slice(0, 200)
            : "Plan actualizado.";
        return { trip: merged, summary };
      }
    }
  } catch (err) {
    console.warn("[viajes/edit-trip] interpret failed", err);
  }

  const heuristic = heuristicAddCity(params.trip, params.instruction);
  if (heuristic) {
    return {
      trip: heuristic,
      summary: `He añadido ${heuristic.destinations[heuristic.destinations.length - 1]} al itinerario.`,
    };
  }

  // Last resort: keep trip, still regenerate with instruction as JSON hint
  return {
    trip: params.trip,
    summary: "Regenero la guía aplicando tu cambio.",
  };
}
