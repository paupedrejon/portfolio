import type { GuideImage } from "./types";

type WikiSearchResponse = {
  query?: {
    search?: { title?: string }[];
  };
};

type WikiImageInfo = {
  url?: string;
  thumburl?: string;
  mime?: string;
  extmetadata?: {
    Artist?: { value?: string };
    LicenseShortName?: { value?: string };
  };
};

type WikiImageResponse = {
  query?: {
    pages?: Record<
      string,
      {
        title?: string;
        imageinfo?: WikiImageInfo[];
      }
    >;
  };
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").trim();
}

const BAD_TITLE =
  /\.(pdf|djvu|svg|tif|tiff)(\b|$)|\/page\d|plan de |map of |carte |atlas |coat of arms|flag of |logo |diagram|screenshot|oj_l_|hermit nation|estudios americanos|cathedral_square.*vilnius|milan_cathedral|duomo|colosseum|eiffel.*when.?not.?paris/i;

const BAD_URL =
  /\.pdf($|\?)|\/wikipedia\/commons\/.*\.pdf|page\d+-.*\.pdf|\.djvu|\.svg($|\?)/i;

function isUsableTitle(title: string): boolean {
  return !BAD_TITLE.test(title);
}

function isUsableUrl(url: string): boolean {
  if (BAD_URL.test(url)) return false;
  return /\.(jpe?g|png|webp)($|\?)/i.test(url) || /\/thumb\//i.test(url);
}

/** Landmark-first queries so Korea ≠ Milan Duomo. */
export function landmarkQueriesForDestination(destination: string): string[] {
  const d = destination.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  if (/corea|korea|seul|seoul|busan|incheon/.test(d)) {
    return [
      "Seoul South Korea skyline night",
      "Gyeongbokgung palace Seoul",
      "N Seoul Tower",
      "Busan Haeundae",
      "Gwanghwamun Seoul",
    ];
  }
  if (/paris|par[ií]s/.test(d)) {
    return [
      "Eiffel Tower Paris",
      "Louvre Pyramid Paris",
      "Seine Paris night",
      "Arc de Triomphe Paris",
    ];
  }
  if (/tokio|tokyo|japon|japan|kyoto|osaka/.test(d)) {
    return [
      "Tokyo skyline night",
      "Sensoji temple Tokyo",
      "Shibuya crossing Tokyo",
      "Fushimi Inari Kyoto",
    ];
  }
  if (/barcelona/.test(d)) {
    return [
      "Sagrada Familia Barcelona",
      "Park Guell Barcelona",
      "Barcelona skyline",
    ];
  }
  if (/roma|rome/.test(d)) {
    return ["Colosseum Rome", "Trevi Fountain Rome", "Vatican Rome"];
  }
  if (/london|londres/.test(d)) {
    return ["Big Ben London", "Tower Bridge London", "London skyline"];
  }
  if (/new york|nyc|nueva york/.test(d)) {
    return [
      "Empire State Building New York",
      "Brooklyn Bridge New York",
      "Times Square New York",
    ];
  }
  return [
    `${destination} landmark filetype:bitmap`,
    `${destination} skyline`,
    `${destination} cityscape -map -plan -pdf`,
  ];
}

async function searchFileTitles(query: string, limit = 5): Promise<string[]> {
  const api = new URL("https://commons.wikimedia.org/w/api.php");
  api.searchParams.set("action", "query");
  api.searchParams.set("format", "json");
  api.searchParams.set("list", "search");
  api.searchParams.set("srnamespace", "6");
  api.searchParams.set("srlimit", String(limit));
  api.searchParams.set("srsearch", `${query} -pdf -djvu -svg`);
  api.searchParams.set("origin", "*");

  const res = await fetch(api.toString(), {
    headers: { "User-Agent": "PortfolioTravelPlanner/1.0 (portfolio demo)" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return [];
  const data = (await res.json()) as WikiSearchResponse;
  return (data.query?.search ?? [])
    .map((p) => p.title)
    .filter((t): t is string => typeof t === "string" && isUsableTitle(t));
}

async function resolveImage(
  title: string,
  query: string,
): Promise<GuideImage | null> {
  if (!isUsableTitle(title)) return null;

  const api = new URL("https://commons.wikimedia.org/w/api.php");
  api.searchParams.set("action", "query");
  api.searchParams.set("format", "json");
  api.searchParams.set("prop", "imageinfo");
  api.searchParams.set("iiprop", "url|extmetadata|mime");
  api.searchParams.set("iiurlwidth", "1280");
  api.searchParams.set("titles", title);
  api.searchParams.set("origin", "*");

  const res = await fetch(api.toString(), {
    headers: { "User-Agent": "PortfolioTravelPlanner/1.0 (portfolio demo)" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as WikiImageResponse;
  const page = Object.values(data.query?.pages ?? {})[0];
  const info = page?.imageinfo?.[0];
  const mime = info?.mime || "";
  if (mime && !mime.startsWith("image/")) return null;
  if (mime.includes("svg")) return null;

  const url = info?.thumburl || info?.url;
  if (!url || !isUsableUrl(url)) return null;

  const artist = stripHtml(
    info.extmetadata?.Artist?.value || "Wikimedia Commons",
  );
  const license = info.extmetadata?.LicenseShortName?.value || "CC";
  return {
    url,
    title: page?.title?.replace(/^File:/, "") || query,
    attribution: `${artist} · ${license}`,
    query,
  };
}

export function filterGuideImages(images: GuideImage[]): GuideImage[] {
  const seen = new Set<string>();
  return images.filter((img) => {
    if (!img?.url || seen.has(img.url)) return false;
    if (!isUsableUrl(img.url) || !isUsableTitle(img.title || "")) return false;
    seen.add(img.url);
    return true;
  });
}

export async function fetchDestinationImages(
  destination: string,
  extraQueries: string[] = [],
): Promise<GuideImage[]> {
  const queries = [
    ...landmarkQueriesForDestination(destination),
    ...extraQueries.slice(0, 2).map((q) => `${destination} ${q}`),
  ].slice(0, 6);

  const images: GuideImage[] = [];
  const seen = new Set<string>();

  for (const q of queries) {
    const titles = await searchFileTitles(q, 4);
    for (const title of titles) {
      if (images.length >= 8) return filterGuideImages(images);
      const img = await resolveImage(title, q);
      if (!img || seen.has(img.url)) continue;
      seen.add(img.url);
      images.push(img);
    }
  }

  return filterGuideImages(images);
}
