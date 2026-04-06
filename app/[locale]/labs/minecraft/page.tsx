import { getTranslations, setRequestLocale } from "next-intl/server";
import MinecraftSandbox from "@/components/labs/minecraft/MinecraftSandbox";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "minecraft" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function MinecraftPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <MinecraftSandbox />;
}
