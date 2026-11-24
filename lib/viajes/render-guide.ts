import type { GuideImage } from "./types";
import type { ItineraryPlan } from "./itinerary-schema";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderGuideHtml(params: {
  plan: ItineraryPlan;
  images: GuideImage[];
  consultedAt: string;
  destination: string;
  origin: string;
  locale: string;
}): string {
  const { plan, images, consultedAt, destination, origin, locale } = params;
  const p = plan.palette || {
    bg: "#12100e",
    ink: "#f4efe6",
    accent: "#c45c26",
    paper: "#1c1814",
  };
  const hero = images[0]?.url;
  const daysHtml = plan.days
    .map((day, i) => {
      const img = images[(i + 1) % Math.max(images.length, 1)];
      const acts = (day.activities || [])
        .map(
          (a) =>
            `<li><strong>${esc(a.name)}</strong>${a.price ? ` · <em>${esc(a.price)}</em>` : ""}${a.tip ? `<span>${esc(a.tip)}</span>` : ""}</li>`,
        )
        .join("");
      return `<article class="day">
        <header><span>0${i + 1}</span><h3>${esc(day.title)}</h3></header>
        ${day.summary ? `<p>${esc(day.summary)}</p>` : ""}
        ${img?.url ? `<figure><img src="${esc(img.url)}" alt=""/><figcaption>${esc(img.attribution || "")}</figcaption></figure>` : ""}
        <ul>${acts}</ul>
      </article>`;
    })
    .join("\n");

  const stays = (plan.stays || [])
    .map(
      (s) =>
        `<div class="stay"><h4>${esc(s.name)}</h4><p>${esc(s.vibe || "")}</p><strong>${esc(s.price || "No verificado")}</strong></div>`,
    )
    .join("");

  const budget = (plan.budget || [])
    .map(
      (b) =>
        `<tr><td>${esc(b.label)}</td><td>${esc(b.amount)}</td></tr>`,
    )
    .join("");

  const lang = locale || "es";

  return `<!DOCTYPE html>
<html lang="${esc(lang)}">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${esc(plan.title)}</title>
<style>
  :root{--bg:${esc(p.bg)};--ink:${esc(p.ink)};--accent:${esc(p.accent)};--paper:${esc(p.paper)};}
  *{box-sizing:border-box} body{margin:0;font-family:Georgia,"Times New Roman",serif;background:var(--bg);color:var(--ink);line-height:1.45}
  .wrap{max-width:920px;margin:0 auto;padding:24px}
  .hero{min-height:56vh;display:grid;align-content:end;padding:48px 28px;border-radius:24px;background:
    linear-gradient(180deg,transparent,rgba(0,0,0,.72)),
    ${hero ? `url("${esc(hero)}") center/cover` : `radial-gradient(circle at 30% 20%, var(--accent), transparent 55%), var(--paper)`};
    margin-bottom:28px}
  .hero h1{font-size:clamp(2.4rem,7vw,4.4rem);margin:0;letter-spacing:-.04em;line-height:.95}
  .hero p{opacity:.9;max-width:40ch}
  .meta{font-family:ui-monospace,monospace;font-size:12px;letter-spacing:.14em;text-transform:uppercase;opacity:.75}
  .tickets{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));margin:20px 0}
  .ticket{background:var(--paper);border:1px solid color-mix(in srgb,var(--ink) 18%,transparent);border-radius:16px;padding:16px}
  .ticket strong{display:block;font-size:1.1rem;margin:.35rem 0}
  .stays{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(200px,1fr))}
  .stay{background:var(--paper);padding:16px;border-radius:16px;border-left:3px solid var(--accent)}
  table{width:100%;border-collapse:collapse;margin:12px 0 28px}
  td{padding:10px 0;border-bottom:1px solid color-mix(in srgb,var(--ink) 16%,transparent)}
  .day{background:var(--paper);border-radius:18px;padding:18px;margin:0 0 16px}
  .day header{display:flex;gap:12px;align-items:baseline}
  .day header span{font-family:ui-monospace,monospace;color:var(--accent)}
  .day ul{list-style:none;padding:0;margin:12px 0 0}
  .day li{padding:8px 0;border-top:1px solid color-mix(in srgb,var(--ink) 12%,transparent);display:grid;gap:2px}
  .day li span{opacity:.75;font-size:.92rem}
  figure{margin:12px 0;border-radius:14px;overflow:hidden}
  img{width:100%;display:block;max-height:280px;object-fit:cover}
  figcaption{font-size:11px;opacity:.65;padding:6px 2px}
  footer{opacity:.7;font-size:.85rem;margin-top:32px}
  @media print{body{background:#fff;color:#111}.hero{min-height:280px;-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style>
</head>
<body>
  <div class="wrap">
    <section class="hero">
      <div class="meta">${esc(origin)} → ${esc(destination)}</div>
      <h1>${esc(plan.title)}</h1>
      <p>${esc(plan.tagline || "")}</p>
    </section>

    <div class="tickets">
      <div class="ticket"><div class="meta">Ida / Outbound</div><strong>${esc(plan.transport?.outbound || "No verificado")}</strong></div>
      <div class="ticket"><div class="meta">Vuelta / Return</div><strong>${esc(plan.transport?.inbound || "No verificado")}</strong><p>${esc(plan.transport?.note || "")}</p></div>
    </div>

    <h2>Estancias</h2>
    <div class="stays">${stays || "<p>No verificado</p>"}</div>

    <h2>Presupuesto estimado</h2>
    <table>${budget || "<tr><td>Total</td><td>No verificado</td></tr>"}</table>

    <h2>Día a día</h2>
    ${daysHtml}

    <footer>
      ${esc(plan.disclaimer || "Precios orientativos, no cotizaciones reservables.")}
      · Consultado: ${esc(consultedAt)}
    </footer>
  </div>
</body>
</html>`;
}
