import TealCodeDownloadClient from "@/components/tealcode/TealCodeDownloadClient";
import { getTranslations } from "next-intl/server";
import "./tealcode-download.css";

export default async function TealCodeDownloadPage() {
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
