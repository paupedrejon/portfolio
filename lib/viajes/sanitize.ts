/** Server-safe HTML sanitizer for guide documents (no DOM required). */

const EMOJI_RE =
  /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}\u{1F1E0}-\u{1F1FF}]/gu;

export function stripGuideEmojis(html: string): string {
  return html.replace(EMOJI_RE, "");
}

/** True when the guide looks complete enough to ship (not truncated / half-baked). */
export function isGuideComplete(
  html: string,
  opts?: { minStays?: number },
): boolean {
  if (!html || html.length < 4000) return false;
  if (!/<\/html>/i.test(html)) return false;
  if (!/<html[\s>]/i.test(html)) return false;

  const stayCards = (
    html.match(/class=["'][^"']*(?:stay-card|stay)\b/gi) || []
  ).length;
  const hasReceipt =
    /class=["'][^"']*receipt/i.test(html) ||
    /id=["'](?:presupuesto|receipt|budget)/i.test(html) ||
    /Presupuesto|RECIBO|Recibo/i.test(html);
  const hasTicket =
    /class=["'][^"']*(?:ticket|boarding-pass|pass)\b/i.test(html);
  const truncatedMidTag = /class=["'][^"']*&lt;|act-desc&lt;/i.test(html);
  const singleCountryStay =
    /Estancia Completa|Country\s*&\s*City|Pack \d+ Noches|Jap[oó]n Estancia/i.test(
      html,
    ) && stayCards < 2;

  const minStays = opts?.minStays ?? 1;
  if (stayCards < minStays) return false;
  if (!hasReceipt) return false;
  if (!hasTicket) return false;
  if (truncatedMidTag) return false;
  if (singleCountryStay) return false;
  return true;
}

export function sanitizeGuideHtml(html: string): string {
  let out = html;
  // Strip scripts and event handlers
  out = out.replace(/<script\b[\s\S]*?<\/script>/gi, "");
  out = out.replace(/<iframe\b[\s\S]*?<\/iframe>/gi, "");
  out = out.replace(/<object\b[\s\S]*?<\/object>/gi, "");
  out = out.replace(/<embed\b[^>]*>/gi, "");
  out = out.replace(/\son\w+\s*=\s*(['"]).*?\1/gi, "");
  out = out.replace(/\son\w+\s*=\s*[^\s>]+/gi, "");
  out = out.replace(/javascript:/gi, "");
  out = out.replace(
    /<meta[^>]+http-equiv\s*=\s*['"]?refresh['"]?[^>]*>/gi,
    "",
  );
  out = out.replace(
    /url\((['"]?)https?:\/\/[^)"']+\.pdf[^)"']*\1\)/gi,
    "none",
  );
  out = out.replace(
    /<img\b[^>]+src=["'][^"']+\.pdf[^"']*["'][^>]*>/gi,
    "",
  );
  out = out.replace(
    /url\((['"]?)https?:\/\/upload\.wikimedia\.org\/[^)"']*\/page\d+-[^)"']*\1\)/gi,
    "none",
  );
  out = out.replace(
    /<img\b[^>]+src=["'][^"']*(?:title.?page|pictorial_representation|austriae|lingayen|moscow_arbat|IA_dr_)[^"']*["'][^>]*>/gi,
    "",
  );
  out = stripGuideEmojis(out);
  return out.trim();
}
