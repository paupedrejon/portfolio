import ProjectCard from "./ProjectCard.jsx";
import useFetch from "../hooks/useFetch.js";
import { getExtraProjects } from "../lib/projectsStore.js";

export default function Projects({ onOpenProject }) {
  const { data: base, loading, error } = useFetch("/projects.json");
  const extras = getExtraProjects();
  const projects = base ? [...base, ...extras] : extras;

  return (
    <section id="projects" className="px-4 md:px-6 py-16 max-w-5xl mx-auto">
      {loading && <p data-testid="loading" className="theme-text-muted reveal">Cargando…</p>}
      {error && <p data-testid="error" className="text-red-500 reveal">{error}</p>}
      {!loading && !error && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" data-testid="projects-grid">
          {projects.map((p, index) => (
            <div
              key={p.id}
              className="reveal"
              style={{ transitionDelay: `${index * 120}ms` }}
            >
              <ProjectCard
                title={p.title}
                description={p.description}
                image={p.image}
                imageAlt={p.imageAlt}
                tech={p.tech}
                onOpen={() => onOpenProject?.(p)}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
