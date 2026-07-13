import { buildRssFeed } from "@/lib/blog/posts";

export async function GET() {
  const feed = buildRssFeed();
  return new Response(feed, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}
