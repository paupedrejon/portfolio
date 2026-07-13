import { contactMetadata } from "@/lib/seo/sections";
import FaqSection from "@/components/seo/FaqSection";
import { getTranslations } from "next-intl/server";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return contactMetadata(locale);
}

export default async function ContactLayout({ children, params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });
  const faqItems = t.raw("faq") as { question: string; answer: string }[];

  return (
    <>
      {children}
      <div className="mx-auto w-full max-w-3xl px-4 pb-20 sm:px-6">
        <FaqSection
          title={t("faqTitle")}
          items={faqItems}
          className="rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8"
        />
      </div>
    </>
  );
}
