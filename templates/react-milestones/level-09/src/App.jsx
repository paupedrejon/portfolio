import { useState } from "react";
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
