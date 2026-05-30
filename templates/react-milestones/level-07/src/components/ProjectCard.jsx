export default function ProjectCard({ title, description, onOpen }) {
  return (
    <article
      data-testid="project-card"
      className="border border-white/10 rounded-lg p-4 bg-white/5 cursor-pointer hover:border-[#2a8ca0]/50 transition"
      onClick={onOpen}
      onKeyDown={(e) => e.key === "Enter" && onOpen?.()}
      role="button"
      tabIndex={0}
    >
      <h3 className="font-bold text-white text-lg">{title}</h3>
      <p className="text-gray-400 text-sm mt-2">{description}</p>
    </article>
  );
}
