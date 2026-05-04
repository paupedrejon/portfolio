import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ locale: string }>;
};

/** Ruta antigua: la presentación vive en `/[locale]/ego`. */
export default async function LegacyEgoLabRedirect({ params }: Props) {
  const { locale } = await params;
  redirect(`/${locale}/ego`);
}
