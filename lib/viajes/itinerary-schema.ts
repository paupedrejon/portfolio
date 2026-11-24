export type ItineraryDay = {
  title: string;
  summary?: string;
  activities: { name: string; price?: string; tip?: string }[];
};

export type ItineraryPlan = {
  title: string;
  tagline: string;
  datesLabel?: string;
  luxuryLabel?: string;
  palette: {
    bg: string;
    ink: string;
    accent: string;
    paper: string;
  };
  transport: {
    outbound: string;
    inbound: string;
    note?: string;
  };
  stays: { name: string; price?: string; vibe?: string }[];
  budget: { label: string; amount: string }[];
  /** Estimated total per person */
  budgetPerPerson?: string;
  /** Estimated total for the whole group */
  budgetTotal?: string;
  days: ItineraryDay[];
  disclaimer?: string;
};

export function parseItineraryJson(raw: string): ItineraryPlan | null {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const text = (fenced?.[1] || raw).trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const data = JSON.parse(text.slice(start, end + 1)) as ItineraryPlan;
    if (!data?.title || !Array.isArray(data.days)) return null;
    return data;
  } catch {
    return null;
  }
}
