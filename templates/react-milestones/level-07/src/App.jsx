import Hero from "./components/Hero.jsx";
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
