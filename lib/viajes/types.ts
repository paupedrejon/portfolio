export type DateMode = "range" | "days" | "flexible";
export type TransportPref = "flight" | "bus" | "flexible";

export type TripPlanInput = {
  origin: string;
  destination: string;
  dateMode: DateMode;
  startDate?: string;
  endDate?: string;
  days?: number;
  luxury: number;
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
