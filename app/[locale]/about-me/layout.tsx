import { aboutMetadata } from "@/lib/seo/sections";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return aboutMetadata(locale);
}

export default function AboutMeLayout({ children }: Props) {
  return children;
}
