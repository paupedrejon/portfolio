import { egoPageMetadata } from "@/lib/seo/sections";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return egoPageMetadata(locale);
}

export default function EgoLayout({ children }: Props) {
  return children;
}
