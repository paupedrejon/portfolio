export default function Hero() {
  return (
    <main className="min-h-screen theme-hero-bg flex flex-col items-center justify-center px-4 md:px-6 pt-20">
      <h1 className="text-center theme-text text-4xl md:text-5xl font-bold">Hello World</h1>
      <p className="theme-text-secondary mt-4 text-center max-w-md">Desarrollador web en formación</p>
      <a
        href="#projects"
        className="mt-6 px-6 py-3 rounded-full theme-accent-btn font-semibold inline-block"
      >
        Ver proyectos
      </a>
    </main>
  );
}
