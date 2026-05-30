import { getTranslations, setRequestLocale } from "next-intl/server";
import DiplomaPageClient from "@/components/cursos/DiplomaPageClient";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "cursos" });
  return {
    title: `${t("diplomaTitle")} | ${t("reactMetaTitle")}`,
    description: t("reactMetaDescription"),
  };
}

export default async function DiplomaPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <DiplomaPageClient />;
}
