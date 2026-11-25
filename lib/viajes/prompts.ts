import type { GuideImage, SearchSnippet, TripPlanInput } from "./types";
import { allDestinations } from "./types";
import type { BookingLinks } from "./booking-links";
import { themeForDestination } from "./destination-theme";

function luxuryCopy(n: number): string {
  const map: Record<number, string> = {
    1: "1/5 backpacker — hostels, street food, free walks",
    2: "2/5 budget — cheap hotels, local eateries",
    3: "3/5 mid — comfortable hotels/apartments, mix of paid sights",
    4: "4/5 upscale — boutique hotels, curated dining",
    5: "5/5 luxury — premium hotels, fine dining, private-feel experiences",
  };
  return map[n] || map[3];
}

function dateCopy(input: TripPlanInput): string {
  if (input.dateMode === "exact" && input.startDate && input.endDate) {
    return `Outbound ${input.startDate} · Return ${input.endDate}`;
  }
  if (input.dateMode === "flexible") {
    const month = input.flexibleMonth || "flexible month";
    const min = input.daysMin ?? input.days ?? 4;
    const max = input.daysMax ?? Math.max(min, 7);
    return `Flexible in ${month}: ${min}–${max} days (pick concrete calendar days inside that window)`;
  }
  return "Flexible dates — suggest a realistic window";
}

/**
 * Blueprint inspired by the Claude «Japón febrero 2027» guide:
 * cultural paper art direction, boarding-pass tickets, ema summary,
 * numbered section seals, city chapters, dense day cards, receipt budget.
 * Destination-adaptive — never force Japanese glyphs onto non-JP trips.
 */
export const GUIDE_SYSTEM_PROMPT = `You are an elite travel art-director + budget closer.
Output ONLY one complete HTML5 document. No markdown fences. No JavaScript. No iframes. No emoji.

════════════════════════════════════
ART DIRECTION (match ART BRIEF + tokens)
════════════════════════════════════
- The DOWNLOADABLE guide uses CULTURAL PAPER (cream/washi/hanji), NOT the portfolio Dark Cherry UI.
- CSS variables in :root from ART TOKENS. Google Fonts from FONT HREF.
- Hero: full-bleed photo (ALLOWED IMAGES only) + dark overlay + HUGE display title + short sub + chip row ("fuda"/tags).
- Optional cultural ornament (circle stamp, vertical script) ONLY if it fits the destination (JP/KR). For Paris/Italy use roman numerals / latin seals — never paste Japanese on a non-Japan trip.
- Body: paper background, serif display + clean sans body, hairline rules, stamp/seal section headers (.sh with numbered mark).
- Prefer transform/opacity-safe CSS; respect prefers-reduced-motion (disable animations).
- Print CSS: hide sticky nav, keep tickets/days/receipt break-inside:avoid.

════════════════════════════════════
DOCUMENT STRUCTURE (in this order)
════════════════════════════════════
1) HERO — destination name dominant; dates; 1 sentence promise; chips (nights · cities · ~€/person).
2) SUMMARY STRIP (.summary) — 3–4 "ema"/plaque cards: Transport total, Stay total, Total/pp (highlighted), optional alt origin note. Big tabular numbers.
3) SECTION «Vuelos / Transporte» — BOARDING-PASS tickets (.ticket):
   - Colored .tk-head ("BOARDING PASS · IDA/VUELTA/TRAMO")
   - Big airport/station codes + dashed .path between them
   - .tk-meta: operator, calendar DATE (vie 14 nov 2026), times, price
   - Perforation (.perf)
   - .tk-legs rows with exact times, vehicle numbers, layovers
   - CTA buttons using LEG LINKS for that exact from→to (Skyscanner / Trainline / Flixbus / Google). NEVER bare homepages. NEVER reuse wrong-leg URLs.
   One ticket/card per major hop including return. Multi-modal OK (flight + train + bus + ferry).
4) SECTION «Alojamiento» — ONE lodging PER destination city:
   - Photo from ALLOWED IMAGES for that city (City:: prefix)
   - Name, neighborhood, nights, check-in→check-out exact dates
   - Nightly + total price from snippets (else "No verificado")
   - Tags (metro, kitchen, score…)
   - CTAs: that city's Booking + Airbnb from STAY LINKS
5) SECTION «Ruta» — horizontal .route of cities/nights, then DAY-BY-DAY:
   - Optional .chapter per city (big cultural glyph/numeral + city name + night span)
   - Each .dia: big day number, weekday, title, one-line sub, "Noche en X" badge
   - .acts grid: 3–5 activities with photo (if available), name, tip, price (EUR or Gratis / No verificado)
   - Morning / afternoon / evening substance — NOT "paseo libre"
   - .transit banners for trains/buses between cities with times + operator
   - Food stops with typical prices; ≥1 paid highlight if luxury ≥ 2
6) SECTION «Presupuesto» — RECEIPT (.receipt) with dotted leaders:
   Every transport leg + every stay + food/day estimate + activities
   Totals: per person + group (TRAVELERS). Footnote domains from snippets + CONSULTED_AT.
7) Optional «Noches» block on dark night palette IF interests include nightlife/party — concrete venues + €/¥ estimates.
8) SECTION «Reservas» — dated checklist (when to book flights, stays, trains).
9) Footer disclaimer.

════════════════════════════════════
HARD CONTENT RULES
════════════════════════════════════
- IMAGES: ONLY URLs in ALLOWED IMAGES. Never invent Wikimedia URLs. Never maps/books/engravings/title pages. Match City:: prefix to section city; else omit <img>.
- Prices ONLY from SEARCH SNIPPETS (cite [n] / domain). Else "No verificado". Prefer EUR.
- Concrete calendar dates on every pass and stay — never omit the day.
- Language = user locale.
- Self-contained: inline <style> + Google Fonts <link>. Inline SVG icons OK (plane/train). No <script>.`;

export function buildPlanUserPrompt(params: {
  input: TripPlanInput;
  snippets: SearchSnippet[];
  images: GuideImage[];
  consultedAt: string;
  booking: BookingLinks;
}): string {
  const { input, snippets, images, consultedAt, booking } = params;
  const dests = allDestinations(input);
  const theme = themeForDestination(dests[0] || input.destination);
  const interests = [
    ...input.interests,
    input.interestsNote?.trim() ? `note: ${input.interestsNote.trim()}` : "",
  ]
    .filter(Boolean)
    .join(", ");

  const legLines = (booking.legs || [])
    .map(
      (l, i) =>
        `[leg${i + 1}] ${l.label} ${l.from} → ${l.to} on ${l.date}
  Skyscanner: ${l.skyscanner}
  Google: ${l.google}
  Flixbus: ${l.flixbus}
  Trainline: ${l.trainline}`,
    )
    .join("\n");

  const stayLines = (booking.stays || [])
    .map(
      (s, i) =>
        `[stay${i + 1}] ${s.city} · ${s.nights} nights · ${s.checkin} → ${s.checkout}
  Booking: ${s.booking}
  Airbnb: ${s.airbnb}`,
    )
    .join("\n");

  return `Travel guide HTML for:

ORIGIN: ${input.origin}
DESTINATIONS (in order): ${dests.join(" → ")}  ← cover ALL with stays + day chapters
DATES: ${dateCopy(input)}
SUGGESTED WINDOW: ${booking.tripStart} → ${booking.tripEnd} (concrete days on every pass/stay)
TRAVELERS: ${input.travelers}
LUXURY: ${luxuryCopy(input.luxury)}
TRANSPORT: ALWAYS multi-modal (flight/train/bus/ferry as needed)
INTERESTS: ${interests || "general sightseeing"}
LOCALE: ${input.locale}
CONSULTED_AT: ${consultedAt}

ART MOOD: ${theme.mood}
ART BRIEF: ${theme.artBrief}
ART TOKENS:
  --washi/bg: ${theme.bg}
  --card/paper: ${theme.paper}
  --sumi/ink: ${theme.ink}
  --mute: ${theme.mute}
  --rule: ${theme.rule}
  --shu/accent: ${theme.accent}
  --shu-soft: ${theme.accentSoft}
  --ai/secondary: ${theme.secondary}
  --night: ${theme.night}
  --neon: ${theme.neon}
DISPLAY FONT: ${theme.displayFont}
BODY FONT: ${theme.bodyFont}
FONT HREF: ${theme.googleFontsHref}
SCRIPT / SEAL SAMPLES (use only if culturally appropriate): ${theme.scriptSamples.join(" · ")}

LEG LINKS (match from→to — do not mix):
${legLines || "(none)"}

STAY LINKS (one lodging card per city):
${stayLines || `(fallback Booking) ${booking.hotelsBooking}`}

Also: GetYourGuide ${booking.activitiesGetYourGuide}

SEARCH SNIPPETS (anchor EVERY price; footnote sources):
${snippets
  .slice(0, 14)
  .map(
    (s, i) =>
      `[${i + 1}] ${s.title}\n${s.url}\n${s.content.slice(0, 400)}`,
  )
  .join("\n\n") || "(none — mark prices No verificado)"}

ALLOWED IMAGES (prefix City:: = that city only; never invent URLs):
${images
  .slice(0, 14)
  .map(
    (img, i) =>
      `[img${i + 1}] ${img.query} | ${img.title}\nURL: ${img.url}\nCredit: ${img.attribution}`,
  )
  .join("\n\n") || "(none — CSS-only hero)"}`;
}

export const JSON_SYSTEM_PROMPT = `Travel planner. Return ONLY valid JSON (no markdown):
{
  "title": string,
  "tagline": string,
  "datesLabel": string,
  "luxuryLabel": string,
  "palette": {"bg":"#paper","ink":"#dark","accent":"#hex","paper":"#card"},
  "legs": [{
    "kind": "flight"|"train"|"bus"|"ferry",
    "label": "IDA"|"VUELTA"|"TRAMO",
    "fromCode": "BCN",
    "toCode": "PRG",
    "fromCity": string,
    "toCity": string,
    "operator": string,
    "date": "vie 14 nov 2026",
    "depart": "20:05",
    "arrive": "22:40",
    "duration": "2 h 35",
    "vehicleNo": "VY8721",
    "price": "55 €",
    "note": string
  }],
  "transport": {"outbound": string, "inbound": string, "note"?: string},
  "stays": [{"name": string, "city": string, "price": string, "vibe": string, "nights": string}],
  "budget": [{"label": string, "amount": string}],
  "budgetPerPerson": string,
  "budgetTotal": string,
  "days": [{"title": string, "city"?: string, "summary"?: string, "activities": [{"name": string, "price"?: string, "tip"?: string}]}],
  "disclaimer"?: string
}
LIGHT cultural paper palette (cream paper + dark ink), NOT dark-mode UI.
Prices from snippets else "No verificado".
stays: ONE per destination city with concrete price.
legs: every hop including return, each with calendar date.
days: full trip length, rich morning/afternoon/evening detail.
Locale = user locale.`;

export function buildJsonUserPrompt(params: {
  input: TripPlanInput;
  snippets: SearchSnippet[];
  consultedAt: string;
}): string {
  const { input, snippets, consultedAt } = params;
  const dests = allDestinations(input);
  const theme = themeForDestination(dests[0] || input.destination);
  return `Trip JSON for ${input.origin} → ${dests.join(" → ")} (content ONLY about these places).
Dates: ${dateCopy(input)}
Travelers: ${input.travelers}
Luxury ${input.luxury}/5 · ALWAYS multi-modal transport
Interests: ${[...input.interests, input.interestsNote].filter(Boolean).join(", ") || "general"}
Locale: ${input.locale}
Consulted: ${consultedAt}
Art mood: ${theme.mood}
Art brief: ${theme.artBrief}
Suggested palette: ${JSON.stringify({
    bg: theme.bg,
    ink: theme.ink,
    accent: theme.accent,
    paper: theme.paper,
  })}
ONE stay per city. Legs with calendar dates covering all hops + return.
Dense day-by-day across all cities for the trip length.
Compute budgetPerPerson and budgetTotal for ${input.travelers} travelers from snippets.
Snippets:
${snippets
  .slice(0, 12)
  .map((s, i) => `[${i + 1}] ${s.title} | ${s.url} | ${s.content.slice(0, 300)}`)
  .join("\n")}`;
}

export const EDIT_SYSTEM_PROMPT = `You edit an existing self-contained travel-guide HTML document.
Return the FULL updated HTML document only.
Preserve cultural paper art direction (NOT Dark Cherry). Keep boarding-pass tickets with dates,
one stay per city with photos/prices, dense day-by-day itinerary, receipt budget.
Never invent image URLs or precise prices without sources.
Keep booking CTA links if present. No scripts. Match guide language.`;

export function buildEditUserPrompt(params: {
  html: string;
  instruction: string;
  snippets?: SearchSnippet[];
  consultedAt: string;
}): string {
  const extra =
    params.snippets && params.snippets.length > 0
      ? `\n\nNEW SEARCH SNIPPETS (${params.consultedAt}):\n${params.snippets
          .map(
            (s, i) =>
              `[${i + 1}] ${s.title}\n${s.url}\n${s.content}`,
          )
          .join("\n\n")}`
      : "";

  return `USER EDIT REQUEST:
${params.instruction}

CURRENT HTML:
${params.html.slice(0, 120000)}
${extra}`;
}
