import { watch, readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { runCheckOnce } from "./check.mjs";
import { isServerReady, colors } from "./check-core.mjs";

const { DIM, RESET, YELLOW } = colors;
const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadConfig() {
  const path = join(root, "course.config.json");
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf8"));
}

let debounceTimer = null;
let running = false;

async function triggerCheck() {
  if (running) return;
  const config = loadConfig();
  if (!config?.studentToken || config.studentToken === "REEMPLAZAR_AL_DESCARGAR") {
    return;
  }

  const server = await isServerReady();
  if (!server.ready) {
    console.log(
      `${YELLOW}Esperando a que arranque Vite (npm run dev)...${RESET}`
    );
    return;
  }

  running = true;
  try {
    console.log(`\n${DIM}[auto-check] Revisando cambios...${RESET}`);
    await runCheckOnce({ config, quiet: true });
    console.log(`${DIM}[auto-check] Hecho. Sigue programando.${RESET}\n`);
  } catch (e) {
    console.log(`${YELLOW}[auto-check] ${e.message}${RESET}\n`);
  } finally {
    running = false;
  }
}

function scheduleCheck() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(triggerCheck, 2500);
}

export function startWatchCheck() {
  const srcDir = join(root, "src");
  console.log(
    `${DIM}Auto-check activo: guarda archivos en src/ y el progreso se enviará solo.${RESET}\n`
  );

  watch(srcDir, { recursive: true }, (_, file) => {
    if (file && !/\.(jsx?|tsx?|css)$/.test(file)) return;
    scheduleCheck();
  });

  // Primera comprobación tras dar tiempo a Vite
  setTimeout(triggerCheck, 8000);
  setInterval(async () => {
    const server = await isServerReady();
    if (server.ready) scheduleCheck();
  }, 20000);
}

const isMain = process.argv[1]?.includes("watch-check");
if (isMain) {
  startWatchCheck();
}
