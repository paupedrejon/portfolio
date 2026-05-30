import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext.jsx";

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function Navbar() {
  const { dark, toggle } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  function goAbout(event) {
    event.preventDefault();
    if (location.pathname === "/") {
      scrollToSection("about");
      return;
    }
    navigate("/");
    setTimeout(() => scrollToSection("about"), 50);
  }

  return (
    <header className="fixed top-0 w-full z-50 theme-nav backdrop-blur border-b">
      <nav className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3" aria-label="Principal">
        <Link to="/" className="theme-text font-bold">Mi Portfolio</Link>
        <div className="flex items-center gap-4 text-sm">
          <a href="#about" onClick={goAbout} className="theme-text-secondary">Sobre mí</a>
          <Link to="/proyectos" className="theme-text-secondary">Proyectos</Link>
          <Link to="/contacto" className="theme-text-secondary">Contacto</Link>
          <Link to="/login" className="theme-text-secondary">Login</Link>
          <button
            type="button"
            data-testid="theme-toggle"
            onClick={toggle}
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
