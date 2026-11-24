import type { DateMode, TransportPref, TripPlanInput } from "./types";

function asString(v: unknown, max = 120): string {
  if (typeof v !== "string") return "";
  return v.trim().slice(0, max);
}

function asInt(v: unknown, min: number, max: number, fallback: number): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

export function parseTripPlanInput(body: unknown): TripPlanInput | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;

  const origin = asString(b.origin, 80);
  const destination = asString(b.destination, 80);
  if (origin.length < 2 || destination.length < 2) return null;

  const dateModeRaw = asString(b.dateMode, 20);
  // Back-compat: range/days → exact/flexible
  let dateMode: DateMode = "exact";
  if (
    dateModeRaw === "flexible" ||
    dateModeRaw === "days"
  ) {
    dateMode = "flexible";
  } else if (dateModeRaw === "exact" || dateModeRaw === "range") {
    dateMode = "exact";
  }

  const transportRaw = asString(b.transport, 20) as TransportPref;
  const transport: TransportPref =
    transportRaw === "bus" ||
    transportRaw === "flight" ||
    transportRaw === "flexible"
      ? transportRaw
      : "flexible";

  const interests = Array.isArray(b.interests)
    ? b.interests
        .filter((x): x is string => typeof x === "string")
        .map((x) => x.trim().slice(0, 40))
        .filter(Boolean)
        .slice(0, 10)
    : [];

  const localeRaw = asString(b.locale, 5).toLowerCase();
  const locale =
    localeRaw === "en" || localeRaw === "it" || localeRaw === "es"
      ? localeRaw
      : "es";

  const daysMin = asInt(b.daysMin ?? b.days, 1, 30, 4);
  const daysMax = asInt(b.daysMax ?? b.days, daysMin, 30, Math.max(daysMin, 7));

  return {
    origin,
    destination,
    dateMode,
    startDate: asString(b.startDate, 32) || undefined,
    endDate: asString(b.endDate, 32) || undefined,
    flexibleMonth: asString(b.flexibleMonth, 16) || undefined,
    daysMin: dateMode === "flexible" ? daysMin : undefined,
    daysMax: dateMode === "flexible" ? daysMax : undefined,
    days: dateMode === "flexible" ? daysMin : undefined,
    luxury: asInt(b.luxury, 1, 5, 3),
    interests,
    interestsNote: asString(b.interestsNote, 400) || undefined,
    transport,
    locale,
  };
}

export function wantsPriceResearch(instruction: string): boolean {
  return /\b(precio|precios|price|prices|vuelo|vuelos|flight|hotel|bus|flixbus|barato|cheap|rebusca|research|buscar|search)\b/i.test(
    instruction,
  );
}
