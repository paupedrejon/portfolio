import type { GuideImage } from "./types";
import type { ItineraryPlan } from "./itinerary-schema";
import { pickHeroImage, themeForDestination } from "./destination-theme";

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

export function renderGuideHtml(params: {
  plan: ItineraryPlan;
  images: GuideImage[];
  consultedAt: string;
  destination: string;
  origin: string;
  locale: string;
  travelers: number;
}): string {
  const {
    plan,
    images,
    consultedAt,
    destination,
    origin,
    locale,
    travelers,
  } = params;
  const theme = themeForDestination(destination);
  const p = {
    bg: plan.palette?.bg || theme.bg,
    ink: plan.palette?.ink || theme.ink,
    accent: plan.palette?.accent || theme.accent,
    paper: plan.palette?.paper || theme.paper,
  };
  // Force readable hero text regardless of AI palette mistakes
  const heroInk = "#f7f3ec";
  const hero = pickHeroImage(images);
  const dayImages = images.filter((img) => img.url !== hero?.url);
  const pax = Math.max(1, travelers || 1);
  const font = theme.displayFont;

  const daysHtml = plan.days
    .map((day, i) => {
      const img = dayImages[i % Math.max(dayImages.length, 1)] || images[i % Math.max(images.length, 1)];
      const acts = (day.activities || [])
        .map(
          (a) =>
            `<li>
              <div class="act__main"><strong>${esc(a.name)}</strong>${a.price ? `<em>${esc(a.price)}</em>` : `<em>No verificado</em>`}</div>
              ${a.tip ? `<span>${esc(a.tip)}</span>` : ""}
            </li>`,
        )
        .join("");
      return `<article class="day">
        <div class="day__text">
          <header><span>${String(i + 1).padStart(2, "0")}</span><h3>${esc(day.title)}</h3></header>
          ${day.summary ? `<p>${esc(day.summary)}</p>` : ""}
          <ul>${acts}</ul>
        </div>
        ${
          img?.url
            ? `<figure><img src="${esc(img.url)}" alt=""/><figcaption>${esc(img.attribution || "")}</figcaption></figure>`
            : ""
        }
      </article>`;
    })
    .join("\n");

  const stays = (plan.stays || [])
    .map(
      (s) =>
        `<div class="stay">
          <div class="meta">Stay</div>
          <h4>${esc(s.name)}</h4>
          <p>${esc(s.vibe || "")}</p>
          <strong>${esc(s.price || "No verificado")}</strong>
        </div>`,
    )
    .join("");

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
  .section-title{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin:34px 0 14px}
  .section-title h2{margin:0;font-size:clamp(1.6rem,3vw,2.2rem)}
  .tickets{display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(260px,1fr))}
  .ticket{
    position:relative;background:var(--paper);border:1px solid var(--line);border-radius:18px;padding:18px 18px 16px;
    background-image:radial-gradient(circle at left center, var(--bg) 10px, transparent 11px),
      radial-gradient(circle at right center, var(--bg) 10px, transparent 11px);
  }
  .ticket strong{display:block;font-family:"${esc(font)}",Georgia,serif;font-size:1.25rem;margin:.4rem 0;font-weight:600}
  .ticket p{margin:0;opacity:.78;font-size:.9rem}
  .stays{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(220px,1fr))}
  .stay{background:var(--paper);padding:18px;border-radius:18px;border-top:3px solid var(--accent)}
  .stay h4{margin:.35rem 0;font-size:1.25rem}
  .stay p{opacity:.78;min-height:2.6em}
  .receipt{background:var(--paper);border-radius:18px;padding:8px 18px 16px;border:1px dashed color-mix(in srgb,var(--accent) 45%, var(--line))}
  table{width:100%;border-collapse:collapse;margin-top:4px}
  td{padding:12px 0;border-bottom:1px solid var(--line);font-size:.95rem}
  td:last-child{text-align:right;font-variant-numeric:tabular-nums}
  .receipt__totals{display:grid;gap:8px;margin-top:14px}
  .receipt__totals div{display:flex;justify-content:space-between;gap:12px;align-items:baseline}
  .receipt__totals .big{font-family:"${esc(font)}",Georgia,serif;font-size:1.55rem;color:var(--accent)}
  .day{display:grid;gap:16px;grid-template-columns:1.2fr .9fr;background:var(--paper);border-radius:22px;padding:18px;margin:0 0 16px;border:1px solid var(--line)}
  @media (max-width:760px){.day{grid-template-columns:1fr}}
  .day header{display:flex;gap:12px;align-items:baseline;margin-bottom:.4rem}
  .day header span{color:var(--accent);letter-spacing:.14em}
  .day header h3{margin:0;font-size:1.45rem}
  .day ul{list-style:none;padding:0;margin:12px 0 0}
  .day li{padding:10px 0;border-top:1px solid var(--line)}
  .act__main{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap}
  .act__main em{font-style:normal;color:var(--accent);font-size:.9rem}
  .day li span{display:block;opacity:.75;margin-top:4px;font-size:.88rem}
  figure{margin:0;border-radius:16px;overflow:hidden;background:#000}
  img{width:100%;height:100%;min-height:220px;max-height:320px;object-fit:cover;display:block}
  figcaption{font-size:10px;opacity:.6;padding:7px 4px}
  footer{opacity:.7;font-size:.82rem;margin-top:36px;max-width:70ch}
  @media print{
    body{background:#fff;color:#111}
    .hero{min-height:320px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    .ticket,.stay,.day,.receipt{break-inside:avoid}
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

    <div class="section-title"><h2>Pases de viaje</h2><span class="meta">Transport</span></div>
    <div class="tickets">
      <div class="ticket">
        <div class="meta">Ida</div>
        <strong>${esc(plan.transport?.outbound || "No verificado")}</strong>
      </div>
      <div class="ticket">
        <div class="meta">Vuelta</div>
        <strong>${esc(plan.transport?.inbound || "No verificado")}</strong>
        <p>${esc(plan.transport?.note || "")}</p>
      </div>
    </div>

    <div class="section-title"><h2>Dónde dormir</h2><span class="meta">Stays</span></div>
    <div class="stays">${stays || "<p>No verificado</p>"}</div>

    <div class="section-title"><h2>Recibo estimado</h2><span class="meta">${pax} pax</span></div>
    <div class="receipt">
      <table>${budgetRows.join("") || "<tr><td>Total</td><td>No verificado</td></tr>"}</table>
      <div class="receipt__totals">
        <div><span class="meta">Por persona</span><span class="big">${esc(perPerson)}</span></div>
        <div><span class="meta">Total grupo (${pax})</span><strong>${esc(totalGroup)}</strong></div>
      </div>
    </div>

    <div class="section-title"><h2>Itinerario</h2><span class="meta">Day by day</span></div>
    ${daysHtml}

    <footer>
      ${esc(plan.disclaimer || "Precios orientativos a partir de búsqueda web; no son cotizaciones reservables.")}
      · Consultado: ${esc(consulted)} · Mood: ${esc(theme.mood)}
    </footer>
  </div>
</body>
</html>`;
}
