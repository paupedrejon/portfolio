export default function App() {
  return (
    <>
      <header className="fixed top-0 w-full z-50 bg-[#0a0a0f]/90 backdrop-blur border-b border-white/10">
        <nav className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
          <a href="#" className="text-white font-bold">Mi Portfolio</a>
          <div className="flex gap-4 text-sm">
            <a href="#about" className="text-gray-300 hover:text-white">Sobre mí</a>
            <a href="#projects" className="text-gray-300 hover:text-white">Proyectos</a>
          </div>
        </nav>
      </header>
      <main className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center px-4 md:px-6 pt-20">
        <h1 className="text-center text-white text-4xl md:text-5xl font-bold">Hello World</h1>
        <p className="text-gray-300 mt-4 text-center max-w-md">Desarrollador web en formación</p>
        <button type="button" className="mt-6 px-6 py-3 rounded-full bg-[#2a8ca0] text-white font-semibold">
          Ver proyectos
        </button>
      </main>
      <section id="about" className="px-4 md:px-6 py-16 max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold mb-4">Sobre mí</h2>
        <p className="text-gray-600 leading-relaxed">Soy estudiante de desarrollo web.</p>
      </section>
      <section id="projects" className="px-4 md:px-6 py-16 max-w-5xl mx-auto section-anchor">
        <h2 className="text-3xl font-bold mb-8">Proyectos</h2>
        <p className="text-gray-500">Próximamente.</p>
      </section>
    </>
  );
}
