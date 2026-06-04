import type { MetadataRoute } from "next";
import { buildSitemapEntries } from "@/lib/seo/paths";

export default function sitemap(): MetadataRoute.Sitemap {
  return buildSitemapEntries().map(({ url, lastModified }) => ({
    url,
    lastModified,
    changeFrequency: "monthly",
    priority: url.endsWith("/study-agents") ? 0.9 : url.match(/\/proyectos\/[^/]+$/) ? 0.8 : 0.7,
  }));
}
