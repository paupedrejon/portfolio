/**
 * Genera templates/react-milestones/level-NN (estado tras completar el nivel NN).
 * node scripts/generate-react-milestones.mjs
 */
import { mkdirSync, writeFileSync, rmSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

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
    <header className="fixed top-0 w-full z-50 bg-[#0a0a0f]/90 backdrop-blur border-b border-white/10">
      <nav className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
        <a href="#" className="text-white font-bold">Mi Portfolio</a>
        <div className="flex items-center gap-4 text-sm">
          <a href="#about" className="text-gray-300 hover:text-white">Sobre mí</a>
          <a href="#projects" className="text-gray-300 hover:text-white">Proyectos</a>
          <a href="#contact" className="text-gray-300 hover:text-white">Contacto</a>
          <button
            type="button"
            data-testid="theme-toggle"
            onClick={onToggle}
            className="px-3 py-1 rounded-full border border-white/20 text-white text-xs"
          >
            {dark ? "Modo claro" : "Modo oscuro"}
          </button>
        </div>
      </nav>
    </header>
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

const PROJECT_CARD = `export default function ProjectCard({ title, description, onOpen }) {
  return (
    <article
      data-testid="project-card"
      className="border border-white/10 rounded-lg p-4 bg-white/5 cursor-pointer hover:border-[#2a8ca0]/50 transition"
      onClick={onOpen}
      onKeyDown={(e) => e.key === "Enter" && onOpen?.()}
      role="button"
      tabIndex={0}
    >
      <h3 className="font-bold text-white text-lg">{title}</h3>
      <p className="text-gray-400 text-sm mt-2">{description}</p>
    </article>
  );
}
`;

const PROJECTS_STATIC = `import { projects } from "../data/projects.js";
import ProjectCard from "./ProjectCard.jsx";

export default function Projects() {
  return (
    <section id="projects" className="px-4 md:px-6 py-16 max-w-5xl mx-auto">
      <h2 className="text-3xl font-bold mb-8 text-white">Proyectos</h2>
      <div className="grid gap-4 md:grid-cols-2" data-testid="projects-grid">
        {projects.map((p) => (
          <ProjectCard key={p.id} title={p.title} description={p.description} />
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
    <section id="projects" className="px-4 md:px-6 py-16 max-w-5xl mx-auto">
      <h2 className="text-3xl font-bold mb-8 text-white">Proyectos</h2>
      {loading && <p data-testid="loading">Cargando…</p>}
      {error && <p data-testid="error" className="text-red-400">{error}</p>}
      {!loading && !error && (
        <div className="grid gap-4 md:grid-cols-2" data-testid="projects-grid">
          {projects.map((p) => (
            <ProjectCard
              key={p.id}
              title={p.title}
              description={p.description}
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
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <input
        id="contact-name"
        name="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Tu nombre"
        className="border border-white/20 rounded px-3 py-2 w-full bg-transparent text-white"
      />
      <input
        type="email"
        name="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="border border-white/20 rounded px-3 py-2 w-full bg-transparent text-white"
      />
      <textarea
        name="message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={4}
        placeholder="Mensaje"
        className="border border-white/20 rounded px-3 py-2 w-full bg-transparent text-white"
      />
      <button type="submit" className="px-6 py-3 rounded-full bg-[#2a8ca0] text-white font-semibold">
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
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md" noValidate>
      <div>
        <input
          id="contact-name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border border-white/20 rounded px-3 py-2 w-full bg-transparent text-white"
        />
        {errors.name && <p className="text-red-400 text-sm mt-1" role="alert">{errors.name}</p>}
      </div>
      <div>
        <input
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border border-white/20 rounded px-3 py-2 w-full bg-transparent text-white"
        />
        {errors.email && <p className="text-red-400 text-sm mt-1" role="alert">{errors.email}</p>}
      </div>
      <textarea
        name="message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={4}
        className="border border-white/20 rounded px-3 py-2 w-full bg-transparent text-white"
      />
      {errors.message && <p className="text-red-400 text-sm" role="alert">{errors.message}</p>}
      <button type="submit" className="px-6 py-3 rounded-full bg-[#2a8ca0] text-white font-semibold">
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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#111] rounded-xl p-6 max-w-lg w-full border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold text-white">{project.title}</h3>
        <p className="text-gray-300 mt-3">{project.description}</p>
        <button
          type="button"
          data-testid="modal-close"
          onClick={onClose}
          className="mt-6 px-4 py-2 rounded-full bg-[#2a8ca0] text-white"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
`;

const DATA_PROJECTS = `export const projects = [
  {
    id: 1,
    title: "Portfolio personal",
    description: "Mi sitio hecho con React y Tailwind, con secciones y formulario de contacto.",
  },
  {
    id: 2,
    title: "App de tareas",
    description: "Lista de tareas con useState y filtros por estado completado.",
  },
  {
    id: 3,
    title: "Clon de landing",
    description: "Réplica mobile-first de una landing para practicar maquetación.",
  },
];
`;

const PROJECTS_JSON = `[
  {
    "id": 1,
    "title": "Portfolio personal",
    "description": "Mi sitio hecho con React y Tailwind."
  },
  {
    "id": 2,
    "title": "App de tareas",
    "description": "Lista de tareas con useState."
  }
]
`;

const INDEX_CSS_REVEAL = `@import "tailwindcss";

.reveal {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.reveal.reveal--visible {
  opacity: 1;
  transform: translateY(0);
}
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
      <section id="projects" className="px-4 md:px-6 py-16 max-w-5xl mx-auto">
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
      <section id="projects" className="px-4 md:px-6 py-16 max-w-5xl mx-auto">
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
      <section id="projects" className="px-4 md:px-6 py-16 max-w-5xl mx-auto">
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

const APP_L9 = `import { useState } from "react";
import Hero from "./components/Hero.jsx";
import Navbar from "./components/Navbar.jsx";
import About from "./components/About.jsx";
import Projects from "./components/Projects.jsx";

export default function App() {
  const [dark, setDark] = useState(true);
  return (
    <div className={dark ? "bg-[#0a0a0f] min-h-screen text-white" : "bg-gray-50 min-h-screen text-gray-900"}>
      <Navbar dark={dark} onToggle={() => setDark(!dark)} />
      <Hero />
      <About />
      <Projects />
    </div>
  );
}
`;

const APP_L10 = `import { useState } from "react";
import Hero from "./components/Hero.jsx";
import Navbar from "./components/Navbar.jsx";
import About from "./components/About.jsx";
import Projects from "./components/Projects.jsx";
import ContactForm from "./components/ContactForm.jsx";

export default function App() {
  const [dark, setDark] = useState(true);
  return (
    <div className={dark ? "bg-[#0a0a0f] min-h-screen text-white" : "bg-gray-50 min-h-screen text-gray-900"}>
      <Navbar dark={dark} onToggle={() => setDark(!dark)} />
      <Hero />
      <About />
      <Projects />
      <section id="contact" className="px-4 md:px-6 py-16 max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold mb-6">Contacto</h2>
        <ContactForm />
      </section>
    </div>
  );
}
`;

const APP_L15 = `import { useState } from "react";
import Hero from "./components/Hero.jsx";
import Navbar from "./components/Navbar.jsx";
import About from "./components/About.jsx";
import Projects from "./components/Projects.jsx";
import ContactForm from "./components/ContactForm.jsx";
import ProjectModal from "./components/ProjectModal.jsx";

export default function App() {
  const [dark, setDark] = useState(true);
  const [modalProject, setModalProject] = useState(null);

  return (
    <div className={dark ? "bg-[#0a0a0f] min-h-screen text-white" : "bg-gray-50 min-h-screen text-gray-900"}>
      <Navbar dark={dark} onToggle={() => setDark(!dark)} />
      <Hero />
      <About />
      <Projects onOpenProject={setModalProject} />
      <section id="contact" className="px-4 md:px-6 py-16 max-w-2xl mx-auto reveal">
        <h2 className="text-3xl font-bold mb-6">Contacto</h2>
        <ContactForm />
      </section>
      <ProjectModal project={modalProject} onClose={() => setModalProject(null)} />
    </div>
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
      "src/App.jsx": APP_L9,
      "src/components/Navbar.jsx": NAVBAR_THEME,
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
  { n: 14, files: { "src/index.css": INDEX_CSS_REVEAL } },
  {
    n: 15,
    files: {
      "src/App.jsx": APP_L15,
      "src/components/ProjectModal.jsx": PROJECT_MODAL,
    },
  },
];

// 16–29: mantienen estado del 15 hasta ampliar curriculum
for (let n = 16; n <= 29; n++) {
  milestones.push({ n, files: {} });
}

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
