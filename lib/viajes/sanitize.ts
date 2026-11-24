/** Server-safe HTML sanitizer for guide documents (no DOM required). */
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
  // Block meta refresh tricks
  out = out.replace(
    /<meta[^>]+http-equiv\s*=\s*['"]?refresh['"]?[^>]*>/gi,
    "",
  );
  // Drop broken / non-photo commons assets (PDFs as "images", page previews…)
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
  return out.trim();
}
