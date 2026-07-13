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
    <article className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
      <BreadcrumbJsonLd
        items={[
          { name: SITE_NAME, url: homeUrl },
          { name: t("title"), url: blogUrl },
          { name: post.title, url: post.url },
        ]}
      />
      <JsonLd data={schema} />
      <Link
        href="/blog"
        className="text-sm opacity-70 hover:opacity-100 hover:underline"
      >
        ← {t("backToList")}
      </Link>
      <header className="mt-6">
        <time className="text-xs uppercase tracking-wider opacity-60" dateTime={post.date}>
          {post.date}
        </time>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{post.title}</h1>
        <p className="mt-3 text-base opacity-80">{post.description}</p>
      </header>
      <div className="prose prose-invert mt-10 max-w-none text-sm leading-relaxed sm:text-base">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
      </div>
    </article>
  );
}
