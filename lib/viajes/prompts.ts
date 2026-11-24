import type { GuideImage, SearchSnippet, TripPlanInput } from "./types";

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

export const GUIDE_SYSTEM_PROMPT = `Elite travel art-director. Output ONLY one complete HTML5 document (no markdown).

Rules:
- Inline CSS in <style>. Optional Google Fonts <link>. No JS/iframes.
- Destination-specific aesthetic (Japan washi/neon; Paris Haussmann cream; etc.).
- Sections: hero, transport tickets, route, 2–3 stays, budget receipt, day-by-day cards with photos if URLs given.
- Prices only from snippets; else "No verificado". Mark as estimado. Footer disclaimer + consulted date.
- Print CSS (@media print). Locale of visible text = user locale.`;

export function buildPlanUserPrompt(params: {
  input: TripPlanInput;
  snippets: SearchSnippet[];
  images: GuideImage[];
  consultedAt: string;
}): string {
  const { input, snippets, images, consultedAt } = params;
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
LUXURY: ${luxuryCopy(input.luxury)}
TRANSPORT PREFERENCE: ${input.transport}
INTERESTS: ${interests || "general sightseeing"}
LOCALE: ${input.locale}
CONSULTED_AT: ${consultedAt}

SEARCH SNIPPETS (cite URLs in a sources strip or footnotes):
${snippets
  .slice(0, 10)
  .map(
    (s, i) =>
      `[${i + 1}] ${s.title}\n${s.url}\n${s.content.slice(0, 420)}`,
  )
  .join("\n\n") || "(none — mark all prices as Unverified)"}

IMAGES (use several; keep attribution):
${images
  .slice(0, 6)
  .map(
    (img, i) =>
      `[img${i + 1}] ${img.title}\nURL: ${img.url}\nCredit: ${img.attribution}`,
  )
  .join("\n\n") || "(none — use elegant CSS geometric hero instead)"}

Make it feel as crafted as a bespoke agency proposal for THIS destination.`;
}

export const JSON_SYSTEM_PROMPT = `You are a travel planner. Return ONLY valid JSON (no markdown) matching:
{
  "title": string,
  "tagline": string,
  "palette": {"bg":"#hex","ink":"#hex","accent":"#hex","paper":"#hex"},
  "transport": {"outbound": string, "inbound": string, "note"?: string},
  "stays": [{"name": string, "price"?: string, "vibe"?: string}],
  "budget": [{"label": string, "amount": string}],
  "days": [{"title": string, "summary"?: string, "activities": [{"name": string, "price"?: string, "tip"?: string}]}],
  "disclaimer"?: string
}
Prices only from snippets; else "No verificado". Palette must evoke the destination. Locale of strings = user locale.`;

export function buildJsonUserPrompt(params: {
  input: import("./types").TripPlanInput;
  snippets: import("./types").SearchSnippet[];
  consultedAt: string;
}): string {
  const { input, snippets, consultedAt } = params;
  return `Trip JSON for ${input.origin} → ${input.destination}.
Dates: ${input.dateMode === "exact" ? `${input.startDate}–${input.endDate}` : `${input.flexibleMonth} ${input.daysMin}-${input.daysMax} days`}
Luxury ${input.luxury}/5 · transport ${input.transport}
Interests: ${[...input.interests, input.interestsNote].filter(Boolean).join(", ") || "general"}
Locale: ${input.locale}
Consulted: ${consultedAt}
Snippets:
${snippets
  .slice(0, 8)
  .map((s, i) => `[${i + 1}] ${s.title} | ${s.url} | ${s.content.slice(0, 280)}`)
  .join("\n")}`;
}

export const EDIT_SYSTEM_PROMPT = `You edit an existing self-contained travel-guide HTML document.
Return the FULL updated HTML document only.
Preserve destination-specific art direction unless the user asks to restyle.
Keep print CSS. Do not invent precise prices without sources; if the user asks for new price research and none is provided, keep "No verificado".
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
