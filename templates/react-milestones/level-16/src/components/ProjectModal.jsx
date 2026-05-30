export default function ProjectModal({ project, onClose }) {
  if (!project) return null;
  return (
    <div
      role="dialog"
      data-testid="project-modal"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="theme-modal rounded-xl max-w-lg w-full border shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {project.image ? (
          <div className="aspect-video w-full overflow-hidden">
            <img
              src={project.image}
              alt={project.imageAlt ?? project.title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : null}
        <div className="p-6">
          <h3 className="text-xl font-bold theme-text">{project.title}</h3>
          <p className="theme-text-muted mt-3 leading-relaxed">{project.description}</p>
          {project.tech?.length ? (
            <ul className="flex flex-wrap gap-1.5 mt-4">
              {project.tech.map((item) => (
                <li key={item} className="text-xs px-2 py-0.5 rounded-full border theme-surface theme-text-muted">
                  {item}
                </li>
              ))}
            </ul>
          ) : null}
          <button
            type="button"
            data-testid="modal-close"
            onClick={onClose}
            className="mt-6 px-4 py-2 rounded-full theme-accent-btn"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
