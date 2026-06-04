import { projectsMetadata } from "@/lib/seo/sections";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return projectsMetadata(locale);
}

export default function ProyectosLayout({ children }: Props) {
  return children;
}
