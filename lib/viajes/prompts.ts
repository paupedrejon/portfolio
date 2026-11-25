import type { GuideImage, SearchSnippet, TripPlanInput } from "./types";
import { allDestinations } from "./types";
import type { GuideVideo } from "./youtube";
import type { BookingLinks } from "./booking-links";
import { themeForDestination } from "./destination-theme";
import { extractPriceFacts } from "./price-facts";

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

export const GUIDE_SYSTEM_PROMPT = `Elite travel art-director + budget closer.
Output ONLY one complete HTML5 document ending with </html>. No markdown. No JavaScript. No iframes. NO EMOJI anywhere (use CSS/SVG/text icons only).

════════════════════════════════════
PRICE & FACT INTEGRITY (non-negotiable)
════════════════════════════════════
- Prefer PRICE FACTS / SEARCH SNIPPETS. Cite [n] or domain.
- If snippets show a band (e.g. 630–650 € i/v), use that — never invent 900+ €.
- If no snippet price: use a realistic market ORIENTATIVO labeled "(orient.)" — NEVER dump "No verificado" on every line.
- For stays: total MUST = nightly × nights (125×16=2000). One booking CTA only (Booking OR Airbnb).
- Transport: ONE CTA per leg to buy that ticket (Skyscanner / Trainline / Flixbus) — not two buttons.
- Forbidden: fake flight codes (NY-120), "Aerolínea Regular", "Estancia Completa" country packs.
- Days: full trip length, ≥3 activities/day. Never a 2-day stub for a 2-week trip.
- Real operator + flight number ONLY when in snippets; else operator "Ver en Skyscanner" and vehicleNo omitted.

════════════════════════════════════
STAYS (critical)
════════════════════════════════════
- ONE lodging CARD PER city in DESTINATIONS list (e.g. Tokio + Kioto + Osaka = 3 cards).
- Each card: specific property NAME (real hotel/hostel/apartment style name from snippets if possible), neighborhood, nights, check-in→check-out from STAY LINKS, nightly + total, photo for THAT city, Booking + Airbnb CTAs for THAT city only.
- NEVER one card titled for the whole country covering all cities.

════════════════════════════════════
TRANSPORT
════════════════════════════════════
- Boarding-pass ticket per leg (ida, intercity trains/buses, vuelta).
- Intercity train/bus MUST include Trainline and/or Flixbus CTA from LEG LINKS for that from→to.
- Never bare thetrainline.com homepage. Never emoji in transit banners.

════════════════════════════════════
DAYS / ACTIVITIES
════════════════════════════════════
- Full trip length; morning/afternoon/evening with concrete places.
- Each paid activity: photo (ALLOWED IMAGES for that city when available) + price + CTA link (GetYourGuide city link or official) "Ver / reservar".
- Free sights still get a short tip; photo when available.

════════════════════════════════════
RECEIPT (mandatory — document incomplete without it)
════════════════════════════════════
- Final .receipt section summing: each transport leg, each city stay, food estimate, activities.
- Per person + group total for TRAVELERS. Footnote CONSULTED_AT + domains.
- Document MUST end with checklist + footer + </html>. If running long, shorten day tips — NEVER truncate before receipt.

════════════════════════════════════
ART (destination-specific — NEVER copy Japan onto other cities)
════════════════════════════════════
- Follow ART BRIEF + style token exactly. NYC = metro/newsprint/taxi stripe. Paris = editorial. Japan ONLY = washi/hinomaru/hanko.
- FORBIDDEN outside Japan/Korea: hinomaru disc, kanji, vertical Asian script, hanko stamps, seigaiha waves, class names implying Japan.
- Cultural PAPER from ART TOKENS (not Dark Cherry). Google Fonts from FONT HREF.
- Hero full-bleed from ALLOWED IMAGES. Use DIFFERENT images per activity/city — never repeat one photo everywhere.
- Include a section «Así se ve de verdad» (or locale equivalent) with cards linking ONLY to ALLOWED VIDEOS (YouTube). Thumbnail from provided thumb URL, title, short blurb, open in new tab. No iframes/embeds.`;

export function buildPlanUserPrompt(params: {
  input: TripPlanInput;
  snippets: SearchSnippet[];
  images: GuideImage[];
  videos?: GuideVideo[];
  consultedAt: string;
  booking: BookingLinks;
}): string {
  const { input, snippets, images, consultedAt, booking } = params;
  const videos = params.videos || [];
  const dests = allDestinations(input);
  const theme = themeForDestination(dests[0] || input.destination);
  const interests = [
    ...input.interests,
    input.interestsNote?.trim() ? `note: ${input.interestsNote.trim()}` : "",
  ]
    .filter(Boolean)
    .join(", ");
  const priceFacts = extractPriceFacts(snippets);

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
  Airbnb: ${s.airbnb}
  GetYourGuide: ${s.getYourGuide}`,
    )
    .join("\n");

  return `Travel guide HTML for:

ORIGIN: ${input.origin}
USER DESTINATION LABELS: ${dests.join(" → ")}
(If a label is a country/region, pick 2–4 concrete cities that fit — ONE stay per chosen city. Any place on Earth.)
DATES: ${dateCopy(input)}
SUGGESTED WINDOW: ${booking.tripStart} → ${booking.tripEnd}
TRAVELERS: ${input.travelers}
LUXURY: ${luxuryCopy(input.luxury)}
TRANSPORT: multi-modal (flight/train/bus/ferry)
INTERESTS: ${interests || "general sightseeing"}
LOCALE: ${input.locale}
CONSULTED_AT: ${consultedAt}

ART MOOD: ${theme.mood}
ART BRIEF: ${theme.artBrief}
GUIDE STYLE: ${theme.style} · verticalScript=${theme.verticalScript}
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
SCRIPT SAMPLES (only if culturally OK): ${theme.scriptSamples.join(" · ")}

PRICE FACTS (use these amounts; do not invent higher flight prices):
${priceFacts.map((f, i) => `  (p${i + 1}) ${f}`).join("\n") || "  (none — write No verificado)"}

LEG LINKS:
${legLines || "(none)"}

STAY LINKS (${booking.stays?.length || 0} cities — output ${booking.stays?.length || 0} stay cards):
${stayLines || `(fallback) ${booking.hotelsBooking}`}

GetYourGuide root: ${booking.activitiesGetYourGuide}

SEARCH SNIPPETS:
${snippets
  .slice(0, 16)
  .map(
    (s, i) =>
      `[${i + 1}] ${s.title}\n${s.url}\n${s.content.slice(0, 450)}`,
  )
  .join("\n\n") || "(none)"}

ALLOWED IMAGES (City:: prefix = that city only):
${images
  .slice(0, 16)
  .map(
    (img, i) =>
      `[img${i + 1}] ${img.query} | ${img.title}\nURL: ${img.url}\nCredit: ${img.attribution}`,
  )
  .join("\n\n") || "(none)"}

ALLOWED VIDEOS (YouTube only — use these for «Así se ve de verdad»; do not invent IDs):
${videos
  .slice(0, 8)
  .map(
    (v, i) =>
      `[vid${i + 1}] ${v.city} · ${v.title}\nWatch: ${v.url}\nThumb: ${v.thumb}\nBlurb: ${v.description}`,
  )
  .join("\n\n") || "(none — omit video section)"}

HARD CHECK before you finish:
1) ${dests.length} stay cards (one per: ${dests.join(", ")})
2) Train/bus legs have Trainline/Flixbus buttons
3) Receipt section with totals
4) Video gallery if ALLOWED VIDEOS present
5) No emoji
6) Ends with </html>`;
}

export const JSON_SYSTEM_PROMPT = `Travel planner. Return ONLY valid JSON (no markdown):
{
  "title": "short punchy title ≤48 chars (no subtitle after colon if possible)",
  "tagline": "one sentence ≤110 chars",
  "datesLabel": string,
  "luxuryLabel": string,
  "palette": {"bg":"#paper","ink":"#dark","accent":"#hex","paper":"#card"},
  "legs": [{
    "kind": "flight"|"train"|"bus"|"ferry",
    "label": "IDA"|"VUELTA"|"TRAMO",
    "fromCode": "MXP",
    "toCode": "HND",
    "fromCity": string,
    "toCity": string,
    "operator": string,
    "date": "vie 12 feb 2027",
    "depart": "20:05",
    "arrive": "22:50",
    "duration": "14 h 45",
    "vehicleNo": "KE928",
    "price": "648 €",
    "note": string
  }],
  "transport": {"outbound": string, "inbound": string, "note"?: string},
  "stays": [{
    "name": "specific property name",
    "city": "ConcreteCityName",
    "price": "2000 €",
    "nightly": "125 €",
    "vibe": "neighborhood + why",
    "nights": "16 noches",
    "platform": "booking"
  }],
  "budget": [{"label": string, "amount": string}],
  "budgetPerPerson": string,
  "budgetTotal": string,
  "days": [{
    "title": string,
    "city": string,
    "summary": string,
    "activities": [{
      "name": string,
      "price": string,
      "tip": string,
      "bookingLabel": "Ver entrada"|"Reservar"|"Más info",
      "time": "09:30"
    }]
  }],
  "disclaimer": string
}
RULES (agency-quality — works for ANY country/city on Earth):
- If the user typed a COUNTRY or REGION (e.g. Canadá, Japón, Italia, Patagonia), YOU must pick 2–4 concrete CITIES that fit trip length + interests. Never use the country name as stays[].city.
- If the user already typed cities, use those cities (in order). Do not invent unrelated countries.
- LIGHT paper palette matching ART BRIEF (luxury 4–5 may be gold/dark editorial). NO emoji. Japanese ornaments ONLY if destination is Japan.
- title MUST be ≤48 characters, punchy, ideally without a long subtitle after ":".
- Stay price MUST equal nightly × nights. One platform per stay: "booking"|"airbnb".
- legs: every hop between chosen cities + return; vehicleNo only if real from snippets.
- days: ONE object PER calendar day (16 nights ⇒ ~16 days). NEVER stop after day 2.
- Each day ≥3 activities (morning/afternoon/evening) with concrete places + prices.
- EVERY activity.price must be concrete (e.g. "32 €", "Gratis", "~45 € / pers.") — never leave meals blank. Lunch/dinner need approx €/person matching luxury.
- Local getting-around must match luxury: level 5 = private chauffeur / premium taxi (NOT metro day-pass as primary); level 4 = taxi + optional half-day driver; ≤3 = metro/bus passes OK.
- Stay names must be real bookable properties; Booking/Airbnb will deep-link by that name.
- Split days across the chosen cities in order.
- budget MUST list legs + stays + food + activities; budgetPerPerson + budgetTotal required.
Locale = user locale.`;

export function buildJsonUserPrompt(params: {
  input: TripPlanInput;
  snippets: SearchSnippet[];
  consultedAt: string;
  booking?: BookingLinks;
}): string {
  const { input, snippets, consultedAt, booking } = params;
  const dests = allDestinations(input);
  const theme = themeForDestination(dests[0] || input.destination);
  const priceFacts = extractPriceFacts(snippets);
  const stayHint = (booking?.stays || [])
    .map((s) => `${s.city}: ${s.nights}n ${s.checkin}→${s.checkout}`)
    .join("; ");

  return `Trip JSON for ${input.origin} → ${dests.join(" → ")}.
Dates: ${dateCopy(input)}
Window: ${booking?.tripStart || "?"} → ${booking?.tripEnd || "?"}
Travelers: ${input.travelers}
Luxury ${input.luxury}/5 · multi-modal${
  input.luxury >= 5
    ? " · LOCAL MOVE = private chauffeur / black car (no public-transit-first advice)"
    : input.luxury >= 4
      ? " · LOCAL MOVE = taxis + optional private driver"
      : " · LOCAL MOVE = transit passes OK"
}
Interests: ${[...input.interests, input.interestsNote].filter(Boolean).join(", ") || "general"}
Locale: ${input.locale}
Consulted: ${consultedAt}
Art mood: ${theme.mood}
Art brief: ${theme.artBrief}
Guide style: ${theme.style} (verticalScript=${theme.verticalScript}) — do NOT use Japan motifs unless style is washi
Palette: ${JSON.stringify({
    bg: theme.bg,
    ink: theme.ink,
    accent: theme.accent,
    paper: theme.paper,
  })}
User labels (may be cities OR a country/region): ${dests.join(" · ")}
If those labels are not concrete lodging cities, invent 2–4 real cities inside that place for stays/days.
Stay windows hint: ${stayHint || "derive from window"}
Nights total: ${(booking?.stays || []).reduce((a, s) => a + s.nights, 0) || "?"} — that many DAY objects, ≥3 activities each.
price = nightly × nights exactly. HARD FAIL if only 1–2 days on a long trip.
PRICE FACTS:
${priceFacts.map((f, i) => `(p${i + 1}) ${f}`).join("\n") || "(none — use realistic orient. amounts, not blank No verificado everywhere)"}
Snippets:
${snippets
  .slice(0, 14)
  .map((s, i) => `[${i + 1}] ${s.title} | ${s.url} | ${s.content.slice(0, 320)}`)
  .join("\n")}`;
}

/** Interpret a chat edit into an updated trip (cities/dates/luxury), not HTML. */
export const EDIT_TRIP_SYSTEM_PROMPT = `You update a travel trip brief from a user chat instruction.
Return ONLY valid JSON (no markdown):
{
  "origin": string,
  "destination": string,
  "destinations": string[],
  "startDate": string|null,
  "endDate": string|null,
  "flexibleMonth": string|null,
  "dateMode": "exact"|"flexible",
  "daysMin": number|null,
  "daysMax": number|null,
  "luxury": number,
  "travelers": number,
  "interests": string[],
  "interestsNote": string,
  "summary": string
}
RULES:
- Apply the instruction fully (add/remove/reorder cities, change dates, luxury, travelers, focus).
- "añade Bratislava" with current Praga+Viena → destination=Praga, destinations=["Viena","Bratislava"] (keep order sensible for geography when possible).
- Keep fields unchanged unless the instruction asks to change them.
- Cities must be concrete place names (not countries) when the user named cities.
- summary: one short sentence in the user locale describing what you changed.
- Never invent a new origin unless asked.`;

export function buildEditTripUserPrompt(params: {
  trip: TripPlanInput;
  instruction: string;
  currentCities?: string[];
}): string {
  const cities =
    params.currentCities && params.currentCities.length > 0
      ? params.currentCities
      : allDestinations(params.trip);
  return `CURRENT TRIP:
origin: ${params.trip.origin}
cities (in order): ${cities.join(" → ")}
dateMode: ${params.trip.dateMode}
startDate: ${params.trip.startDate || ""}
endDate: ${params.trip.endDate || ""}
flexibleMonth: ${params.trip.flexibleMonth || ""}
daysMin: ${params.trip.daysMin ?? ""}
daysMax: ${params.trip.daysMax ?? ""}
luxury: ${params.trip.luxury}
travelers: ${params.trip.travelers}
interests: ${params.trip.interests.join(", ")}
interestsNote: ${params.trip.interestsNote || ""}
locale: ${params.trip.locale}

USER INSTRUCTION:
${params.instruction}

Return the full updated trip JSON.`;
}
