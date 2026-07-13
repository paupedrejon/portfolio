import HomePage from "@/components/home/HomePage";
import JsonLd from "@/components/seo/JsonLd";
import { personSchema, profilePageSchema, websiteSchema } from "@/lib/seo/json-ld";
import { homeMetadata } from "@/lib/seo/sections";
import { getTranslations, setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return homeMetadata(locale);
}

export default async function LocaleHomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "home" });

  const person = personSchema({
    name: t("title"),
    description: t("seoDescription"),
    locale,
    jobTitle: t("seoJobTitle"),
    knowsAbout: t.raw("seoKnowsAbout") as string[],
  });
  const website = websiteSchema({
    name: t("title"),
    description: t("seoDescription"),
    locale,
  });
  const profilePage = profilePageSchema(person);

  return (
    <>
      <JsonLd data={[profilePage, person, website]} />
      <div className="sr-only">
        <h1>{t("seoTitle")}</h1>
        <p>{t("seoDescription")}</p>
        <nav aria-label="Secciones principales">
          <a href={`/${locale}/proyectos`}>Proyectos</a>
          <a href={`/${locale}/skills`}>Skills</a>
          <a href={`/${locale}/experience`}>Experiencia</a>
          <a href={`/${locale}/blog`}>Blog</a>
          <a href={`/${locale}/contact`}>Contacto</a>
        </nav>
      </div>
      <HomePage />
    </>
  );
}
