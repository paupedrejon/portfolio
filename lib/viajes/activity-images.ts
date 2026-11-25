import type { ItineraryPlan } from "./itinerary-schema";
import type { GuideImage } from "./types";

export type ActivityImageKey = string; // `${city}::${activity}`

const UA = "PortfolioTravelPlanner/1.0 (portfolio demo)";

/** Junk that must never appear on travel cards / hero. */
const BAD_ASSET =
  /map|locator|flag|coat.?of.?arms|diagram|modis|satellite|\.svg|banner|black.?and.?white|blanco.?y.?negro|b&w|sepia|engraving|woodcut|etching|lithograph|postcard|manuscript|painting of|mural|conquista|soldiers?|military|parade|banda militar|tropa|ej[eé]rcito|army|troops|19th|18th|17th|siglo\s*(x+|i+v?|\d)|(?:^|[^\d])(1[5-9]\d{2})(?:[^\d]|$)|a[nñ]o\s*1[789]\d{2}|circa?\s*1[789]\d{2}|inauguraci[oó]n|vintage|old.?photo|fotografi[aá]\s*hist|historical.?photo|newspaper|scan_|book.?cover|infographic|emblem|seal of|crest of|disambiguation|desambiguaci|subte|estaci[oó]n de|metro de|plantilla:|template:|category:|anexo:|lista de|list of/i;

function keyFor(city: string, activity: string): ActivityImageKey {
  return `${city.trim()}::${activity.trim()}`.toLowerCase();
}

/** Strip tracking query so the same file isn't reused via ?utm=… */
function urlKey(url: string): string {
  try {
    const u = new URL(url);
    u.search = "";
    u.hash = "";
    return u.toString();
  } catch {
    return url.split("?")[0];
  }
}

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim();
}

function landmarkCore(activity: string): string {
  return activity
    .replace(
      /\b(visita(s)?|r[aá]pida|tour|cena|desayuno|almuerzo|paseo|compras|shopping|show|entrada|privada|privado|incluido|traslado(s)?|regreso|vuelo(s)?|aeropuerto|excursi[oó]n|caminata|ascenso|degustaci[oó]n|inmersi[oó]n|y)\b/gi,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim();
}

function usableThumb(src?: string, title = ""): string | null {
  if (!src) return null;
  if (BAD_ASSET.test(src) || BAD_ASSET.test(title)) return null;
  if (/\.svg($|\?)/i.test(src)) return null;
  return src;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      signal: AbortSignal.timeout(12000),
    });
    if (res.status === 429) return null;
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("json")) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

type PageThumb = { title: string; url: string };

/** Few HTTP calls: pipe many titles into pageimages. */
async function batchPageImages(
  titles: string[],
  lang: "es" | "en",
): Promise<Map<string, PageThumb>> {
  const out = new Map<string, PageThumb>();
  const unique = [...new Set(titles.map((t) => t.trim()).filter((t) => t.length > 2))];
  for (let i = 0; i < unique.length; i += 20) {
    const chunk = unique.slice(i, i + 20);
    const api = new URL(`https://${lang}.wikipedia.org/w/api.php`);
    api.searchParams.set("action", "query");
    api.searchParams.set("format", "json");
    api.searchParams.set("prop", "pageimages");
    api.searchParams.set("piprop", "thumbnail");
    api.searchParams.set("pithumbsize", "1280");
    api.searchParams.set("redirects", "1");
    api.searchParams.set("titles", chunk.join("|"));
    api.searchParams.set("origin", "*");
    const data = await fetchJson<{
      query?: {
        redirects?: { from: string; to: string }[];
        normalized?: { from: string; to: string }[];
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
    if (!data?.query) continue;

    const alias = new Map<string, string>();
    for (const n of data.query.normalized || []) alias.set(norm(n.from), n.to);
    for (const r of data.query.redirects || []) alias.set(norm(r.from), r.to);

    const byTitle = new Map<string, PageThumb>();
    for (const page of Object.values(data.query.pages ?? {})) {
      if (!page?.title || page.missing || BAD_ASSET.test(page.title)) continue;
      const url = usableThumb(page.thumbnail?.source, page.title);
      if (!url) continue;
      const thumb = { title: page.title, url };
      byTitle.set(norm(page.title), thumb);
    }

    for (const asked of chunk) {
      const n = norm(asked);
      const resolved = alias.get(n) || asked;
      const thumb = byTitle.get(norm(resolved));
      if (thumb) {
        out.set(n, thumb);
        out.set(norm(resolved), thumb);
      }
    }
    for (const [k, v] of byTitle) out.set(k, v);
  }
  return out;
}

/**
 * Candidate Wikipedia titles for an activity — no search API (avoids 429).
 * Landmark-name aliases are pattern-based, not country lists.
 */
function titleCandidates(activity: string, city: string): string[] {
  const raw = activity.trim();
  const core = landmarkCore(raw);
  const words = core.split(/\s+/).filter(Boolean);
  const out: string[] = [];

  const add = (...xs: string[]) => {
    for (const x of xs) {
      const t = x.trim();
      if (t.length > 2) out.push(t);
    }
  };

  add(core, raw, words.slice(0, 5).join(" "), words.slice(0, 4).join(" "));
  if (city) {
    add(`${core} (${city})`, `${words.slice(0, 4).join(" ")} (${city})`);
  }

  // Pattern aliases (work worldwide when the name appears in the activity)
  if (/antropolog/i.test(raw)) add("Museo Nacional de Antropología");
  if (/chapultepec/i.test(raw)) {
    add("Bosque de Chapultepec", "Castillo de Chapultepec");
  }
  if (/bellas artes/i.test(raw)) add("Palacio de Bellas Artes");
  if (/z[oó]calo/i.test(raw)) add("Zócalo", "Plaza de la Constitución (Ciudad de México)");
  if (/mercado de san juan/i.test(raw)) add("Mercado de San Juan");
  if (/frida|kahlo|azul/i.test(raw)) add("Museo Frida Kahlo");
  if (/teotihuac/i.test(raw)) add("Teotihuacán");
  if (/xochimilco/i.test(raw)) add("Xochimilco");
  if (/malba/i.test(raw)) add("Museo de Arte Latinoamericano de Buenos Aires", "MALBA");
  if (/aten(eo)?|grand splendid/i.test(raw)) add("El Ateneo Grand Splendid");
  if (/teatro col[oó]n/i.test(raw)) add("Teatro Colón");
  if (/plaza de mayo/i.test(raw)) add("Plaza de Mayo");
  if (/casa rosada/i.test(raw)) add("Casa Rosada");
  if (/recoleta/i.test(raw) && /cementerio|cemetery/i.test(raw)) {
    add("Cementerio de la Recoleta");
  }
  if (/llao/i.test(raw)) add("Hotel Llao Llao");
  if (/campanario/i.test(raw)) add("Cerro Campanario");
  if (/catedral/i.test(raw) && /bariloche|cerro/i.test(`${raw} ${city}`)) {
    add("Cerro Catedral");
  }
  if (/shinjuku.?gyoen/i.test(raw)) add("Shinjuku Gyoen");
  if (/shibuya/i.test(raw)) add("Shibuya");
  if (/senso-?ji|sensō-?ji|asakusa/i.test(raw)) add("Sensō-ji");
  if (/fushimi|inari/i.test(raw)) add("Fushimi Inari-taisha");
  if (/arashiyama/i.test(raw)) add("Arashiyama");
  if (/polanco/i.test(raw)) add("Polanco (Ciudad de México)");
  if (/hundertwasser/i.test(raw)) {
    add("Hundertwasserhaus", "KunstHausWien");
  }
  if (/prater/i.test(raw)) add("Wurstelprater", "Prater");
  if (/noria|riesenrad|wiener riesenrad/i.test(raw)) add("Wiener Riesenrad");
  if (/sch[oö]nbrunn/i.test(raw)) add("Schloss Schönbrunn");
  if (/stephansdom|stephan(s)?platz/i.test(raw)) add("Stephansdom");
  if (/belvedere/i.test(raw)) add("Belvedere, Vienna");
  if (/sagrada/i.test(raw)) add("Sagrada Família");
  if (/park g[uü]ell|güell/i.test(raw)) add("Park Güell");
  if (/colosseum|coliseo|colosseo/i.test(raw)) add("Colosseum");
  if (/eiffel/i.test(raw)) add("Eiffel Tower");
  if (/tower bridge/i.test(raw)) add("Tower Bridge");
  if (/times square/i.test(raw)) add("Times Square");
  if (/central park/i.test(raw)) add("Central Park");
  if (/museo del prado|\bprado\b/i.test(raw)) add("Museo del Prado");
  if (/thyssen/i.test(raw)) add("Museo Thyssen-Bornemisza");
  if (/reina sof[ií]a|reina sofia/i.test(raw)) add("Museo Nacional Centro de Arte Reina Sofía");
  if (/buen retiro|\bretiro\b/i.test(raw)) add("Parque del Retiro");
  if (/atocha/i.test(raw)) add("Estación de Atocha", "Madrid Atocha railway station");
  if (/gran v[ií]a/i.test(raw)) add("Gran Vía, Madrid");
  if (/plaza mayor/i.test(raw)) add("Plaza Mayor, Madrid");
  if (/shard/i.test(raw)) add("The Shard");
  if (/westminster/i.test(raw)) add("Westminster Abbey");
  if (/borough market/i.test(raw)) add("Borough Market");
  if (/four seasons/i.test(raw)) add(`Four Seasons Hotel ${city}`, "Four Seasons Hotel Madrid");
  if (/ritz/i.test(raw) && city) add(`The Ritz ${city}`, `Hotel Ritz ${city}`);
  if (/mandarin|oriental/i.test(raw) && city) add(`Mandarin Oriental ${city}`);
  // Airport → airport page (better than random city history)
  if (/aeropuerto|airport|benito ju[aá]rez/i.test(raw)) {
    add(
      `Aeropuerto Internacional de ${city}`,
      "Aeropuerto Internacional de la Ciudad de México",
      city ? `${city} International Airport` : "",
    );
  }

  return [...new Set(out)];
}

function scoreCandidate(
  candidate: string,
  pageTitle: string,
  activity: string,
  city: string,
): number {
  if (BAD_ASSET.test(pageTitle)) return -100;
  const t = norm(pageTitle);
  const a = norm(activity);
  const c = norm(city);
  const cand = norm(candidate);
  let score = 0;

  // Exact / near-exact candidate hit is strong
  if (t === cand) score += 20;
  else if (t.includes(cand) || cand.includes(t)) score += 12;

  const tokens = a.split(/[^a-z0-9]+/).filter((x) => x.length > 3);
  let hits = 0;
  for (const tok of tokens) {
    if (t.includes(tok)) {
      hits += 1;
      score += tok.length > 5 ? 5 : 2;
    }
  }
  if (hits === 0 && tokens.length > 0) score -= 8;

  if (c && (t === c || t === `ciudad de ${c}`)) score -= 15;
  if (pageTitle.length < 60) score += 1;
  return score;
}

async function commonsPhoto(
  query: string,
  used: Set<string>,
): Promise<GuideImage | null> {
  const isUsed = (url: string) => used.has(urlKey(url));
  const api = new URL("https://commons.wikimedia.org/w/api.php");
  api.searchParams.set("action", "query");
  api.searchParams.set("format", "json");
  api.searchParams.set("generator", "search");
  api.searchParams.set(
    "gsrsearch",
    `${query} -map -plan -pdf -svg -diagram -flag -banner -engraving -postcard -military -soldiers -parade -satellite -MODIS -"black and white" -sepia`,
  );
  api.searchParams.set("gsrnamespace", "6");
  api.searchParams.set("gsrlimit", "10");
  api.searchParams.set("prop", "imageinfo");
  api.searchParams.set("iiprop", "url|mime|extmetadata");
  api.searchParams.set("iiurlwidth", "1280");
  api.searchParams.set("origin", "*");
  const data = await fetchJson<{
    query?: {
      pages?: Record<
        string,
        {
          title?: string;
          imageinfo?: {
            url?: string;
            thumburl?: string;
            mime?: string;
            extmetadata?: {
              DateTime?: { value?: string };
              DateTimeOriginal?: { value?: string };
            };
          }[];
        }
      >;
    };
  }>(api.toString());

  for (const page of Object.values(data?.query?.pages ?? {})) {
    const title = page.title || "";
    if (BAD_ASSET.test(title)) continue;
    const info = page.imageinfo?.[0];
    if (!info?.mime?.startsWith("image/") || info.mime.includes("svg")) continue;
    const url = usableThumb(info.thumburl || info.url, title);
    if (!url || isUsed(url)) continue;
    const when =
      info.extmetadata?.DateTimeOriginal?.value ||
      info.extmetadata?.DateTime?.value ||
      "";
    if (/^1[789]\d{2}/.test(when)) continue;
    return {
      url,
      title: title.replace(/^File:/i, ""),
      attribution: "Wikimedia Commons",
      query,
    };
  }
  return null;
}

async function openversePhoto(
  query: string,
  used: Set<string>,
): Promise<GuideImage | null> {
  const api = new URL("https://api.openverse.org/v1/images/");
  api.searchParams.set("q", query);
  api.searchParams.set("page_size", "8");
  api.searchParams.set("license", "pdm,cc0,by,by-sa");
  api.searchParams.set("format", "json");
  const data = await fetchJson<{
    results?: {
      title?: string;
      url?: string;
      thumbnail?: string;
      foreign_landing_url?: string;
    }[];
  }>(api.toString());
  for (const hit of data?.results || []) {
    const title = hit.title || query;
    if (BAD_ASSET.test(title) || BAD_ASSET.test(hit.url || "")) continue;
    const url = usableThumb(hit.thumbnail || hit.url, title);
    if (!url || used.has(urlKey(url))) continue;
    return {
      url,
      title,
      attribution: "Openverse",
      query,
    };
  }
  return null;
}

async function wikiSummaryThumb(
  title: string,
  lang: "es" | "en",
): Promise<GuideImage | null> {
  const slug = encodeURIComponent(title.replace(/ /g, "_"));
  const data = await fetchJson<{
    title?: string;
    type?: string;
    thumbnail?: { source?: string };
    originalimage?: { source?: string };
  }>(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${slug}`);
  if (!data || data.type === "disambiguation") return null;
  if (BAD_ASSET.test(data.title || title)) return null;
  const url =
    usableThumb(data.thumbnail?.source, data.title || title) ||
    usableThumb(data.originalimage?.source, data.title || title);
  if (!url) return null;
  return {
    url,
    title: data.title || title,
    attribution: `Wikipedia ${lang}`,
    query: title,
  };
}

/**
 * Solid image map:
 * 1) Guess Wikipedia titles from activity names (0 search API calls)
 * 2) Batch pageimages (2 HTTP calls total for es+en)
 * 3) Assign uniquely — never the same URL twice
 * 4) Commons only for remaining misses
 * 5) City Wikipedia summary for hero
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
  for (const stay of plan.stays || []) pushJob(stay.city || "", stay.name || "");
  for (const day of plan.days || []) {
    for (const a of day.activities || []) pushJob(day.city || "", a.name || "");
  }

  const capped = jobs.slice(0, 56);
  const cities = [
    ...new Set(
      (plan.days || []).map((d) => (d.city || "").trim()).filter(Boolean),
    ),
  ].slice(0, 4);

  const withCandidates = capped.map((job) => ({
    ...job,
    candidates: titleCandidates(job.activity, job.city),
  }));
  const allTitles = withCandidates.flatMap((j) => j.candidates);

  const [esPages, enPages, citySummaries] = await Promise.all([
    batchPageImages(allTitles, "es"),
    batchPageImages(allTitles, "en"),
    Promise.all(
      cities.map(async (city) => {
        for (const lang of ["es", "en"] as const) {
          const sum = await wikiSummaryThumb(city, lang);
          if (sum) return { ...sum, query: `${city}::hero` };
        }
        return null;
      }),
    ),
  ]);

  const byActivity = new Map<ActivityImageKey, GuideImage>();
  const usedUrls = new Set<string>();
  const markUsed = (url: string) => usedUrls.add(urlKey(url));
  const isUsed = (url: string) => usedUrls.has(urlKey(url));

  for (const job of withCandidates) {
    let best: { score: number; thumb: PageThumb } | null = null;
    for (const cand of job.candidates) {
      const thumb =
        esPages.get(norm(cand)) || enPages.get(norm(cand)) || null;
      if (!thumb) continue;
      if (isUsed(thumb.url)) continue;
      const score = scoreCandidate(cand, thumb.title, job.activity, job.city);
      if (!best || score > best.score) best = { score, thumb };
    }
    // Soft threshold: candidate hit already implies relevance
    if (!best || best.score < 3) continue;
    markUsed(best.thumb.url);
    byActivity.set(job.key, {
      url: best.thumb.url,
      title: best.thumb.title,
      attribution: "Wikipedia",
      query: `${job.city}::${job.activity}`,
    });
  }

  // Commons / summary for misses — parallel batches
  const misses = withCandidates.filter((j) => !byActivity.has(j.key));
  async function fillMiss(job: (typeof withCandidates)[number]) {
    const core = landmarkCore(job.activity) || job.activity;
    // Try Wikipedia summary on top candidates first (1 call each, high precision)
    for (const cand of job.candidates.slice(0, 3)) {
      for (const lang of ["es", "en"] as const) {
        const sum = await wikiSummaryThumb(cand, lang);
        if (sum && !isUsed(sum.url) && !BAD_ASSET.test(sum.title)) {
          markUsed(sum.url);
          byActivity.set(job.key, {
            ...sum,
            query: `${job.city}::${job.activity}`,
          });
          return;
        }
      }
    }
    const isHotel = /hotel|resort|palace|ritz|seasons|mandarin|hyatt|hilton|marriott|apartment|hostal|hostel/i.test(
      job.activity,
    );
    const queries = [
      `${core} ${job.city}`,
      core.length > 3 ? core : "",
      isHotel ? `${job.activity}` : "",
      isHotel ? `${core} hotel ${job.city}` : "",
      /cena|dinner|restaurante|comer|food|almuerzo|lunch/i.test(job.activity)
        ? `${job.city} restaurant food`
        : "",
      /parque|park|jard[ií]n|garden/i.test(job.activity)
        ? `${job.city} park`
        : "",
      /museo|museum/i.test(job.activity) ? `${job.city} museum` : "",
    ].filter((q) => q.length > 3);

    for (const q of queries) {
      const img = await commonsPhoto(q, usedUrls);
      if (img) {
        markUsed(img.url);
        byActivity.set(job.key, {
          ...img,
          query: `${job.city}::${job.activity}`,
        });
        return;
      }
    }
    // Hotels / leftovers: Openverse often has usable modern photos
    for (const q of queries.slice(0, 3)) {
      const img = await openversePhoto(q, usedUrls);
      if (img) {
        markUsed(img.url);
        byActivity.set(job.key, {
          ...img,
          query: `${job.city}::${job.activity}`,
        });
        return;
      }
    }
  }

  for (let i = 0; i < misses.length; i += 5) {
    await Promise.all(misses.slice(i, i + 5).map((job) => fillMiss(job)));
  }

  // Large unique city pool → fill remaining empties (URLs still unused)
  const poolQueries = cities.flatMap((c) => [
    `${c} landmark`,
    `${c} street`,
    `${c} plaza`,
    `${c} park`,
    `${c} cathedral`,
    `${c} museum`,
    `${c} night`,
    `${c} architecture`,
    `${c} skyline`,
    `${c} restaurant`,
    `${c} hotel exterior`,
    `${c} square`,
  ]);
  const cityPool: GuideImage[] = [];
  const poolSeen = new Set<string>(usedUrls);
  for (let i = 0; i < poolQueries.length; i += 4) {
    const batch = await Promise.all(
      poolQueries
        .slice(i, i + 4)
        .map((q) => commonsPhoto(q, poolSeen)),
    );
    for (const img of batch) {
      if (!img || poolSeen.has(urlKey(img.url))) continue;
      poolSeen.add(urlKey(img.url));
      cityPool.push(img);
      if (cityPool.length >= 40) break;
    }
    if (cityPool.length >= 40) break;
  }

  let poolIdx = 0;
  for (const job of withCandidates) {
    if (byActivity.has(job.key)) continue;
    const img = cityPool[poolIdx++];
    if (!img) break;
    markUsed(img.url);
    byActivity.set(job.key, {
      ...img,
      query: `${job.city}::${job.activity}`,
    });
  }

  const cityFallbacks: GuideImage[] = [];
  for (const sum of citySummaries) {
    if (sum && !BAD_ASSET.test(sum.title) && !isUsed(sum.url)) {
      markUsed(sum.url);
      cityFallbacks.push(sum);
    }
  }
  for (const img of cityPool.slice(poolIdx)) {
    if (cityFallbacks.length >= 12) break;
    if (isUsed(img.url)) continue;
    markUsed(img.url);
    cityFallbacks.push({ ...img, query: img.query || "city-pool" });
  }

  return { byActivity, cityFallbacks };
}

export function lookupActivityImage(
  map: Map<ActivityImageKey, GuideImage>,
  city: string,
  activity: string,
): GuideImage | null {
  return map.get(keyFor(city, activity)) || null;
}
