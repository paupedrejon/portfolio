/** Prefijos de ruta sin locale (deben coincidir con middleware.ts). */
export const LOCALE_FREE_PATH_PREFIXES = [
  "/api",
  "/auth",
  "/study-agents",
  "/cursos/react-demo",
] as const;

export function isLocaleFreePath(href: string): boolean {
  return LOCALE_FREE_PATH_PREFIXES.some(
    (prefix) => href === prefix || href.startsWith(`${prefix}/`),
  );
}
