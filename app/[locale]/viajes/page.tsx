import { getTranslations, setRequestLocale } from "next-intl/server";
import ViajesClient from "./ViajesClient";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "viajes" });
  const { buildPageMetadata } = await import("@/lib/seo/metadata");
  return buildPageMetadata({
    locale,
    pathname: "/viajes",
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

export default async function ViajesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ViajesClient />;
}
