import { Routes, Route } from "react-router-dom";
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
