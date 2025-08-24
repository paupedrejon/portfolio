'use client';

import Link from "next/link";

const links = [
  { href: "/", label: "Inicio" },
  { href: "#personajes", label: "Personajes" },
  { href: "#jugabilidad", label: "Jugabilidad" },
  { href: "#comojugar", label: "Cómo jugar" },
  { href: "#tienda", label: "Tienda" },
];

export default function Header() {
  return (
    <header className="absolute top-6 left-0 right-0 z-30">
      <div className="container">
        <div className="flex items-center justify-between rounded-full border border-white/10 bg-black/60 backdrop-blur px-4 py-2">
          {/* Logo + nombre (estilo del pantallazo) */}
          <Link href="/" className="flex items-center gap-3">
            <span className="inline-grid place-items-center h-8 w-8 rounded-full ring-2 ring-white/70">
              {/* mini anillo como icono */}
              <span className="h-4 w-4 rounded-full ring-2 ring-white/70"></span>
            </span>
            <span className="font-semibold tracking-widest">
              <span className="text-white">SALMON</span>{" "}
              <span className="opacity-80">INFINITE</span>{" "}
              <span className="text-white">2</span>
            </span>
          </Link>

          {/* Navegación */}
          <nav className="hidden md:flex items-center gap-2">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="px-4 py-2 rounded-full text-sm font-medium hover:bg-white/10 transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
