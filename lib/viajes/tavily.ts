import { allDestinations } from "./types";
import type { SearchSnippet, TripPlanInput } from "./types";
import { resolveTripDates } from "./booking-links";

type TavilyResult = {
  title?: string;
  url?: string;
  content?: string;
};

type TavilyResponse = {
  results?: TavilyResult[];
};

function luxuryLabel(n: number): string {
  if (n <= 1) return "budget hostel backpacker dorm";
  if (n === 2) return "budget mid-range hotel";
  if (n === 3) return "mid-range hotel apartment";
  if (n === 4) return "upscale boutique hotel";
  return "luxury 5-star hotel";
}

export function buildSearchQueries(input: TripPlanInput): string[] {
  const dests = allDestinations(input);
  const primary = dests[0] || input.destination;
  const { origin, travelers } = input;
  const lux = luxuryLabel(input.luxury);
  const pax = travelers || 2;
  const { start, end } = resolveTripDates(input);

  const interests =
    input.interests.length > 0
      ? input.interests.join(" ")
      : "sightseeing food";

  const lodgingQs = dests.slice(0, 4).map(
    (city) =>
      `${city} ${lux} hotel OR apartment Booking.com price per night EUR ${pax} adults ${start}`,
  );

  const hopQs =
    dests.length > 1
      ? dests.slice(0, -1).map((city, i) => {
          const next = dests[i + 1];
          return `Shinkansen OR train OR bus ${city} to ${next} ticket price EUR Trainline`;
        })
      : [];

  const queries = [
    `cheapest round trip flight ${origin} to ${primary} ${start} ${end} ${pax} adults price EUR Skyscanner`,
    `${origin} to ${primary} flights February price euros round trip`,
    ...hopQs.slice(0, 2),
    ...lodgingQs.slice(0, 3),
    `${primary} hotel mid-range price per night EUR Booking`,
    `GetYourGuide ${primary} ${interests} ticket price EUR`,
    `${primary} museum ticket Broadway dinner price EUR`,
  ].filter(Boolean);

  return [...new Set(queries)].slice(0, 8);
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
      max_results: 5,
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
      content: (r.content || "").slice(0, 1000),
    }));
}

export async function searchTravelContext(
  input: TripPlanInput,
): Promise<SearchSnippet[]> {
  const apiKey = process.env.TAVILY_API_KEY?.trim();
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
