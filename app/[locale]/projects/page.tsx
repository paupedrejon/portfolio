import ProjectCard from "@/components/ProjectCard";
import { projects } from "@/data/projects";




export const metadata = {
title: "Proyectos",
};


export default function ProjectsPage() {
return (
<section className="container py-16">
<h1 className="text-3xl font-bold">Todos los proyectos</h1>
<p className="opacity-80 mt-2">Filtrados por relevancia para el CV.</p>
<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
{projects.map((p) => (
<ProjectCard key={p.slug} project={p} />
))}
</div>
</section>
);
}