import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getAllPostSlugs, getPostBySlug } from "@/lib/blog/posts";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";
import JsonLd from "@/components/seo/JsonLd";
import { blogPostingSchema } from "@/lib/seo/json-ld";
import { localizedUrl } from "@/lib/seo/paths";
import { SITE_NAME } from "@/lib/seo/config";
import { buildOgImageUrl } from "@/lib/seo/og-image";
import { Link } from "@/i18n/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import "../blog.css";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export function generateStaticParams() {
  return getAllPostSlugs();
}

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  const post = getPostBySlug(locale, slug);
  if (!post) return {};
  const { buildPageMetadata } = await import("@/lib/seo/metadata");
  return buildPageMetadata({
    locale,
    pathname: `/blog/${slug}`,
    title: `${post.title} | Pau Pedrejon`,
    description: post.description,
    ogTitle: post.ogTitle ?? post.title,
    ogSubtitle: post.description.slice(0, 120),
    keywords: post.tags,
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const post = getPostBySlug(locale, slug);
  if (!post) notFound();

  const t = await getTranslations({ locale, namespace: "blog" });
  const homeUrl = localizedUrl(locale, "/");
  const blogUrl = localizedUrl(locale, "/blog");

  const schema = blogPostingSchema({
    title: post.title,
    description: post.description,
    url: post.url,
    datePublished: post.date,
    image: buildOgImageUrl({ title: post.title, subtitle: post.description.slice(0, 120) }),
    tags: post.tags,
  });

  return (
    <article className="blog-page">
      <div className="blog-page__inner">
        <BreadcrumbJsonLd
          items={[
            { name: SITE_NAME, url: homeUrl },
            { name: t("title"), url: blogUrl },
            { name: post.title, url: post.url },
          ]}
        />
        <JsonLd data={schema} />
        <Link href="/blog" className="blog-back">
          ← {t("backToList")}
        </Link>
        <header className="blog-header">
          <time className="blog-date" dateTime={post.date}>
            {post.date}
          </time>
          <h1 className="blog-title">{post.title}</h1>
          <p className="blog-lead">{post.description}</p>
        </header>
        <div className="blog-prose">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
        </div>
      </div>
    </article>
  );
}
