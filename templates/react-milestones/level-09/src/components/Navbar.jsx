export default function Navbar({ dark, onToggle }) {
  return (
    <header className="fixed top-0 w-full z-50 theme-nav backdrop-blur border-b">
      <nav className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
        <a href="#" className="theme-text font-bold">Mi Portfolio</a>
        <div className="flex items-center gap-4 text-sm">
          <a href="#about" className="theme-text-secondary">Sobre mí</a>
          <a href="#projects" className="theme-text-secondary">Proyectos</a>
          <a href="#contact" className="theme-text-secondary">Contacto</a>
          <button
            type="button"
            data-testid="theme-toggle"
            onClick={onToggle}
            aria-label={dark ? "Activar modo claro" : "Activar modo oscuro"}
            title={dark ? "Modo claro" : "Modo oscuro"}
            className="p-2 rounded-full border theme-surface theme-text leading-none"
          >
            {dark ? (
              <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>
      </nav>
    </header>
  );
}
