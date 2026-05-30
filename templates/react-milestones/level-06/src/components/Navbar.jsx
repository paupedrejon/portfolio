export default function Navbar() {
  return (
    <header className="fixed top-0 w-full z-50 bg-[#0a0a0f]/90 backdrop-blur border-b border-white/10">
      <nav className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
        <a href="#" className="text-white font-bold">Mi Portfolio</a>
        <div className="flex gap-4 text-sm">
          <a href="#about" className="text-gray-300 hover:text-white">Sobre mí</a>
          <a href="#projects" className="text-gray-300 hover:text-white">Proyectos</a>
          <a href="#contact" className="text-gray-300 hover:text-white">Contacto</a>
        </div>
      </nav>
    </header>
  );
}
