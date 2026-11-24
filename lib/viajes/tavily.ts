import type { SearchSnippet, TripPlanInput } from "./types";

type TavilyResult = {
  title?: string;
  url?: string;
  content?: string;
};

type TavilyResponse = {
  results?: TavilyResult[];
};

function luxuryLabel(n: number): string {
  if (n <= 1) return "budget hostel backpacker";
  if (n === 2) return "budget mid-range hotel";
  if (n === 3) return "mid-range hotel apartment";
  if (n === 4) return "upscale boutique hotel";
  return "luxury 5-star hotel";
}

function whenLabel(input: TripPlanInput): string {
  if (input.dateMode === "exact" && input.startDate && input.endDate) {
    return `${input.startDate} to ${input.endDate}`;
  }
  if (input.dateMode === "flexible") {
    const month = input.flexibleMonth || "upcoming months";
    const min = input.daysMin ?? 3;
    const max = input.daysMax ?? 10;
    return `${month} trip ${min}-${max} days`;
  }
  if (input.days) return `${input.days} days`;
  return "flexible dates";
}

export function buildSearchQueries(input: TripPlanInput): string[] {
  const { origin, destination, transport } = input;
  const lux = luxuryLabel(input.luxury);
  const when = whenLabel(input);

  const interests =
    input.interests.length > 0
      ? input.interests.join(" ")
      : "sightseeing food";

  const transportQ =
    transport === "bus"
      ? `Flixbus bus ${origin} to ${destination} cheapest ticket price ${when}`
      : transport === "flight"
        ? `cheapest flights ${origin} to ${destination} round trip prices ${when}`
        : `cheapest transport flight or bus ${origin} to ${destination} prices ${when}`;

  return [
    transportQ,
    `${destination} ${lux} booking prices per night ${when}`,
    `best things to do in ${destination} ${interests} ticket prices`,
    `${destination} restaurants average meal price`,
  ];
}

async function searchOne(
  apiKey: string,
  query: string,
): Promise<SearchSnippet[]> {
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: "basic",
      max_results: 3,
      include_answer: false,
    }),
  });

  if (res.status === 429) throw new Error("TAVILY_QUOTA");
  if (!res.ok) return [];

  const data = (await res.json()) as TavilyResponse;
  return (data.results ?? [])
    .filter((r) => r.url && r.content)
    .map((r) => ({
      query,
      title: r.title || query,
      url: r.url!,
      content: (r.content || "").slice(0, 900),
    }));
}

export async function searchTravelContext(
  input: TripPlanInput,
): Promise<SearchSnippet[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error("TAVILY_API_KEY_MISSING");
  }

  const queries = buildSearchQueries(input);
  const settled = await Promise.allSettled(
    queries.map((q) => searchOne(apiKey, q)),
  );

  const snippets: SearchSnippet[] = [];
  for (const result of settled) {
    if (result.status === "rejected") {
      if (
        result.reason instanceof Error &&
        result.reason.message === "TAVILY_QUOTA"
      ) {
        throw result.reason;
      }
      continue;
    }
    snippets.push(...result.value);
  }
  return snippets;
}
