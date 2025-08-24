"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Poppins } from "next/font/google";

const poppins = Poppins({ subsets: ["latin"], weight: ["600", "700"] });

const links = [
  { href: "/",          label: "HOME" },
  { href: "/proyectos", label: "PROJECTS" },
  { href: "/skills", label: "SKILLS" },
  { href: "/about-me", label: "ABOUT ME" },
  { href: "/contact", label: "CONTACT" },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header
      className="
        fixed top-0 left-0 z-50 w-screen
        bg-[#dce3e4]        /* <- gris claro, pon #575757 si quieres el oscuro */
        shadow-[0_1px_0_0_rgba(0,0,0,0.06)]
      "
    >
      {/* wrapper centrado pero sin limitar toda la barra */}
      <div className="h-16 flex items-center justify-between px-8 max-w-[1280px] mx-auto">
        <div
          className={`select-none cursor-default leading-none ${poppins.className}`}
          style={{ textAlign: "center", color: "#575757", padding: "0 1rem" }}
        >
          <span className="block text-[20px] tracking-[0.35em] opacity-100 ">PAU</span>
          <span className="block text-[20px] tracking-[0.35em] opacity-100">PEDREJON</span>
        </div>

        <nav aria-label="Main">
          <ul className="flex items-center gap-3">
            {links.map((l) => {
              const active = pathname === l.href;
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    aria-current={active ? "page" : undefined}
                    style={{ textAlign: "center", color: "#575757", padding: "0 1rem" }}
                    className={`${poppins.className} cta-btn cta-btn--grey`}
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
