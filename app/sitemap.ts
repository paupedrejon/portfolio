import type { MetadataRoute } from "next";
import { buildSitemapEntries } from "@/lib/seo/paths";

function sitemapPriority(url: string): number {
  if (url.match(/\/(es|en|it)\/?$/)) return 1;
  if (url.includes("/experience") || url.includes("/contact") || url.includes("/skills")) {
    return 0.95;
  }
  if (url.includes("/proyectos") && !url.match(/\/proyectos\/[^/]+$/)) return 0.9;
  if (url.match(/\/proyectos\/[^/]+$/)) return 0.85;
  if (url.includes("/about-me") || url.includes("/education")) return 0.8;
  if (url.includes("/privacy")) return 0.5;
  if (url.endsWith("/study-agents")) return 0.7;
  return 0.65;
}

export default function sitemap(): MetadataRoute.Sitemap {
  return buildSitemapEntries().map(({ url, lastModified }) => ({
    url,
    lastModified,
    changeFrequency: "monthly",
    priority: sitemapPriority(url),
  }));
}
