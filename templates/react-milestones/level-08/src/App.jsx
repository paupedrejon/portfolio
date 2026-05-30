import Hero from "./components/Hero.jsx";
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
