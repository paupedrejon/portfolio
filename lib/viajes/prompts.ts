import type { GuideImage, SearchSnippet, TripPlanInput } from "./types";
import { allDestinations } from "./types";
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
- For stays: if nightly known, total = nightly × nights (label orient. if computed).
- Forbidden: fake flight codes (NY-120), "Aerolínea Regular", "Estancia Completa" country packs.
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
- Hero full-bleed from ALLOWED IMAGES. Use DIFFERENT images per activity/city — never repeat one photo everywhere.`;

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
DESTINATIONS (in order — ONE stay card EACH): ${dests.join(" → ")}
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

HARD CHECK before you finish:
1) ${dests.length} stay cards (one per: ${dests.join(", ")})
2) Train/bus legs have Trainline/Flixbus buttons
3) Receipt section with totals
4) No emoji
5) Ends with </html>`;
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
    "city": "Tokio",
    "price": "total for stay or No verificado",
    "nightly": "85 €",
    "vibe": "neighborhood + why",
    "nights": "4 noches"
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
RULES:
- LIGHT paper palette matching ART BRIEF. NO emoji. NO Japanese motifs unless destination is Japan.
- Prices: snippets/PRICE FACTS first; else realistic "(orient.)" amounts — avoid littering "No verificado".
- Never invent 900€ flights if snippets show ~640€. Never invent flight numbers (no NY-120).
- stays: EXACTLY one per destination city with SPECIFIC hotel name + nightly when possible.
- legs: every hop + return; vehicleNo only if real from snippets.
- days: cover the trip; concrete places + prices; vary activity names (MoMA, High Line, Brooklyn Bridge…).
- budget MUST list legs + stays + food + activities; budgetPerPerson + budgetTotal required (compute if needed).
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
Luxury ${input.luxury}/5 · multi-modal
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
REQUIRED stays (one each): ${dests.join(", ")}
Stay windows: ${stayHint || "derive from window"}
If nightly known, set price = nightly × nights as "X €".
PRICE FACTS:
${priceFacts.map((f, i) => `(p${i + 1}) ${f}`).join("\n") || "(none — use realistic orient. amounts, not blank No verificado everywhere)"}
Snippets:
${snippets
  .slice(0, 14)
  .map((s, i) => `[${i + 1}] ${s.title} | ${s.url} | ${s.content.slice(0, 320)}`)
  .join("\n")}`;
}

export const EDIT_SYSTEM_PROMPT = `You edit an existing self-contained travel-guide HTML document.
Return the FULL updated HTML document only (must include receipt + </html>).
Preserve cultural paper art. No emoji. No invented prices.
Keep one stay per city, boarding passes with dates, Trainline/Flixbus on ground legs,
activity CTAs, dense days. No scripts. Match guide language.`;

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
