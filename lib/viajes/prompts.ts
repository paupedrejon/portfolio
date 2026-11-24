import type { GuideImage, SearchSnippet, TripPlanInput } from "./types";
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

export const GUIDE_SYSTEM_PROMPT = `You are an elite travel art-director (agency proposal quality, like a bespoke Claude travel zine).
Output ONLY one complete HTML5 document. No markdown.

HARD RULES:
- Inline CSS + optional Google Fonts. No JS/iframes.
- Aesthetic MUST feel specific to the destination (Paris = night Haussmann + champagne gold + serif display; Japan = washi/neon/hinomaru; etc.). Never generic beige brochure.
- Hero: full-bleed photo, DARK overlay, title/meta ALWAYS light (#f7f3ec or similar). Never dark text on photo.
- Prefer landmark photos for hero (not antique maps).
- Sections: hero with traveler chips, boarding-pass tickets, stays, RECEIPT with per-person + group total, day-by-day with photo + activities.
- Prices from snippets only; else "No verificado". Show budget PER PERSON and TOTAL for N travelers.
- Print CSS. Visible language = user locale.`;

export function buildPlanUserPrompt(params: {
  input: TripPlanInput;
  snippets: SearchSnippet[];
  images: GuideImage[];
  consultedAt: string;
}): string {
  const { input, snippets, images, consultedAt } = params;
  const theme = themeForDestination(input.destination);
  const interests = [
    ...input.interests,
    input.interestsNote?.trim() ? `note: ${input.interestsNote.trim()}` : "",
  ]
    .filter(Boolean)
    .join(", ");

  return `Create the destination-themed travel guide HTML for:

ORIGIN: ${input.origin}
DESTINATION: ${input.destination}
DATES: ${dateCopy(input)}
TRAVELERS: ${input.travelers}
LUXURY: ${luxuryCopy(input.luxury)}
TRANSPORT: ${input.transport}
INTERESTS: ${interests || "general sightseeing"}
LOCALE: ${input.locale}
CONSULTED_AT: ${consultedAt}
ART DIRECTION HINT: ${theme.mood}
SUGGESTED PALETTE: bg ${theme.bg}, ink ${theme.ink}, accent ${theme.accent}, paper ${theme.paper}

Include explicit "por persona" and "total grupo (${input.travelers})" in the receipt.

SEARCH SNIPPETS:
${snippets
  .slice(0, 10)
  .map(
    (s, i) =>
      `[${i + 1}] ${s.title}\n${s.url}\n${s.content.slice(0, 420)}`,
  )
  .join("\n\n") || "(none — mark all prices as Unverified)"}

IMAGES (prefer landmarks for hero; keep attribution):
${images
  .slice(0, 6)
  .map(
    (img, i) =>
      `[img${i + 1}] ${img.title}\nURL: ${img.url}\nCredit: ${img.attribution}`,
  )
  .join("\n\n") || "(none — elegant CSS geometric hero)"}`;
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
Palette must be DARK bg + LIGHT ink (readable on photos). Prices from snippets else "No verificado".
budgetPerPerson and budgetTotal required for the traveler count. Locale = user locale.`;

export function buildJsonUserPrompt(params: {
  input: TripPlanInput;
  snippets: SearchSnippet[];
  consultedAt: string;
}): string {
  const { input, snippets, consultedAt } = params;
  const theme = themeForDestination(input.destination);
  return `Trip JSON for ${input.origin} → ${input.destination}.
Dates: ${dateCopy(input)}
Travelers: ${input.travelers}
Luxury ${input.luxury}/5 · transport ${input.transport}
Interests: ${[...input.interests, input.interestsNote].filter(Boolean).join(", ") || "general"}
Locale: ${input.locale}
Consulted: ${consultedAt}
Art mood: ${theme.mood}
Suggested palette: ${JSON.stringify({ bg: theme.bg, ink: theme.ink, accent: theme.accent, paper: theme.paper })}
Compute budgetPerPerson and budgetTotal for ${input.travelers} travelers.
Snippets:
${snippets
  .slice(0, 8)
  .map((s, i) => `[${i + 1}] ${s.title} | ${s.url} | ${s.content.slice(0, 280)}`)
  .join("\n")}`;
}

export const EDIT_SYSTEM_PROMPT = `You edit an existing self-contained travel-guide HTML document.
Return the FULL updated HTML document only.
Preserve destination-specific art direction unless the user asks to restyle.
Keep print CSS and light text on photo heroes. Do not invent precise prices without sources; if the user asks for new price research and none is provided, keep "No verificado".
No scripts. Language of edits must match the guide language.`;

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
