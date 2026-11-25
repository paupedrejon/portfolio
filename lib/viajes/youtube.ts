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
  return `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;
}

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim();
}

/** Beach / island / lagoon destinations need resort/aerial queries, not "city walk". */
function isIslandOrBeachPlace(place: string): boolean {
  return /maldives|maldiv|male\b|malé|bali|seychell|bora|tahiti|fiji|maui|hawaii|phuket|cancun|cancún|riviera maya|zanzibar|santorini|mykonos|ibiza|capri|amalfi|caribbean|polinesia|bora bora|mauritius|mauricio|maldives|atol[oó]n|lagoon|isla\b|island resort/i.test(
    place,
  );
}

/**
 * Destination-shaped YouTube queries:
 * Maldivas → beach / aerial / overwater; Paris → landmarks / Eiffel vibe.
 */
export function videoQueriesForCity(city: string): string[] {
  const c = city.trim();
  if (!c) return [];
  if (isIslandOrBeachPlace(c)) {
    return [
      `site:youtube.com ${c} beach aerial drone 4K`,
      `site:youtube.com ${c} overwater villa resort cinematic 4K`,
      `site:youtube.com ${c} lagoon island paradise 4K`,
    ];
  }
  return [
    `site:youtube.com ${c} landmarks cinematic 4K`,
    `site:youtube.com ${c} iconic view drone 4K`,
    `site:youtube.com ${c} walking tour 4K`,
  ];
}

/** True when the video text clearly refers to the place (avoids random cities). */
export function videoMatchesPlace(video: GuideVideo, place: string): boolean {
  const blob = norm(`${video.title} ${video.description} ${video.city}`);
  const placeN = norm(place);
  if (!placeN) return false;
  if (placeN.length > 3 && blob.includes(placeN)) return true;
  const tokens = placeN.split(/[^a-z0-9]+/).filter((t) => t.length > 3);
  if (tokens.length === 0) return blob.includes(placeN);
  const hits = tokens.filter((t) => blob.includes(t)).length;
  // Require a solid hit; "norte/sur/atolón" alone is too weak
  const strong = tokens.filter(
    (t) => !/^(norte|sur|east|west|atol|atolon|island|isla|city|ciudad)$/.test(t),
  );
  if (strong.length) return strong.some((t) => blob.includes(t));
  return hits >= 1;
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
    const title = (r.title || `${city} — vídeo`)
      .replace(/\s*-\s*YouTube\s*$/i, "")
      .trim();
    const description =
      (r.content || "").replace(/^###?\s*Description\s*/i, "").slice(0, 120).trim() ||
      `Ambiente en ${city}`;
    const video: GuideVideo = {
      id,
      title,
      description,
      url: `https://www.youtube.com/watch?v=${id}`,
      thumb: thumbFor(id),
      city,
    };
    // Drop obvious off-destination hits (e.g. Tasmania when searching Malé)
    if (!videoMatchesPlace(video, city)) continue;
    out.push(video);
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
  // Always include the user-facing destination label (e.g. "Maldivas")
  const places = [
    ...new Set(
      [input.destination, ...limitedCities]
        .map((p) => p.trim())
        .filter(Boolean),
    ),
  ].slice(0, 5);

  const queries: { city: string; q: string }[] = [];
  for (const place of places) {
    for (const q of videoQueriesForCity(place).slice(0, 2)) {
      queries.push({ city: place, q });
    }
  }

  const settled = await Promise.allSettled(
    queries.slice(0, 8).map(({ city, q }) => searchYoutube(apiKey, q, city)),
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
      // Must match at least one trip place
      const ok = places.some((p) => videoMatchesPlace(v, p));
      if (!ok) continue;
      seen.add(v.id);
      videos.push(v);
      if (videos.length >= 5) return videos;
    }
  }
  return videos;
}
