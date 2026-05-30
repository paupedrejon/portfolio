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
    <section className="px-4 md:px-6 py-16 max-w-5xl mx-auto">
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
