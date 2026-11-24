import { contactMetadata } from "@/lib/seo/sections";
import FaqSection from "@/components/seo/FaqSection";
import { getTranslations } from "next-intl/server";
import "./contact.css";

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
      <div className="contact-faq-wrap">
        <FaqSection title={t("faqTitle")} items={faqItems} />
      </div>
    </>
  );
}
