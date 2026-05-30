import { getTranslations, setRequestLocale } from "next-intl/server";
import ReactCourseClient from "@/components/cursos/ReactCourseClient";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "cursos" });
  return {
    title: t("reactMetaTitle"),
    description: t("reactMetaDescription"),
  };
}

export default async function ReactCoursePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ReactCourseClient />;
}
