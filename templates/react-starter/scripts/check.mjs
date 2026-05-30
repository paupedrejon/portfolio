import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import {
  projectRoot,
  colors,
  ensureDevServer,
  stopDevServer,
  runLevelChecks,
} from "./check-core.mjs";

const { GREEN, RED, YELLOW, DIM, RESET, BOLD } = colors;

function loadConfig() {
  const path = join(projectRoot, "course.config.json");
  if (!existsSync(path)) {
    console.error(`${RED}No se encontró course.config.json${RESET}`);
    process.exit(1);
  }
  return JSON.parse(readFileSync(path, "utf8"));
}

function parseArgs() {
  const args = process.argv.slice(2);
  let levelOverride = null;
  let quiet = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--level" && args[i + 1]) {
      levelOverride = parseInt(args[i + 1], 10);
      i++;
    }
    if (args[i] === "--quiet") quiet = true;
  }
  return { levelOverride, quiet };
}

async function fetchCurrentLevel(apiBaseUrl, token, levelOverride) {
  let url = `${apiBaseUrl.replace(/\/$/, "")}/api/cursos/react/current-level?token=${encodeURIComponent(token)}`;
  if (levelOverride != null) url += `&levelId=${levelOverride}`;
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
  if (!res.ok) throw new Error(data.error || `Verify API ${res.status}`);
  return data;
}

export async function runCheckOnce({ config, levelOverride, quiet = false } = {}) {
  const cfg = config ?? loadConfig();
  const levelData = await fetchCurrentLevel(
    cfg.apiBaseUrl,
    cfg.studentToken,
    levelOverride ?? null
  );

  const levelId = levelOverride ?? levelData.levelId;
  if (levelData.courseCompleted && levelOverride == null) {
    return { courseCompleted: true, levelId };
  }

  const checkpoints = levelData.checkpoints ?? [];
  if (!checkpoints.length) {
    return { levelId, skipped: true };
  }

  if (!quiet) {
    console.log(`\n${BOLD}Curso de React — Corrector automático${RESET}\n`);
    console.log(`${DIM}Nivel ${levelId}${RESET} — ${checkpoints.length} pasos\n`);
  }

  let devProc = null;
  let startedByUs = false;
  let baseUrl;

  try {
    if (!quiet) console.log(`${DIM}Comprobando tu proyecto...${RESET}`);
    const server = await ensureDevServer();
    devProc = server.proc;
    startedByUs = server.startedByUs;
    baseUrl = server.baseUrl;

    const { results, allPassed } = await runLevelChecks({
      baseUrl,
      checkpoints,
      quiet,
    });

    if (!quiet) console.log("");

    const verify = await postVerify(cfg.apiBaseUrl, cfg.studentToken, levelId, results);

    if (!quiet) {
      if (verify.levelPassed) {
        console.log(`${GREEN}${BOLD}¡Nivel ${levelId} superado!${RESET}`);
        if (verify.nextLevelId) {
          console.log(`${DIM}Siguiente: nivel ${verify.nextLevelId}${RESET}`);
        }
        if (verify.courseCompleted) {
          console.log(
            `${GREEN}${BOLD}¡CURSO COMPLETADO! Obtén tu diploma en la web.${RESET}`
          );
        }
      } else {
        console.log(
          `${YELLOW}Sigue los pasos en la web del curso. El progreso se actualiza solo.${RESET}`
        );
      }
      console.log("");
    }

    return { levelId, allPassed, verify, results };
  } finally {
    if (startedByUs) stopDevServer(devProc);
  }
}

async function main() {
  const config = loadConfig();
  const { levelOverride, quiet } = parseArgs();

  if (
    !config.studentToken ||
    config.studentToken === "REEMPLAZAR_AL_DESCARGAR"
  ) {
    console.error(
      `${RED}Token no configurado. Descarga la plantilla desde la web del curso.${RESET}`
    );
    process.exit(1);
  }

  try {
    const out = await runCheckOnce({ config, levelOverride, quiet });
    if (out.courseCompleted) {
      console.log(`${GREEN}¡Has completado todos los niveles! 🎉${RESET}\n`);
      process.exit(0);
    }
    if (out.skipped) {
      console.log(`${YELLOW}No hay pasos para este nivel${RESET}`);
      process.exit(0);
    }
    process.exit(out.allPassed ? 0 : 1);
  } catch (e) {
    console.error(`${RED}Error:${RESET}`, e.message);
    process.exit(1);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
