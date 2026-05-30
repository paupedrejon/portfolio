/** Milestones 17–29: estado tras completar cada nivel (importado por generate-react-milestones.mjs) */

export const USE_FETCH = `import { useEffect, useState } from "react";

/** Hook reutilizable para peticiones GET */
export default function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(url));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error("Error al cargar");
        return r.json();
      })
      .then((json) => {
        if (!cancelled) {
          setData(json);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e.message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  return { data, loading, error };
}
`;

export const PROJECTS_USEFETCH = `import ProjectCard from "./ProjectCard.jsx";
import useFetch from "../hooks/useFetch.js";
import { getExtraProjects } from "../lib/projectsStore.js";

export default function Projects({ onOpenProject }) {
  const { data: base, loading, error } = useFetch("/projects.json");
  const extras = getExtraProjects();
  const projects = base ? [...base, ...extras] : extras;

  return (
    <section id="projects" className="px-4 md:px-6 py-16 max-w-5xl mx-auto">
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

export const THEME_CONTEXT = `import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  }, [dark]);

  const toggle = () => setDark((value) => !value);

  return (
    <ThemeContext.Provider value={{ dark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme debe usarse dentro de ThemeProvider");
  return ctx;
}
`;

export const MAIN_WITH_THEME = `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import App from "./App.jsx";
import "./index.css";

document.documentElement.setAttribute("data-theme", "dark");

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
`;

export const NAVBAR_CONTEXT = `import { Link, useLocation, useNavigate } from "react-router-dom";
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
`;

export const APP_L18 = `import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import HomePage from "./pages/HomePage.jsx";
import ProjectsPage from "./pages/ProjectsPage.jsx";
import ContactPage from "./pages/ContactPage.jsx";
import ProjectModal from "./components/ProjectModal.jsx";
import { useScrollReveal } from "./hooks/useScrollReveal.js";
import { useState } from "react";

export default function App() {
  const [modalProject, setModalProject] = useState(null);
  useScrollReveal();

  return (
    <div className="min-h-screen theme-page">
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/proyectos" element={<ProjectsPage onOpenProject={setModalProject} />} />
        <Route path="/contacto" element={<ContactPage />} />
      </Routes>
      <ProjectModal project={modalProject} onClose={() => setModalProject(null)} />
    </div>
  );
}
`;

export const INDEX_HTML_SEO = `<!DOCTYPE html>
<html lang="es" data-theme="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Portfolio de desarrollo web — proyectos React, contacto y demo de routing." />
    <title>Mi Portfolio — Curso de React</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`;

export const HOME_PAGE_MAIN = `import Hero from "../components/Hero.jsx";
import About from "../components/About.jsx";

export default function HomePage() {
  return (
    <main>
      <Hero />
      <About />
    </main>
  );
}
`;

export const PROJECTS_PAGE_MAIN = `import PageHero from "../components/PageHero.jsx";
import Projects from "../components/Projects.jsx";

export default function ProjectsPage({ onOpenProject }) {
  return (
    <main>
      <PageHero
        title="Proyectos"
        subtitle="Apps y experimentos que he ido construyendo mientras aprendo."
        videoSrc="https://cdn.coverr.co/videos/coverr-a-man-typing-on-a-computer-5256/1080p.mp4"
      />
      <Projects onOpenProject={onOpenProject} />
    </main>
  );
}
`;

export const CONTACT_PAGE_MAIN = `import PageHero from "../components/PageHero.jsx";
import ContactForm from "../components/ContactForm.jsx";

export default function ContactPage() {
  return (
    <main>
      <PageHero
        title="Contacto"
        subtitle="Cuéntame tu idea — te responderé en cuanto pueda."
      />
      <section className="px-4 md:px-6 py-12 max-w-xl mx-auto">
        <div className="theme-surface border rounded-2xl p-6 md:p-8">
          <ContactForm />
        </div>
      </section>
    </main>
  );
}
`;

export const LOGIN_PAGE = `import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHero from "../components/PageHero.jsx";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo iniciar sesión");
      localStorage.setItem("auth-token", data.token);
      navigate("/admin");
    } catch (err) {
      setError(err.message || "Error de conexión con el servidor de auth");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <PageHero title="Login" subtitle="Demo: demo@curso.dev / curso123" />
      <section className="px-4 md:px-6 py-12 max-w-md mx-auto">
        <form onSubmit={handleSubmit} className="theme-surface border rounded-2xl p-6 space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium theme-text mb-1.5">Email</label>
            <input
              id="login-email"
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="theme-input rounded-lg px-3 py-2.5 w-full"
              autoComplete="email"
              required
            />
          </div>
          <div>
            <label htmlFor="login-password" className="block text-sm font-medium theme-text mb-1.5">Contraseña</label>
            <input
              id="login-password"
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="theme-input rounded-lg px-3 py-2.5 w-full"
              autoComplete="current-password"
              required
            />
          </div>
          {error && (
            <p className="text-red-500 text-sm" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 rounded-full theme-accent-btn font-semibold disabled:opacity-60"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </section>
    </main>
  );
}
`;

export const AUTH_API = `import { createServer } from "http";
import { randomUUID } from "crypto";

const PORT = Number(process.env.AUTH_API_PORT || 8787);

const DEMO_USER = {
  email: "demo@curso.dev",
  password: "curso123",
};

const sessions = new Map();

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

function json(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

createServer(async (req, res) => {
  const url = new URL(req.url, \`http://localhost:\${PORT}\`);

  if (url.pathname === "/api/login" && req.method === "POST") {
    try {
      const { email, password } = await readBody(req);
      if (email === DEMO_USER.email && password === DEMO_USER.password) {
        const token = randomUUID();
        sessions.set(token, { email, createdAt: Date.now() });
        return json(res, 200, { ok: true, token, user: { email } });
      }
      return json(res, 401, { ok: false, error: "Email o contraseña incorrectos" });
    } catch {
      return json(res, 400, { ok: false, error: "Petición inválida" });
    }
  }

  if (url.pathname === "/api/me" && req.method === "GET") {
    const auth = req.headers.authorization || "";
    const token = auth.replace(/^Bearer\\s+/i, "");
    const session = sessions.get(token);
    if (!session) return json(res, 401, { ok: false, error: "No autenticado" });
    return json(res, 200, { ok: true, user: { email: session.email } });
  }

  if (url.pathname === "/api/health" && req.method === "GET") {
    return json(res, 200, { ok: true });
  }

  json(res, 404, { ok: false, error: "No encontrado" });
}).listen(PORT, () => {
  console.log(
    \`\\x1b[36m[auth-api]\\x1b[0m http://localhost:\${PORT} — demo: \${DEMO_USER.email} / \${DEMO_USER.password}\\n\`
  );
});
`;

export const VITE_CONFIG_AUTH = `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
    },
  },
});
`;

export const APP_L20 = `import { Routes, Route } from "react-router-dom";
import { useState } from "react";
import Navbar from "./components/Navbar.jsx";
import HomePage from "./pages/HomePage.jsx";
import ProjectsPage from "./pages/ProjectsPage.jsx";
import ContactPage from "./pages/ContactPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import ProjectModal from "./components/ProjectModal.jsx";
import { useScrollReveal } from "./hooks/useScrollReveal.js";

export default function App() {
  const [modalProject, setModalProject] = useState(null);
  useScrollReveal();

  return (
    <div className="min-h-screen theme-page">
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/proyectos" element={<ProjectsPage onOpenProject={setModalProject} />} />
        <Route path="/contacto" element={<ContactPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
      <ProjectModal project={modalProject} onClose={() => setModalProject(null)} />
    </div>
  );
}
`;

export const ENV_EXAMPLE = `# Copia a .env.local y rellena (no subas .env a git)
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
VITE_SITE_URL=http://localhost:5173
`;

export const SUPABASE_LIB = `/** Cliente Supabase opcional — requiere npm install @supabase/supabase-js */

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export function isSupabaseConfigured() {
  return Boolean(url && anonKey);
}

/** Placeholder: conecta aquí cuando instales @supabase/supabase-js */
export async function fetchProjectsFromSupabase() {
  if (!isSupabaseConfigured()) return null;
  // import { createClient } from "@supabase/supabase-js";
  // const supabase = createClient(url, anonKey);
  // const { data } = await supabase.from("projects").select("*");
  // return data;
  return null;
}
`;

export const PROJECTS_STORE = `const STORAGE_KEY = "portfolio-projects-extra";

export function getExtraProjects() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addProject(project) {
  const list = getExtraProjects();
  list.push({
    id: Date.now(),
    title: project.title,
    description: project.description,
    image: project.image ?? "/projects/landing.svg",
    imageAlt: project.imageAlt ?? project.title,
    tech: project.tech ?? ["Demo"],
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  return list;
}
`;

export const ADMIN_PAGE = `import { useState } from "react";
import PageHero from "../components/PageHero.jsx";
import { addProject } from "../lib/projectsStore.js";

export default function AdminPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState("");

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    setImageFile(file ?? null);
    setPreview(file ? URL.createObjectURL(file) : "");
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!name.trim()) return;
    addProject({
      title: name.trim(),
      description: description.trim() || "Proyecto añadido desde el panel admin.",
      image: preview || "/projects/landing.svg",
      imageAlt: name.trim(),
      tech: ["Nuevo"],
    });
    setName("");
    setDescription("");
    setImageFile(null);
    setPreview("");
    alert("Proyecto guardado en localStorage (demo)");
  }

  return (
    <main>
      <PageHero title="Admin" subtitle="Añade proyectos de demo al portfolio." />
      <section className="px-4 md:px-6 py-12 max-w-xl mx-auto">
        <form onSubmit={handleSubmit} className="theme-surface border rounded-2xl p-6 space-y-4">
          <div>
            <label htmlFor="admin-name" className="block text-sm font-medium theme-text mb-1.5">Título</label>
            <input
              id="admin-name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="theme-input rounded-lg px-3 py-2.5 w-full"
            />
          </div>
          <div>
            <label htmlFor="admin-desc" className="block text-sm font-medium theme-text mb-1.5">Descripción</label>
            <textarea
              id="admin-desc"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="theme-input rounded-lg px-3 py-2.5 w-full"
            />
          </div>
          <div>
            <label htmlFor="admin-image" className="block text-sm font-medium theme-text mb-1.5">Imagen</label>
            <input
              id="admin-image"
              type="file"
              name="image"
              accept="image/*"
              onChange={handleFileChange}
              className="theme-input rounded-lg px-3 py-2 w-full"
            />
            {preview ? (
              <img src={preview} alt="Vista previa del proyecto" className="mt-3 rounded-lg aspect-video object-cover w-full" />
            ) : null}
          </div>
          <button type="submit" className="px-6 py-3 rounded-full theme-accent-btn font-semibold">
            Guardar proyecto
          </button>
        </form>
      </section>
    </main>
  );
}
`;

export const APP_L22 = `import { Routes, Route } from "react-router-dom";
import { useState } from "react";
import Navbar from "./components/Navbar.jsx";
import HomePage from "./pages/HomePage.jsx";
import ProjectsPage from "./pages/ProjectsPage.jsx";
import ContactPage from "./pages/ContactPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import ProjectModal from "./components/ProjectModal.jsx";
import { useScrollReveal } from "./hooks/useScrollReveal.js";

export default function App() {
  const [modalProject, setModalProject] = useState(null);
  useScrollReveal();

  return (
    <div className="min-h-screen theme-page">
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/proyectos" element={<ProjectsPage onOpenProject={setModalProject} />} />
        <Route path="/contacto" element={<ContactPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
      <ProjectModal project={modalProject} onClose={() => setModalProject(null)} />
    </div>
  );
}
`;

export const CONTACT_FORM_PERSIST = `import { useState } from "react";
import { saveContactMessage } from "../lib/contactStore.js";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);

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
    saveContactMessage({ name, email, message });
    setSent(true);
    setName("");
    setEmail("");
    setMessage("");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 w-full" noValidate>
      {sent ? (
        <p className="text-green-500 text-sm" role="status">Mensaje guardado (demo local).</p>
      ) : null}
      <div>
        <label htmlFor="contact-name" className="block text-sm font-medium theme-text mb-1.5">Nombre</label>
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
        <label htmlFor="contact-email" className="block text-sm font-medium theme-text mb-1.5">Email</label>
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
        <label htmlFor="contact-message" className="block text-sm font-medium theme-text mb-1.5">Mensaje</label>
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

export const CONTACT_STORE = `const KEY = "portfolio-contact-messages";

export function saveContactMessage({ name, email, message }) {
  const list = JSON.parse(localStorage.getItem(KEY) || "[]");
  list.push({ name, email, message, at: new Date().toISOString() });
  localStorage.setItem(KEY, JSON.stringify(list));
}
`;

export const ENV_EXAMPLE_FULL = `# Variables del portfolio (copia a .env.local)
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
VITE_SITE_URL=http://localhost:5173
VITE_ANALYTICS_ID=
`;

export const PACKAGE_JSON_FINAL = `{
  "name": "react-portfolio-curso",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "node scripts/dev-with-check.mjs",
    "dev:only": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
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
    "@testing-library/react": "^16.3.0",
    "@vitejs/plugin-react": "^4.3.4",
    "@tailwindcss/vite": "^4.1.0",
    "jsdom": "^26.1.0",
    "tailwindcss": "^4.1.0",
    "vite": "^6.2.0",
    "vitest": "^3.2.0"
  }
}
`;

export const VITEST_CONFIG = `import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
  },
});
`;

export const PROJECT_CARD_TEST = `import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ProjectCard from "./ProjectCard.jsx";

describe("ProjectCard", () => {
  it("muestra título y descripción", () => {
    render(
      <ProjectCard
        title="Demo"
        description="Descripción de prueba"
        image="/projects/portfolio.svg"
        imageAlt="Demo"
        tech={["React"]}
      />
    );
    expect(screen.getByText("Demo")).toBeTruthy();
    expect(screen.getByText("Descripción de prueba")).toBeTruthy();
  });
});
`;

export const APP_LAZY = `import { lazy, Suspense, useState } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import HomePage from "./pages/HomePage.jsx";
import ProjectsPage from "./pages/ProjectsPage.jsx";
import ContactPage from "./pages/ContactPage.jsx";
import ProjectModal from "./components/ProjectModal.jsx";
import { useScrollReveal } from "./hooks/useScrollReveal.js";

const LoginPage = lazy(() => import("./pages/LoginPage.jsx"));
const AdminPage = lazy(() => import("./pages/AdminPage.jsx"));

export default function App() {
  const [modalProject, setModalProject] = useState(null);
  useScrollReveal();

  return (
    <div className="min-h-screen theme-page">
      <Navbar />
      <Suspense fallback={<p className="p-10 text-center theme-text-muted">Cargando…</p>}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/proyectos" element={<ProjectsPage onOpenProject={setModalProject} />} />
          <Route path="/contacto" element={<ContactPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </Suspense>
      <ProjectModal project={modalProject} onClose={() => setModalProject(null)} />
    </div>
  );
}
`;

export const INDEX_HTML_ANALYTICS = `<!DOCTYPE html>
<html lang="es" data-theme="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Portfolio de desarrollo web — proyectos React, contacto y demo de routing." />
    <title>Mi Portfolio — Curso de React</title>
    <!-- Analytics demo: sustituye por tu script (Plausible, GA, etc.) -->
    <!-- <script defer data-domain="tu-dominio.com" src="https://plausible.io/js/script.js"></script> -->
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`;

export const README_FINAL = `# Portfolio — Curso React (completado)

Portfolio multi-página con routing, tema claro/oscuro, proyectos con imágenes, panel admin demo, tests y CI.

## URL pública

https://mi-portfolio-demo.vercel.app

## Scripts

\`\`\`bash
npm install
npm run dev      # http://localhost:5173
npm run check    # corrector del curso
npm test         # Vitest
npm run build    # build producción
\`\`\`

## Variables de entorno

Copia \`.env.example\` a \`.env.local\`. Supabase es opcional.

## Rutas

- \`/\` — Home
- \`/proyectos\` — Grid con fetch + localStorage
- \`/contacto\` — Formulario persistente (demo)
- \`/login\` — Login con API local (\`demo@curso.dev\` / \`curso123\`)
- \`/admin\` — Añadir proyectos (demo)

## Login (desarrollo)

\`npm run dev\` arranca Vite y el servidor de auth en \`http://localhost:8787\`. Las peticiones a \`/api/*\` se redirigen por proxy.
`;

export const CI_WORKFLOW = `name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run build
`;

/** @returns {{ n: number; files: Record<string, string> }[]} */
export function getMilestones17to29() {
  return [
    {
      n: 17,
      files: {
        "src/hooks/useFetch.js": USE_FETCH,
        "src/lib/projectsStore.js": PROJECTS_STORE,
        "src/components/Projects.jsx": PROJECTS_USEFETCH,
      },
    },
    {
      n: 18,
      files: {
        "src/context/ThemeContext.jsx": THEME_CONTEXT,
        "src/main.jsx": MAIN_WITH_THEME,
        "src/App.jsx": APP_L18,
        "src/components/Navbar.jsx": NAVBAR_CONTEXT,
      },
    },
    {
      n: 19,
      files: {
        "index.html": INDEX_HTML_SEO,
        "src/pages/HomePage.jsx": HOME_PAGE_MAIN,
        "src/pages/ProjectsPage.jsx": PROJECTS_PAGE_MAIN,
        "src/pages/ContactPage.jsx": CONTACT_PAGE_MAIN,
      },
    },
    {
      n: 20,
      files: {
        "server/auth-api.mjs": AUTH_API,
        "vite.config.js": VITE_CONFIG_AUTH,
        "src/pages/LoginPage.jsx": LOGIN_PAGE,
        "src/App.jsx": APP_L20,
      },
    },
    {
      n: 21,
      files: {
        ".env.example": ENV_EXAMPLE,
        "src/lib/supabase.js": SUPABASE_LIB,
      },
    },
    {
      n: 22,
      files: {
        "src/pages/AdminPage.jsx": ADMIN_PAGE,
        "src/App.jsx": APP_L22,
      },
    },
    { n: 23, files: {} },
    {
      n: 24,
      files: {
        "src/lib/contactStore.js": CONTACT_STORE,
        "src/components/ContactForm.jsx": CONTACT_FORM_PERSIST,
      },
    },
    { n: 25, files: { ".env.example": ENV_EXAMPLE_FULL } },
    {
      n: 26,
      files: {
        "package.json": PACKAGE_JSON_FINAL,
        "vitest.config.js": VITEST_CONFIG,
        "src/components/ProjectCard.test.jsx": PROJECT_CARD_TEST,
      },
    },
    { n: 27, files: { "src/App.jsx": APP_LAZY } },
    {
      n: 28,
      files: {
        "index.html": INDEX_HTML_ANALYTICS,
        "README.md": README_FINAL,
      },
    },
    { n: 29, files: { ".github/workflows/ci.yml": CI_WORKFLOW } },
  ];
}
