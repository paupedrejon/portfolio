import type { GuideImage } from "./types";
import type { GuideVideo } from "./youtube";
import type { ItineraryPlan, TransportLeg } from "./itinerary-schema";
import type { BookingLinks } from "./booking-links";
import {
  pickHeroImage,
  themeForDestination,
  type DestinationTheme,
} from "./destination-theme";
import { filterGuideImages } from "./wikimedia";
import {
  lookupActivityImage,
  type ActivityImageKey,
} from "./activity-images";
import {
  formatEuro,
  parseEuro,
  resolveStayTotal,
  stayPlatformForLuxury,
} from "./money";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normCity(s?: string): string {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim();
}

function bookingHrefForLeg(leg: TransportLeg, booking: BookingLinks): string {
  const from = normCity(leg.fromCity || leg.fromCode);
  const to = normCity(leg.toCity || leg.toCode);
  const matched = (booking.legs || []).find(
    (l) =>
      (normCity(l.from).includes(from) || from.includes(normCity(l.from))) &&
      (normCity(l.to).includes(to) || to.includes(normCity(l.to))),
  );
  const kind = (leg.kind || "flight").toLowerCase();
  if (matched) {
    if (kind === "bus") return matched.flixbus;
    if (kind === "train") return matched.trainline;
    return matched.skyscanner || matched.google;
  }
  if (kind === "bus") return booking.busFlixbus || booking.flightsSkyscanner;
  if (kind === "train") return booking.trainsTrainline || booking.flightsSkyscanner;
  return booking.flightsSkyscanner;
}

function dayNumberLabel(title: string, index: number): string {
  const m = title.match(/\b(\d{1,2})\b/);
  if (m) return m[1].padStart(2, "0");
  return String(index + 1).padStart(2, "0");
}

function addDaysIso(iso: string, n: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + n);
  return d.toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function tokensOf(s: string): string[] {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 3);
}

function hourOf(time?: string): number | null {
  if (!time) return null;
  const m = time.match(/(\d{1,2})/);
  if (!m) return null;
  const h = Number(m[1]);
  return Number.isFinite(h) ? h : null;
}

function slotOf(time?: string): "mañana" | "tarde" | "noche" {
  const h = hourOf(time);
  if (h == null) return "tarde";
  if (h < 12) return "mañana";
  if (h < 18) return "tarde";
  return "noche";
}

function matchVideoForActivity(
  videos: GuideVideo[],
  city: string,
  activity: string,
): GuideVideo | null {
  if (!videos.length) return null;
  const tokens = tokensOf(activity);
  const cityN = normCity(city);
  let best: GuideVideo | null = null;
  let bestScore = -1;
  for (const v of videos) {
    const blob = `${v.title} ${v.description} ${v.city}`.toLowerCase();
    let score = 0;
    if (cityN && normCity(v.city).includes(cityN)) score += 4;
    for (const t of tokens) {
      if (blob.includes(t)) score += 3;
    }
    if (score > bestScore) {
      bestScore = score;
      best = v;
    }
  }
  if (bestScore >= 3) return best;
  return (
    videos.find((v) => cityN && normCity(v.city).includes(cityN)) ||
    videos[0] ||
    null
  );
}

function youtubeHref(
  videos: GuideVideo[],
  city: string,
  activity: string,
): string {
  const hit = matchVideoForActivity(videos, city, activity);
  if (hit?.url) return hit.url;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${activity} ${city}`)}`;
}

function buildDayPlan(
  activities: { name: string; time?: string }[],
): { mañana: string; tarde: string; noche: string } {
  const buckets: Record<"mañana" | "tarde" | "noche", string[]> = {
    mañana: [],
    tarde: [],
    noche: [],
  };
  for (const a of activities) {
    buckets[slotOf(a.time)].push(a.name);
  }
  const join = (xs: string[]) =>
    xs.length ? xs.slice(0, 3).join(", ") : "Libre / ritmo local";
  return {
    mañana: join(buckets.mañana),
    tarde: join(buckets.tarde),
    noche: join(buckets.noche),
  };
}

function renderTicket(
  leg: TransportLeg,
  booking: BookingLinks,
  accent: string,
  seal: string,
): string {
  const from = leg.fromCode || (leg.fromCity || "—").slice(0, 3).toUpperCase();
  const to = leg.toCode || (leg.toCity || "—").slice(0, 3).toUpperCase();
  const href = bookingHrefForLeg(leg, booking);
  const price = leg.price || "No verificado";
  const label = leg.label || (leg.kind || "TRAMO").toUpperCase();
  const date =
    leg.date ||
    booking.legs?.find(
      (l) =>
        normCity(l.from).includes(normCity(leg.fromCity)) &&
        normCity(l.to).includes(normCity(leg.toCity)),
    )?.date ||
    booking.tripStart ||
    "—";
  const kind = (leg.kind || "flight").toLowerCase();
  const matched = (booking.legs || []).find(
    (l) =>
      (normCity(l.from).includes(normCity(leg.fromCity)) ||
        normCity(leg.fromCity).includes(normCity(l.from))) &&
      (normCity(l.to).includes(normCity(leg.toCity)) ||
        normCity(leg.toCity).includes(normCity(l.to))),
  );
  // ONE primary CTA to book this leg at the shown price
  let ctaHref = href;
  let ctaLabel = `Reservar · ${price}`;
  if (kind === "train") {
    ctaHref = matched?.trainline || booking.trainsTrainline;
    ctaLabel = `Reservar tren · ${price}`;
  } else if (kind === "bus") {
    ctaHref = matched?.flixbus || booking.busFlixbus;
    ctaLabel = `Reservar bus · ${price}`;
  } else if (kind === "ferry") {
    ctaHref = matched?.skyscanner || href;
    ctaLabel = `Reservar ferry · ${price}`;
  } else {
    ctaHref = matched?.skyscanner || href;
    ctaLabel = `Reservar vuelo · ${price}`;
  }

  const flightId =
    leg.vehicleNo && !/^NY-\d+/i.test(leg.vehicleNo)
      ? leg.vehicleNo
      : "ver oferta";

  return `<article class="ticket" style="--c:${esc(accent)}">
    <div class="tk-head"><span>${esc(seal)} · BOARDING PASS</span><span>${esc(label)}</span></div>
    <div class="tk-main">
      <div class="tk-route">
        <div><b>${esc(from)}</b><small>${esc(leg.fromCity || "")}</small></div>
        <div class="path" aria-hidden="true"></div>
        <div class="r"><b>${esc(to)}</b><small>${esc(leg.toCity || "")}</small></div>
      </div>
      <div class="tk-meta">
        <div><small>Operador</small><b>${esc(leg.operator || "Ver en Skyscanner")}</b></div>
        <div><small>Fecha</small><b>${esc(date)}</b></div>
        <div><small>Salida</small><b>${esc(leg.depart || "—")}</b></div>
        <div class="price"><small>Precio</small><b class="num">${esc(price)}</b></div>
      </div>
    </div>
    <div class="perf" aria-hidden="true"></div>
    <div class="tk-legs">
      <div class="leg-h">${esc(label)} · ${esc(date)}</div>
      <div class="row">
        <div class="t">${esc(leg.depart || "—")}</div>
        <div class="r">${esc(leg.fromCity || from)} → ${esc(leg.toCity || to)}
          <small>${esc([leg.arrive ? `llega ${leg.arrive}` : "", leg.duration || "", leg.note || ""].filter(Boolean).join(" · "))}</small>
        </div>
        <span class="fn">${esc(flightId)}</span>
      </div>
    </div>
    <div class="tk-foot">
      <div class="btns">
        <a class="btn solid" href="${esc(ctaHref)}" target="_blank" rel="noopener">${esc(ctaLabel)}</a>
      </div>
    </div>
  </article>`;
}

function sectionHead(
  theme: DestinationTheme,
  num: string,
  title: string,
  lead: string,
): string {
  const script =
    theme.verticalScript && theme.scriptSamples[0]
      ? `<span class="v-script" aria-hidden="true">${esc(theme.scriptSamples[0])}</span>`
      : "";
  return `<div class="sh">
    <div class="mark"><span class="seal">${esc(num)}</span>${script}</div>
    <div><h2>${esc(title)}</h2><div class="rule"></div>
    <p class="lead">${esc(lead)}</p></div>
  </div>`;
}

function heroOrnament(theme: DestinationTheme): string {
  if (theme.style === "washi") {
    return `<div class="motif motif-disc" aria-hidden="true"></div>`;
  }
  if (theme.style === "metro") {
    return `<div class="motif motif-taxi" aria-hidden="true"></div>`;
  }
  // editorial / hanji / default
  return `<div class="motif motif-bar" aria-hidden="true"></div>`;
}

function divider(theme: DestinationTheme): string {
  if (theme.style === "washi") return `<div class="divider divider-waves" aria-hidden="true"></div>`;
  if (theme.style === "metro") return `<div class="divider divider-taxi" aria-hidden="true"></div>`;
  return `<div class="divider divider-rule" aria-hidden="true"></div>`;
}

export function renderGuideHtml(params: {
  plan: ItineraryPlan;
  images: GuideImage[];
  videos?: GuideVideo[];
  /** Per-activity photos resolved via Wikipedia/Commons */
  activityImages?: Map<ActivityImageKey, GuideImage>;
  consultedAt: string;
  destination: string;
  origin: string;
  locale: string;
  travelers: number;
  luxury?: number;
  booking: BookingLinks;
}): string {
  const {
    plan,
    consultedAt,
    destination,
    origin,
    locale,
    travelers,
    booking,
  } = params;
  const videos = (params.videos || []).slice(0, 5);
  const activityImages = params.activityImages || new Map();
  const luxury = params.luxury ?? 3;
  const images = filterGuideImages(params.images).filter(
    (img) =>
      !/black.?and.?white|blanco.?y.?negro|soldiers?|military|parade|conquista|engraving|banner|siglo|19th|18th/i.test(
        `${img.title} ${img.query} ${img.url}`,
      ),
  );
  const theme = themeForDestination(destination);
  const p = {
    bg: plan.palette?.bg || theme.bg,
    ink: plan.palette?.ink || theme.ink,
    accent: plan.palette?.accent || theme.accent,
    paper: plan.palette?.paper || theme.paper,
  };
  // Prefer Wikipedia city summary (::hero) over random Commons historical shots
  const hero =
    images.find((img) => /::hero$/i.test(img.query || "")) ||
    pickHeroImage(images);
  const pool = images.filter(
    (img) => img.url !== hero?.url && !/::hero$/i.test(img.query || ""),
  );
  const pax = Math.max(1, travelers || 1);
  const seals = theme.scriptSamples;
  const dateLine = plan.datesLabel || `${booking.tripStart} → ${booking.tripEnd}`;
  const lang = locale || "es";
  const consulted = consultedAt.slice(0, 10);

  const urlKey = (url: string) => {
    try {
      const u = new URL(url);
      u.search = "";
      u.hash = "";
      return u.toString();
    } catch {
      return url.split("?")[0];
    }
  };
  const usedUrls = new Set<string>();
  if (hero?.url) usedUrls.add(urlKey(hero.url));

  const scoreImg = (img: GuideImage, tokens: string[], city?: string) => {
    const blob = `${img.query} ${img.title}`.toLowerCase();
    let score = 0;
    const n = normCity(city);
    if (n && (normCity(img.query).includes(n) || normCity(img.title).includes(n)))
      score += 4;
    for (const t of tokens) {
      if (t.length < 4) continue;
      if (blob.includes(t)) score += 3;
    }
    if (usedUrls.has(urlKey(img.url))) score -= 50;
    return score;
  };

  /** Unique image only — never recycle the same URL across cards. */
  const nextImg = (city?: string, hint?: string): GuideImage | null => {
    const tokens = tokensOf(hint || "");
    const ranked = [...pool, ...images]
      .map((img) => ({ img, score: scoreImg(img, tokens, city) }))
      .sort((a, b) => b.score - a.score);
    const pick =
      ranked.find((r) => r.score > 0 && !usedUrls.has(urlKey(r.img.url)))?.img ||
      ranked.find((r) => !usedUrls.has(urlKey(r.img.url)))?.img ||
      null;
    if (pick?.url) usedUrls.add(urlKey(pick.url));
    return pick;
  };

  /**
   * Activity photos ONLY from the per-activity map (Wikipedia → pageimage).
   * Never reuse a pool image — that produced identical / unrelated photos.
   * Empty placeholder beats a wrong photo.
   */
  const photoForActivity = (
    city: string,
    activity: string,
  ): GuideImage | null => {
    const direct = lookupActivityImage(activityImages, city, activity);
    if (direct?.url && !usedUrls.has(urlKey(direct.url))) {
      usedUrls.add(urlKey(direct.url));
      return direct;
    }
    return null;
  };

  const legs: TransportLeg[] =
    plan.legs && plan.legs.length > 0
      ? plan.legs
      : (booking.legs || []).map((l) => ({
          kind: "flight",
          label: l.label,
          fromCity: l.from,
          toCity: l.to,
          date: l.date,
          operator: "Ver ofertas",
        }));

  const ticketsHtml = legs
    .map((leg, i) =>
      renderTicket(
        leg,
        booking,
        i % 2 === 1 ? theme.secondary : p.accent,
        seals[i % seals.length] || "PASS",
      ),
    )
    .join("\n");

  const staysList = (booking.stays || []).map((link, i) => {
    const hit =
      plan.stays?.find((s) => normCity(s.city) === normCity(link.city)) ||
      plan.stays?.[i];
    const total = resolveStayTotal({
      total: hit?.price,
      nightly: hit?.nightly,
      nights: link.nights,
    });
    const platform =
      hit?.platform || stayPlatformForLuxury(luxury);
    const bookHref = platform === "airbnb" ? link.airbnb : link.booking;
    const bookLabel =
      platform === "airbnb"
        ? `Reservar en Airbnb · ${total}`
        : `Reservar en Booking · ${total}`;
    return {
      name: hit?.name || `Alojamiento en ${link.city}`,
      city: link.city,
      price: total,
      nightly: hit?.nightly || "",
      vibe: hit?.vibe || "",
      nightsLabel: `${link.nights} noches · ${link.checkin} → ${link.checkout}`,
      nights: link.nights,
      bookHref,
      bookLabel,
      link,
    };
  });

  const stayHtml = staysList
    .map((stay) => {
      const photo =
        lookupActivityImage(activityImages, stay.city, stay.name) ||
        nextImg(stay.city, stay.name);
      const nightlyNum = parseEuro(stay.nightly);
      const nightlyShown = nightlyNum
        ? formatEuro(nightlyNum)
        : parseEuro(stay.price) && stay.nights
          ? formatEuro((parseEuro(stay.price) || 0) / stay.nights)
          : stay.nightly;
      return `<article class="stay">
        <div class="poster">
          ${photo?.url ? `<img src="${esc(photo.url)}" alt="${esc(stay.city)}"/>` : ""}
          <span class="city-es">${esc(stay.city)}</span>
        </div>
        <div class="body">
          <div class="when">${esc(stay.nightsLabel)}</div>
          <h3>${esc(stay.name)}</h3>
          <p>${esc(stay.vibe || "")}</p>
          <div class="money">
            ${nightlyShown ? `<div><small>Por noche</small><b>${esc(nightlyShown)}</b></div>` : ""}
            <div class="pp"><small>Total estancia (${stay.nights} noches)</small><b>${esc(stay.price)}</b></div>
          </div>
          <div class="btns" style="margin-top:14px">
            <a class="btn solid" href="${esc(stay.bookHref)}" target="_blank" rel="noopener">${esc(stay.bookLabel)}</a>
          </div>
        </div>
      </article>`;
    })
    .join("\n");

  const citiesOrder =
    (booking.stays || []).map((s) => s.city).filter(Boolean).length > 0
      ? (booking.stays || []).map((s) => s.city)
      : [
          ...new Set(
            plan.days.map((d) => d.city || destination).filter(Boolean),
          ),
        ];

  const routeHtml = citiesOrder
    .map((c) => {
      const nights =
        booking.stays?.find((s) => normCity(s.city) === normCity(c))?.nights ||
        plan.days.filter((d) => normCity(d.city || destination) === normCity(c))
          .length;
      return `<div class="stop"><b>${esc(c)}</b><span>${nights} noche${nights === 1 ? "" : "s"}</span></div>`;
    })
    .join("");

  function transitBetween(fromCity: string, toCity: string): string {
    const planLeg = legs.find(
      (l) =>
        normCity(l.fromCity).includes(normCity(fromCity)) &&
        normCity(l.toCity).includes(normCity(toCity)),
    );
    const bookLeg = booking.legs?.find(
      (l) =>
        normCity(l.from).includes(normCity(fromCity)) &&
        normCity(l.to).includes(normCity(toCity)),
    );
    const kind = (planLeg?.kind || "flight").toLowerCase();
    const meta = [
      planLeg?.date || "",
      planLeg?.operator || "",
      planLeg?.price || "",
    ]
      .filter(Boolean)
      .join(" · ");
    let label = "Vuelo";
    let href = bookLeg?.skyscanner || booking.flightsSkyscanner;
    let cta = "Reservar vuelo";
    if (kind === "bus") {
      label = "Bus";
      href = bookLeg?.flixbus || booking.busFlixbus;
      cta = "Reservar bus";
    } else if (kind === "train") {
      label = "Tren";
      href = bookLeg?.trainline || booking.trainsTrainline;
      cta = "Reservar tren";
    } else if (kind === "ferry") {
      label = "Ferry";
      cta = "Ver opciones";
    }
    return `<div class="transit">
      <span><b>${esc(label)}</b> ${esc(fromCity)} → ${esc(toCity)}${meta ? ` · ${esc(meta)}` : ""}</span>
      <span class="btns">
        <a class="btn solid" href="${esc(href)}" target="_blank" rel="noopener">${esc(cta)}</a>
      </span>
    </div>`;
  }

  let lastCity = "";
  const daysHtml = plan.days
    .map((day, i) => {
      const city = day.city || destination;
      let chapter = "";
      if (city !== lastCity) {
        const seal = seals[(citiesOrder.indexOf(city) + 1) % seals.length] || "";
        const transit =
          lastCity && city !== lastCity ? transitBetween(lastCity, city) : "";
        const chapterMark =
          theme.verticalScript && seal
            ? `<span class="kj" aria-hidden="true">${esc(seal)}</span>`
            : `<span class="kj kj-lat">${esc(seal || String(citiesOrder.indexOf(city) + 1).padStart(2, "0"))}</span>`;
        chapter = `${transit}<div class="chapter">${chapterMark}<div><h3>${esc(city)}</h3><p>${esc(day.summary || "")}</p></div></div>`;
        lastCity = city;
      }
      const dayActs = day.activities || [];
      const acts = dayActs
        .map((a) => {
          const img = photoForActivity(city, a.name);
          const price = (a.price || "").trim() || "Orient.";
          const isNight = slotOf(a.time) === "noche";
          const yt = youtubeHref(videos, city, a.name);
          const priceTag = /gratis|incluido|free|0\s*[€$¥]/i.test(price)
            ? "Gratis"
            : price;
          return `<figure class="act">
            <div class="ph${img?.url ? "" : " ph-empty"}"${
              img?.url
                ? ` style="background-image:url('${esc(img.url)}')"`
                : ""
            }>
              <span class="tag price">${esc(priceTag)}</span>
              ${isNight ? `<span class="tag noche">Noche</span>` : ""}
              ${a.time ? `<span class="tag time">${esc(a.time)}</span>` : ""}
            </div>
            <figcaption>
              <b>${esc(a.name)}</b>
              <span class="d">${esc(a.tip || "")}</span>
              <a class="yt" href="${esc(yt)}" target="_blank" rel="noopener"><span class="yt-ico" aria-hidden="true"></span> Vídeos en YouTube</a>
            </figcaption>
          </figure>`;
        })
        .join("");
      const planDay = buildDayPlan(dayActs);
      const moveHint =
        theme.style === "washi" || theme.style === "hanji"
          ? "Tarjeta de transporte local · ~presupuesto día"
          : `Moverse en ${city} · metro / bus / a pie`;
      const num = dayNumberLabel(day.title, i);
      const dayDate = booking.tripStart
        ? addDaysIso(booking.tripStart, i)
        : dateLine;
      return `${chapter}
      <article class="dia">
        <div class="dia-head">
          <div class="dnum"><b>${esc(num)}</b></div>
          <div>
            <div class="dm">${esc(dayDate)}</div>
            <h4>${esc(day.title)}</h4>
            ${day.summary ? `<p class="dsub">${esc(day.summary)}</p>` : ""}
          </div>
          <span class="dnight">Noche en ${esc(city)}</span>
        </div>
        <div class="acts">${acts}</div>
        <div class="dia-foot">
          <div class="plan">
            <h5>Plan del día</h5>
            <p><b>Mañana</b> · ${esc(planDay.mañana)}</p>
            <p><b>Tarde</b> · ${esc(planDay.tarde)}</p>
            <p><b>Noche</b> · ${esc(planDay.noche)}</p>
          </div>
          <div class="move">
            <h5>Cómo moverse y cuánto cuesta</h5>
            <p>${esc(moveHint)}</p>
          </div>
        </div>
      </article>`;
    })
    .join("\n");

  // Budget: prefer plan rows; fill gaps from legs/stays
  let budgetLines = (plan.budget || [])
    .map(
      (b) =>
        `<div class="line"><span class="l">${esc(b.label)}</span><span class="d"></span><span class="a">${esc(b.amount || "No verificado")}</span></div>`,
    )
    .join("");

  if (!budgetLines) {
    const auto: string[] = [];
    for (const leg of legs) {
      auto.push(
        `<div class="line"><span class="l">${esc(leg.label || "Tramo")} ${esc(leg.fromCity || "")} → ${esc(leg.toCity || "")}</span><span class="d"></span><span class="a">${esc(leg.price || "No verificado")}</span></div>`,
      );
    }
    for (const stay of staysList) {
      auto.push(
        `<div class="line"><span class="l">Alojamiento ${esc(stay.city)}</span><span class="d"></span><span class="a">${esc(stay.price)}</span></div>`,
      );
    }
    budgetLines = auto.join("");
  }

  const staySum = staysList.reduce(
    (acc, s) => acc + (parseEuro(s.price) || 0),
    0,
  );
  const legSum = legs.reduce((acc, l) => acc + (parseEuro(l.price) || 0), 0);
  const actSum = plan.days.reduce(
    (acc, d) =>
      acc +
      (d.activities || []).reduce((a, act) => a + (parseEuro(act.price) || 0), 0),
    0,
  );

  const computedGroup =
    parseEuro(plan.budgetTotal) ||
    (staySum + legSum * pax + actSum * pax > 0
      ? staySum + legSum * pax + actSum * pax
      : null);
  const perPerson =
    plan.budgetPerPerson && !/no verificado/i.test(plan.budgetPerPerson)
      ? plan.budgetPerPerson
      : computedGroup
        ? formatEuro(computedGroup / pax)
        : "Ver enlaces";
  const totalGroup =
    plan.budgetTotal && !/no verificado/i.test(plan.budgetTotal)
      ? plan.budgetTotal
      : computedGroup
        ? formatEuro(computedGroup)
        : "Ver enlaces";

  const transportHint =
    legs.map((l) => parseEuro(l.price)).find((n) => n) != null
      ? formatEuro(legs.reduce((a, l) => a + (parseEuro(l.price) || 0), 0))
      : legs[0]?.price || "Ver Skyscanner";
  const stayHint =
    staySum > 0 ? formatEuro(staySum) : staysList[0]?.price || "Ver Booking";

  const videosTitle =
    lang.startsWith("en")
      ? "How it really looks"
      : lang.startsWith("it")
        ? "Com'è davvero"
        : "Así se ve de verdad";
  const videosLead =
    lang.startsWith("en")
      ? "YouTube walks & atmosphere — open externally"
      : lang.startsWith("it")
        ? "Video YouTube, si aprono fuori"
        : "vídeos de YouTube, se abren fuera";

  const videosHtml =
    videos.length === 0
      ? ""
      : `<section id="videos">
    ${sectionHead(theme, seals[0] || "01", videosTitle, videosLead)}
    <div class="videos">
      ${videos
        .map(
          (v) => `<a class="vid" href="${esc(v.url)}" target="_blank" rel="noopener">
        <div class="vid-thumb">
          <img src="${esc(v.thumb)}" alt="${esc(v.title)}" loading="lazy"/>
          <div class="vid-play" aria-hidden="true"><span></span></div>
        </div>
        <div class="vid-body">
          <b>${esc(v.title)}</b>
          <small>${esc(v.description)}</small>
          <span class="vid-city">${esc(v.city)}</span>
        </div>
      </a>`,
        )
        .join("\n")}
    </div>
  </section>`;

  const styleAttr = `data-style="${esc(theme.style)}"`;

  return `<!DOCTYPE html>
<html lang="${esc(lang)}" ${styleAttr}>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${esc(plan.title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="${esc(theme.googleFontsHref)}" rel="stylesheet"/>
<style>
:root{
  --paper-bg:${esc(p.bg)};
  --card:${esc(p.paper)};
  --ink:${esc(p.ink)};
  --mute:${esc(theme.mute)};
  --rule:${esc(theme.rule)};
  --accent:${esc(p.accent)};
  --accent-soft:${esc(theme.accentSoft)};
  --secondary:${esc(theme.secondary)};
  --night:${esc(theme.night)};
  --neon:${esc(theme.neon)};
  --display:"${esc(theme.displayFont)}",Georgia,serif;
  --body:"${esc(theme.bodyFont)}",system-ui,sans-serif;
  color-scheme:light;
}
*{box-sizing:border-box}
html{scroll-behavior:smooth;background:var(--paper-bg)}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}*{animation:none!important;transition:none!important}}
body{margin:0;color:var(--ink);font-family:var(--body);font-size:16px;line-height:1.65;background:
  radial-gradient(ellipse 80% 50% at 10% -10%,color-mix(in srgb,var(--accent) 12%,transparent),transparent 55%),
  radial-gradient(ellipse 60% 40% at 100% 0%,color-mix(in srgb,var(--secondary) 8%,transparent),transparent 50%),
  var(--paper-bg)}
img{max-width:100%;display:block}
a{color:var(--secondary)}
h1,h2,h3,h4{font-family:var(--display);font-weight:800;margin:0;line-height:1.15}
.wrap{max-width:1080px;margin:0 auto;padding:0 22px}
.num{font-variant-numeric:tabular-nums}
.seal{display:inline-grid;place-items:center;min-width:44px;height:44px;padding:0 8px;font-family:var(--display);font-weight:800;color:var(--accent);border:2px solid var(--accent);border-radius:4px;line-height:1;font-size:14px}
html[data-style="washi"] .seal,html[data-style="hanji"] .seal{border-radius:6px;border-width:3px;font-size:22px;width:44px;padding:0}
.v-script{writing-mode:vertical-rl;text-orientation:upright;font-family:var(--display);font-weight:800;letter-spacing:.14em;font-size:18px;color:var(--accent)}
.hero{position:relative;min-height:min(72vh,620px);color:#fff;overflow:hidden;background:#0d0b10;isolation:isolate}
.hero-bg{position:absolute;inset:0;z-index:-2;background:${hero ? `url("${esc(hero.url)}") center/cover` : `radial-gradient(circle at 30% 20%,color-mix(in srgb,var(--accent) 50%,#000),#0d0b10)`}}
.hero::before{content:"";position:absolute;inset:0;z-index:-1;background:${theme.heroOverlay}}
.motif{position:absolute;z-index:-1;pointer-events:none}
.motif-disc{width:min(48vw,380px);aspect-ratio:1;border-radius:50%;background:var(--accent);right:8%;top:60px;opacity:.85;box-shadow:0 0 0 14px color-mix(in srgb,var(--accent) 25%,transparent)}
.motif-taxi{left:0;right:0;top:0;height:10px;background:repeating-linear-gradient(90deg,var(--accent) 0 28px,#111 28px 56px)}
.motif-bar{left:0;top:0;bottom:0;width:8px;background:var(--accent)}
.hero .wrap{position:relative;min-height:min(72vh,620px);display:flex;flex-direction:column;justify-content:flex-end;padding:70px 22px 56px}
.hero .eyebrow{font-size:13px;letter-spacing:.2em;text-transform:uppercase;font-weight:700;color:#f3d9b8}
.hero h1{font-size:clamp(2.8rem,9vw,5.5rem);margin:8px 0 6px;text-shadow:0 6px 30px rgba(0,0,0,.35);max-width:16ch}
.hero .sub{font-size:1.1rem;max-width:44ch;margin:8px 0 0;color:#efe6d6}
.chips{display:flex;flex-wrap:wrap;gap:10px;margin-top:22px}
.chips span{background:var(--card);color:var(--ink);font-weight:700;font-size:14px;padding:6px 14px;border-left:5px solid var(--accent)}
html[data-style="metro"] .chips span{border-left:0;border-bottom:3px solid var(--accent)}
.divider{height:12px}
.divider-taxi{height:10px;background:repeating-linear-gradient(90deg,var(--accent) 0 24px,#111 24px 48px)}
.divider-rule{height:3px;background:var(--ink);opacity:.85}
.divider-waves{height:36px;background:var(--secondary)}
.summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,200px),1fr));gap:14px;margin:34px 0 0}
.ema{position:relative;background:var(--card);border:1px solid var(--rule);padding:16px 18px}
.ema .k{font-size:13px;font-weight:700;color:var(--mute);letter-spacing:.06em}
.ema .v{font-family:var(--display);font-size:1.7rem;font-weight:800;line-height:1.1;margin-top:6px}
.ema .s{font-size:14px;color:var(--mute)}
.ema.total{background:var(--ink);color:var(--paper-bg);border-color:var(--ink)}
.ema.total .k,.ema.total .s{color:#c9bca5}
section{padding:56px 0 8px}
.sh{display:grid;grid-template-columns:auto 1fr;gap:18px;align-items:start;margin-bottom:22px}
.sh .mark{display:flex;flex-direction:column;align-items:center;gap:8px}
.sh h2{font-size:clamp(1.8rem,4vw,2.8rem)}
.sh .lead{color:var(--mute);max-width:66ch;margin:10px 0 0;font-size:1.05rem}
.rule{height:2px;background:linear-gradient(90deg,var(--ink) 0 64px,var(--rule) 64px);margin:12px 0 0}
.tickets{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr));gap:20px}
.ticket{--c:var(--accent);background:var(--card);border:1px solid var(--rule);border-radius:14px;overflow:hidden}
.tk-head{background:var(--c);color:#fff;padding:10px 18px;display:flex;justify-content:space-between;font-size:12px;font-weight:700;letter-spacing:.12em}
.tk-main{padding:18px 20px 12px}
.tk-route{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:12px}
.tk-route b{display:block;font-family:var(--display);font-size:clamp(2rem,5vw,2.8rem);line-height:1}
.tk-route small{font-size:12px;color:var(--mute);font-weight:700}
.tk-route .r{text-align:right}
.tk-route .path{height:2px;background:repeating-linear-gradient(90deg,var(--c) 0 6px,transparent 6px 12px)}
.tk-meta{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:16px}
@media (max-width:520px){.tk-meta{grid-template-columns:1fr 1fr}}
.tk-meta small{display:block;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--mute);font-weight:700}
.tk-meta .price b{font-family:var(--display);font-size:1.6rem;color:var(--c)}
.perf{border-top:2px dashed var(--rule);margin:0 18px;position:relative}
.perf::before,.perf::after{content:"";position:absolute;top:-12px;width:22px;height:22px;border-radius:50%;background:var(--paper-bg);border:1px solid var(--rule)}
.perf::before{left:-30px}.perf::after{right:-30px}
.tk-legs{padding:12px 20px 4px}
.leg-h{font-size:11px;font-weight:700;letter-spacing:.14em;color:var(--c);text-transform:uppercase;margin:8px 0 4px}
.row{display:grid;grid-template-columns:64px 1fr auto;gap:12px;align-items:center;padding:7px 0;border-bottom:1px dotted var(--rule)}
.row .t{font-family:var(--display);font-weight:800;font-size:1.25rem}
.row .r{font-weight:700;font-size:.95rem}
.row .r small{display:block;font-weight:400;color:var(--mute);font-size:.8rem}
.fn{font-size:11px;font-weight:700;border:1.5px solid var(--ink);border-radius:4px;padding:1px 7px}
.tk-foot{padding:12px 20px 18px}
.btns{display:flex;flex-wrap:wrap;gap:8px}
.btn{display:inline-block;text-decoration:none;font-weight:700;font-size:14px;padding:8px 16px;border:2px solid var(--ink);color:var(--ink);background:transparent}
.btn.solid{background:var(--ink);color:var(--paper-bg)}
.stays{display:grid;gap:22px}
.stay{display:grid;grid-template-columns:minmax(0,320px) 1fr;background:var(--card);border:1px solid var(--rule)}
@media (max-width:760px){.stay{grid-template-columns:1fr}}
.poster{position:relative;min-height:240px;overflow:hidden;background:#222}
.poster img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.poster .city-es{position:absolute;left:16px;bottom:12px;z-index:1;color:#fff;font-weight:700;letter-spacing:.16em;text-transform:uppercase;font-size:12px;text-shadow:0 2px 12px #000}
.stay .body{padding:20px 22px}
.stay .when{font-size:12px;font-weight:700;letter-spacing:.08em;color:var(--accent)}
.stay h3{font-size:1.4rem;margin:4px 0}
.money{display:flex;gap:22px;margin-top:14px;padding-top:12px;border-top:2px solid var(--ink)}
.money small{display:block;font-size:11px;font-weight:700;color:var(--mute);letter-spacing:.06em}
.money b{font-family:var(--display);font-size:1.6rem}
.route{display:flex;overflow-x:auto;gap:0;padding:8px 0 18px;margin-bottom:10px}
.stop{flex:1 0 110px;text-align:center;position:relative;padding-top:28px}
.stop::before{content:"";position:absolute;top:12px;left:0;right:0;height:3px;background:var(--ink)}
.stop:first-child::before{left:50%}.stop:last-child::before{right:50%}
.stop b{display:block;font-family:var(--display);font-size:1.1rem}
.stop span{display:block;font-size:12px;color:var(--mute)}
.chapter{display:grid;grid-template-columns:auto 1fr;gap:16px;align-items:end;margin:48px 0 18px;padding-bottom:10px;border-bottom:2px solid var(--ink)}
.chapter .kj{font-family:var(--display);font-weight:800;font-size:clamp(2.4rem,6vw,3.8rem);line-height:1;color:var(--accent)}
.chapter .kj-lat{font-size:clamp(1.8rem,4vw,2.6rem);letter-spacing:.08em}
.chapter h3{font-size:clamp(1.4rem,3vw,1.9rem)}
.chapter p{margin:2px 0 0;color:var(--mute);font-size:.95rem}
.dias{display:grid;gap:42px}
.dia{display:grid;gap:0;padding:0;background:transparent;border:0}
.dia-head{display:grid;grid-template-columns:auto 1fr auto;gap:18px;align-items:end;padding:0 0 14px;border-bottom:2px solid var(--ink)}
.dnum b{font-family:var(--display);font-weight:800;font-size:clamp(2.8rem,7vw,4.2rem);line-height:.85;color:var(--ink)}
.dm{font-size:11px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;color:var(--mute)}
.dia h4{font-size:clamp(1.35rem,3vw,1.85rem);margin:4px 0 0}
.dsub{margin:6px 0 0;color:var(--mute);font-size:.98rem;max-width:52ch}
.dnight{font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--mute);border:1.5px solid var(--rule);padding:6px 10px;white-space:nowrap;align-self:start}
.acts{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,200px),1fr));gap:18px;padding:22px 0 8px}
.act{margin:0}
.act .ph{position:relative;aspect-ratio:4/3;background:#2a2622 center/cover no-repeat;overflow:hidden;isolation:isolate}
.act .ph::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 45%,rgba(0,0,0,.45));pointer-events:none}
.act .ph-empty{background:linear-gradient(145deg,color-mix(in srgb,var(--accent) 18%,var(--rule)),var(--card))}
.act .tag{position:absolute;z-index:1;font-size:11px;font-weight:700;letter-spacing:.04em;padding:4px 8px;line-height:1.2;color:#fff;text-shadow:0 1px 6px rgba(0,0,0,.45)}
.act .tag.price{left:10px;bottom:10px;background:rgba(12,10,12,.72);backdrop-filter:blur(4px);font-family:var(--display);font-size:15px;font-weight:800}
.act .tag.noche{left:10px;top:10px;background:var(--accent)}
.act .tag.time{right:10px;top:10px;background:rgba(12,10,12,.55);font-size:10px;letter-spacing:.12em;text-transform:uppercase}
.act b{display:block;font-family:var(--display);font-weight:800;font-size:1.12rem;margin-top:10px;line-height:1.2}
.act .d{display:block;font-size:.88rem;color:var(--mute);margin-top:4px;line-height:1.4}
.act .yt{display:inline-flex;align-items:center;gap:6px;margin-top:10px;font-size:13px;font-weight:700;color:var(--accent);text-decoration:none}
.act .yt:hover{text-decoration:underline}
.yt-ico{width:14px;height:14px;border-radius:50%;background:#e11;display:inline-grid;place-items:center;flex:none}
.yt-ico::before{content:"";border-style:solid;border-width:4px 0 4px 7px;border-color:transparent transparent transparent #fff;margin-left:1px}
.dia-foot{display:grid;grid-template-columns:1.2fr .8fr;gap:22px;margin-top:18px;padding-top:16px;border-top:1px solid var(--rule)}
.dia-foot h5{margin:0 0 8px;font-family:var(--display);font-size:1rem;letter-spacing:.14em;text-transform:uppercase;font-weight:800}
.dia-foot p{margin:0 0 6px;font-size:.92rem;color:var(--mute)}
.dia-foot p b{color:var(--ink);font-weight:700}
.dia-foot .move{padding:14px 16px;border:1.5px solid var(--rule);background:var(--card)}
.transit{display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between;margin:18px 0;padding:14px 16px;border:1.5px dashed var(--rule);background:var(--card);font-size:.95rem}
@media (max-width:760px){
  .dia-head{grid-template-columns:auto 1fr;gap:12px}
  .dia-head .dnight{grid-column:1/-1;justify-self:start}
  .acts{grid-template-columns:1fr 1fr}
  .dia-foot{grid-template-columns:1fr}
}
@media (max-width:480px){.acts{grid-template-columns:1fr}}
.budget{display:grid;grid-template-columns:minmax(0,420px) 1fr;gap:28px;align-items:start}
@media (max-width:820px){.budget{grid-template-columns:1fr}}
.receipt{background:#fffdf8;padding:24px 24px 36px;box-shadow:0 18px 30px -22px rgba(29,26,23,.7);
  -webkit-mask:linear-gradient(#000 0 0) top/100% calc(100% - 12px) no-repeat,conic-gradient(from -45deg at bottom,#0000,#000 1deg 89deg,#0000 90deg) bottom/18px 12px repeat-x;
  mask:linear-gradient(#000 0 0) top/100% calc(100% - 12px) no-repeat,conic-gradient(from -45deg at bottom,#0000,#000 1deg 89deg,#0000 90deg) bottom/18px 12px repeat-x}
.receipt h3{text-align:center;font-size:1.5rem;letter-spacing:.3em}
.receipt .rs{text-align:center;font-size:12px;color:var(--mute);margin:4px 0 14px}
.line{display:flex;align-items:baseline;gap:8px;padding:6px 0;font-size:.95rem}
.line .l{flex:none;max-width:62%}
.line .d{flex:1;border-bottom:2px dotted var(--rule);transform:translateY(-4px)}
.line .a{flex:none;font-weight:700;font-variant-numeric:tabular-nums}
.receipt .tot{border-top:2px solid var(--ink);margin-top:10px;padding-top:12px;font-family:var(--display);font-size:1.35rem;font-weight:800;display:flex;justify-content:space-between}
.note{font-size:.9rem;color:var(--mute);margin-top:14px}
.todo{display:grid;gap:10px;margin:0;padding:0;list-style:none}
.todo li{display:grid;grid-template-columns:120px 1fr;gap:14px;background:var(--card);border:1px solid var(--rule);padding:12px 16px}
.todo .w{font-family:var(--display);font-weight:800;color:var(--accent)}
.videos{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,180px),1fr));gap:18px;margin-top:8px}
.vid{display:block;text-decoration:none;color:inherit;background:var(--card);border:1px solid var(--rule);overflow:hidden;transition:transform .2s}
.vid:hover{transform:translateY(-3px)}
.vid-thumb{position:relative;aspect-ratio:16/10;background:#111;overflow:hidden}
.vid-thumb img{width:100%;height:100%;object-fit:cover;display:block}
.vid-play{position:absolute;inset:0;display:grid;place-items:center;background:rgba(0,0,0,.25)}
.vid-play span{width:52px;height:36px;border-radius:10px;background:#ff0033;display:grid;place-items:center;box-shadow:0 4px 16px rgba(0,0,0,.35)}
.vid-play span::before{content:"";border-style:solid;border-width:8px 0 8px 14px;border-color:transparent transparent transparent #fff;margin-left:3px}
.vid-body{padding:12px 14px 16px}
.vid-body b{display:block;font-family:var(--display);font-weight:800;font-size:1.05rem;line-height:1.25;color:var(--ink)}
.vid-body small{display:block;margin-top:4px;font-size:.82rem;color:var(--mute);line-height:1.4}
.vid-city{display:inline-block;margin-top:8px;font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--accent)}
footer{margin:48px 0 0;padding:24px 0 48px;font-size:13px;color:var(--mute)}
@media print{
  .divider{display:none}
  .ticket,.stay,.dia,.receipt,.vid{break-inside:avoid}
  .btn,.vid-play{display:none}
}
</style>
</head>
<body>
<header class="hero">
  <div class="hero-bg" role="img" aria-label="${esc(destination)}"></div>
  ${heroOrnament(theme)}
  <div class="wrap">
    <div class="eyebrow">${esc(origin)} → ${esc(destination)} · ${esc(dateLine)}</div>
    <h1>${esc(plan.title)}</h1>
    <p class="sub">${esc(plan.tagline || theme.mood)}</p>
    <div class="chips">
      <span>${pax} ${pax === 1 ? "viajero" : "viajeros"}</span>
      <span>${esc(destination)}</span>
      ${plan.luxuryLabel ? `<span>${esc(plan.luxuryLabel)}</span>` : ""}
      <span>~${esc(perPerson)} / persona</span>
    </div>
  </div>
</header>
${divider(theme)}

<main class="wrap">
  <div class="summary">
    <div class="ema"><div class="k">Transporte</div><div class="v num">${esc(transportHint)}</div><div class="s">Tramos principales</div></div>
    <div class="ema"><div class="k">Alojamiento</div><div class="v num">${esc(stayHint)}</div><div class="s">1 por ciudad</div></div>
    <div class="ema total"><div class="k">Total por persona</div><div class="v num">${esc(perPerson)}</div><div class="s">Grupo ${pax}: ${esc(totalGroup)}</div></div>
  </div>

  ${videosHtml}

  <section id="transporte">
    ${sectionHead(theme, seals[1] || "01", "Transporte", "Billetes con fecha y enlace de reserva por tramo.")}
    <div class="tickets">${ticketsHtml}</div>
  </section>

  <section id="alojamiento">
    ${sectionHead(theme, seals[2] || "02", "Alojamiento", "Una opción por ciudad, con fechas exactas de check-in y check-out.")}
    <div class="stays">${stayHtml || "<p>No verificado</p>"}</div>
  </section>

  <section id="ruta">
    ${sectionHead(theme, seals[3] || "03", "La ruta, día a día", "Cada actividad con foto del lugar, precio sobre la imagen y vídeo en YouTube.")}
    <div class="route" aria-label="Recorrido">${routeHtml}</div>
    <div class="dias">${daysHtml}</div>
  </section>

  <section id="presupuesto">
    ${sectionHead(theme, seals[4] || "04", "Presupuesto por persona", `Cifras ancladas a búsqueda o cálculo orientativo · ${consulted}.`)}
    <div class="budget">
      <div class="receipt">
        <h3>RECIBO</h3>
        <div class="rs">${esc(origin)} → ${esc(destination)} · ${pax} pax</div>
        ${budgetLines || `<div class="line"><span class="l">Total</span><span class="d"></span><span class="a">Ver enlaces</span></div>`}
        <div class="tot line"><span class="l">Por persona</span><span class="a">${esc(perPerson)}</span></div>
        <div class="tot line"><span class="l">Total grupo</span><span class="a">${esc(totalGroup)}</span></div>
      </div>
      <div>
        <p class="note">${esc(plan.disclaimer || "Precios orientativos; confirma en Skyscanner / Booking antes de pagar. Si aparece «orient.» es cálculo a partir de tarifa/noche.")}</p>
        <ul class="todo" style="margin-top:18px">
          <li><span class="w">Ya</span><span>Cerrar fechas y número de viajeros.</span></li>
          <li><span class="w">Pronto</span><span>Reservar vuelos con los enlaces de cada tramo.</span></li>
          <li><span class="w">Después</span><span>Bloquear alojamiento ciudad a ciudad.</span></li>
        </ul>
      </div>
    </div>
  </section>
</main>

<footer>
  <div class="wrap">
    Consultado: ${esc(consulted)} · ${esc(theme.mood)} · estilo ${esc(theme.style)}
    · <a href="${esc(booking.flightsSkyscanner)}" target="_blank" rel="noopener">Skyscanner</a>
    · <a href="${esc(booking.hotelsBooking)}" target="_blank" rel="noopener">Booking</a>
    · <a href="${esc(booking.activitiesGetYourGuide)}" target="_blank" rel="noopener">GetYourGuide</a>
  </div>
</footer>
</body>
</html>`;
}
