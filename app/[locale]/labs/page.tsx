import { getTranslations, setRequestLocale } from "next-intl/server";
import LabsLanding from "@/components/labs/LabsLanding";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "labs" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function LabsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LabsLanding />;
}
