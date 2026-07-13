import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { routing } from "@/i18n/routing";
import { localizedUrl } from "@/lib/seo/paths";
import { SITE_URL } from "@/lib/seo/config";

export type BlogPost = {
  slug: string;
  locale: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  ogTitle?: string;
  content: string;
  url: string;
};

const CONTENT_DIR = path.join(process.cwd(), "content", "blog");

function postFilePath(locale: string, slug: string): string {
  return path.join(CONTENT_DIR, locale, `${slug}.md`);
}

export function getAllPostSlugs(): { locale: string; slug: string }[] {
  const slugs: { locale: string; slug: string }[] = [];
  for (const locale of routing.locales) {
    const dir = path.join(CONTENT_DIR, locale);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (file.endsWith(".md")) {
        slugs.push({ locale, slug: file.replace(/\.md$/, "") });
      }
    }
  }
  return slugs;
}

export function getPostBySlug(locale: string, slug: string): BlogPost | null {
  const filePath = postFilePath(locale, slug);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  return {
    slug,
    locale,
    title: String(data.title ?? slug),
    description: String(data.description ?? ""),
    date: String(data.date ?? new Date().toISOString().slice(0, 10)),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    ogTitle: data.ogTitle ? String(data.ogTitle) : undefined,
    content,
    url: localizedUrl(locale, `/blog/${slug}`),
  };
}

export function getPostsForLocale(locale: string): BlogPost[] {
  const dir = path.join(CONTENT_DIR, locale);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => getPostBySlug(locale, f.replace(/\.md$/, ""))!)
    .filter(Boolean)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function buildRssFeed(): string {
  const items: string[] = [];
  for (const locale of routing.locales) {
    for (const post of getPostsForLocale(locale)) {
      items.push(`
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${post.url}</link>
      <guid isPermaLink="true">${post.url}</guid>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <description><![CDATA[${post.description}]]></description>
    </item>`);
    }
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Pau Pedrejon — Blog</title>
    <link>${SITE_URL}/es/blog</link>
    <description>Artículos sobre desarrollo full-stack, IA y proyectos reales.</description>
    <language>es</language>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
    ${items.join("\n")}
  </channel>
</rss>`;
}
