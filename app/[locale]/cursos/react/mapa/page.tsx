import { getTranslations, setRequestLocale } from "next-intl/server";
import ReactCourseMapClient from "@/components/cursos/ReactCourseMapClient";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "cursos" });
  const { buildPageMetadata } = await import("@/lib/seo/metadata");
  return buildPageMetadata({
    locale,
    pathname: "/cursos/react/mapa",
    title: `${t("levelsTitle")} | ${t("reactMetaTitle")}`,
    description: t("reactMetaDescription"),
  });
}

export default async function ReactCourseMapPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ReactCourseMapClient />;
}
