import { useState, useEffect } from "react";
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
