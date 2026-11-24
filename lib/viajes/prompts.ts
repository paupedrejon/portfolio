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

export const GUIDE_SYSTEM_PROMPT = `Elite travel art-director + budget closer. Output ONLY one complete HTML5 document. No markdown.

HARD RULES:
- Inline CSS + optional Google Fonts. No JS/iframes. No emoji in transport cards (use text/SVG CSS).
- Destination-specific art. Hero: full-bleed photo, DARK overlay, ALWAYS light title (#f7f3ec).
- IMAGES: use ONLY URLs listed in IMAGES. Never invent Wikimedia URLs. Never use maps, books, engravings, title pages, or photos of other cities.
- Match each image to the city of that section (query prefix "City::"). If no fitting image, omit the <img>.

CONTENT (close a bookable multi-city budget — NOT a vague brochure):

1) TRANSPORT — boarding-pass cards for EVERY leg (origin→city1, city1→city2, …, last→origin).
   MUST show a concrete calendar DATE (e.g. "vie 14 nov 2026") on each pass — never omit the day.
   Show codes, operator, times, price from snippets, vehicle number if known.
   Use the matching LEG LINK href for that exact from→to (Skyscanner for flights, Trainline/Flixbus for ground). NEVER use bare homepage links like thetrainline.com/ alone. NEVER reuse origin→first-city Flixbus for a later leg.

2) STAYS — ONE lodging PER destination city (not only the first city).
   For each city: name, neighborhood, nights, exact price from snippets, PHOTO from ALLOWED IMAGES for that city, CTAs using that city's Booking + Airbnb links from STAY LINKS.
   Backpacker = cheapest decent hostel; mid = apartment/hotel, etc.

3) ITINERARY — one day block per day covering the FULL trip length across ALL cities (e.g. 6 days ⇒ 6 day blocks split across cities).
   Each day: city label + date, morning / afternoon / evening with concrete places (not "paseo libre").
   Each activity: name, tip with local detail, price (ticket/meal EUR or Gratis/No verificado), photo when a matching city image exists.
   Include food stops with typical prices, transit tips, and at least one paid highlight when luxury ≥ 2.
   Substance over fluff — readers should know WHAT to do hour-by-hour.

4) RECEIPT — every leg + every stay + food/activities; per person + group total; footnote sources.

- Prices ONLY from SEARCH SNIPPETS (cite domain). Else "No verificado". Prefer EUR.
- Real <a target="_blank" rel="noopener"> CTAs with provided URLs only.
- Print CSS. Language = user locale.`;

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
DESTINATIONS (in order): ${dests.join(" → ")}  ← cover ALL of these with stays + days
DATES: ${dateCopy(input)}
SUGGESTED WINDOW: ${booking.tripStart} → ${booking.tripEnd} (use concrete days inside for passes)
TRAVELERS: ${input.travelers}
LUXURY: ${luxuryCopy(input.luxury)}
TRANSPORT: ALWAYS multi-modal (flight/train/bus/ferry as needed)
INTERESTS: ${interests || "general sightseeing"}
LOCALE: ${input.locale}
CONSULTED_AT: ${consultedAt}
ART MOOD: ${theme.mood}

LEG LINKS (use the matching from→to href — do not mix cities):
${legLines || "(none)"}

STAY LINKS (one lodging card per city — use that city's URLs):
${stayLines || `(fallback Booking) ${booking.hotelsBooking}`}

Also available: GetYourGuide ${booking.activitiesGetYourGuide}

SEARCH SNIPPETS (anchor EVERY price; footnote sources):
${snippets
  .slice(0, 14)
  .map(
    (s, i) =>
      `[${i + 1}] ${s.title}\n${s.url}\n${s.content.slice(0, 400)}`,
  )
  .join("\n\n") || "(none — mark prices No verificado)"}

ALLOWED IMAGES (prefix City:: means use only for that city; never invent URLs):
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
  "palette": {"bg":"#dark","ink":"#light","accent":"#hex","paper":"#dark"},
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
Dark bg + light ink. Prices from snippets else "No verificado".
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
Suggested palette: ${JSON.stringify({ bg: theme.bg, ink: theme.ink, accent: theme.accent, paper: theme.paper })}
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
Preserve destination art direction. Keep light text on photo heroes.
Never invent image URLs or precise prices without sources.
Keep boarding-pass legs with dates, one stay per city with photos/prices, dense day-by-day itinerary.
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
