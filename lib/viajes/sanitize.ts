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
  return out.trim();
}
