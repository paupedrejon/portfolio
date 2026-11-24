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

export function buildSearchQueries(input: TripPlanInput): string[] {
  const { origin, destination, transport } = input;
  const lux = luxuryLabel(input.luxury);
  const when =
    input.dateMode === "range" && input.startDate && input.endDate
      ? `${input.startDate} to ${input.endDate}`
      : input.dateMode === "days" && input.days
        ? `${input.days} days`
        : "flexible dates";

  const transportQ =
    transport === "bus"
      ? `Flixbus bus ${origin} to ${destination} cheapest ticket price ${when}`
      : transport === "flight"
        ? `cheapest flights ${origin} to ${destination} round trip prices ${when}`
        : `cheapest transport flight or bus ${origin} to ${destination} prices ${when}`;

  const interests =
    input.interests.length > 0
      ? input.interests.join(" ")
      : "sightseeing food";

  return [
    transportQ,
    `return trip cheapest ${destination} to ${origin} ${transport === "bus" ? "bus" : "flight"} price`,
    `${destination} ${lux} booking prices per night ${when}`,
    `best things to do in ${destination} ${interests} ticket prices`,
    `${destination} restaurants ${input.luxury <= 2 ? "cheap local" : input.luxury >= 4 ? "fine dining" : "mid-range"} average price`,
    `${destination} day trip activities costs ${when}`,
  ].slice(0, 6);
}

export async function searchTravelContext(
  input: TripPlanInput,
): Promise<SearchSnippet[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error("TAVILY_API_KEY_MISSING");
  }

  const queries = buildSearchQueries(input);
  const snippets: SearchSnippet[] = [];

  for (const query of queries) {
    try {
      const res = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: apiKey,
          query,
          search_depth: "basic",
          max_results: 4,
          include_answer: false,
        }),
      });

      if (res.status === 429) {
        throw new Error("TAVILY_QUOTA");
      }
      if (!res.ok) {
        continue;
      }

      const data = (await res.json()) as TavilyResponse;
      for (const r of data.results ?? []) {
        if (!r.url || !r.content) continue;
        snippets.push({
          query,
          title: r.title || query,
          url: r.url,
          content: r.content.slice(0, 900),
        });
      }
    } catch (err) {
      if (err instanceof Error && err.message === "TAVILY_QUOTA") throw err;
    }
  }

  return snippets;
}
