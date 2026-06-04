import { contactMetadata } from "@/lib/seo/sections";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return contactMetadata(locale);
}

export default function ContactLayout({ children }: Props) {
  return children;
}
