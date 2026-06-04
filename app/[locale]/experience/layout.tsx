import { experienceMetadata } from "@/lib/seo/sections";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return experienceMetadata(locale);
}

export default function ExperienceLayout({ children }: Props) {
  return children;
}
