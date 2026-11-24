import type { GuideImage } from "./types";

type WikiSearchResponse = {
  query?: {
    search?: { title?: string }[];
  };
};

type WikiImageInfo = {
  url?: string;
  thumburl?: string;
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

async function searchFileTitles(query: string, limit = 3): Promise<string[]> {
  const api = new URL("https://commons.wikimedia.org/w/api.php");
  api.searchParams.set("action", "query");
  api.searchParams.set("format", "json");
  api.searchParams.set("list", "search");
  api.searchParams.set("srnamespace", "6");
  api.searchParams.set("srlimit", String(limit));
  api.searchParams.set("srsearch", query);
  api.searchParams.set("origin", "*");

  const res = await fetch(api.toString(), {
    headers: { "User-Agent": "PortfolioTravelPlanner/1.0 (portfolio demo)" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return [];
  const data = (await res.json()) as WikiSearchResponse;
  return (data.query?.search ?? [])
    .map((p) => p.title)
    .filter((t): t is string => Boolean(t));
}

async function resolveImage(
  title: string,
  query: string,
): Promise<GuideImage | null> {
  const api = new URL("https://commons.wikimedia.org/w/api.php");
  api.searchParams.set("action", "query");
  api.searchParams.set("format", "json");
  api.searchParams.set("prop", "imageinfo");
  api.searchParams.set("iiprop", "url|extmetadata");
  api.searchParams.set("iiurlwidth", "1200");
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
  const url = info?.thumburl || info?.url;
  if (!url) return null;

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

export async function fetchDestinationImages(
  destination: string,
  extraQueries: string[] = [],
): Promise<GuideImage[]> {
  const queries = [
    `${destination} landmark`,
    `${destination} skyline`,
    `${destination} tower OR cathedral OR plaza -map -plan`,
    ...extraQueries.slice(0, 2).map((q) => `${destination} ${q}`),
  ];

  const images: GuideImage[] = [];
  const seen = new Set<string>();

  for (const q of queries) {
    const titles = await searchFileTitles(q, 2);
    for (const title of titles) {
      if (images.length >= 8) return images;
      const img = await resolveImage(title, q);
      if (!img || seen.has(img.url)) continue;
      seen.add(img.url);
      images.push(img);
    }
  }

  return images;
}
