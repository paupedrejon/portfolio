import { useEffect, useState } from "react";
import ProjectCard from "./ProjectCard.jsx";

export default function Projects({ onOpenProject }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/projects.json")
      .then((r) => {
        if (!r.ok) throw new Error("Error al cargar");
        return r.json();
      })
      .then((data) => {
        setProjects(data);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  return (
    <section id="projects" className="px-4 md:px-6 py-16 max-w-5xl mx-auto section-anchor">
      <h2 className="text-3xl font-bold mb-8 theme-text">Proyectos</h2>
      {loading && <p data-testid="loading" className="theme-text-muted">Cargando…</p>}
      {error && <p data-testid="error" className="text-red-500">{error}</p>}
      {!loading && !error && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" data-testid="projects-grid">
          {projects.map((p) => (
            <ProjectCard
              key={p.id}
              title={p.title}
              description={p.description}
              image={p.image}
              imageAlt={p.imageAlt}
              tech={p.tech}
              onOpen={() => onOpenProject?.(p)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
