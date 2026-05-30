import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  rmSync,
  cpSync,
  existsSync,
} from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";
import { materializeCourseTemplate } from "../lib/cursos/zip-template.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const DEMO_BASE = "/cursos/react-demo/";
const outDir = join(root, "public", "cursos", "react-demo");
const workDir = join(root, ".tmp-react-demo-build");

function patchUseFetch(dir) {
  const path = join(dir, "src", "hooks", "useFetch.js");
  if (!existsSync(path)) return;
  let src = readFileSync(path, "utf8");
  if (!src.includes("import.meta.env.BASE_URL")) {
    src = src.replace(
      "fetch(url)",
      'fetch(url.startsWith("/") ? `${import.meta.env.BASE_URL}${url.slice(1)}` : url)'
    );
    writeFileSync(path, src, "utf8");
  }
}

function patchProjectsJson(dir) {
  const jsonPath = join(dir, "public", "projects.json");
  if (!existsSync(jsonPath)) return;
  const base = DEMO_BASE.replace(/\/$/, "");
  const data = JSON.parse(readFileSync(jsonPath, "utf8"));
  const patched = data.map((p) => ({
    ...p,
    image:
      typeof p.image === "string" && p.image.startsWith("/")
        ? `${base}${p.image}`
        : p.image,
  }));
  writeFileSync(jsonPath, JSON.stringify(patched, null, 2), "utf8");
}

function patchViteConfig(dir) {
  const path = join(dir, "vite.config.js");
  let src = readFileSync(path, "utf8");
  if (!src.includes("base:")) {
    src = src.replace(
      "export default defineConfig({",
      `export default defineConfig({\n  base: "${DEMO_BASE}",`
    );
    writeFileSync(path, src, "utf8");
  }
}

function patchMainJsx(dir) {
  const path = join(dir, "src", "main.jsx");
  let src = readFileSync(path, "utf8");
  if (!src.includes("basename=")) {
    src = src.replace(
      "<BrowserRouter>",
      `<BrowserRouter basename="${DEMO_BASE.replace(/\/$/, "")}">`
    );
    writeFileSync(path, src, "utf8");
  }
}

function run(cmd, args, cwd) {
  const result = spawnSync(cmd, args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    throw new Error(`${cmd} ${args.join(" ")} falló con código ${result.status}`);
  }
}

async function main() {
  console.log("Generando portfolio demo (nivel 30)…");
  rmSync(workDir, { recursive: true, force: true });
  mkdirSync(workDir, { recursive: true });

  materializeCourseTemplate(workDir, { afterLevel: 30 });
  patchViteConfig(workDir);
  patchMainJsx(workDir);
  patchUseFetch(workDir);
  patchProjectsJson(workDir);

  console.log("Instalando dependencias del demo…");
  run("npm", ["install", "--no-audit", "--no-fund"], workDir);

  console.log("Compilando demo con Vite…");
  run("npm", ["run", "build"], workDir);

  const distDir = join(workDir, "dist");
  if (!existsSync(join(distDir, "index.html"))) {
    throw new Error("Build sin index.html en dist/");
  }

  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(dirname(outDir), { recursive: true });
  cpSync(distDir, outDir, { recursive: true });

  rmSync(workDir, { recursive: true, force: true });
  console.log(`Demo publicado en public/cursos/react-demo/ (base ${DEMO_BASE})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
