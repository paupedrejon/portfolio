export default function ProjectCard({ title, description, image, imageAlt, tech = [], onOpen }) {
  return (
    <article
      data-testid="project-card"
      className="group border border-white/10 rounded-xl overflow-hidden bg-white/5 cursor-pointer hover:border-[#2a8ca0]/50 transition"
      onClick={onOpen}
      onKeyDown={(e) => e.key === "Enter" && onOpen?.()}
      role="button"
      tabIndex={0}
    >
      {image ? (
        <div className="aspect-video overflow-hidden">
          <img
            src={image}
            alt={imageAlt ?? title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
        </div>
      ) : null}
      <div className="p-4">
        <h3 className="font-bold text-white text-lg">{title}</h3>
        <p className="text-gray-400 text-sm mt-2">{description}</p>
        {tech.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5 mt-3">
            {tech.map((item) => (
              <li key={item} className="text-xs px-2 py-0.5 rounded-full border border-white/10 text-gray-400">
                {item}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  );
}
