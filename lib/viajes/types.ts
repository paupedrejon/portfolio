export type DateMode = "exact" | "flexible";
/** Always search all modes (flight/train/bus/ferry); kept for back-compat. */
export type TransportPref = "flexible";

export type TripPlanInput = {
  origin: string;
  /** Primary destination (first city or country as typed by the user). */
  destination: string;
  /** Extra destinations the user added (cities/countries). */
  destinations: string[];
  dateMode: DateMode;
  /** Exact outbound YYYY-MM-DD */
  startDate?: string;
  /** Exact return YYYY-MM-DD */
  endDate?: string;
  /** Flexible: YYYY-MM */
  flexibleMonth?: string;
  daysMin?: number;
  daysMax?: number;
  /** Legacy single days count (maps to min=max) */
  days?: number;
  luxury: number;
  /** Number of travelers (for per-person budget). */
  travelers: number;
  interests: string[];
  interestsNote?: string;
  transport: TransportPref;
  locale: string;
};

export type GuideImage = {
  url: string;
  title: string;
  attribution: string;
  query: string;
};

export type { GuideVideo } from "./youtube";

export type SearchSnippet = {
  query: string;
  title: string;
  url: string;
  content: string;
};

export type PlanResult = {
  html: string;
  title: string;
  sources: SearchSnippet[];
  images: GuideImage[];
  consultedAt: string;
};

export const INTEREST_PRESETS = [
  "food",
  "culture",
  "nature",
  "nightlife",
  "shopping",
  "museums",
  "adventure",
  "relaxation",
] as const;

export type InterestPreset = (typeof INTEREST_PRESETS)[number];

/** User-typed destinations only — never invent country→city expansions here. */
export function allDestinations(
  input: Pick<TripPlanInput, "destination" | "destinations">,
): string[] {
  const list = [input.destination, ...(input.destinations || [])]
    .map((s) => s.trim())
    .filter(Boolean);
  return [...new Set(list)];
}

/** Prefer concrete cities from the AI plan; fall back to user labels. */
export function citiesFromPlan(
  plan: {
    stays?: { city?: string }[];
    days?: { city?: string }[];
    legs?: { toCity?: string; fromCity?: string }[];
  } | null,
  fallback: string[],
): string[] {
  const fromStays = (plan?.stays || []).map((s) => s.city?.trim()).filter(Boolean) as string[];
  const fromDays = (plan?.days || []).map((d) => d.city?.trim()).filter(Boolean) as string[];
  const fromLegs = (plan?.legs || [])
    .flatMap((l) => [l.toCity, l.fromCity])
    .map((s) => s?.trim())
    .filter(Boolean) as string[];

  const ordered: string[] = [];
  for (const c of [...fromStays, ...fromDays, ...fromLegs]) {
    const key = c.toLowerCase();
    if (!ordered.some((x) => x.toLowerCase() === key)) ordered.push(c);
  }
  // Drop origin-looking noise later in booking; here keep destinations only
  if (ordered.length >= 1) return ordered.slice(0, 6);
  return fallback.slice(0, 6);
}
