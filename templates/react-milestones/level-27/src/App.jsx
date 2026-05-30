import { lazy, Suspense, useState } from "react";
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
