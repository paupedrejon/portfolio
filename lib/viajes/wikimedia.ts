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
  /\.(pdf|djvu|svg|tif|tiff)(\b|$)|\/page\d|plan de |map of |carte |atlas |coat of arms|flag of |logo |diagram|screenshot|oj_l_|title.?page|pictorial representation|manuscript|engraving|woodcut|etching|book.?cover|scan of|postcard of .*18|old.?map|cadastr|burn.?scar|modis|satellite|nasa |documents_de_la_session|session_de_la|chart of |graph of |topo(graphic)? map|cadastral|scan_|page_from|newspaper|gazette|worksheet|infographic|emblem|seal of |crest of |locator map|orthophoto|aerial survey/i;

const BAD_URL =
  /\.pdf($|\?)|\/wikipedia\/commons\/.*\.pdf|page\d+-.*\.pdf|\.djvu|\.svg($|\?)|Burn_Scars|MODIS|Documents_de_la_session|locator_map/i;

function isUsableTitle(title: string): boolean {
  return !BAD_TITLE.test(title);
}

function isUsableUrl(url: string): boolean {
  if (BAD_URL.test(url)) return false;
  return /\.(jpe?g|png|webp)($|\?)/i.test(url) || /\/thumb\//i.test(url);
}

/**
 * Generic landmark queries for ANY city/country — no per-destination hardcoding.
 * Works for Montreal, Osaka, Cape Town, Patagonia, etc.
 */
export function landmarkQueriesForDestination(destination: string): string[] {
  const place = destination.trim();
  if (!place) return [];
  return [
    `${place} skyline`,
    `${place} landmark`,
    `${place} cityscape photo`,
    `${place} old town`,
    `${place} street night`,
    `${place} travel photography`,
    `${place} waterfront`,
    `${place} historic center`,
  ];
}

async function searchFileTitles(query: string, limit = 5): Promise<string[]> {
  const api = new URL("https://commons.wikimedia.org/w/api.php");
  api.searchParams.set("action", "query");
  api.searchParams.set("format", "json");
  api.searchParams.set("list", "search");
  api.searchParams.set("srnamespace", "6");
  api.searchParams.set("srlimit", String(limit));
  api.searchParams.set(
    "srsearch",
    `${query} -pdf -djvu -svg -map -plan -postcard -engraving -manuscript -book -satellite -MODIS`,
  );
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
    if (!isUsableTitle(img.query || "")) return false;
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
    ...extraQueries.slice(0, 4).map((q) => `${destination} ${q}`),
  ].slice(0, 10);

  const images: GuideImage[] = [];
  const seen = new Set<string>();

  for (const q of queries) {
    const titles = await searchFileTitles(q, 3);
    for (const title of titles) {
      if (images.length >= 14) return filterGuideImages(images);
      const img = await resolveImage(title, `${destination}::${q}`);
      if (!img || seen.has(img.url)) continue;
      seen.add(img.url);
      images.push(img);
    }
  }

  return filterGuideImages(images);
}
