import { SITE_URL } from "./config";

type OgImageParams = {
  title?: string;
  subtitle?: string;
};

export function buildOgImageUrl(params: OgImageParams = {}): string {
  const url = new URL("/api/og", SITE_URL);
  if (params.title) url.searchParams.set("title", params.title);
  if (params.subtitle) url.searchParams.set("subtitle", params.subtitle);
  return url.toString();
}

/** OG por defecto (home / páginas sin título custom). */
export const DEFAULT_OG_IMAGE_URL = buildOgImageUrl({
  title: "Pau Pedrejon",
  subtitle: "Full-Stack Developer & AI Engineer",
});
