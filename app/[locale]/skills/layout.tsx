import { skillsMetadata } from "@/lib/seo/sections";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return skillsMetadata(locale);
}

export default function SkillsLayout({ children }: Props) {
  return children;
}
