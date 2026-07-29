import TealCodeDownloadClient from "@/components/tealcode/TealCodeDownloadClient";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getTranslations, setRequestLocale } from "next-intl/server";
import "./tealcode-download.css";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "tealcodePage" });
  return buildPageMetadata({
    locale,
    pathname: "/tealcode",
    title: `${t("title")} | Pau Pedrejon`,
    description: t("subtitle"),
    ogTitle: t("title"),
    ogSubtitle: t("subtitle"),
  });
}

export default async function TealCodeDownloadPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("tealcodePage");

  return (
    <TealCodeDownloadClient
      title={t("title")}
      subtitle={t("subtitle")}
      backLabel={t("backLabel")}
      installerTitle={t("installerTitle")}
      installerDesc={t("installerDesc")}
      installerCta={t("installerCta")}
      installerPending={t("installerPending")}
      devTitle={t("devTitle")}
      sourceCta={t("sourceCta")}
      afterInstallTitle={t("afterInstallTitle")}
      afterInstallSteps={t.raw("afterInstallSteps") as string[]}
    />
  );
}
