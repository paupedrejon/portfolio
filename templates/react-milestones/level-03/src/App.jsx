export default function App() {
  return (
    <>
      <main className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center px-4 md:px-6">
        <h1 className="text-center text-white text-4xl md:text-5xl font-bold">Hello World</h1>
        <p className="text-gray-300 mt-4 text-center max-w-md">Desarrollador web en formación</p>
        <button type="button" className="mt-6 px-6 py-3 rounded-full bg-[#2a8ca0] text-white font-semibold">
          Ver proyectos
        </button>
      </main>
      <section id="about" className="px-4 md:px-6 py-16 max-w-2xl mx-auto bg-white">
        <h2 className="text-3xl font-bold mb-4">Sobre mí</h2>
        <p className="text-gray-600 leading-relaxed">
          Soy estudiante de desarrollo web. Me apasiona React y construir proyectos.
        </p>
      </section>
    </>
  );
}
