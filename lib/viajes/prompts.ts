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
  if (input.dateMode === "range" && input.startDate && input.endDate) {
    return `${input.startDate} → ${input.endDate}`;
  }
  if (input.dateMode === "days" && input.days) {
    return `${input.days} days (flexible calendar)`;
  }
  return "Flexible dates — suggest a realistic window";
}

export const GUIDE_SYSTEM_PROMPT = `You are an elite travel art-director + itinerary writer.
You produce ONE complete, self-contained HTML5 document (DOCTYPE + html + head + body) that feels like a premium printed travel guide.

HARD RULES:
- Output ONLY the HTML document. No markdown fences unless wrapping the whole HTML.
- Inline ALL CSS in a <style> block. No external CSS frameworks. You may use Google Fonts <link> if it fits the destination vibe.
- Aesthetic MUST be destination-specific and emotionally attractive (Japan → washi/neon/hinomaru; Paris → Haussmann cream + Eiffel ink; Iceland → glacial blues; Morocco → zellige terracotta, etc.). Invent a coherent palette, display type, and motifs for THIS trip.
- Structure (adapt names to locale/destination):
  1) Full-bleed hero with destination title + trip dates + short poetic line
  2) Boarding-pass / ticket cards for outbound + return transport (or bus)
  3) Route / city hops diagram (simple CSS/HTML, no JS required)
  4) Stay comparison (2–3 lodging options matching luxury level)
  5) Itemized receipt / budget breakdown with ESTIMATED prices
  6) Day-by-day cards (activities + approx price + short tip) with photos when URLs provided
- Prices: use ONLY figures supported by the search snippets. If unknown, write "No verificado" / "Unverified" — NEVER invent precise flight/hotel prices.
- Mark every money figure as estimado / estimate. Include a small disclaimer footer: prices are indicative, not bookable quotes; consulted date provided.
- Use the provided Wikimedia image URLs with <img> and visible attribution captions.
- Responsive but print-friendly: include @media print { ... } that removes interactive chrome, uses white backgrounds if needed, and paginates cleanly.
- No scripts, no iframes, no external trackers. Pure HTML+CSS.
- Language of all visible copy: match the user locale (es / en / it).`;

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
  .map(
    (s, i) =>
      `[${i + 1}] Q="${s.query}"\nTitle: ${s.title}\nURL: ${s.url}\n${s.content}`,
  )
  .join("\n\n") || "(none — mark all prices as Unverified)"}

IMAGES (use several; keep attribution):
${images
  .map(
    (img, i) =>
      `[img${i + 1}] ${img.title}\nURL: ${img.url}\nCredit: ${img.attribution}`,
  )
  .join("\n\n") || "(none — use elegant CSS geometric hero instead)"}

Make it feel as crafted as a bespoke agency proposal for THIS destination.`;
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
