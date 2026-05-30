import { useState, useEffect } from "react";
import Hero from "./components/Hero.jsx";
import Navbar from "./components/Navbar.jsx";
import About from "./components/About.jsx";
import Projects from "./components/Projects.jsx";

export default function App() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <div className="min-h-screen theme-page">
      <Navbar dark={dark} onToggle={() => setDark(!dark)} />
      <Hero />
      <About />
      <Projects />
    </div>
  );
}
