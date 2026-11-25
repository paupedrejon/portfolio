import type { ItineraryPlan } from "./itinerary-schema";
import type { GuideImage } from "./types";
import { filterGuideImages, fetchDestinationImages } from "./wikimedia";

export type ActivityImageKey = string; // `${city}::${activity}`

const UA = "PortfolioTravelPlanner/1.0 (portfolio demo)";

function keyFor(city: string, activity: string): ActivityImageKey {
  return `${city.trim()}::${activity.trim()}`.toLowerCase();
}

const BAD_PAGE =
  /desambiguaci|disambiguation|lista de|list of|anexo:|subte|estaci[oó]n|station|metro de|line [a-z0-9]|l[ií]nea |category:|plantilla:|template:/i;

/** Strip action verbs that pollute Wikipedia titles — keep articles (Plaza de Mayo). */
function cleanQuery(s: string): string {
  return s
    .replace(
      /\b(visita(s)?|tour|cena|desayuno|almuerzo|paseo|compras|shopping|show|entrada|privada|privado|incluido|traslado|regreso|excursi[oó]n|caminata|ascenso|degustaci[oó]n)\b/gi,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim();
}

function usableThumb(src?: string): string | null {
  if (!src) return null;
  if (/\.svg($|\?)/i.test(src)) return null;
  if (/map|locator|flag|coat_of_arms|diagram|modis|satellite/i.test(src))
    return null;
  return src;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("json")) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

type PageThumb = { title: string; url: string };

/** One MediaWiki request → many page thumbnails. */
async function batchPageImages(
  titles: string[],
  lang: "es" | "en",
): Promise<Map<string, PageThumb>> {
  const out = new Map<string, PageThumb>();
  const unique = [...new Set(titles.map((t) => t.trim()).filter(Boolean))];
  for (let i = 0; i < unique.length; i += 18) {
    const chunk = unique.slice(i, i + 18);
    const api = new URL(`https://${lang}.wikipedia.org/w/api.php`);
    api.searchParams.set("action", "query");
    api.searchParams.set("format", "json");
    api.searchParams.set("prop", "pageimages");
    api.searchParams.set("piprop", "thumbnail");
    api.searchParams.set("pithumbsize", "1200");
    api.searchParams.set("titles", chunk.join("|"));
    api.searchParams.set("origin", "*");
    const data = await fetchJson<{
      query?: {
        pages?: Record<
          string,
          {
            title?: string;
            missing?: boolean;
            thumbnail?: { source?: string };
          }
        >;
      };
    }>(api.toString());
    for (const page of Object.values(data?.query?.pages ?? {})) {
      if (!page?.title || page.missing || BAD_PAGE.test(page.title)) continue;
      const url = usableThumb(page.thumbnail?.source);
      if (!url) continue;
      out.set(page.title.toLowerCase(), { title: page.title, url });
      // Also index without diacritics-ish lowercase exact
      out.set(norm(page.title), { title: page.title, url });
    }
  }
  return out;
}

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim();
}

function scoreMatch(candidateTitle: string, activity: string, city: string): number {
  const t = norm(candidateTitle);
  const a = norm(activity);
  const c = norm(city);
  if (BAD_PAGE.test(candidateTitle)) return -100;
  let score = 0;
  const tokens = a.split(/[^a-z0-9]+/).filter((x) => x.length > 2);
  for (const tok of tokens) {
    if (t.includes(tok)) score += tok.length > 5 ? 5 : 2;
  }
  if (c && t.includes(c)) score += 2;
  // Penalize generic city dump pages when activity is specific
  if (tokens.length >= 2 && (t === c || t.startsWith("san carlos de "))) score -= 8;
  if (candidateTitle.length < 50) score += 1;
  return score;
}

/** Candidate Wikipedia titles for an activity. */
function titleCandidates(activity: string, city: string): string[] {
  const cleaned = cleanQuery(activity);
  const words = cleaned.split(/\s+/).filter(Boolean);
  const out = [
    cleaned,
    activity.trim(),
    words.slice(0, 4).join(" "),
    words.slice(0, 3).join(" "),
    `${cleaned} (${city})`,
    `${words.slice(0, 3).join(" ")} ${city}`,
  ];
  // Known Spanish landmark aliases
  if (/malba/i.test(activity)) {
    out.push("Museo de Arte Latinoamericano de Buenos Aires", "MALBA");
  }
  if (/aten(eo)?|grand splendid/i.test(activity)) {
    out.push("El Ateneo Grand Splendid");
  }
  if (/teatro col[oó]n/i.test(activity)) out.push("Teatro Colón");
  if (/plaza de mayo|casa rosada/i.test(activity)) {
    out.push("Plaza de Mayo", "Casa Rosada");
  }
  if (/recoleta/i.test(activity) && /cementerio|cementery|cemetery/i.test(activity)) {
    out.push("Cementerio de la Recoleta");
  }
  if (/llao/i.test(activity)) out.push("Hotel Llao Llao", "Llao Llao");
  if (/campanario/i.test(activity)) {
    out.push("Cerro Campanario", "Cerro Campanario (Bariloche)");
  }
  if (/nahuel|huapi/i.test(activity)) out.push("Nahuel Huapi", "Lago Nahuel Huapi");
  if (/catedral/i.test(activity) && /bariloche|cerro/i.test(`${activity} ${city}`)) {
    out.push("Cerro Catedral");
  }
  return [...new Set(out.map((s) => s.trim()).filter((s) => s.length > 2))];
}

async function commonsThumb(query: string): Promise<string | null> {
  const api = new URL("https://commons.wikimedia.org/w/api.php");
  api.searchParams.set("action", "query");
  api.searchParams.set("format", "json");
  api.searchParams.set("generator", "search");
  api.searchParams.set(
    "gsrsearch",
    `${query} -map -plan -pdf -svg -diagram -flag -satellite -MODIS`,
  );
  api.searchParams.set("gsrnamespace", "6");
  api.searchParams.set("gsrlimit", "5");
  api.searchParams.set("prop", "imageinfo");
  api.searchParams.set("iiprop", "url|mime");
  api.searchParams.set("iiurlwidth", "1200");
  api.searchParams.set("origin", "*");
  const data = await fetchJson<{
    query?: {
      pages?: Record<
        string,
        {
          title?: string;
          imageinfo?: { url?: string; thumburl?: string; mime?: string }[];
        }
      >;
    };
  }>(api.toString());
  for (const page of Object.values(data?.query?.pages ?? {})) {
    const title = page.title || "";
    if (/map|plan|diagram|pdf|svg|flag|coat|satellite|modis|locator/i.test(title))
      continue;
    const info = page.imageinfo?.[0];
    if (!info?.mime?.startsWith("image/") || info.mime.includes("svg")) continue;
    const url = usableThumb(info.thumburl || info.url);
    if (url) return url;
  }
  return null;
}

async function openverseThumb(query: string): Promise<string | null> {
  const api = new URL("https://api.openverse.org/v1/images/");
  api.searchParams.set("q", query);
  api.searchParams.set("page_size", "4");
  const data = await fetchJson<{
    results?: { title?: string; url?: string; thumbnail?: string }[];
  }>(api.toString());
  for (const r of data?.results || []) {
    const url = usableThumb(r.thumbnail || r.url);
    if (!url) continue;
    if (/map|diagram|flag|svg/i.test(`${r.title || ""} ${url}`)) continue;
    return url;
  }
  return null;
}

/**
 * Fetch a photo for (almost) every activity in the plan.
 * Solid strategy: batched Wikipedia pageimages (few HTTP calls) →
 * Commons/Openverse only for misses → city skyline fallbacks.
 */
export async function fetchActivityImageMap(
  plan: ItineraryPlan,
): Promise<{
  byActivity: Map<ActivityImageKey, GuideImage>;
  cityFallbacks: GuideImage[];
}> {
  const jobs: { city: string; activity: string; key: ActivityImageKey }[] = [];
  const seenJob = new Set<string>();
  const pushJob = (city: string, name: string) => {
    const c = city.trim() || "destino";
    const n = name.trim();
    if (!n) return;
    const k = keyFor(c, n);
    if (seenJob.has(k)) return;
    seenJob.add(k);
    jobs.push({ city: c, activity: n, key: k });
  };
  for (const stay of plan.stays || []) {
    pushJob(stay.city || "", stay.name || "");
  }
  for (const day of plan.days || []) {
    const city = (day.city || "").trim() || "destino";
    for (const a of day.activities || []) {
      pushJob(city, a.name || "");
    }
  }

  const capped = jobs.slice(0, 40);
  const cities = [
    ...new Set(
      (plan.days || []).map((d) => (d.city || "").trim()).filter(Boolean),
    ),
  ].slice(0, 4);

  // City pools in parallel with Wikipedia batches
  const cityPromise = Promise.all(
    cities.map((c) =>
      fetchDestinationImages(c, ["landmark", "skyline", "plaza", "lake"]),
    ),
  );

  const candidatesByJob = capped.map((job) => ({
    ...job,
    candidates: titleCandidates(job.activity, job.city),
  }));
  const allTitles = candidatesByJob.flatMap((j) => j.candidates);

  const [esPages, enPages] = await Promise.all([
    batchPageImages(allTitles, "es"),
    batchPageImages(allTitles, "en"),
  ]);

  const byActivity = new Map<ActivityImageKey, GuideImage>();

  for (const job of candidatesByJob) {
    let best: { score: number; thumb: PageThumb } | null = null;
    for (const cand of job.candidates) {
      const hit =
        esPages.get(cand.toLowerCase()) ||
        esPages.get(norm(cand)) ||
        enPages.get(cand.toLowerCase()) ||
        enPages.get(norm(cand));
      if (!hit) continue;
      const score = scoreMatch(hit.title, job.activity, job.city);
      if (!best || score > best.score) best = { score, thumb: hit };
    }
    // Also scan all returned pages for fuzzy match
    for (const thumb of [...esPages.values(), ...enPages.values()]) {
      const score = scoreMatch(thumb.title, job.activity, job.city);
      if (score >= 6 && (!best || score > best.score)) {
        best = { score, thumb };
      }
    }
    if (best && best.score >= 4) {
      byActivity.set(job.key, {
        url: best.thumb.url,
        title: best.thumb.title,
        attribution: "Wikipedia",
        query: `${job.city}::${job.activity}`,
      });
    }
  }

  // Fill misses with Commons / Openverse (capped, sequential-ish)
  const misses = candidatesByJob.filter((j) => !byActivity.has(j.key)).slice(0, 12);
  for (const job of misses) {
    const q = `${cleanQuery(job.activity) || job.activity} ${job.city}`;
    const commons = await commonsThumb(q);
    if (commons) {
      byActivity.set(job.key, {
        url: commons,
        title: q,
        attribution: "Wikimedia Commons",
        query: `${job.city}::${job.activity}`,
      });
      continue;
    }
    const ov = await openverseThumb(q);
    if (ov) {
      byActivity.set(job.key, {
        url: ov,
        title: q,
        attribution: "Openverse",
        query: `${job.city}::${job.activity}`,
      });
    }
  }

  const cityBatches = await cityPromise;
  const cityFallbacks = filterGuideImages(cityBatches.flat());

  return { byActivity, cityFallbacks };
}

export function lookupActivityImage(
  map: Map<ActivityImageKey, GuideImage>,
  city: string,
  activity: string,
): GuideImage | null {
  return map.get(keyFor(city, activity)) || null;
}

/** @deprecated kept for direct tests */
export async function resolveActivityImage(
  activity: string,
  city: string,
): Promise<GuideImage | null> {
  const fake: ItineraryPlan = {
    title: "x",
    tagline: "",
    palette: { bg: "", ink: "", accent: "", paper: "" },
    transport: { outbound: "", inbound: "" },
    stays: [],
    budget: [],
    days: [{ title: "1", city, activities: [{ name: activity }] }],
  };
  const { byActivity } = await fetchActivityImageMap(fake);
  return byActivity.get(keyFor(city, activity)) || null;
}
