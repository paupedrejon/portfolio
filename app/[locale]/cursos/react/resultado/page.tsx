import { getTranslations, setRequestLocale } from "next-intl/server";
import ReactCourseResultClient from "@/components/cursos/ReactCourseResultClient";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "cursos" });
  return {
    title: `${t("finalResultTitle")} | ${t("reactMetaTitle")}`,
    description: t("finalResultSubtitle"),
  };
}

export default async function ReactCourseResultPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ReactCourseResultClient />;
}
