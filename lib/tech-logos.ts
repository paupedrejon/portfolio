/**
 * Map technology names to Simple Icons slugs for logo display.
 * CDN: https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/{slug}.svg
 * Fallback to text when slug not found.
 */
const TECH_TO_SLUG: Record<string, string> = {
  "next.js": "nextdotjs",
  "nextjs": "nextdotjs",
  "react": "react",
  "typescript": "typescript",
  "ts": "typescript",
  "python": "python",
  "fastapi": "fastapi",
  "langchain": "langchain",
  "tailwind": "tailwindcss",
  "tailwindcss": "tailwindcss",
  "vercel": "vercel",
  "unreal engine": "unrealengine",
  "unreal engine vr": "unrealengine",
  "blender": "blender",
  "c++": "cplusplus",
  "cpp": "cplusplus",
  "c": "c",
  "git": "git",
  "unity": "unity",
  "proteus": "proteus",
  "freecad": "freecad",
  "arduino": "arduino",
};

/** Light color for dark backgrounds (slate-300) */
const ICON_COLOR = "94a3b8";
const ICONS_CDN = "https://cdn.simpleicons.org";

/**
 * Get Simple Icons slug for a technology name, or null if not found.
 */
export function getTechLogoSlug(techName: string): string | null {
  const normalized = techName.toLowerCase().trim();
  return TECH_TO_SLUG[normalized] ?? null;
}

/**
 * Get CDN URL for a tech logo, or null if no icon exists.
 * Uses cdn.simpleicons.org for color control on dark themes.
 */
export function getTechLogoUrl(techName: string, color = ICON_COLOR): string | null {
  const slug = getTechLogoSlug(techName);
  if (!slug) return null;
  return `${ICONS_CDN}/${slug}/${color}`;
}
