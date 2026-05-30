import { getTranslations, setRequestLocale } from "next-intl/server";
import CursosLanding from "@/components/cursos/CursosLanding";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "cursos" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function CursosPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <CursosLanding />;
}
