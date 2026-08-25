import { getPostsForLocale } from "@/lib/blog/posts";
import { Link } from "@/i18n/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import "./blog.css";

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
    <section className="blog-page">
      <div className="blog-page__inner">
        <h1 className="blog-list-title">{t("title")}</h1>
        <p className="blog-list-subtitle">{t("subtitle")}</p>
        <ul className="blog-posts">
          {posts.map((post) => (
            <li key={post.slug} className="blog-post-card">
              <time className="blog-date" dateTime={post.date}>
                {post.date}
              </time>
              <h2 className="blog-post-card__title">
                <Link href={`/blog/${post.slug}`}>{post.title}</Link>
              </h2>
              <p className="blog-post-card__desc">{post.description}</p>
              {post.tags.length > 0 && (
                <div className="blog-tags">
                  {post.tags.map((tag) => (
                    <span key={tag} className="blog-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
        {posts.length === 0 && <p className="blog-empty">{t("empty")}</p>}
      </div>
    </section>
  );
}
