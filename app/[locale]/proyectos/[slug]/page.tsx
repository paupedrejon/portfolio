import ProjectDetailView from "@/components/projects/ProjectDetailView";
import { isProjectSlug, PROJECTS_CONFIG } from "@/lib/projects/config";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ slug: string; locale: string }>;
};

export function generateStaticParams() {
  return PROJECTS_CONFIG.map((project) => ({ slug: project.slug }));
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { slug } = await params;

  if (!isProjectSlug(slug)) {
    notFound();
  }

  return <ProjectDetailView slug={slug} />;
}
