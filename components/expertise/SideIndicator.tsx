"use client";

interface SideIndicatorProps {
  items: Array<{ id: string; areaNumber: string; label: string }>;
  activeId: string;
  activeAccent?: string;
}

function scrollToExpertiseSection(id: string) {
  const el = document.getElementById(`section-${id}`);
  if (!el) return;
  const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
}

export default function SideIndicator({
  items,
  activeId,
  activeAccent = "#f5f3ee",
}: SideIndicatorProps) {
  return (
    <>
      <nav
        aria-label="Expertise progress"
        className="hidden md:flex fixed left-6 top-1/2 z-30 -translate-y-1/2 flex-col gap-4"
      >
        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <a
              key={item.id}
              href={`#section-${item.id}`}
              aria-current={isActive ? "true" : undefined}
              className="group flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 rounded-md"
              onClick={(e) => {
                e.preventDefault();
                scrollToExpertiseSection(item.id);
              }}
            >
              <span
                className="inline-flex h-3 w-3 rotate-45 border transition-all"
                style={{
                  borderColor: isActive ? activeAccent : "rgba(245, 243, 238, 0.35)",
                  background: isActive ? `${activeAccent}cc` : "transparent",
                }}
              />
              <span className="text-[10px] tracking-[0.34em] uppercase text-[#f5f3ee]/70">
                {item.areaNumber}
              </span>
            </a>
          );
        })}
      </nav>

      <nav
        aria-label="Expertise progress mobile"
        className="md:hidden sticky top-20 z-30 mx-auto mb-4 flex w-fit items-center gap-2 rounded-full border border-white/15 bg-[#0d0e12]/70 px-3 py-2 backdrop-blur"
      >
        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <a
              key={item.id}
              href={`#section-${item.id}`}
              aria-label={item.label}
              aria-current={isActive ? "true" : undefined}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 rounded-full"
              onClick={(e) => {
                e.preventDefault();
                scrollToExpertiseSection(item.id);
              }}
            >
              <span
                className="block h-2.5 w-2.5 rounded-full transition-all"
                style={{
                  background: isActive ? activeAccent : "rgba(245, 243, 238, 0.3)",
                }}
              />
            </a>
          );
        })}
      </nav>
    </>
  );
}
