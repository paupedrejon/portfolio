import { educationMetadata } from "@/lib/seo/sections";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return educationMetadata(locale);
}

export default function EducationLayout({ children }: Props) {
  return children;
}
