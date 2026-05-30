/**
 * Genera templates/react-milestones/level-NN con el código acumulado tras cada nivel.
 * Ejecutar: node scripts/generate-react-milestones.mjs
 */
import { mkdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outBase = join(root, "templates", "react-milestones");

const APP_L1 = `export default function App() {
  return (
    <main className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center">
      <h1 className="text-center text-white text-4xl md:text-5xl font-bold">Hello World</h1>
    </main>
  );
}
`;

const APP_L2 = `export default function App() {
  return (
    <main className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center px-6">
      <h1 className="text-center text-white text-4xl md:text-5xl font-bold">Hello World</h1>
      <p className="text-gray-300 mt-4 text-center max-w-md">Desarrollador web en formación</p>
      <button
        type="button"
        className="mt-6 px-6 py-3 rounded-full bg-[#2a8ca0] text-white font-semibold"
      >
        Ver proyectos
      </button>
    </main>
  );
}
`;

const APP_L3 = `export default function App() {
  return (
    <>
      <main className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center px-6">
        <h1 className="text-center text-white text-4xl md:text-5xl font-bold">Hello World</h1>
        <p className="text-gray-300 mt-4 text-center max-w-md">Desarrollador web en formación</p>
        <button
          type="button"
          className="mt-6 px-6 py-3 rounded-full bg-[#2a8ca0] text-white font-semibold"
        >
          Ver proyectos
        </button>
      </main>
      <section id="about" className="px-4 py-16 max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold mb-4">Sobre mí</h2>
        <p className="text-gray-600 leading-relaxed">
          Soy estudiante de desarrollo web. Me apasiona React y construir proyectos que
          demuestren lo que voy aprendiendo en el camino.
        </p>
      </section>
    </>
  );
}
`;

const APP_L4 = `export default function App() {
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
      <main className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center px-6 pt-20">
        <h1 className="text-center text-white text-4xl md:text-5xl font-bold">Hello World</h1>
        <p className="text-gray-300 mt-4 text-center max-w-md">Desarrollador web en formación</p>
        <button type="button" className="mt-6 px-6 py-3 rounded-full bg-[#2a8ca0] text-white font-semibold">
          Ver proyectos
        </button>
      </main>
      <section id="about" className="px-4 py-16 max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold mb-4">Sobre mí</h2>
        <p className="text-gray-600 leading-relaxed">
          Soy estudiante de desarrollo web. Me apasiona React y construir proyectos.
        </p>
      </section>
      <section id="projects" className="px-4 py-16 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold mb-8">Proyectos</h2>
        <p className="text-gray-500">Próximamente más proyectos.</p>
      </section>
    </>
  );
}
`;

const milestones = [
  { n: 1, files: { "src/App.jsx": APP_L1 } },
  { n: 2, files: { "src/App.jsx": APP_L2 } },
  { n: 3, files: { "src/App.jsx": APP_L3 } },
  { n: 4, files: { "src/App.jsx": APP_L4 } },
];

// Niveles 5+: copian el anterior hasta generar más variantes
for (let n = 5; n <= 29; n++) {
  const prev = milestones.find((m) => m.n === n - 1) ?? milestones[milestones.length - 1];
  milestones.push({ n, files: { ...prev.files } });
}

function writeMilestone({ n, files }) {
  const dir = join(outBase, `level-${String(n).padStart(2, "0")}`);
  mkdirSync(dir, { recursive: true });
  for (const [rel, content] of Object.entries(files)) {
    const filePath = join(dir, rel);
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, content, "utf8");
  }
}

for (const m of milestones) {
  writeMilestone(m);
  console.log("✓ milestone", m.n);
}

console.log(`\nGenerados ${milestones.length} milestones en ${outBase}`);
