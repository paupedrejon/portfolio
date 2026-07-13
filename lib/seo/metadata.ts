import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import {
  DEFAULT_OG_IMAGE,
  SITE_NAME,
  SITE_URL,
  TWITTER_HANDLE,
} from "./config";
import { localePathname } from "./localized-paths";
import { buildOgImageUrl } from "./og-image";

export type PageMetadataInput = {
  locale: string;
  /** Ruta sin prefijo de idioma, p. ej. `/proyectos` o `/` para inicio */
  pathname: string;
  title: string;
  description: string;
  image?: string;
  noIndex?: boolean;
  keywords?: string[];
  /** Si true, genera OG dinámica con title como título de la imagen */
  ogTitle?: string;
  ogSubtitle?: string;
};

function resolveImageUrl(image: string): string {
  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }
  if (image.startsWith("/api/og")) {
    return `${SITE_URL}${image}`;
  }
  const path = image.startsWith("/") ? image : `/${image}`;
  return `${SITE_URL}${path}`;
}

function resolveOgImage(input: PageMetadataInput): string {
  if (input.ogTitle || input.ogSubtitle) {
    return buildOgImageUrl({
      title: input.ogTitle ?? input.title,
      subtitle: input.ogSubtitle ?? input.description.slice(0, 120),
    });
  }
  if (input.image && input.image !== DEFAULT_OG_IMAGE) {
    return resolveImageUrl(input.image);
  }
  return buildOgImageUrl({
    title: input.title.slice(0, 80),
    subtitle: input.description.slice(0, 120),
  });
}

export function buildPageMetadata({
  locale,
  pathname,
  title,
  description,
  image = DEFAULT_OG_IMAGE,
  noIndex = false,
  keywords,
  ogTitle,
  ogSubtitle,
}: PageMetadataInput): Metadata {
  const pathKey =
    pathname === "" ? "/" : pathname.startsWith("/") ? pathname : `/${pathname}`;
  const canonical = `${SITE_URL}${localePathname(locale, pathKey)}`;
  const imageUrl = resolveOgImage({
    locale,
    pathname,
    title,
    description,
    image,
    ogTitle,
    ogSubtitle,
  });

  const languages: Record<string, string> = {};
  for (const loc of routing.locales) {
    languages[loc] = `${SITE_URL}${localePathname(loc, pathKey)}`;
  }
  languages["x-default"] =
    `${SITE_URL}${localePathname(routing.defaultLocale, pathKey)}`;

  return {
    title,
    description,
    ...(keywords?.length ? { keywords } : {}),
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
      images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
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

/** Metadata para rutas sin i18n (study-agents, etc.) */
export function buildStaticMetadata(input: {
  pathname: string;
  title: string;
  description: string;
  noIndex?: boolean;
  ogTitle?: string;
  ogSubtitle?: string;
}): Metadata {
  const canonical = `${SITE_URL}${input.pathname.startsWith("/") ? input.pathname : `/${input.pathname}`}`;
  const imageUrl = buildOgImageUrl({
    title: input.ogTitle ?? input.title,
    subtitle: input.ogSubtitle ?? input.description.slice(0, 120),
  });

  return {
    title: input.title,
    description: input.description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      url: canonical,
      siteName: SITE_NAME,
      title: input.title,
      description: input.description,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: input.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [imageUrl],
      creator: TWITTER_HANDLE,
    },
    robots: input.noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}
