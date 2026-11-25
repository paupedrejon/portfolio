import { allDestinations } from "./types";
import type { TripPlanInput } from "./types";

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

/** Landmark / vibe search queries per city for atmospheric walk videos. */
export function videoQueriesForCity(city: string): string[] {
  const c = city.trim();
  const d = c
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");

  if (/tokio|tokyo/.test(d)) {
    return [
      `site:youtube.com Tokyo night walk Shibuya Shinjuku 4K`,
      `site:youtube.com Tokyo snow night walking tour`,
    ];
  }
  if (/kioto|kyoto/.test(d)) {
    return [
      `site:youtube.com Fushimi Inari walking tour 4K`,
      `site:youtube.com Kyoto Arashiyama Gion walk`,
    ];
  }
  if (/osaka/.test(d)) {
    return [`site:youtube.com Dotonbori Osaka night walk 4K`];
  }
  if (/nueva york|new york|nyc|manhattan/.test(d)) {
    return [
      `site:youtube.com New York City walking tour 4K Manhattan`,
      `site:youtube.com Times Square night walk New York`,
      `site:youtube.com Brooklyn Bridge walk New York 4K`,
    ];
  }
  if (/paris|par[ií]s/.test(d)) {
    return [
      `site:youtube.com Paris walking tour 4K Seine`,
      `site:youtube.com Montmartre night walk Paris`,
    ];
  }
  if (/seul|seoul/.test(d)) {
    return [`site:youtube.com Seoul night walk Myeongdong Hongdae 4K`];
  }
  if (/montreal|montr[eé]al/.test(d)) {
    return [
      `site:youtube.com Old Montreal winter walking tour snow`,
      `site:youtube.com Montreal night walk winter 4K`,
    ];
  }
  if (/quebec|qu[eé]bec/.test(d)) {
    return [`site:youtube.com Old Quebec City winter night walk snow`];
  }
  if (/toronto/.test(d)) {
    return [`site:youtube.com Toronto winter walking tour 4K`];
  }
  if (/canada|canad[aá]/.test(d)) {
    return [
      `site:youtube.com Quebec City winter walk snow 4K`,
      `site:youtube.com Montreal winter Old Port walk`,
    ];
  }
  if (/roma|rome/.test(d)) {
    return [`site:youtube.com Rome walking tour Colosseum 4K`];
  }
  if (/barcelona/.test(d)) {
    return [`site:youtube.com Barcelona walking tour Gothic Quarter 4K`];
  }
  if (/london|londres/.test(d)) {
    return [`site:youtube.com London walking tour 4K`];
  }
  return [
    `site:youtube.com ${c} walking tour 4K`,
    `site:youtube.com ${c} night walk travel`,
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
      max_results: 5,
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
    const title = (r.title || `${city} — vídeo`).replace(/\s*-\s*YouTube\s*$/i, "").trim();
    const description = (r.content || "").slice(0, 120).trim() || `Paseo / ambiente en ${city}`;
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

/** Fetch 4–8 destination vibe videos (YouTube) via Tavily. Free tier friendly. */
export async function fetchTripVideos(
  input: TripPlanInput,
): Promise<GuideVideo[]> {
  const apiKey = process.env.TAVILY_API_KEY?.trim();
  if (!apiKey) return [];

  const cities = allDestinations(input).slice(0, 4);
  const queries: { city: string; q: string }[] = [];
  for (const city of cities) {
    for (const q of videoQueriesForCity(city).slice(0, 2)) {
      queries.push({ city, q });
    }
  }
  // Cap parallel searches to protect free quota
  const limited = queries.slice(0, 6);

  const settled = await Promise.allSettled(
    limited.map(({ city, q }) => searchYoutube(apiKey, q, city)),
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
      if (videos.length >= 8) return videos;
    }
  }
  return videos;
}
