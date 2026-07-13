import { routing } from "@/i18n/routing";

/** Rutas internas (filesystem) → segmento público por locale. */
const LOCALIZED_SEGMENTS: Record<string, Record<string, string>> = {
  "/proyectos": {
    es: "/proyectos",
    en: "/projects",
    it: "/progetti",
  },
};

function isLocale(value: string): value is (typeof routing.locales)[number] {
  return routing.locales.includes(value as (typeof routing.locales)[number]);
}

/**
 * Convierte una ruta interna (p. ej. `/proyectos/foo`) a la URL pública del locale
 * (p. ej. `/projects/foo` en inglés).
 */
export function localizePathname(locale: string, pathname: string): string {
  const loc = isLocale(locale) ? locale : routing.defaultLocale;
  const normalized =
    pathname === "" || pathname === "/"
      ? "/"
      : pathname.startsWith("/")
        ? pathname
        : `/${pathname}`;

  for (const [internalPrefix, byLocale] of Object.entries(LOCALIZED_SEGMENTS)) {
    const localizedPrefix = byLocale[loc] ?? internalPrefix;
    if (normalized === internalPrefix) return localizedPrefix;
    if (normalized.startsWith(`${internalPrefix}/`)) {
      return normalized.replace(internalPrefix, localizedPrefix);
    }
  }

  return normalized;
}

/** Ruta completa con prefijo de locale: `/es/proyectos`, `/en/projects`, etc. */
export function localePathname(locale: string, pathname: string): string {
  const localized = localizePathname(locale, pathname);
  if (localized === "/") return `/${locale}`;
  return `/${locale}${localized}`;
}
