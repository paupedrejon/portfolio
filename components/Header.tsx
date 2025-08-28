"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Poppins } from "next/font/google";
import { useEffect, useRef, useState } from "react";

const poppins = Poppins({ subsets: ["latin"], weight: ["600", "700"] });

const links = [
  { href: "/",          label: "HOME" },
  { href: "/proyectos", label: "PROJECTS" },
  { href: "/skills",    label: "SKILLS" },
  { href: "/about-me",  label: "ABOUT ME" },
  { href: "/contact",   label: "CONTACT" },
];

const SAFETY_MIN_WIDTH = 640;     // fuerza hamburguesa por debajo de 640px
const FIT_TOLERANCE = 20;          // px de margen para “cabe”

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [compact, setCompact] = useState(false);

  const barRef   = useRef<HTMLDivElement | null>(null);
  const sizerRef = useRef<HTMLDivElement | null>(null); // 👈 clon invisible

  // cierra panel al navegar
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  useEffect(() => {
    const bar = barRef.current;
    const sizer = sizerRef.current;
    if (!bar || !sizer) return;

    const measure = () => {
      // ancho disponible de la barra visible
      const available = bar.clientWidth;

      // ancho necesario de la versión “escritorio”
      // (el clon está fuera del flujo y no afecta al layout)
      const needed = sizer.scrollWidth;

      const forceCompact = window.innerWidth < SAFETY_MIN_WIDTH;
      const shouldCompact = forceCompact || (needed > available - FIT_TOLERANCE);

      setCompact(shouldCompact);
    };

    // 1ª medida
    measure();

    // escucha cambios de tamaño con debounce
    let raf: number | null = null;
    const schedule = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };

    const ro1 = new ResizeObserver(schedule);
    const ro2 = new ResizeObserver(schedule);
    ro1.observe(bar);
    ro2.observe(sizer);
    window.addEventListener("resize", schedule);

    return () => {
      ro1.disconnect(); ro2.disconnect();
      window.removeEventListener("resize", schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <header className="fixed top-0 left-0 z-50 w-full bg-[#dce3e4] shadow-[0_1px_0_0_rgba(0,0,0,0.06)]">

      {/* Barra visible */}
<div
  ref={barRef}
  className={`h-16 flex items-center ${compact ? "justify-center" : "justify-between"} px-3 md:px-8 w-full`}
>


        {/* Marca */}
        <div
          className={`select-none cursor-default leading-none ${poppins.className}`}
          style={{ textAlign: "center", color: "#575757", padding: "0 0.5rem" }}
        >
          <span
          className="block text-[20px] tracking-[0.35em]"
          style={{ fontWeight: 700 }}
        >
          PAU PEDREJON
        </span>
 
        </div>

        {/* Menú escritorio si cabe; si no, hamburguesa a la izquierda */}
        {!compact ? (
          <nav aria-label="Main">
            <ul className="flex items-center gap-3">
              {links.map((l) => {
                const active = pathname === l.href;
                return (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      aria-current={active ? "page" : undefined}
                      style={{ textAlign: "center", color: "#575757", padding: "0 1rem", whiteSpace: "nowrap" }}
                      className={`${poppins.className} cta-btn cta-btn--grey`}
                    >
                      {l.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        ) : (
          <button
            type="button"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((v) => !v)}
            className="ml-1 inline-flex items-center justify-center p-2 rounded-md text-[#575757] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#575757]"
          >
            {!menuOpen ? (
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            )}
          </button>
        )}
      </div>

      {/* Panel móvil (solo en compacto) */}
      {compact && (
        <nav
          id="mobile-menu"
          className="w-full overflow-hidden transition-[max-height] duration-300"
          style={{ maxHeight: menuOpen ? 320 : 0 }}
          aria-hidden={!menuOpen}
        >
          <ul className="px-3 pb-4 space-y-2">
            {links.map((l) => {
              const active = pathname === l.href;
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    aria-current={active ? "page" : undefined}
                    className={`${poppins.className} block w-full rounded-md`}
                    style={{ color: "#575757", padding: "0.9rem 0.9rem", background: "rgba(0,0,0,0.03)" }}
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}

      {/* Clon invisible para medir */}
   <div
  ref={sizerRef}
  aria-hidden
  className="pointer-events-none fixed -left-[9999px] top-0"
>
  <div className="h-16 flex items-center justify-between px-3 md:px-8 max-w-[1280px]">
    <div className={`${poppins.className} block w-full rounded-md`} style={{ padding: "0.9rem 0.9rem" }}>
      <span className="block text-[20px] tracking-[0.35em] font-bold"   style={{ fontWeight: 700 }}
>PAU</span>
      <span className="block text-[20px] tracking-[0.35em] font-bold"   style={{ fontWeight: 700 }}
>PEDREJON</span>
    </div>

    <ul className="flex items-center gap-3">
      {links.map((l) => (
        <li key={l.href}>
          <span
            className={`${poppins.className} cta-btn cta-btn--grey`}
            style={{
              textAlign: "center",
              color: "#575757",
              padding: "0 1rem",
              whiteSpace: "nowrap",
              display: "inline-block",
            }}
          >
            {l.label}
          </span>
        </li>
      ))}
    </ul>
  </div>
</div>
    </header>
  );
}
