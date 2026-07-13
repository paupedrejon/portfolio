import { getPostsForLocale } from "@/lib/blog/posts";
import { Link } from "@/i18n/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  const { buildPageMetadata } = await import("@/lib/seo/metadata");
  return buildPageMetadata({
    locale,
    pathname: "/blog",
    title: t("metaTitle"),
    description: t("metaDescription"),
    keywords: t.raw("seoKeywords") as string[],
  });
}

export default async function BlogPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "blog" });
  const posts = getPostsForLocale(locale);

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("title")}</h1>
      <p className="mt-3 text-base opacity-80">{t("subtitle")}</p>
      <ul className="mt-10 space-y-6">
        {posts.map((post) => (
          <li key={post.slug} className="border-b border-white/10 pb-6">
            <time className="text-xs uppercase tracking-wider opacity-60" dateTime={post.date}>
              {post.date}
            </time>
            <h2 className="mt-1 text-xl font-semibold">
              <Link href={`/blog/${post.slug}`} className="hover:underline">
                {post.title}
              </Link>
            </h2>
            <p className="mt-2 text-sm leading-relaxed opacity-80">{post.description}</p>
            {post.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs opacity-70"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
      {posts.length === 0 && (
        <p className="mt-8 text-sm opacity-60">{t("empty")}</p>
      )}
    </section>
  );
}
