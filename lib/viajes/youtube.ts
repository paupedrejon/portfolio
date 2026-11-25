import type { TripPlanInput } from "./types";
import { allDestinations } from "./types";

export type GuideVideo = {
  id: string;
  title: string;
  description: string;
  url: string;
  thumb: string;
  city: string;
};

function extractYoutubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace(/^\//, "").slice(0, 20);
      return /^[\w-]{6,}$/.test(id) ? id : null;
    }
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v && /^[\w-]{6,}$/.test(v)) return v;
      const embed = u.pathname.match(/\/(?:embed|shorts|live)\/([\w-]{6,})/);
      if (embed) return embed[1];
    }
  } catch {
    /* ignore */
  }
  const m = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/,
  );
  return m?.[1] || null;
}

function thumbFor(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

/** Generic vibe queries — works for any city on Earth. */
export function videoQueriesForCity(city: string): string[] {
  const c = city.trim();
  if (!c) return [];
  return [
    `site:youtube.com ${c} walking tour 4K`,
    `site:youtube.com ${c} night walk travel`,
    `site:youtube.com ${c} city walk no talking`,
  ];
}

type TavilyResult = { title?: string; url?: string; content?: string };
type TavilyResponse = { results?: TavilyResult[] };

async function searchYoutube(
  apiKey: string,
  query: string,
  city: string,
): Promise<GuideVideo[]> {
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey.trim(),
      query,
      search_depth: "basic",
      max_results: 4,
      include_domains: ["youtube.com", "www.youtube.com", "youtu.be"],
      include_answer: false,
    }),
  });
  if (res.status === 429) throw new Error("TAVILY_QUOTA");
  if (!res.ok) return [];

  const data = (await res.json()) as TavilyResponse;
  const out: GuideVideo[] = [];
  for (const r of data.results ?? []) {
    if (!r.url) continue;
    const id = extractYoutubeId(r.url);
    if (!id) continue;
    const title = (r.title || `${city} — vídeo`)
      .replace(/\s*-\s*YouTube\s*$/i, "")
      .trim();
    const description =
      (r.content || "").replace(/^###?\s*Description\s*/i, "").slice(0, 120).trim() ||
      `Ambiente en ${city}`;
    out.push({
      id,
      title,
      description,
      url: `https://www.youtube.com/watch?v=${id}`,
      thumb: thumbFor(id),
      city,
    });
  }
  return out;
}

/** Fetch vibe videos for the given cities (from AI plan or user input). */
export async function fetchTripVideos(
  input: TripPlanInput,
  cityOverride?: string[],
): Promise<GuideVideo[]> {
  const apiKey = process.env.TAVILY_API_KEY?.trim();
  if (!apiKey) return [];

  const cities =
    cityOverride && cityOverride.length > 0
      ? cityOverride
      : allDestinations(input);
  const limitedCities = cities.slice(0, 4);

  const queries: { city: string; q: string }[] = [];
  for (const city of limitedCities) {
    for (const q of videoQueriesForCity(city).slice(0, 2)) {
      queries.push({ city, q });
    }
  }

  const settled = await Promise.allSettled(
    queries.slice(0, 6).map(({ city, q }) => searchYoutube(apiKey, q, city)),
  );

  const seen = new Set<string>();
  const videos: GuideVideo[] = [];
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
    for (const v of result.value) {
      if (seen.has(v.id)) continue;
      seen.add(v.id);
      videos.push(v);
      if (videos.length >= 5) return videos;
    }
  }
  return videos;
}
