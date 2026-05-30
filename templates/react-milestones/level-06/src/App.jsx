import Hero from "./components/Hero.jsx";
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
