import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/seo/metadata";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "privacy" });
  return buildPageMetadata({
    locale,
    pathname: "/privacy",
    title: `${t("title")} — Pau Pedrejon`,
    description: t("tagline"),
    noIndex: false,
  });
}

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
