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

function googleFontHref(family: string): string {
  const q = encodeURIComponent(family);
  return `https://fonts.googleapis.com/css2?family=${q}:ital,wght@0,400;0,600;0,700;1,400&family=IBM+Plex+Mono:wght@400;500&display=swap`;
}

function bookingHrefForLeg(leg: TransportLeg, booking: BookingLinks): string {
  const kind = (leg.kind || "flight").toLowerCase();
  if (kind === "bus") return booking.busFlixbus || booking.flightsSkyscanner;
  if (kind === "train") return booking.trainsTrainline || booking.flightsSkyscanner;
  if (kind === "ferry") return booking.flightsSkyscanner;
  return booking.flightsSkyscanner;
}

function renderPass(leg: TransportLeg, booking: BookingLinks, accent: string): string {
  const from = leg.fromCode || leg.fromCity || "—";
  const to = leg.toCode || leg.toCity || "—";
  const href = bookingHrefForLeg(leg, booking);
  const price = leg.price || "No verificado";
  const label = leg.label || (leg.kind || "TRAMO").toUpperCase();
  return `<article class="pass">
    <header class="pass__head" style="background:${esc(accent)}">
      <span>BOARDING PASS · ${esc(label)}</span>
      <span>${esc(leg.operator || leg.kind || "Transport")}</span>
    </header>
    <div class="pass__route">
      <strong>${esc(from)}</strong>
      <span class="pass__dash" aria-hidden="true"></span>
      <strong>${esc(to)}</strong>
    </div>
    <div class="pass__grid">
      <div><span>Operador</span><b>${esc(leg.operator || "—")}</b></div>
      <div><span>Fecha</span><b>${esc(leg.date || "—")}</b></div>
      <div><span>Salida</span><b>${esc(leg.depart || "—")}</b></div>
      <div><span>Precio</span><b class="pass__price">${esc(price)}</b></div>
    </div>
    <div class="pass__footer">
      <div>
        <div class="meta">${esc(leg.fromCity || "")}${leg.toCity ? ` → ${esc(leg.toCity)}` : ""}</div>
        <p>${esc([leg.arrive ? `llega ${leg.arrive}` : "", leg.duration || "", leg.note || ""].filter(Boolean).join(" · "))}</p>
      </div>
      <div class="pass__code">${esc(leg.vehicleNo || price)}</div>
    </div>
    <div class="cta-row"><a class="btn btn--primary" href="${esc(href)}" target="_blank" rel="noopener">Reservar</a></div>
  </article>`;
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
  const heroInk = "#f7f3ec";
  const hero = pickHeroImage(images);
  const dayImages = images.filter((img) => img.url !== hero?.url);
  const pax = Math.max(1, travelers || 1);
  const font = theme.displayFont;

  let imgCursor = 0;
  const nextImg = () => {
    if (dayImages.length === 0 && images.length === 0) return null;
    const pool = dayImages.length ? dayImages : images;
    const img = pool[imgCursor % pool.length];
    imgCursor += 1;
    return img;
  };

  const daysHtml = plan.days
    .map((day, i) => {
      const acts = (day.activities || [])
        .map((a) => {
          const img = nextImg();
          return `<li class="act">
            ${
              img?.url
                ? `<figure class="act__photo"><img src="${esc(img.url)}" alt=""/><figcaption>${esc(img.attribution || "")}</figcaption></figure>`
                : ""
            }
            <div class="act__body">
              <div class="act__main"><strong>${esc(a.name)}</strong><em>${esc(a.price || "No verificado")}</em></div>
              ${a.tip ? `<span>${esc(a.tip)}</span>` : ""}
            </div>
          </li>`;
        })
        .join("");
      return `<article class="day">
        <header><span>DÍA ${String(i + 1).padStart(2, "0")}</span><h3>${esc(day.title)}</h3></header>
        ${day.summary ? `<p class="day__sum">${esc(day.summary)}</p>` : ""}
        <ul class="act-list">${acts}</ul>
      </article>`;
    })
    .join("\n");

  const stay = (plan.stays || [])[0];
  const stayHtml = stay
    ? `<div class="stay">
        <div class="meta">Alojamiento elegido</div>
        <h4>${esc(stay.name)}</h4>
        <p>${esc(stay.vibe || "")}</p>
        ${stay.nights ? `<div class="meta">${esc(stay.nights)}</div>` : ""}
        <strong class="stay__price">${esc(stay.price || "No verificado")}</strong>
        <div class="cta-row">
          <a class="btn btn--primary" href="${esc(booking.hotelsBooking)}" target="_blank" rel="noopener">Reservar en Booking</a>
          <a class="btn btn--ghost" href="${esc(booking.hotelsAirbnb)}" target="_blank" rel="noopener">Ver en Airbnb</a>
        </div>
      </div>`
    : `<p>No verificado</p>`;

  const legs: TransportLeg[] =
    plan.legs && plan.legs.length > 0
      ? plan.legs
      : [
          {
            kind: "flight",
            label: "IDA",
            fromCity: origin,
            toCity: destination,
            operator: "Ver ofertas",
            price: undefined,
            note: plan.transport?.outbound,
          },
          {
            kind: "flight",
            label: "VUELTA",
            fromCity: destination,
            toCity: origin,
            operator: "Ver ofertas",
            price: undefined,
            note: plan.transport?.inbound || plan.transport?.note,
          },
        ];

  const passesHtml = legs.map((leg) => renderPass(leg, booking, p.accent)).join("\n");

  const budgetRows = (plan.budget || []).map((b) => {
    const amount = b.amount || "No verificado";
    return `<tr><td>${esc(b.label)}</td><td>${esc(amount)}</td></tr>`;
  });

  const perPerson =
    plan.budgetPerPerson ||
    plan.budget?.find((b) => /persona|person|pax|\/pp/i.test(b.label))?.amount ||
    "No verificado";
  const totalGroup =
    plan.budgetTotal ||
    plan.budget?.find((b) => /total/i.test(b.label))?.amount ||
    "No verificado";

  const dateLine = plan.datesLabel || "";
  const lang = locale || "es";
  const consulted = consultedAt.slice(0, 10);

  return `<!DOCTYPE html>
<html lang="${esc(lang)}">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${esc(plan.title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="${googleFontHref(font)}" rel="stylesheet"/>
<style>
  :root{
    --bg:${esc(p.bg)};
    --ink:${esc(p.ink)};
    --accent:${esc(p.accent)};
    --paper:${esc(p.paper)};
    --hero-ink:${heroInk};
    --line: color-mix(in srgb, var(--ink) 16%, transparent);
  }
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--ink);font-family:"IBM Plex Mono",ui-monospace,monospace;line-height:1.5}
  h1,h2,h3,h4{font-family:"${esc(font)}",Georgia,serif;font-weight:600;letter-spacing:-.03em;line-height:1.05}
  .wrap{max-width:980px;margin:0 auto;padding:20px 18px 64px}
  .hero{
    position:relative;min-height:min(68vh,640px);display:grid;align-content:end;
    padding:clamp(28px,5vw,56px);border-radius:28px;overflow:hidden;margin-bottom:28px;
    background:${theme.heroOverlay},
      ${hero ? `url("${esc(hero.url)}") center/cover` : `radial-gradient(circle at 20% 15%, color-mix(in srgb,var(--accent) 45%, transparent), transparent 50%), var(--paper)`};
    color:var(--hero-ink);
    box-shadow:0 30px 80px rgba(0,0,0,.35);
  }
  .hero .meta{color:color-mix(in srgb, var(--hero-ink) 75%, transparent);margin-bottom:10px}
  .hero h1{font-size:clamp(2.6rem,7vw,4.8rem);margin:0;max-width:16ch;color:var(--hero-ink);text-shadow:0 2px 24px rgba(0,0,0,.45)}
  .hero .tag{margin:.85rem 0 0;max-width:46ch;font-size:1.05rem;color:color-mix(in srgb, var(--hero-ink) 88%, transparent);font-family:"${esc(font)}",Georgia,serif;font-style:italic;font-weight:400}
  .hero .chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:1.2rem}
  .chip{border:1px solid color-mix(in srgb, var(--hero-ink) 30%, transparent);background:rgba(0,0,0,.28);backdrop-filter:blur(8px);border-radius:999px;padding:.4rem .75rem;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--hero-ink)}
  .meta{font-size:11px;letter-spacing:.16em;text-transform:uppercase}
  .section-title{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin:40px 0 16px}
  .section-title h2{margin:0;font-size:clamp(1.6rem,3vw,2.2rem);border-left:5px solid var(--accent);padding-left:.7rem}
  .passes{display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(280px,1fr))}
  .pass{background:#f4efe6;color:#1a1a1a;border-radius:16px;overflow:hidden;border:1px solid color-mix(in srgb,#000 10%, transparent)}
  .pass__head{display:flex;justify-content:space-between;gap:8px;padding:.65rem 1rem;color:#fff;font-size:11px;letter-spacing:.08em;text-transform:uppercase}
  .pass__route{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:1.1rem 1rem .4rem;font-family:"${esc(font)}",Georgia,serif}
  .pass__route strong{font-size:clamp(1.8rem,4vw,2.4rem);letter-spacing:-.04em}
  .pass__dash{flex:1;border-top:2px dashed color-mix(in srgb,var(--accent) 70%, #999);position:relative;margin:0 .4rem}
  .pass__grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;padding:.6rem 1rem 1rem}
  .pass__grid span{display:block;font-size:10px;letter-spacing:.1em;text-transform:uppercase;opacity:.65}
  .pass__grid b{font-size:.92rem}
  .pass__price{color:var(--accent)}
  .pass__footer{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;padding:0 1rem 1rem;border-top:1px dashed #cbbfae;margin-top:.2rem;padding-top:.85rem}
  .pass__footer p{margin:.2rem 0 0;font-size:.82rem;opacity:.8}
  .pass__code{border:1px solid #1a1a1a;border-radius:8px;padding:.45rem .55rem;font-weight:700;font-size:.85rem;white-space:nowrap}
  .pass .cta-row{padding:0 1rem 1rem}
  .stay{background:var(--paper);padding:1.25rem;border-radius:18px;border-top:3px solid var(--accent);max-width:520px}
  .stay h4{margin:.35rem 0;font-size:1.45rem}
  .stay p{opacity:.78}
  .stay__price{display:block;margin:1rem 0;font-size:1.6rem;color:var(--accent)}
  .receipt{background:var(--paper);border-radius:18px;padding:8px 18px 16px;border:1px dashed color-mix(in srgb,var(--accent) 45%, var(--line))}
  table{width:100%;border-collapse:collapse;margin-top:4px}
  td{padding:12px 0;border-bottom:1px solid var(--line);font-size:.95rem}
  td:last-child{text-align:right;font-variant-numeric:tabular-nums}
  .receipt__totals{display:grid;gap:8px;margin-top:14px}
  .receipt__totals div{display:flex;justify-content:space-between;gap:12px;align-items:baseline}
  .receipt__totals .big{font-family:"${esc(font)}",Georgia,serif;font-size:1.55rem;color:var(--accent)}
  .day{background:var(--paper);border-radius:22px;padding:1.35rem 1.25rem;margin:0 0 1.75rem;border:1px solid var(--line);border-left:4px solid var(--accent)}
  .day header{display:flex;gap:12px;align-items:baseline;margin-bottom:.55rem}
  .day header span{color:var(--accent);letter-spacing:.14em;font-size:.78rem}
  .day header h3{margin:0;font-size:1.45rem}
  .day__sum{opacity:.8;margin:0 0 .85rem}
  .act-list{list-style:none;padding:0;margin:0;display:grid;gap:1rem}
  .act{display:grid;grid-template-columns:140px 1fr;gap:14px;padding-top:1rem;border-top:1px solid var(--line)}
  .act:first-child{border-top:0;padding-top:0}
  @media (max-width:640px){.act{grid-template-columns:1fr}.pass__grid{grid-template-columns:repeat(2,1fr)}}
  .act__photo{margin:0;border-radius:12px;overflow:hidden;background:#000;min-height:100px}
  .act__photo img{width:100%;height:110px;object-fit:cover;display:block}
  .act__photo figcaption{font-size:9px;opacity:.55;padding:4px}
  .act__main{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap}
  .act__main em{font-style:normal;color:var(--accent);font-size:.9rem;font-weight:700}
  .act__body span{display:block;opacity:.75;margin-top:4px;font-size:.88rem}
  footer{opacity:.7;font-size:.82rem;margin-top:36px;max-width:70ch}
  .cta-row{display:flex;flex-wrap:wrap;gap:10px;margin-top:12px}
  .btn{display:inline-flex;align-items:center;justify-content:center;padding:.7rem 1rem;border-radius:999px;text-decoration:none;font-size:.85rem;font-weight:600;letter-spacing:.02em}
  .btn--primary{background:var(--accent);color:#fff}
  .btn--ghost{border:1px solid var(--line);color:var(--ink)}
  .pass .btn--ghost,.pass .btn--primary{color:#fff}
  .pass .btn--ghost{border-color:#1a1a1a;color:#1a1a1a;background:transparent}
  .pass .btn--primary{background:#1a1a1a;color:#fff}
  .cta-band{margin:28px 0;padding:18px;border-radius:18px;background:var(--paper);border:1px solid var(--line);display:grid;gap:12px}
  @media print{
    body{background:#fff;color:#111}
    .hero{min-height:320px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    .pass,.stay,.day,.receipt{break-inside:avoid}
    .btn{display:none}
  }
</style>
</head>
<body>
  <div class="wrap">
    <section class="hero">
      <div class="meta">${esc(origin)} → ${esc(destination)}${dateLine ? ` · ${esc(dateLine)}` : ""}</div>
      <h1>${esc(plan.title)}</h1>
      <p class="tag">${esc(plan.tagline || theme.mood)}</p>
      <div class="chips">
        <span class="chip">${pax} ${pax === 1 ? "viajero" : "viajeros"}</span>
        <span class="chip">${esc(destination)}</span>
        ${plan.luxuryLabel ? `<span class="chip">${esc(plan.luxuryLabel)}</span>` : ""}
      </div>
    </section>

    <div class="section-title"><h2>Billetes recomendados</h2><span class="meta">Vuelo · tren · bus · ferry</span></div>
    <div class="passes">${passesHtml}</div>

    <div class="section-title"><h2>Alojamiento</h2><span class="meta">1 opción cerrada</span></div>
    ${stayHtml}

    <div class="section-title"><h2>Itinerario día a día</h2><span class="meta">Foto · actividad · precio</span></div>
    ${daysHtml}

    <div class="section-title"><h2>Presupuesto cerrado</h2><span class="meta">${pax} pax</span></div>
    <div class="receipt">
      <table>${budgetRows.join("") || "<tr><td>Total</td><td>No verificado</td></tr>"}</table>
      <div class="receipt__totals">
        <div><span class="meta">Por persona</span><span class="big">${esc(perPerson)}</span></div>
        <div><span class="meta">Total grupo (${pax})</span><strong>${esc(totalGroup)}</strong></div>
      </div>
    </div>

    <div class="cta-band">
      <div class="meta">Reservar ahora</div>
      <div class="cta-row">
        <a class="btn btn--primary" href="${esc(booking.flightsSkyscanner)}" target="_blank" rel="noopener">Skyscanner</a>
        <a class="btn btn--ghost" href="${esc(booking.flightsGoogle)}" target="_blank" rel="noopener">Google Flights</a>
        <a class="btn btn--ghost" href="${esc(booking.hotelsBooking)}" target="_blank" rel="noopener">Booking</a>
        <a class="btn btn--ghost" href="${esc(booking.hotelsAirbnb)}" target="_blank" rel="noopener">Airbnb</a>
        <a class="btn btn--ghost" href="${esc(booking.activitiesGetYourGuide)}" target="_blank" rel="noopener">GetYourGuide</a>
        <a class="btn btn--ghost" href="${esc(booking.busFlixbus)}" target="_blank" rel="noopener">Flixbus</a>
      </div>
    </div>

    <footer>
      ${esc(plan.disclaimer || "Precios orientativos a partir de búsqueda web; verifica en el enlace de reserva antes de comprar.")}
      · Consultado: ${esc(consulted)} · Mood: ${esc(theme.mood)}
    </footer>
  </div>
</body>
</html>`;
}
