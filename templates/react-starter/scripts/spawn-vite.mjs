import { spawn } from "child_process";
import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");

function viteBinPath() {
  const bin = join(projectRoot, "node_modules", "vite", "bin", "vite.js");
  if (!existsSync(bin)) {
    throw new Error("Vite no instalado. Ejecuta: npm install");
  }
  return bin;
}

/** Arranca Vite con Node (fiable en Windows y rutas con espacios). */
export function spawnVite(options = {}) {
  const { cwd = projectRoot, stdio = "inherit", env } = options;
  return spawn(process.execPath, [viteBinPath()], {
    cwd,
    stdio,
    env: env ? { ...process.env, ...env } : process.env,
    windowsHide: options.windowsHide ?? false,
  });
}

export { projectRoot };
