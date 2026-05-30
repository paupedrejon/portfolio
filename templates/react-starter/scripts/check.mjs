import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { chromium } from "@playwright/test";
import { checks, getCheck } from "./checks/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";

function loadConfig() {
  const path = join(root, "course.config.json");
  if (!existsSync(path)) {
    console.error(`${RED}No se encontró course.config.json${RESET}`);
    process.exit(1);
  }
  return JSON.parse(readFileSync(path, "utf8"));
}

function parseArgs() {
  const args = process.argv.slice(2);
  let levelOverride = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--level" && args[i + 1]) {
      levelOverride = parseInt(args[i + 1], 10);
      i++;
    }
  }
  return { levelOverride };
}

async function fetchCurrentLevel(apiBaseUrl, token, levelOverride) {
  let url = `${apiBaseUrl.replace(/\/$/, "")}/api/cursos/react/current-level?token=${encodeURIComponent(token)}`;
  if (levelOverride != null) {
    url += `&levelId=${levelOverride}`;
  }
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `API ${res.status}`);
  }
  return res.json();
}

async function postVerify(apiBaseUrl, token, levelId, results) {
  const url = `${apiBaseUrl.replace(/\/$/, "")}/api/cursos/react/levels/${levelId}/verify`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, results }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Verify API ${res.status}`);
  }
  return data;
}

async function startDevServer() {
  const { spawn } = await import("child_process");
  return new Promise((resolve, reject) => {
    const proc = spawn("npm", ["run", "dev"], {
      cwd: root,
      shell: true,
      stdio: "pipe",
      env: { ...process.env, FORCE_COLOR: "0" },
    });
    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) reject(new Error("Timeout esperando servidor Vite"));
    }, 120000);

    const checkReady = async () => {
      try {
        const r = await fetch("http://127.0.0.1:5173/");
        if (r.ok && !resolved) {
          resolved = true;
          clearTimeout(timeout);
          resolve(proc);
        }
      } catch {
        /* not ready */
      }
    };

    const interval = setInterval(checkReady, 500);
    proc.on("error", (e) => {
      clearInterval(interval);
      reject(e);
    });
    proc.stderr?.on("data", () => {});
    proc.stdout?.on("data", () => {});
  });
}

async function main() {
  const config = loadConfig();
  const { levelOverride } = parseArgs();

  if (!config.studentToken || config.studentToken === "REEMPLAZAR_AL_DESCARGAR") {
    console.error(`${RED}Token de alumno no configurado. Descarga la plantilla desde la web del curso.${RESET}`);
    process.exit(1);
  }

  console.log(`\n${BOLD}Curso de React — Corrector automático${RESET}\n`);

  let levelData;
  try {
    levelData = await fetchCurrentLevel(
      config.apiBaseUrl,
      config.studentToken,
      levelOverride
    );
  } catch (e) {
    console.error(`${RED}Error al obtener nivel:${RESET}`, e.message);
    process.exit(1);
  }

  const levelId = levelOverride ?? levelData.levelId;
  if (levelData.courseCompleted && !levelOverride) {
    console.log(`${GREEN}¡Has completado todos los niveles! 🎉${RESET}\n`);
    process.exit(0);
  }

  const checkpoints = levelData.checkpoints ?? [];

  if (!checkpoints?.length) {
    console.log(`${YELLOW}No hay checkpoints para el nivel ${levelId}${RESET}`);
    process.exit(0);
  }

  console.log(`${DIM}Nivel ${levelId}${RESET} — ${checkpoints.length} puntos\n`);

  console.log(`${DIM}Arrancando servidor de desarrollo...${RESET}`);
  let devProc;
  try {
    devProc = await startDevServer();
  } catch (e) {
    console.error(`${RED}No se pudo arrancar Vite:${RESET}`, e.message);
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const results = [];
  let allPassed = true;

  try {
    await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });

    for (const cp of checkpoints) {
      const fn = getCheck(cp.id);
      let outcome;
      try {
        outcome = await fn(page);
      } catch (err) {
        outcome = { passed: false, hint: err.message };
      }

      if (outcome.skipped) {
        console.log(`  ${YELLOW}○${RESET} ${cp.label} ${DIM}(pendiente)${RESET}`);
        results.push({ checkpointId: cp.id, passed: false });
        allPassed = false;
        continue;
      }

      results.push({ checkpointId: cp.id, passed: outcome.passed });
      if (outcome.passed) {
        console.log(`  ${GREEN}✓${RESET} ${cp.label}`);
      } else {
        allPassed = false;
        const hint = outcome.hint ? ` ${DIM}(encontrado: ${outcome.hint})${RESET}` : "";
        console.log(`  ${RED}✗${RESET} ${cp.label}${hint}`);
      }
    }
  } finally {
    await browser.close();
    devProc?.kill?.("SIGTERM");
  }

  console.log("");

  try {
    const verify = await postVerify(
      config.apiBaseUrl,
      config.studentToken,
      levelId,
      results
    );

    if (verify.levelPassed) {
      console.log(`${GREEN}${BOLD}¡Nivel ${levelId} superado!${RESET}`);
      if (verify.nextLevelId) {
        console.log(`${DIM}Siguiente: nivel ${verify.nextLevelId}${RESET}`);
      }
      if (verify.courseCompleted) {
        console.log(`${GREEN}${BOLD}¡CURSO COMPLETADO! Obtén tu diploma en la web.${RESET}`);
      }
    } else {
      console.log(`${YELLOW}Nivel no superado aún. Corrige los puntos en rojo y vuelve a ejecutar npm run check${RESET}`);
    }
  } catch (e) {
    console.error(`${RED}Error al enviar veredicto:${RESET}`, e.message);
    process.exit(1);
  }

  console.log("");
  process.exit(allPassed ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
