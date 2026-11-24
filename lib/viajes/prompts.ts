import type { GuideImage, SearchSnippet, TripPlanInput } from "./types";
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

export const GUIDE_SYSTEM_PROMPT = `Elite travel art-director. Output ONLY one complete HTML5 document. No markdown.

HARD RULES:
- Inline CSS + optional Google Fonts. No JS/iframes.
- Destination-specific art (Korea = Seoul neon/hanok charcoal+cherry; Paris = Haussmann night+gold; Japan = washi/neon). Never generic.
- Hero: full-bleed photo, DARK overlay, ALWAYS light title text (#f7f3ec).
- IMAGES: use ONLY URLs listed in IMAGES. Never invent Wikimedia/upload URLs. Never use PDFs, maps, books, or photos of other cities.
- Every photo must match THIS destination. If unsure, use CSS geometric hero / skip the image.
- Sections: hero chips, boarding passes WITH "Reservar vuelo" buttons using BOOKING LINKS, stays WITH Booking button, day cards, receipt (per person + group total), CTA strip.
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
  const theme = themeForDestination(input.destination);
  const interests = [
    ...input.interests,
    input.interestsNote?.trim() ? `note: ${input.interestsNote.trim()}` : "",
  ]
    .filter(Boolean)
    .join(", ");

  return `Travel guide HTML for:

ORIGIN: ${input.origin}
DESTINATION: ${input.destination}  ← ALL imagery & copy must be about THIS place only
DATES: ${dateCopy(input)}
TRAVELERS: ${input.travelers}
LUXURY: ${luxuryCopy(input.luxury)}
TRANSPORT: ${input.transport}
INTERESTS: ${interests || "general sightseeing"}
LOCALE: ${input.locale}
CONSULTED_AT: ${consultedAt}
ART MOOD: ${theme.mood}

BOOKING LINKS (use these exact hrefs for CTAs):
- Flights Google: ${booking.flightsGoogle}
- Flights Skyscanner: ${booking.flightsSkyscanner}
- Hotels Booking.com: ${booking.hotelsBooking}
- Activities GetYourGuide: ${booking.activitiesGetYourGuide}
${booking.busFlixbus ? `- Bus Flixbus: ${booking.busFlixbus}` : ""}

SEARCH SNIPPETS (anchor prices here; include source in receipt footnotes):
${snippets
  .slice(0, 12)
  .map(
    (s, i) =>
      `[${i + 1}] ${s.title}\n${s.url}\n${s.content.slice(0, 380)}`,
  )
  .join("\n\n") || "(none — mark prices No verificado)"}

ALLOWED IMAGES (use only these URLs; skip if not fitting destination):
${images
  .slice(0, 8)
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
  "transport": {"outbound": string, "inbound": string, "note"?: string},
  "stays": [{"name": string, "price"?: string, "vibe"?: string}],
  "budget": [{"label": string, "amount": string}],
  "budgetPerPerson": string,
  "budgetTotal": string,
  "days": [{"title": string, "summary"?: string, "activities": [{"name": string, "price"?: string, "tip"?: string}]}],
  "disclaimer"?: string
}
Dark bg + light ink. Prices from snippets else "No verificado" (prefer EUR).
budgetPerPerson + budgetTotal for traveler count. Content must match destination city/country only. Locale = user locale.`;

export function buildJsonUserPrompt(params: {
  input: TripPlanInput;
  snippets: SearchSnippet[];
  consultedAt: string;
}): string {
  const { input, snippets, consultedAt } = params;
  const theme = themeForDestination(input.destination);
  return `Trip JSON for ${input.origin} → ${input.destination} (content ONLY about ${input.destination}).
Dates: ${dateCopy(input)}
Travelers: ${input.travelers}
Luxury ${input.luxury}/5 · transport ${input.transport}
Interests: ${[...input.interests, input.interestsNote].filter(Boolean).join(", ") || "general"}
Locale: ${input.locale}
Consulted: ${consultedAt}
Art mood: ${theme.mood}
Suggested palette: ${JSON.stringify({ bg: theme.bg, ink: theme.ink, accent: theme.accent, paper: theme.paper })}
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
