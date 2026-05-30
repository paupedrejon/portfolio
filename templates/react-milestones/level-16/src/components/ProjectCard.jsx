export default function ProjectCard({ title, description, image, imageAlt, tech = [], onOpen }) {
  return (
    <article
      data-testid="project-card"
      className="group border rounded-xl overflow-hidden theme-surface cursor-pointer hover:border-[#2a8ca0]/50 transition shadow-sm hover:shadow-md"
      onClick={onOpen}
      onKeyDown={(e) => e.key === "Enter" && onOpen?.()}
      role="button"
      tabIndex={0}
    >
      {image ? (
        <div className="aspect-video overflow-hidden bg-black/10">
          <img
            src={image}
            alt={imageAlt ?? title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
        </div>
      ) : null}
      <div className="p-4">
        <h3 className="font-bold theme-text text-lg">{title}</h3>
        <p className="theme-text-muted text-sm mt-2 leading-relaxed">{description}</p>
        {tech.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5 mt-3">
            {tech.map((item) => (
              <li
                key={item}
                className="text-xs px-2 py-0.5 rounded-full border theme-surface theme-text-muted"
              >
                {item}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  );
}
