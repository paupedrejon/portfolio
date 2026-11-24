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
    return `Flexible in ${month}: ${min}–${max} days (pick best cheap window)`;
  }
  return "Flexible dates — suggest a realistic window";
}

export const GUIDE_SYSTEM_PROMPT = `Elite travel art-director + budget closer. Output ONLY one complete HTML5 document. No markdown.

HARD RULES:
- Inline CSS + optional Google Fonts. No JS/iframes.
- Destination-specific art (Korea = Seoul neon/hanok charcoal+cherry; Paris = Haussmann night+gold; NYC = taxi yellow + midnight glass; Japan = washi/neon). Never generic.
- Hero: full-bleed photo, DARK overlay, ALWAYS light title text (#f7f3ec).
- IMAGES: use ONLY URLs listed in IMAGES. Never invent Wikimedia/upload URLs. Never use PDFs, maps, books, or photos of other cities.
- Every photo must match THIS destination. If unsure, use CSS geometric hero / skip the image.

CONTENT STRUCTURE (critical — close a bookable budget, do NOT just sell the idea):

1) TRANSPORT — boarding-pass style cards (like physical tickets), NOT generic "Google Flights / Skyscanner comparador" cards.
   For each recommended option show: airport/station codes, airline or operator, outbound + return dates, exact price from snippets (EUR), flight/train/bus number if known, leg times, layovers in accent color.
   Prefer concrete itineraries (e.g. KE928 MXP→ICN 20:05). Include long trains/buses/ferries when cheaper or necessary.
   Each pass ends with a real "Reservar" <a> using BOOKING LINKS (Skyscanner / Google Flights / Flixbus / Trainline).
   Multi-city trips: one pass per leg between cities.

2) STAY — pick EXACTLY ONE primary lodging matching luxury level (backpacker = cheapest decent hostel).
   Show name, neighborhood, exact nightly or total price from snippets, short vibe, and CTAs to Booking.com + Airbnb with provided links.
   Do not list 3 vague hostels without prices.

3) ITINERARY — one clearly separated day block per day.
   Each day: title, then 2–4 activities. Each activity: photo (from ALLOWED IMAGES when possible), name, exact price (or "Gratis" / "No verificado"), 1-line tip.
   Visually separate days (large gap / distinct cards). Never dump all days as plain bullet lists only.

4) RECEIPT — line items with per-person + group totals citing snippet sources in footnotes.

- Prices ONLY from SEARCH SNIPPETS (cite source domain). Else "No verificado". Prefer EUR.
- Buttons: real <a href="..." target="_blank" rel="noopener"> styled as CTAs. Use the provided booking URLs.
- Print CSS. Visible language = user locale.`;

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

  return `Travel guide HTML for:

ORIGIN: ${input.origin}
DESTINATIONS (in order): ${dests.join(" → ")}  ← imagery & copy about these places only
DATES: ${dateCopy(input)}
TRAVELERS: ${input.travelers}
LUXURY: ${luxuryCopy(input.luxury)}
TRANSPORT: ALWAYS multi-modal — search/recommend flights + trains + buses + ferries as needed (never flight-only)
INTERESTS: ${interests || "general sightseeing"}
LOCALE: ${input.locale}
CONSULTED_AT: ${consultedAt}
ART MOOD: ${theme.mood}

BOOKING LINKS (use these exact hrefs for CTAs):
- Flights Google: ${booking.flightsGoogle}
- Flights Skyscanner: ${booking.flightsSkyscanner}
- Hotels Booking.com: ${booking.hotelsBooking}
- Hotels Airbnb: ${booking.hotelsAirbnb}
- Activities GetYourGuide: ${booking.activitiesGetYourGuide}
- Bus Flixbus: ${booking.busFlixbus}
- Trains Trainline: ${booking.trainsTrainline}

SEARCH SNIPPETS (anchor EVERY price here; include source in receipt footnotes):
${snippets
  .slice(0, 12)
  .map(
    (s, i) =>
      `[${i + 1}] ${s.title}\n${s.url}\n${s.content.slice(0, 380)}`,
  )
  .join("\n\n") || "(none — mark prices No verificado)"}

ALLOWED IMAGES (use only these URLs; skip if not fitting destination):
${images
  .slice(0, 10)
  .map(
    (img, i) =>
      `[img${i + 1}] ${img.title}\nURL: ${img.url}\nCredit: ${img.attribution}`,
  )
  .join("\n\n") || "(none — CSS-only hero)"}`;
}

export const JSON_SYSTEM_PROMPT = `Travel planner. Return ONLY valid JSON (no markdown):
{
  "title": string,
  "tagline": string,
  "datesLabel": string,
  "luxuryLabel": string,
  "palette": {"bg":"#dark","ink":"#light","accent":"#hex","paper":"#dark"},
  "legs": [{
    "kind": "flight"|"train"|"bus"|"ferry",
    "label": "IDA"|"VUELTA"|"TRAMO",
    "fromCode": "BCN",
    "toCode": "JFK",
    "fromCity": string,
    "toCity": string,
    "operator": "LEVEL",
    "date": "vie 12 nov",
    "depart": "12:45",
    "arrive": "15:30",
    "duration": "8 h 45",
    "vehicleNo": "IB6251",
    "price": "370 €",
    "note": "escala opcional"
  }],
  "transport": {"outbound": string, "inbound": string, "note"?: string},
  "stays": [{"name": string, "price": string, "vibe": string, "nights"?: string}],
  "budget": [{"label": string, "amount": string}],
  "budgetPerPerson": string,
  "budgetTotal": string,
  "days": [{"title": string, "summary"?: string, "activities": [{"name": string, "price"?: string, "tip"?: string}]}],
  "disclaimer"?: string
}
Dark bg + light ink. Prices from snippets else "No verificado" (prefer EUR).
stays: EXACTLY 1 recommended lodging with concrete price.
legs: concrete ticket-style segments (prefer over vague transport strings).
budgetPerPerson + budgetTotal for traveler count. Content must match destination city/country only. Locale = user locale.`;

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
Luxury ${input.luxury}/5 · ALWAYS multi-modal transport (flight/train/bus/ferry)
Interests: ${[...input.interests, input.interestsNote].filter(Boolean).join(", ") || "general"}
Locale: ${input.locale}
Consulted: ${consultedAt}
Art mood: ${theme.mood}
Suggested palette: ${JSON.stringify({ bg: theme.bg, ink: theme.ink, accent: theme.accent, paper: theme.paper })}
Pick ONE stay matching luxury. Build boarding-pass style legs with prices from snippets.
Compute budgetPerPerson and budgetTotal for ${input.travelers} travelers from snippets.
Snippets:
${snippets
  .slice(0, 10)
  .map((s, i) => `[${i + 1}] ${s.title} | ${s.url} | ${s.content.slice(0, 300)}`)
  .join("\n")}`;
}

export const EDIT_SYSTEM_PROMPT = `You edit an existing self-contained travel-guide HTML document.
Return the FULL updated HTML document only.
Preserve destination art direction. Keep light text on photo heroes.
Never invent image URLs or precise prices without sources.
Keep boarding-pass transport cards, single recommended stay with price, and day-by-day activities with prices.
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
