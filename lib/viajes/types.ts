export type DateMode = "exact" | "flexible";
/** Always search all modes (flight/train/bus/ferry); kept for back-compat. */
export type TransportPref = "flexible";

export type TripPlanInput = {
  origin: string;
  /** Primary destination (first city). */
  destination: string;
  /** Extra cities on the same trip (e.g. Prague + Vienna). */
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

/** Expand country-level destinations into a classic multi-city route for stays/days. */
export function expandDestinationLabel(label: string): string[] {
  const d = label
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim();
  if (/^(japon|japan|nihon|nippon)$/.test(d)) {
    return ["Tokio", "Kioto", "Osaka"];
  }
  if (/^(corea del sur|south korea|korea|corea)$/.test(d)) {
    return ["Seúl", "Busan"];
  }
  if (/^(italia|italy)$/.test(d)) {
    return ["Roma", "Florencia", "Venecia"];
  }
  if (/^(francia|france)$/.test(d)) {
    return ["París"];
  }
  if (/^(espana|spain)$/.test(d)) {
    return ["Madrid", "Barcelona"];
  }
  return [label.trim()].filter(Boolean);
}

export function allDestinations(
  input: Pick<TripPlanInput, "destination" | "destinations">,
): string[] {
  const raw = [input.destination, ...(input.destinations || [])]
    .map((s) => s.trim())
    .filter(Boolean);
  const expanded = raw.flatMap((label) => expandDestinationLabel(label));
  return [...new Set(expanded)];
}
