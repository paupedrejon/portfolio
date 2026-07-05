import { routing } from "@/i18n/routing";
import { getVisibleProjects } from "@/lib/projects/config";
import { getLevelIds } from "@/lib/cursos/levels";
import { SITE_URL } from "./config";

/** Rutas públicas indexables (sin prefijo de locale). */
export const LOCALIZED_STATIC_PATHS = [
  "",
  "/proyectos",
  "/skills",
  "/experience",
  "/education",
  "/about-me",
  "/contact",
  "/ego",
  "/cursos",
  "/cursos/react",
  "/cursos/react/mapa",
  "/cursos/react/diploma",
  "/cursos/react/resultado",
  "/labs",
  "/labs/minecraft",
  "/projects",
] as const;

export function localizedUrl(locale: string, pathname: string): string {
  const normalized = pathname === "" ? "" : pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (!normalized) return `${SITE_URL}/${locale}`;
  return `${SITE_URL}/${locale}${normalized}`;
}

export function buildSitemapEntries(): { url: string; lastModified?: Date }[] {
  const lastModified = new Date();
  const entries: { url: string; lastModified: Date }[] = [];

  for (const locale of routing.locales) {
    for (const path of LOCALIZED_STATIC_PATHS) {
      entries.push({ url: localizedUrl(locale, path), lastModified });
    }
    for (const { slug } of getVisibleProjects()) {
      entries.push({
        url: localizedUrl(locale, `/proyectos/${slug}`),
        lastModified,
      });
    }
    for (const levelId of getLevelIds()) {
      entries.push({
        url: localizedUrl(locale, `/cursos/react/nivel/${levelId}`),
        lastModified,
      });
    }
  }

  entries.push({ url: `${SITE_URL}/study-agents`, lastModified });

  return entries;
}
