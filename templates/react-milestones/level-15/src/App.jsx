import { useState, useEffect } from "react";
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
