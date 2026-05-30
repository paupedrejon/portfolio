import { getTranslations, setRequestLocale } from "next-intl/server";
import ReactCourseMapClient from "@/components/cursos/ReactCourseMapClient";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "cursos" });
  return {
    title: `${t("levelsTitle")} | ${t("reactMetaTitle")}`,
  };
}

export default async function ReactCourseMapPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ReactCourseMapClient />;
}
