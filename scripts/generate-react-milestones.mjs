/**
 * Genera templates/react-milestones/level-NN (estado tras completar el nivel NN).
 * node scripts/generate-react-milestones.mjs
 */
import { mkdirSync, writeFileSync, rmSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { getMilestones17to29 } from "./milestones-17-29.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outBase = join(root, "templates", "react-milestones");

const HERO = `export default function Hero() {
  return (
    <main className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center px-4 md:px-6 pt-20">
      <h1 className="text-center text-white text-4xl md:text-5xl font-bold">Hello World</h1>
      <p className="text-gray-300 mt-4 text-center max-w-md">Desarrollador web en formación</p>
      <button
        type="button"
        className="mt-6 px-6 py-3 rounded-full bg-[#2a8ca0] text-white font-semibold"
      >
        Ver proyectos
      </button>
    </main>
  );
}
`;

const NAVBAR = `export default function Navbar() {
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
`;

const NAVBAR_THEME = `export default function Navbar({ dark, onToggle }) {
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
`;

const NAVBAR_ROUTER = `import { Link, useLocation, useNavigate } from "react-router-dom";

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function Navbar({ dark, onToggle }) {
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
      <nav className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/" className="theme-text font-bold">Mi Portfolio</Link>
        <div className="flex items-center gap-4 text-sm">
          <a href="#about" onClick={goAbout} className="theme-text-secondary">
            Sobre mí
          </a>
          <Link to="/proyectos" className="theme-text-secondary">Proyectos</Link>
          <Link to="/contacto" className="theme-text-secondary">Contacto</Link>
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
`;

const HERO_THEME = `export default function Hero() {
  return (
    <main className="min-h-screen theme-hero-bg flex flex-col items-center justify-center px-4 md:px-6 pt-20">
      <h1 className="text-center theme-text text-4xl md:text-5xl font-bold">Hello World</h1>
      <p className="theme-text-secondary mt-4 text-center max-w-md">Desarrollador web en formación</p>
      <a
        href="#projects"
        className="mt-6 px-6 py-3 rounded-full theme-accent-btn font-semibold inline-block"
      >
        Ver proyectos
      </a>
    </main>
  );
}
`;

const HERO_ROUTER = `import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <main className="min-h-screen theme-hero-bg flex flex-col items-center justify-center px-4 md:px-6 pt-20">
      <h1 className="text-center theme-text text-4xl md:text-5xl font-bold">Hello World</h1>
      <p className="theme-text-secondary mt-4 text-center max-w-md">Desarrollador web en formación</p>
      <Link
        to="/proyectos"
        className="mt-6 px-6 py-3 rounded-full theme-accent-btn font-semibold inline-block"
      >
        Ver proyectos
      </Link>
    </main>
  );
}
`;

const ABOUT_THEME = `export default function About() {
  return (
    <section id="about" className="px-4 md:px-6 py-16 max-w-2xl mx-auto section-anchor reveal">
      <h2 className="text-3xl font-bold mb-4 theme-text">Sobre mí</h2>
      <p className="theme-text-muted leading-relaxed">
        Soy estudiante de desarrollo web. Me apasiona React y construir proyectos que
        demuestren lo que voy aprendiendo en el camino.
      </p>
    </section>
  );
}
`;

const PROJECT_CARD_THEME = `export default function ProjectCard({ title, description, image, imageAlt, tech = [], onOpen }) {
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
`;

const ABOUT = `export default function About() {
  return (
    <section id="about" className="px-4 md:px-6 py-16 max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold mb-4 text-white">Sobre mí</h2>
      <p className="text-gray-400 leading-relaxed">
        Soy estudiante de desarrollo web. Me apasiona React y construir proyectos que
        demuestren lo que voy aprendiendo en el camino.
      </p>
    </section>
  );
}
`;

const PROJECT_CARD = `export default function ProjectCard({ title, description, image, imageAlt, tech = [], onOpen }) {
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
`;

const PROJECTS_STATIC_THEME = `import { projects } from "../data/projects.js";
import ProjectCard from "./ProjectCard.jsx";

export default function Projects() {
  return (
    <section id="projects" className="px-4 md:px-6 py-16 max-w-5xl mx-auto section-anchor">
      <h2 className="text-3xl font-bold mb-8 theme-text">Proyectos</h2>
      <div className="grid gap-4 md:grid-cols-2" data-testid="projects-grid">
        {projects.map((p) => (
          <ProjectCard
            key={p.id}
            title={p.title}
            description={p.description}
            image={p.image}
            imageAlt={p.imageAlt}
            tech={p.tech}
          />
        ))}
      </div>
    </section>
  );
}
`;

const PROJECTS_STATIC = `import { projects } from "../data/projects.js";
import ProjectCard from "./ProjectCard.jsx";

export default function Projects() {
  return (
    <section id="projects" className="px-4 md:px-6 py-16 max-w-5xl mx-auto section-anchor">
      <h2 className="text-3xl font-bold mb-8 text-white">Proyectos</h2>
      <div className="grid gap-4 md:grid-cols-2" data-testid="projects-grid">
        {projects.map((p) => (
          <ProjectCard
            key={p.id}
            title={p.title}
            description={p.description}
            image={p.image}
            imageAlt={p.imageAlt}
            tech={p.tech}
          />
        ))}
      </div>
    </section>
  );
}
`;

const PROJECTS_FETCH = `import { useEffect, useState } from "react";
import ProjectCard from "./ProjectCard.jsx";

export default function Projects({ onOpenProject }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/projects.json")
      .then((r) => {
        if (!r.ok) throw new Error("Error al cargar");
        return r.json();
      })
      .then((data) => {
        setProjects(data);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  return (
    <section id="projects" className="px-4 md:px-6 py-16 max-w-5xl mx-auto section-anchor">
      <h2 className="text-3xl font-bold mb-8 theme-text">Proyectos</h2>
      {loading && <p data-testid="loading" className="theme-text-muted">Cargando…</p>}
      {error && <p data-testid="error" className="text-red-500">{error}</p>}
      {!loading && !error && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" data-testid="projects-grid">
          {projects.map((p) => (
            <ProjectCard
              key={p.id}
              title={p.title}
              description={p.description}
              image={p.image}
              imageAlt={p.imageAlt}
              tech={p.tech}
              onOpen={() => onOpenProject?.(p)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
`;

const CONTACT_BASIC = `import { useState } from "react";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    alert("Mensaje enviado (demo)");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 w-full">
      <div>
        <label htmlFor="contact-name" className="block text-sm font-medium theme-text mb-1.5">
          Nombre
        </label>
        <input
          id="contact-name"
          name="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tu nombre"
          className="theme-input rounded-lg px-3 py-2.5 w-full"
        />
      </div>
      <div>
        <label htmlFor="contact-email" className="block text-sm font-medium theme-text mb-1.5">
          Email
        </label>
        <input
          id="contact-email"
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          className="theme-input rounded-lg px-3 py-2.5 w-full"
        />
      </div>
      <div>
        <label htmlFor="contact-message" className="block text-sm font-medium theme-text mb-1.5">
          Mensaje
        </label>
        <textarea
          id="contact-message"
          name="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          placeholder="Cuéntame en qué puedo ayudarte…"
          className="theme-input rounded-lg px-3 py-2.5 w-full resize-y min-h-[120px]"
        />
      </div>
      <button type="submit" className="w-full sm:w-auto px-6 py-3 rounded-full theme-accent-btn font-semibold">
        Enviar
      </button>
    </form>
  );
}
`;

const CONTACT_VALIDATED = `import { useState } from "react";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});

  function validate() {
    const next = {};
    if (!name.trim()) next.name = "El nombre es obligatorio";
    if (!email.includes("@")) next.email = "Email no válido";
    if (!message.trim()) next.message = "Escribe un mensaje";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    alert("Mensaje enviado (demo)");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 w-full" noValidate>
      <div>
        <label htmlFor="contact-name" className="block text-sm font-medium theme-text mb-1.5">
          Nombre
        </label>
        <input
          id="contact-name"
          name="name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tu nombre"
          className="theme-input rounded-lg px-3 py-2.5 w-full"
        />
        {errors.name && <p className="text-red-500 text-sm mt-1" role="alert">{errors.name}</p>}
      </div>
      <div>
        <label htmlFor="contact-email" className="block text-sm font-medium theme-text mb-1.5">
          Email
        </label>
        <input
          id="contact-email"
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          className="theme-input rounded-lg px-3 py-2.5 w-full"
        />
        {errors.email && <p className="text-red-500 text-sm mt-1" role="alert">{errors.email}</p>}
      </div>
      <div>
        <label htmlFor="contact-message" className="block text-sm font-medium theme-text mb-1.5">
          Mensaje
        </label>
        <textarea
          id="contact-message"
          name="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          placeholder="Cuéntame en qué puedo ayudarte…"
          className="theme-input rounded-lg px-3 py-2.5 w-full resize-y min-h-[120px]"
        />
        {errors.message && <p className="text-red-500 text-sm mt-1" role="alert">{errors.message}</p>}
      </div>
      <button type="submit" className="w-full sm:w-auto px-6 py-3 rounded-full theme-accent-btn font-semibold">
        Enviar
      </button>
    </form>
  );
}
`;

const PROJECT_MODAL = `export default function ProjectModal({ project, onClose }) {
  if (!project) return null;
  return (
    <div
      role="dialog"
      data-testid="project-modal"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="theme-modal rounded-xl max-w-lg w-full border shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {project.image ? (
          <div className="aspect-video w-full overflow-hidden">
            <img
              src={project.image}
              alt={project.imageAlt ?? project.title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : null}
        <div className="p-6">
          <h3 className="text-xl font-bold theme-text">{project.title}</h3>
          <p className="theme-text-muted mt-3 leading-relaxed">{project.description}</p>
          {project.tech?.length ? (
            <ul className="flex flex-wrap gap-1.5 mt-4">
              {project.tech.map((item) => (
                <li key={item} className="text-xs px-2 py-0.5 rounded-full border theme-surface theme-text-muted">
                  {item}
                </li>
              ))}
            </ul>
          ) : null}
          <button
            type="button"
            data-testid="modal-close"
            onClick={onClose}
            className="mt-6 px-4 py-2 rounded-full theme-accent-btn"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
`;

const USE_SCROLL_REVEAL = `import { useEffect } from "react";

/** Activa .reveal--visible cuando la sección entra en pantalla */
export function useScrollReveal() {
  useEffect(() => {
    let observer;

    const timer = setTimeout(() => {
      const nodes = document.querySelectorAll(".reveal:not(.reveal--visible)");
      if (!nodes.length) return;

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("reveal--visible");
            }
          });
        },
        { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
      );

      nodes.forEach((node) => observer.observe(node));
    }, 100);

    return () => {
      clearTimeout(timer);
      observer?.disconnect();
    };
  }, []);
}
`;

const USE_SCROLL_REVEAL_ROUTER = `import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Igual que useScrollReveal pero se reinicia al cambiar de ruta (React Router) */
export function useScrollReveal() {
  const { pathname } = useLocation();

  useEffect(() => {
    let observer;

    const timer = setTimeout(() => {
      const nodes = document.querySelectorAll(".reveal:not(.reveal--visible)");
      if (!nodes.length) return;

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("reveal--visible");
            }
          });
        },
        { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
      );

      nodes.forEach((node) => observer.observe(node));
    }, 100);

    return () => {
      clearTimeout(timer);
      observer?.disconnect();
    };
  }, [pathname]);
}
`;

const INDEX_CSS_THEME = `@import "tailwindcss";

[data-theme="dark"] {
  --page-bg: #0a0a0f;
  --hero-bg: #0a0a0f;
  --text-primary: #ffffff;
  --text-secondary: #d1d5db;
  --text-muted: #9ca3af;
  --accent: #2a8ca0;
  --nav-bg: rgba(10, 10, 15, 0.92);
  --border-color: rgba(255, 255, 255, 0.12);
  --surface-bg: rgba(255, 255, 255, 0.05);
  --input-bg: rgba(255, 255, 255, 0.04);
  --modal-bg: #141419;
}

[data-theme="light"] {
  --page-bg: #f9fafb;
  --hero-bg: #f3f4f6;
  --text-primary: #111827;
  --text-secondary: #374151;
  --text-muted: #6b7280;
  --accent: #2a8ca0;
  --nav-bg: rgba(255, 255, 255, 0.95);
  --border-color: rgba(17, 24, 39, 0.12);
  --surface-bg: #ffffff;
  --input-bg: #ffffff;
  --modal-bg: #ffffff;
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  min-height: 100vh;
  background-color: var(--page-bg);
  color: var(--text-primary);
  font-family: system-ui, -apple-system, sans-serif;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.theme-page {
  background-color: var(--page-bg);
  color: var(--text-primary);
}

.theme-hero-bg {
  background-color: var(--hero-bg);
}

.theme-nav {
  background-color: var(--nav-bg);
  border-color: var(--border-color);
}

.theme-text {
  color: var(--text-primary);
}

.theme-text-secondary {
  color: var(--text-secondary);
}

.theme-text-muted {
  color: var(--text-muted);
}

.theme-surface {
  background-color: var(--surface-bg);
  border-color: var(--border-color);
}

.theme-input {
  background-color: var(--input-bg);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.theme-input::placeholder {
  color: var(--text-muted);
  opacity: 1;
}

.theme-modal {
  background-color: var(--modal-bg);
  border-color: var(--border-color);
}

.theme-accent-btn {
  background-color: var(--accent);
  color: #ffffff;
}

.section-anchor {
  scroll-margin-top: 5.5rem;
}

a.theme-text-secondary:hover,
a.hover\\:theme-text:hover {
  color: var(--text-primary);
}
`;

const INDEX_CSS_REVEAL = `
.page-hero {
  position: relative;
  min-height: 44vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.page-hero__video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.page-hero__overlay {
  position: absolute;
  inset: 0;
  background: rgba(10, 10, 15, 0.68);
}

[data-theme="light"] .page-hero__overlay {
  background: rgba(15, 23, 42, 0.45);
}

.page-hero__overlay--solid {
  background: linear-gradient(160deg, var(--hero-bg) 0%, var(--page-bg) 100%);
}

.page-hero__content {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 6.5rem 1.5rem 3rem;
  max-width: 42rem;
}

.page-hero__content .theme-text,
.page-hero__content .theme-text-secondary {
  color: #ffffff;
}

.page-hero__content .theme-text-secondary {
  opacity: 0.9;
}

.reveal {
  opacity: 0;
  transform: translateY(36px);
  transition: opacity 0.75s ease, transform 0.75s ease;
}

.reveal.reveal--visible {
  opacity: 1;
  transform: translateY(0);
}
`;

const INDEX_CSS_THEME_REVEAL = INDEX_CSS_THEME + INDEX_CSS_REVEAL;

const DATA_PROJECTS = `export const projects = [
  {
    id: 1,
    title: "Portfolio personal",
    description: "Mi sitio hecho con React y Tailwind, con secciones y formulario de contacto.",
    image: "/projects/portfolio.svg",
    imageAlt: "Captura del portfolio personal",
    tech: ["React", "Tailwind", "Vite"],
  },
  {
    id: 2,
    title: "App de tareas",
    description: "Lista de tareas con useState y filtros por estado completado.",
    image: "/projects/tasks.svg",
    imageAlt: "Vista de la app de tareas",
    tech: ["React", "useState"],
  },
  {
    id: 3,
    title: "Clon de landing",
    description: "Réplica mobile-first de una landing para practicar maquetación.",
    image: "/projects/landing.svg",
    imageAlt: "Maquetación de landing page",
    tech: ["HTML", "CSS", "Responsive"],
  },
];
`;

const PROJECTS_JSON = `[
  {
    "id": 1,
    "title": "Portfolio personal",
    "description": "Mi sitio hecho con React y Tailwind, con rutas y formulario de contacto.",
    "image": "/projects/portfolio.svg",
    "imageAlt": "Captura del portfolio personal",
    "tech": ["React", "Tailwind", "Vite"]
  },
  {
    "id": 2,
    "title": "App de tareas",
    "description": "Lista de tareas con useState y filtros por estado.",
    "image": "/projects/tasks.svg",
    "imageAlt": "Vista de la app de tareas",
    "tech": ["React", "useState"]
  },
  {
    "id": 3,
    "title": "Clon de landing",
    "description": "Réplica mobile-first de una landing para practicar maquetación.",
    "image": "/projects/landing.svg",
    "imageAlt": "Maquetación de landing page",
    "tech": ["HTML", "CSS", "Responsive"]
  }
]
`;

const APP_L1 = `export default function App() {
  return (
    <main className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center">
      <h1 className="text-center text-white text-4xl md:text-5xl font-bold">Hello World</h1>
    </main>
  );
}
`;

const APP_L2 = `export default function App() {
  return (
    <main className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center px-4 md:px-6">
      <h1 className="text-center text-white text-4xl md:text-5xl font-bold">Hello World</h1>
      <p className="text-gray-300 mt-4 text-center max-w-md">Desarrollador web en formación</p>
      <button
        type="button"
        className="mt-6 px-6 py-3 rounded-full bg-[#2a8ca0] text-white font-semibold"
      >
        Ver proyectos
      </button>
    </main>
  );
}
`;

const APP_L3 = `export default function App() {
  return (
    <>
      <main className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center px-4 md:px-6">
        <h1 className="text-center text-white text-4xl md:text-5xl font-bold">Hello World</h1>
        <p className="text-gray-300 mt-4 text-center max-w-md">Desarrollador web en formación</p>
        <button type="button" className="mt-6 px-6 py-3 rounded-full bg-[#2a8ca0] text-white font-semibold">
          Ver proyectos
        </button>
      </main>
      <section id="about" className="px-4 md:px-6 py-16 max-w-2xl mx-auto bg-white">
        <h2 className="text-3xl font-bold mb-4">Sobre mí</h2>
        <p className="text-gray-600 leading-relaxed">
          Soy estudiante de desarrollo web. Me apasiona React y construir proyectos.
        </p>
      </section>
    </>
  );
}
`;

const APP_L4 = `export default function App() {
  return (
    <>
      <header className="fixed top-0 w-full z-50 bg-[#0a0a0f]/90 backdrop-blur border-b border-white/10">
        <nav className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
          <a href="#" className="text-white font-bold">Mi Portfolio</a>
          <div className="flex gap-4 text-sm">
            <a href="#about" className="text-gray-300 hover:text-white">Sobre mí</a>
            <a href="#projects" className="text-gray-300 hover:text-white">Proyectos</a>
          </div>
        </nav>
      </header>
      <main className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center px-4 md:px-6 pt-20">
        <h1 className="text-center text-white text-4xl md:text-5xl font-bold">Hello World</h1>
        <p className="text-gray-300 mt-4 text-center max-w-md">Desarrollador web en formación</p>
        <button type="button" className="mt-6 px-6 py-3 rounded-full bg-[#2a8ca0] text-white font-semibold">
          Ver proyectos
        </button>
      </main>
      <section id="about" className="px-4 md:px-6 py-16 max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold mb-4">Sobre mí</h2>
        <p className="text-gray-600 leading-relaxed">Soy estudiante de desarrollo web.</p>
      </section>
      <section id="projects" className="px-4 md:px-6 py-16 max-w-5xl mx-auto section-anchor">
        <h2 className="text-3xl font-bold mb-8">Proyectos</h2>
        <p className="text-gray-500">Próximamente.</p>
      </section>
    </>
  );
}
`;

const APP_L6 = `import Hero from "./components/Hero.jsx";
import Navbar from "./components/Navbar.jsx";
import About from "./components/About.jsx";

export default function App() {
  return (
    <div className="bg-[#0a0a0f] min-h-screen text-white">
      <Navbar />
      <Hero />
      <About />
      <section id="projects" className="px-4 md:px-6 py-16 max-w-5xl mx-auto section-anchor">
        <h2 className="text-3xl font-bold mb-8">Proyectos</h2>
        <p className="text-gray-500">Próximamente.</p>
      </section>
    </div>
  );
}
`;

const APP_L7 = `import Hero from "./components/Hero.jsx";
import Navbar from "./components/Navbar.jsx";
import About from "./components/About.jsx";
import ProjectCard from "./components/ProjectCard.jsx";

export default function App() {
  return (
    <div className="bg-[#0a0a0f] min-h-screen text-white">
      <Navbar />
      <Hero />
      <About />
      <section id="projects" className="px-4 md:px-6 py-16 max-w-5xl mx-auto section-anchor">
        <h2 className="text-3xl font-bold mb-8">Proyectos</h2>
        <ProjectCard title="Mi primer proyecto" description="Descripción de ejemplo del portfolio." />
      </section>
    </div>
  );
}
`;

const APP_L8 = `import Hero from "./components/Hero.jsx";
import Navbar from "./components/Navbar.jsx";
import About from "./components/About.jsx";
import Projects from "./components/Projects.jsx";

export default function App() {
  return (
    <div className="bg-[#0a0a0f] min-h-screen text-white">
      <Navbar />
      <Hero />
      <About />
      <Projects />
    </div>
  );
}
`;

const APP_L9 = `import { useState, useEffect } from "react";
import Hero from "./components/Hero.jsx";
import Navbar from "./components/Navbar.jsx";
import About from "./components/About.jsx";
import Projects from "./components/Projects.jsx";

export default function App() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <div className="min-h-screen theme-page">
      <Navbar dark={dark} onToggle={() => setDark(!dark)} />
      <Hero />
      <About />
      <Projects />
    </div>
  );
}
`;

const APP_L10 = `import { useState, useEffect } from "react";
import Hero from "./components/Hero.jsx";
import Navbar from "./components/Navbar.jsx";
import About from "./components/About.jsx";
import Projects from "./components/Projects.jsx";
import ContactForm from "./components/ContactForm.jsx";

export default function App() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <div className="min-h-screen theme-page">
      <Navbar dark={dark} onToggle={() => setDark(!dark)} />
      <Hero />
      <About />
      <Projects />
      <section id="contact" className="px-4 md:px-6 py-16 max-w-2xl mx-auto section-anchor">
        <h2 className="text-3xl font-bold mb-6 theme-text">Contacto</h2>
        <ContactForm />
      </section>
    </div>
  );
}
`;

const APP_L15 = `import { useState, useEffect } from "react";
import Hero from "./components/Hero.jsx";
import Navbar from "./components/Navbar.jsx";
import About from "./components/About.jsx";
import Projects from "./components/Projects.jsx";
import ContactForm from "./components/ContactForm.jsx";
import ProjectModal from "./components/ProjectModal.jsx";

export default function App() {
  const [dark, setDark] = useState(true);
  const [modalProject, setModalProject] = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <div className="min-h-screen theme-page">
      <Navbar dark={dark} onToggle={() => setDark(!dark)} />
      <Hero />
      <About />
      <Projects onOpenProject={setModalProject} />
      <section id="contact" className="px-4 md:px-6 py-16 max-w-2xl mx-auto section-anchor">
        <h2 className="text-3xl font-bold mb-6 theme-text">Contacto</h2>
        <ContactForm />
      </section>
      <ProjectModal project={modalProject} onClose={() => setModalProject(null)} />
    </div>
  );
}
`;

const MAIN_THEME = `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

document.documentElement.setAttribute("data-theme", "dark");

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
`;

const INDEX_HTML_THEME = `<!DOCTYPE html>
<html lang="es" data-theme="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Mi Portfolio — Curso de React</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`;

const PACKAGE_JSON_ROUTER = `{
  "name": "react-portfolio-curso",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "node scripts/dev-with-check.mjs",
    "dev:only": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "check": "node scripts/check.mjs",
    "check:watch": "node scripts/watch-check.mjs",
    "postinstall": "npx playwright install chromium"
  },
  "dependencies": {
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "react-router-dom": "^7.6.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.51.0",
    "@vitejs/plugin-react": "^4.3.4",
    "@tailwindcss/vite": "^4.1.0",
    "tailwindcss": "^4.1.0",
    "vite": "^6.2.0"
  }
}
`;

const MAIN_ROUTER = `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";

document.documentElement.setAttribute("data-theme", "dark");

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
`;

const APP_L16 = `import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import HomePage from "./pages/HomePage.jsx";
import ProjectsPage from "./pages/ProjectsPage.jsx";
import ContactPage from "./pages/ContactPage.jsx";
import ProjectModal from "./components/ProjectModal.jsx";
import { useScrollReveal } from "./hooks/useScrollReveal.js";

export default function App() {
  const [dark, setDark] = useState(true);
  const [modalProject, setModalProject] = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  }, [dark]);

  useScrollReveal();

  return (
    <div className="min-h-screen theme-page">
      <Navbar dark={dark} onToggle={() => setDark(!dark)} />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/proyectos"
          element={<ProjectsPage onOpenProject={setModalProject} />}
        />
        <Route path="/contacto" element={<ContactPage />} />
      </Routes>
      <ProjectModal project={modalProject} onClose={() => setModalProject(null)} />
    </div>
  );
}
`;

const HOME_PAGE = `import Hero from "../components/Hero.jsx";
import About from "../components/About.jsx";

export default function HomePage() {
  return (
    <>
      <Hero />
      <About />
    </>
  );
}
`;

const PAGE_HERO = `export default function PageHero({ title, subtitle, videoSrc }) {
  return (
    <header className="page-hero">
      {videoSrc ? (
        <>
          <video
            className="page-hero__video"
            autoPlay
            muted
            loop
            playsInline
            aria-hidden="true"
          >
            <source src={videoSrc} type="video/mp4" />
          </video>
          <div className="page-hero__overlay" aria-hidden="true" />
        </>
      ) : (
        <div className="page-hero__overlay page-hero__overlay--solid" aria-hidden="true" />
      )}
      <div className="page-hero__content">
        <h1 className="text-4xl md:text-5xl font-bold theme-text">{title}</h1>
        {subtitle ? (
          <p className="theme-text-secondary mt-3 text-lg">{subtitle}</p>
        ) : null}
      </div>
    </header>
  );
}
`;

const PROJECTS_FETCH_PAGE = `import { useEffect, useState } from "react";
import ProjectCard from "./ProjectCard.jsx";

export default function Projects({ onOpenProject }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/projects.json")
      .then((r) => {
        if (!r.ok) throw new Error("Error al cargar");
        return r.json();
      })
      .then((data) => {
        setProjects(data);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  return (
    <section className="px-4 md:px-6 py-16 max-w-5xl mx-auto">
      {loading && <p data-testid="loading" className="theme-text-muted reveal">Cargando…</p>}
      {error && <p data-testid="error" className="text-red-500 reveal">{error}</p>}
      {!loading && !error && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" data-testid="projects-grid">
          {projects.map((p, index) => (
            <div
              key={p.id}
              className="reveal"
              style={{ transitionDelay: \`\${index * 120}ms\` }}
            >
              <ProjectCard
                title={p.title}
                description={p.description}
                image={p.image}
                imageAlt={p.imageAlt}
                tech={p.tech}
                onOpen={() => onOpenProject?.(p)}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
`;

const PROJECTS_PAGE = `import PageHero from "../components/PageHero.jsx";
import Projects from "../components/Projects.jsx";

export default function ProjectsPage({ onOpenProject }) {
  return (
    <>
      <PageHero
        title="Proyectos"
        subtitle="Apps y experimentos que he ido construyendo mientras aprendo."
        videoSrc="https://cdn.coverr.co/videos/coverr-a-man-typing-on-a-computer-5256/1080p.mp4"
      />
      <Projects onOpenProject={onOpenProject} />
    </>
  );
}
`;

const CONTACT_PAGE = `import PageHero from "../components/PageHero.jsx";
import ContactForm from "../components/ContactForm.jsx";

export default function ContactPage() {
  return (
    <>
      <PageHero
        title="Contacto"
        subtitle="Cuéntame tu idea — te responderé en cuanto pueda."
      />
      <section className="px-4 md:px-6 py-12 max-w-xl mx-auto">
        <div className="theme-surface border rounded-2xl p-6 md:p-8">
          <ContactForm />
        </div>
      </section>
    </>
  );
}
`;

/** @type {{ n: number; files: Record<string, string> }[]} */
const milestones = [
  { n: 1, files: { "src/App.jsx": APP_L1 } },
  { n: 2, files: { "src/App.jsx": APP_L2 } },
  { n: 3, files: { "src/App.jsx": APP_L3 } },
  { n: 4, files: { "src/App.jsx": APP_L4 } },
  {
    n: 5,
    files: {
      "src/App.jsx": APP_L4.replace(
        'id="about" className="px-4 md:px-6 py-16',
        'id="about" className="px-4 md:px-8 py-16'
      ).replace(
        "text-4xl md:text-5xl",
        "text-4xl sm:text-5xl md:text-6xl"
      ),
    },
  },
  {
    n: 6,
    files: {
      "src/App.jsx": APP_L6,
      "src/components/Hero.jsx": HERO,
      "src/components/Navbar.jsx": NAVBAR,
      "src/components/About.jsx": ABOUT,
    },
  },
  {
    n: 7,
    files: {
      "src/App.jsx": APP_L7,
      "src/components/ProjectCard.jsx": PROJECT_CARD,
    },
  },
  {
    n: 8,
    files: {
      "src/App.jsx": APP_L8,
      "src/components/Projects.jsx": PROJECTS_STATIC,
      "src/data/projects.js": DATA_PROJECTS,
    },
  },
  {
    n: 9,
    files: {
      "index.html": INDEX_HTML_THEME,
      "src/main.jsx": MAIN_THEME,
      "src/index.css": INDEX_CSS_THEME,
      "src/App.jsx": APP_L9,
      "src/components/Hero.jsx": HERO_THEME,
      "src/components/Navbar.jsx": NAVBAR_THEME,
      "src/components/About.jsx": ABOUT_THEME,
      "src/components/ProjectCard.jsx": PROJECT_CARD_THEME,
      "src/components/Projects.jsx": PROJECTS_STATIC_THEME,
    },
  },
  { n: 10, files: { "src/App.jsx": APP_L10, "src/components/ContactForm.jsx": CONTACT_BASIC } },
  { n: 11, files: { "src/components/ContactForm.jsx": CONTACT_VALIDATED } },
  {
    n: 12,
    files: {
      "src/components/Projects.jsx": PROJECTS_FETCH,
      "public/projects.json": PROJECTS_JSON,
    },
  },
  { n: 13, files: {} },
  { n: 14, files: { "src/index.css": INDEX_CSS_THEME_REVEAL, "src/hooks/useScrollReveal.js": USE_SCROLL_REVEAL } },
  {
    n: 15,
    files: {
      "src/App.jsx": APP_L15,
      "src/components/ProjectModal.jsx": PROJECT_MODAL,
    },
  },
  {
    n: 16,
    files: {
      "package.json": PACKAGE_JSON_ROUTER,
      "src/main.jsx": MAIN_ROUTER,
      "src/index.css": INDEX_CSS_THEME_REVEAL,
      "src/App.jsx": APP_L16,
      "src/hooks/useScrollReveal.js": USE_SCROLL_REVEAL_ROUTER,
      "src/components/Hero.jsx": HERO_ROUTER,
      "src/components/Navbar.jsx": NAVBAR_ROUTER,
      "src/components/PageHero.jsx": PAGE_HERO,
      "src/components/ProjectCard.jsx": PROJECT_CARD_THEME,
      "src/components/ProjectModal.jsx": PROJECT_MODAL,
      "src/components/Projects.jsx": PROJECTS_FETCH_PAGE,
      "src/components/About.jsx": ABOUT_THEME,
      "src/components/ContactForm.jsx": CONTACT_VALIDATED,
      "src/pages/HomePage.jsx": HOME_PAGE,
      "src/pages/ProjectsPage.jsx": PROJECTS_PAGE,
      "src/pages/ContactPage.jsx": CONTACT_PAGE,
    },
  },
];

milestones.push(...getMilestones17to29());

function writeMilestone({ n, files }) {
  const dir = join(outBase, `level-${String(n).padStart(2, "0")}`);
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true });
  }
  mkdirSync(dir, { recursive: true });
  for (const [rel, content] of Object.entries(files)) {
    if (!content) continue;
    const filePath = join(dir, rel);
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, content, "utf8");
  }
}

for (const m of milestones) {
  writeMilestone(m);
  const count = Object.keys(m.files).length;
  console.log(`✓ milestone ${String(m.n).padStart(2, "0")} (${count} archivos)`);
}

console.log(`\nListo: ${outBase}`);
