import { projects } from "../data/projects.js";
import ProjectCard from "./ProjectCard.jsx";

export default function Projects() {
  return (
    <section id="projects" className="px-4 md:px-6 py-16 max-w-5xl mx-auto section-anchor">
      <h2 className="text-3xl font-bold mb-8 text-white">Proyectos</h2>
      <div className="grid gap-4 md:grid-cols-2" data-testid="projects-grid">
        {projects.map((p) => (
          <ProjectCard
            key={p.id}
            title={p.title}
            description={p.description}
            image={p.image}
            imageAlt={p.imageAlt}
            tech={p.tech}
          />
        ))}
      </div>
    </section>
  );
}
