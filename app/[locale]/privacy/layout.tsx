import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("privacy");
  return {
    title: `${t("title")} — Pau Pedrejon`,
    description: t("tagline"),
  };
}

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
