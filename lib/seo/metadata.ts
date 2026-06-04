import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import {
  DEFAULT_OG_IMAGE,
  SITE_NAME,
  SITE_URL,
  TWITTER_HANDLE,
} from "./config";

export type PageMetadataInput = {
  locale: string;
  /** Ruta sin prefijo de idioma, p. ej. `/proyectos` o `/` para inicio */
  pathname: string;
  title: string;
  description: string;
  image?: string;
  noIndex?: boolean;
};

function resolveImageUrl(image: string): string {
  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }
  const path = image.startsWith("/") ? image : `/${image}`;
  return `${SITE_URL}${path}`;
}

function localePath(locale: string, pathname: string): string {
  const normalized = pathname === "/" || pathname === "" ? "" : pathname;
  if (!normalized) return `/${locale}`;
  const withSlash = normalized.startsWith("/") ? normalized : `/${normalized}`;
  return `/${locale}${withSlash}`;
}

export function buildPageMetadata({
  locale,
  pathname,
  title,
  description,
  image = DEFAULT_OG_IMAGE,
  noIndex = false,
}: PageMetadataInput): Metadata {
  const pathKey = pathname === "" ? "/" : pathname.startsWith("/") ? pathname : `/${pathname}`;
  const canonical = `${SITE_URL}${localePath(locale, pathKey)}`;
  const imageUrl = resolveImageUrl(image);

  const languages: Record<string, string> = {};
  for (const loc of routing.locales) {
    languages[loc] = `${SITE_URL}${localePath(loc, pathKey)}`;
  }
  languages["x-default"] = `${SITE_URL}${localePath(routing.defaultLocale, pathKey)}`;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages,
    },
    openGraph: {
      type: "website",
      locale: locale === "es" ? "es_ES" : locale === "it" ? "it_IT" : "en_US",
      url: canonical,
      siteName: SITE_NAME,
      title,
      description,
      images: [{ url: imageUrl, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
      creator: TWITTER_HANDLE,
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}
