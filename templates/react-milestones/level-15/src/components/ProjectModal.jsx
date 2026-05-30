export default function ProjectModal({ project, onClose }) {
  if (!project) return null;
  return (
    <div
      role="dialog"
      data-testid="project-modal"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#111] rounded-xl p-6 max-w-lg w-full border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold text-white">{project.title}</h3>
        <p className="text-gray-300 mt-3">{project.description}</p>
        <button
          type="button"
          data-testid="modal-close"
          onClick={onClose}
          className="mt-6 px-4 py-2 rounded-full bg-[#2a8ca0] text-white"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
