export type DateMode = "exact" | "flexible";
export type TransportPref = "flight" | "bus" | "flexible";

export type TripPlanInput = {
  origin: string;
  destination: string;
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
