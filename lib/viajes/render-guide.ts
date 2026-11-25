import type { GuideImage } from "./types";
import type { ItineraryPlan, TransportLeg } from "./itinerary-schema";
import type { BookingLinks } from "./booking-links";
import { pickHeroImage, themeForDestination } from "./destination-theme";
import { filterGuideImages } from "./wikimedia";

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

function imgForCity(images: GuideImage[], city?: string): GuideImage | null {
  if (!city) return images[0] || null;
  const n = normCity(city);
  const hit = images.find((img) => normCity(img.query).includes(n));
  return hit || null;
}

function dayNumberLabel(title: string, index: number): string {
  const m = title.match(/\b(\d{1,2})\b/);
  if (m) return m[1].padStart(2, "0");
  return String(index + 1).padStart(2, "0");
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
  const cta =
    kind === "bus" ? "Flixbus" : kind === "train" ? "Trainline" : "Skyscanner";

  return `<article class="ticket" style="--c:${esc(accent)}">
    <div class="tk-head"><span>${esc(seal)} · BOARDING PASS</span><span>${esc(label)}</span></div>
    <div class="tk-main">
      <div class="tk-route">
        <div><b>${esc(from)}</b><small>${esc(leg.fromCity || "")}</small></div>
        <div class="path" aria-hidden="true"></div>
        <div class="r"><b>${esc(to)}</b><small>${esc(leg.toCity || "")}</small></div>
      </div>
      <div class="tk-meta">
        <div><small>Operador</small><b>${esc(leg.operator || "—")}</b></div>
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
        <span class="fn">${esc(leg.vehicleNo || price)}</span>
      </div>
    </div>
    <div class="tk-foot">
      <div class="btns">
        <a class="btn solid" href="${esc(href)}" target="_blank" rel="noopener">Reservar · ${esc(cta)}</a>
      </div>
    </div>
  </article>`;
}

function sectionHead(
  num: string,
  script: string,
  title: string,
  lead: string,
): string {
  return `<div class="sh">
    <div class="mark"><span class="hanko">${esc(num)}</span>${script ? `<span class="v-jp" aria-hidden="true">${esc(script)}</span>` : ""}</div>
    <div><h2>${esc(title)}</h2><div class="rule"></div>
    <p class="lead">${esc(lead)}</p></div>
  </div>`;
}

export function renderGuideHtml(params: {
  plan: ItineraryPlan;
  images: GuideImage[];
  consultedAt: string;
  destination: string;
  origin: string;
  locale: string;
  travelers: number;
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
  const images = filterGuideImages(params.images);
  const theme = themeForDestination(destination);
  const p = {
    bg: plan.palette?.bg || theme.bg,
    ink: plan.palette?.ink || theme.ink,
    accent: plan.palette?.accent || theme.accent,
    paper: plan.palette?.paper || theme.paper,
  };
  const hero = pickHeroImage(images);
  const dayImages = images.filter((img) => img.url !== hero?.url);
  const pax = Math.max(1, travelers || 1);
  const seals = theme.scriptSamples;
  const dateLine = plan.datesLabel || `${booking.tripStart} → ${booking.tripEnd}`;
  const lang = locale || "es";
  const consulted = consultedAt.slice(0, 10);

  let imgCursor = 0;
  const nextImg = (city?: string) => {
    const byCity = city ? imgForCity(dayImages.length ? dayImages : images, city) : null;
    if (byCity) return byCity;
    const pool = dayImages.length ? dayImages : images;
    if (!pool.length) return null;
    const img = pool[imgCursor % pool.length];
    imgCursor += 1;
    return img;
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
      renderTicket(leg, booking, i % 2 === 1 ? theme.secondary : p.accent, seals[0] || "PASS"),
    )
    .join("\n");

  const staysList = plan.stays?.length
    ? plan.stays
    : (booking.stays || []).map((s) => ({
        name: `Alojamiento en ${s.city}`,
        city: s.city,
        price: "No verificado",
        vibe: "",
        nights: `${s.nights} noches`,
      }));

  const stayHtml = staysList
    .map((stay, i) => {
      const city = stay.city || booking.stays?.[i]?.city || destination;
      const link =
        booking.stays?.find((s) => normCity(s.city) === normCity(city)) ||
        booking.stays?.[i];
      const photo = imgForCity(images, city) || nextImg(city);
      return `<article class="stay">
        <div class="poster">
          ${photo?.url ? `<img src="${esc(photo.url)}" alt="${esc(city)}"/>` : ""}
          <span class="city-es">${esc(city)}</span>
        </div>
        <div class="body">
          <div class="when">${esc(
            stay.nights ||
              (link
                ? `${link.nights} noches · ${link.checkin} → ${link.checkout}`
                : ""),
          )}</div>
          <h3>${esc(stay.name)}</h3>
          <p>${esc(stay.vibe || "")}</p>
          <div class="money">
            <div class="pp"><small>Total estancia</small><b>${esc(stay.price || "No verificado")}</b></div>
          </div>
          <div class="btns" style="margin-top:14px">
            <a class="btn solid" href="${esc(link?.booking || booking.hotelsBooking)}" target="_blank" rel="noopener">Booking</a>
            <a class="btn" href="${esc(link?.airbnb || booking.hotelsAirbnb)}" target="_blank" rel="noopener">Airbnb</a>
          </div>
        </div>
      </article>`;
    })
    .join("\n");

  // Group days into city chapters
  const citiesOrder: string[] = [];
  for (const day of plan.days) {
    const c = day.city || destination;
    if (!citiesOrder.includes(c)) citiesOrder.push(c);
  }

  const routeHtml = citiesOrder
    .map((c) => {
      const nights = plan.days.filter((d) => (d.city || destination) === c).length;
      return `<div class="stop"><b>${esc(c)}</b><span>${nights} día${nights === 1 ? "" : "s"}</span></div>`;
    })
    .join("");

  let lastCity = "";
  const daysHtml = plan.days
    .map((day, i) => {
      const city = day.city || destination;
      let chapter = "";
      if (city !== lastCity) {
        const seal = seals[(citiesOrder.indexOf(city) + 1) % seals.length] || "";
        chapter = `<div class="chapter">${seal ? `<span class="kj" aria-hidden="true">${esc(seal)}</span>` : "<span></span>"}<div><h3>${esc(city)}</h3><p>${esc(day.summary || "")}</p></div></div>`;
        lastCity = city;
      }
      const acts = (day.activities || [])
        .map((a) => {
          const img = nextImg(city);
          return `<figure class="act">
            ${
              img?.url
                ? `<div class="ph" style="background-image:url('${esc(img.url)}')"></div>`
                : `<div class="ph"></div>`
            }
            <figcaption>
              <b>${esc(a.name)}</b>
              <span class="d">${esc(a.tip || "")}${a.price ? ` · ${esc(a.price)}` : ""}</span>
            </figcaption>
          </figure>`;
        })
        .join("");
      const num = dayNumberLabel(day.title, i);
      return `${chapter}
      <article class="dia">
        <div class="dia-head">
          <div class="dnum"><b>${esc(num)}</b></div>
          <div>
            <div class="dm">${esc(dateLine)}</div>
            <h4>${esc(day.title)}</h4>
            ${day.summary ? `<p class="dsub">${esc(day.summary)}</p>` : ""}
          </div>
          <span class="dnight">Noche en ${esc(city)}</span>
        </div>
        <div class="acts">${acts}</div>
      </article>`;
    })
    .join("\n");

  const budgetLines = (plan.budget || [])
    .map(
      (b) =>
        `<div class="line"><span class="l">${esc(b.label)}</span><span class="d"></span><span class="a">${esc(b.amount || "No verificado")}</span></div>`,
    )
    .join("");

  const perPerson =
    plan.budgetPerPerson ||
    plan.budget?.find((b) => /persona|person|pax|\/pp/i.test(b.label))?.amount ||
    "No verificado";
  const totalGroup =
    plan.budgetTotal ||
    plan.budget?.find((b) => /total/i.test(b.label))?.amount ||
    "No verificado";

  const transportHint = legs[0]?.price || "—";
  const stayHint = staysList[0]?.price || "—";

  return `<!DOCTYPE html>
<html lang="${esc(lang)}">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${esc(plan.title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="${esc(theme.googleFontsHref)}" rel="stylesheet"/>
<style>
:root{
  --washi:${esc(p.bg)};
  --card:${esc(p.paper)};
  --sumi:${esc(p.ink)};
  --mute:${esc(theme.mute)};
  --rule:${esc(theme.rule)};
  --shu:${esc(p.accent)};
  --shu-soft:${esc(theme.accentSoft)};
  --ai:${esc(theme.secondary)};
  --night:${esc(theme.night)};
  --neon:${esc(theme.neon)};
  --mincho:"${esc(theme.displayFont)}",Georgia,serif;
  --gothic:"${esc(theme.bodyFont)}",system-ui,sans-serif;
  color-scheme:light;
}
*{box-sizing:border-box}
html{scroll-behavior:smooth;background:var(--washi)}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}*{animation:none!important;transition:none!important}}
body{margin:0;color:var(--sumi);font-family:var(--gothic);font-size:16px;line-height:1.65;background:var(--washi)}
img{max-width:100%;display:block}
a{color:var(--ai)}
h1,h2,h3,h4{font-family:var(--mincho);font-weight:800;margin:0;line-height:1.15}
.wrap{max-width:1080px;margin:0 auto;padding:0 22px}
.num{font-variant-numeric:tabular-nums}
.v-jp{writing-mode:vertical-rl;text-orientation:upright;font-family:var(--mincho);font-weight:800;letter-spacing:.14em;font-size:18px;color:var(--shu)}
.hanko{display:inline-grid;place-items:center;width:44px;height:44px;font-family:var(--mincho);font-weight:800;color:var(--shu);border:3px solid var(--shu);border-radius:6px;line-height:1}
.hero{position:relative;min-height:min(72vh,620px);color:#fff;overflow:hidden;background:#0d0b10;isolation:isolate}
.hero-bg{position:absolute;inset:0;z-index:-2;background:${hero ? `url("${esc(hero.url)}") center/cover` : `radial-gradient(circle at 30% 20%,color-mix(in srgb,var(--shu) 50%,#000),#0d0b10)`}}
.hero::before{content:"";position:absolute;inset:0;z-index:-1;background:${theme.heroOverlay}}
.hinomaru{position:absolute;width:min(48vw,380px);aspect-ratio:1;border-radius:50%;background:var(--shu);right:8%;top:60px;z-index:-1;opacity:.85;box-shadow:0 0 0 14px color-mix(in srgb,var(--shu) 25%,transparent)}
.hero .wrap{position:relative;min-height:min(72vh,620px);display:flex;flex-direction:column;justify-content:flex-end;padding:70px 22px 56px}
.hero .eyebrow{font-size:13px;letter-spacing:.2em;text-transform:uppercase;font-weight:700;color:#f3d9b8}
.hero h1{font-size:clamp(3.2rem,11vw,6.5rem);margin:8px 0 6px;text-shadow:0 6px 30px rgba(0,0,0,.35);max-width:14ch}
.hero .sub{font-size:1.1rem;max-width:44ch;margin:8px 0 0;color:#efe6d6}
.fuda{display:flex;flex-wrap:wrap;gap:10px;margin-top:22px}
.fuda span{background:var(--card);color:var(--sumi);font-weight:700;font-size:14px;padding:6px 14px;border-left:5px solid var(--shu)}
.waves{height:40px;background:var(--ai);opacity:.9}
.summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,200px),1fr));gap:14px;margin:34px 0 0}
.ema{position:relative;background:var(--card);border:1px solid var(--rule);padding:16px 18px}
.ema .k{font-size:13px;font-weight:700;color:var(--mute);letter-spacing:.06em}
.ema .v{font-family:var(--mincho);font-size:2rem;font-weight:800;line-height:1.1;margin-top:6px}
.ema .s{font-size:14px;color:var(--mute)}
.ema.total{background:var(--sumi);color:var(--washi);border-color:var(--sumi)}
.ema.total .k,.ema.total .s{color:#c9bca5}
section{padding:56px 0 8px}
.sh{display:grid;grid-template-columns:auto 1fr;gap:18px;align-items:start;margin-bottom:22px}
.sh .mark{display:flex;flex-direction:column;align-items:center;gap:8px}
.sh h2{font-size:clamp(1.8rem,4vw,2.8rem)}
.sh .lead{color:var(--mute);max-width:66ch;margin:10px 0 0;font-size:1.05rem}
.rule{height:2px;background:linear-gradient(90deg,var(--sumi) 0 64px,var(--rule) 64px);margin:12px 0 0}
.tickets{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr));gap:20px}
.ticket{--c:var(--shu);background:var(--card);border:1px solid var(--rule);border-radius:14px;overflow:hidden}
.tk-head{background:var(--c);color:#fff;padding:10px 18px;display:flex;justify-content:space-between;font-size:12px;font-weight:700;letter-spacing:.12em}
.tk-main{padding:18px 20px 12px}
.tk-route{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:12px}
.tk-route b{display:block;font-family:var(--mincho);font-size:clamp(2rem,5vw,2.8rem);line-height:1}
.tk-route small{font-size:12px;color:var(--mute);font-weight:700}
.tk-route .r{text-align:right}
.tk-route .path{height:2px;background:repeating-linear-gradient(90deg,var(--c) 0 6px,transparent 6px 12px)}
.tk-meta{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:16px}
@media (max-width:520px){.tk-meta{grid-template-columns:1fr 1fr}}
.tk-meta small{display:block;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--mute);font-weight:700}
.tk-meta .price b{font-family:var(--mincho);font-size:1.6rem;color:var(--c)}
.perf{border-top:2px dashed var(--rule);margin:0 18px;position:relative}
.perf::before,.perf::after{content:"";position:absolute;top:-12px;width:22px;height:22px;border-radius:50%;background:var(--washi);border:1px solid var(--rule)}
.perf::before{left:-30px}.perf::after{right:-30px}
.tk-legs{padding:12px 20px 4px}
.leg-h{font-size:11px;font-weight:700;letter-spacing:.14em;color:var(--c);text-transform:uppercase;margin:8px 0 4px}
.row{display:grid;grid-template-columns:64px 1fr auto;gap:12px;align-items:center;padding:7px 0;border-bottom:1px dotted var(--rule)}
.row .t{font-family:var(--mincho);font-weight:800;font-size:1.25rem}
.row .r{font-weight:700;font-size:.95rem}
.row .r small{display:block;font-weight:400;color:var(--mute);font-size:.8rem}
.fn{font-size:11px;font-weight:700;border:1.5px solid var(--sumi);border-radius:4px;padding:1px 7px}
.tk-foot{padding:12px 20px 18px}
.btns{display:flex;flex-wrap:wrap;gap:8px}
.btn{display:inline-block;text-decoration:none;font-weight:700;font-size:14px;padding:8px 16px;border:2px solid var(--sumi);color:var(--sumi);background:transparent}
.btn.solid{background:var(--sumi);color:var(--washi)}
.stays{display:grid;gap:22px}
.stay{display:grid;grid-template-columns:minmax(0,320px) 1fr;background:var(--card);border:1px solid var(--rule)}
@media (max-width:760px){.stay{grid-template-columns:1fr}}
.poster{position:relative;min-height:240px;overflow:hidden;background:#222}
.poster img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.poster .city-es{position:absolute;left:16px;bottom:12px;z-index:1;color:#fff;font-weight:700;letter-spacing:.16em;text-transform:uppercase;font-size:12px;text-shadow:0 2px 12px #000}
.stay .body{padding:20px 22px}
.stay .when{font-size:12px;font-weight:700;letter-spacing:.08em;color:var(--shu)}
.stay h3{font-size:1.4rem;margin:4px 0}
.money{display:flex;gap:22px;margin-top:14px;padding-top:12px;border-top:2px solid var(--sumi)}
.money small{display:block;font-size:11px;font-weight:700;color:var(--mute);letter-spacing:.06em}
.money b{font-family:var(--mincho);font-size:1.6rem}
.route{display:flex;overflow-x:auto;gap:0;padding:8px 0 18px;margin-bottom:10px}
.stop{flex:1 0 110px;text-align:center;position:relative;padding-top:28px}
.stop::before{content:"";position:absolute;top:12px;left:0;right:0;height:3px;background:var(--sumi)}
.stop:first-child::before{left:50%}.stop:last-child::before{right:50%}
.stop b{display:block;font-family:var(--mincho);font-size:1.1rem}
.stop span{display:block;font-size:12px;color:var(--mute)}
.chapter{display:grid;grid-template-columns:auto 1fr;gap:16px;align-items:end;margin:48px 0 18px;padding-bottom:10px;border-bottom:2px solid var(--sumi)}
.chapter .kj{font-family:var(--mincho);font-weight:800;font-size:clamp(2.4rem,6vw,3.8rem);line-height:1;color:var(--shu)}
.chapter h3{font-size:clamp(1.4rem,3vw,1.9rem)}
.chapter p{margin:2px 0 0;color:var(--mute);font-size:.95rem}
.dias,.dia{display:grid;gap:28px}
.dia{gap:0;background:var(--card);border:1px solid var(--rule)}
.dia-head{display:grid;grid-template-columns:auto 1fr auto;gap:18px;align-items:center;padding:16px 22px;border-bottom:1px solid var(--rule)}
.dnum b{font-family:var(--mincho);font-weight:800;font-size:3rem;line-height:.9}
.dm{font-size:11px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--mute)}
.dia h4{font-size:clamp(1.2rem,2.5vw,1.6rem);margin:2px 0 0}
.dsub{margin:4px 0 0;color:var(--mute);font-size:.95rem}
.dnight{font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--mute);border:1.5px solid var(--rule);padding:4px 10px;white-space:nowrap}
.acts{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,180px),1fr));gap:16px;padding:18px 22px 22px}
.act{margin:0}
.act .ph{aspect-ratio:16/10;background:#2a2622 center/cover no-repeat}
.act b{display:block;font-family:var(--mincho);font-weight:800;font-size:1.05rem;margin-top:8px}
.act .d{display:block;font-size:.85rem;color:var(--mute);margin-top:2px}
@media (max-width:640px){
  .dia-head{grid-template-columns:auto 1fr;gap:12px}
  .dia-head .dnight{grid-column:1/-1;justify-self:start}
  .acts{grid-template-columns:1fr 1fr}
}
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
.receipt .tot{border-top:2px solid var(--sumi);margin-top:10px;padding-top:12px;font-family:var(--mincho);font-size:1.35rem;font-weight:800;display:flex;justify-content:space-between}
.note{font-size:.9rem;color:var(--mute);margin-top:14px}
.todo{display:grid;gap:10px;margin:0;padding:0;list-style:none}
.todo li{display:grid;grid-template-columns:120px 1fr;gap:14px;background:var(--card);border:1px solid var(--rule);padding:12px 16px}
.todo .w{font-family:var(--mincho);font-weight:800;color:var(--shu)}
footer{margin:48px 0 0;padding:24px 0 48px;font-size:13px;color:var(--mute)}
@media print{
  .waves{display:none}
  .ticket,.stay,.dia,.receipt{break-inside:avoid}
  .btn{display:none}
}
</style>
</head>
<body>
<header class="hero">
  <div class="hero-bg" role="img" aria-label="${esc(destination)}"></div>
  <div class="hinomaru" aria-hidden="true"></div>
  <div class="wrap">
    <div class="eyebrow">${esc(origin)} → ${esc(destination)} · ${esc(dateLine)}</div>
    <h1>${esc(plan.title)}</h1>
    <p class="sub">${esc(plan.tagline || theme.mood)}</p>
    <div class="fuda">
      <span>${pax} ${pax === 1 ? "viajero" : "viajeros"}</span>
      <span>${esc(destination)}</span>
      ${plan.luxuryLabel ? `<span>${esc(plan.luxuryLabel)}</span>` : ""}
      <span>~${esc(perPerson)} / persona</span>
    </div>
  </div>
</header>
<div class="waves" aria-hidden="true"></div>

<main class="wrap">
  <div class="summary">
    <div class="ema"><div class="k">Transporte</div><div class="v num">${esc(transportHint)}</div><div class="s">Tramos principales</div></div>
    <div class="ema"><div class="k">Alojamiento</div><div class="v num">${esc(stayHint)}</div><div class="s">1 por ciudad</div></div>
    <div class="ema total"><div class="k">Total por persona</div><div class="v num">${esc(perPerson)}</div><div class="s">Grupo ${pax}: ${esc(totalGroup)}</div></div>
  </div>

  <section id="transporte">
    ${sectionHead(seals[1] || "01", seals[0] || "", "Transporte", "Billetes concretos con fecha, hora y enlace de reserva por tramo.")}
    <div class="tickets">${ticketsHtml}</div>
  </section>

  <section id="alojamiento">
    ${sectionHead(seals[2] || "02", "", "Alojamiento", "Una opción por ciudad, con fechas exactas de check-in y check-out.")}
    <div class="stays">${stayHtml || "<p>No verificado</p>"}</div>
  </section>

  <section id="ruta">
    ${sectionHead(seals[3] || "03", "", "La ruta, día a día", "Actividades concretas con precio orientativo. Sin relleno.")}
    <div class="route" aria-label="Recorrido">${routeHtml}</div>
    <div class="dias">${daysHtml}</div>
  </section>

  <section id="presupuesto">
    ${sectionHead(seals[4] || "04", "", "Presupuesto por persona", `Cifras ancladas a búsqueda web · consultado ${consulted}.`)}
    <div class="budget">
      <div class="receipt">
        <h3>RECIBO</h3>
        <div class="rs">${esc(origin)} → ${esc(destination)} · ${pax} pax</div>
        ${budgetLines || `<div class="line"><span class="l">Total</span><span class="d"></span><span class="a">No verificado</span></div>`}
        <div class="tot line"><span class="l">Por persona</span><span class="a">${esc(perPerson)}</span></div>
        <div class="tot line"><span class="l">Total grupo</span><span class="a">${esc(totalGroup)}</span></div>
      </div>
      <div>
        <p class="note">${esc(plan.disclaimer || "Precios orientativos a partir de búsqueda web; verifica en el enlace de reserva antes de comprar.")}</p>
        <ul class="todo" style="margin-top:18px">
          <li><span class="w">Ya</span><span>Cerrar fechas y número de viajeros.</span></li>
          <li><span class="w">Pronto</span><span>Reservar vuelos/trenes con los enlaces de cada tramo.</span></li>
          <li><span class="w">Después</span><span>Bloquear alojamiento ciudad a ciudad.</span></li>
        </ul>
      </div>
    </div>
  </section>
</main>

<footer>
  <div class="wrap">
    Consultado: ${esc(consulted)} · ${esc(theme.mood)}
    · <a href="${esc(booking.flightsSkyscanner)}" target="_blank" rel="noopener">Skyscanner</a>
    · <a href="${esc(booking.hotelsBooking)}" target="_blank" rel="noopener">Booking</a>
    · <a href="${esc(booking.activitiesGetYourGuide)}" target="_blank" rel="noopener">GetYourGuide</a>
  </div>
</footer>
</body>
</html>`;
}
