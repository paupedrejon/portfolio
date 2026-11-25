import type { SearchSnippet } from "./types";

/** Pull concrete € amounts from search snippets for the model to cite — not invent. */
export function extractPriceFacts(snippets: SearchSnippet[]): string[] {
  const facts: string[] = [];
  const seen = new Set<string>();

  for (const s of snippets) {
    const blob = `${s.title} ${s.content}`;
    const amounts = blob.match(
      /(?:€\s?\d{1,3}(?:[.\s]\d{3})*(?:,\d{1,2})?|\d{1,3}(?:[.\s]\d{3})*(?:,\d{1,2})?\s?€|\d{2,5}\s?(?:EUR|eur))/g,
    );
    if (!amounts?.length) continue;

    for (const raw of amounts.slice(0, 3)) {
      const key = `${raw}|${s.url}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const domain = (() => {
        try {
          return new URL(s.url).hostname.replace(/^www\./, "");
        } catch {
          return s.url.slice(0, 40);
        }
      })();
      facts.push(
        `${raw.trim()} · ${domain} · «${s.title.slice(0, 80)}» · ${s.url}`,
      );
      if (facts.length >= 24) return facts;
    }
  }
  return facts;
}
