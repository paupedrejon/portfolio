import { spawn } from "child_process";
import { spawnVite, projectRoot } from "./spawn-vite.mjs";
import { chromium } from "@playwright/test";
import { getCheck } from "./checks/index.js";

export { projectRoot };
export const DEFAULT_PORT = 5173;

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";

export const colors = { GREEN, RED, YELLOW, DIM, RESET, BOLD };

export async function isServerReady(port = DEFAULT_PORT) {
  const hosts = [`http://127.0.0.1:${port}/`, `http://localhost:${port}/`];
  for (const url of hosts) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(2500) });
      if (r.status < 500) return { ready: true, url: url.replace(/\/$/, "") };
    } catch {
      /* try next */
    }
  }
  return { ready: false, url: null };
}

/**
 * Usa el servidor Vite si ya está corriendo (npm run dev); si no, lo arranca.
 */
export async function ensureDevServer(port = DEFAULT_PORT) {
  const existing = await isServerReady(port);
  if (existing.ready) {
    return { proc: null, baseUrl: existing.url, startedByUs: false };
  }

  return new Promise((resolve, reject) => {
    const proc = spawnVite({
      stdio: ["ignore", "pipe", "pipe"],
      env: { FORCE_COLOR: "0", BROWSER: "none" },
      windowsHide: true,
    });

    let resolved = false;
    let detectedPort = port;

    const fail = (err) => {
      if (resolved) return;
      resolved = true;
      clearInterval(poll);
      clearTimeout(hardTimeout);
      try {
        proc.kill("SIGTERM");
      } catch {
        /* ignore */
      }
      reject(err);
    };

    const tryResolve = async () => {
      const check = await isServerReady(detectedPort);
      if (check.ready && !resolved) {
        resolved = true;
        clearInterval(poll);
        clearTimeout(hardTimeout);
        resolve({ proc, baseUrl: check.url, startedByUs: true });
      }
    };

    const onData = (chunk) => {
      const text = chunk.toString();
      const m = text.match(/Local:\s+https?:\/\/(?:127\.0\.0\.1|localhost):(\d+)/i);
      if (m) detectedPort = parseInt(m[1], 10);
      if (/ready in \d+/i.test(text) || /Local:/i.test(text)) {
        tryResolve();
      }
    };

    proc.stdout?.on("data", onData);
    proc.stderr?.on("data", onData);
    proc.on("error", fail);

    const poll = setInterval(tryResolve, 800);
    const hardTimeout = setTimeout(
      () => fail(new Error("Timeout esperando servidor Vite. ¿Tienes otra app en el puerto 5173? Cierra otras terminales o ejecuta: npm run dev")),
      180000
    );
  });
}

export function stopDevServer(proc) {
  if (!proc) return;
  try {
    if (process.platform === "win32") {
      spawn("taskkill", ["/pid", String(proc.pid), "/f", "/t"], { shell: true });
    } else {
      proc.kill("SIGTERM");
    }
  } catch {
    /* ignore */
  }
}

export async function runLevelChecks({ baseUrl, checkpoints, quiet = false }) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const results = [];
  let allPassed = true;

  try {
    await page.goto(`${baseUrl}/`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await page.waitForTimeout(500);

    for (const cp of checkpoints) {
      const fn = getCheck(cp.id);
      let outcome;
      try {
        outcome = fn ? await fn(page) : { passed: false, hint: "Check no implementado" };
      } catch (err) {
        outcome = { passed: false, hint: err.message };
      }

      if (outcome.skipped) {
        if (!quiet) {
          console.log(`  ${YELLOW}○${RESET} ${cp.label} ${DIM}(pendiente)${RESET}`);
        }
        results.push({ checkpointId: cp.id, passed: false });
        allPassed = false;
        continue;
      }

      results.push({ checkpointId: cp.id, passed: outcome.passed });
      if (!quiet) {
        if (outcome.passed) {
          console.log(`  ${GREEN}✓${RESET} ${cp.label}`);
        } else {
          allPassed = false;
          const hint = outcome.hint ? ` ${DIM}(${outcome.hint})${RESET}` : "";
          console.log(`  ${RED}✗${RESET} ${cp.label}${hint}`);
        }
      } else if (!outcome.passed) {
        allPassed = false;
      }
    }
  } finally {
    await browser.close();
  }

  return { results, allPassed };
}
