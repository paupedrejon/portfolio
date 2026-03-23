/**
 * Graba rutas reales de Study Agents en móvil (Playwright → WebM).
 *
 * Uso:
 * 1) Levanta Next (otra terminal): npm run dev
 * 2) npm run record-exact-promos (o node scripts/record-study-agents-exact-promos.mjs)
 *
 * Salida:
 * public/study-agents-promo/exports/promo-exact-<variant>.webm
 */

import { chromium } from "playwright";
import { mkdirSync, renameSync, readdirSync, statSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const outDir = path.join(
  root,
  "public",
  "study-agents-promo",
  "exports"
);

const BASE =
  process.env.PROMO_URL?.replace(/\/$/, "") || "http://127.0.0.1:3000";

// iPhone-like viewport para activar modo móvil en StudyChat
const VIEWPORT = { width: 390, height: 844 };
const CLIPS = [
  // Mantengo la misma filosofía de duración que record-study-promos.mjs
  { path: "/study-agents-promo/exact/v1-notes", out: "promo-exact-v1-notes.webm", waitMs: 14000 + 3500 },
  { path: "/study-agents-promo/exact/v2-feedback", out: "promo-exact-v2-feedback.webm", waitMs: 15000 + 3500 },
  { path: "/study-agents-promo/exact/v3-exercise", out: "promo-exact-v3-exercise.webm", waitMs: 18000 + 3500 },
];

function newestWebm(dir) {
  if (!existsSync(dir)) return null;
  const files = readdirSync(dir).filter((f) => f.endsWith(".webm"));
  if (!files.length) return null;
  return files
    .map((f) => ({ f, t: statSync(path.join(dir, f)).mtimeMs }))
    .sort((a, b) => b.t - a.t)[0].f;
}

async function main() {
  mkdirSync(outDir, { recursive: true });
  console.log("Base URL:", BASE);
  console.log("Viewport:", `${VIEWPORT.width}x${VIEWPORT.height}`);
  console.log("Salida:", outDir);
  console.log("");

  const browser = await chromium.launch({ headless: true });

  for (const clip of CLIPS) {
    const url = `${BASE}${clip.path}`;
    console.log("Grabando:", url);

    const context = await browser.newContext({
      viewport: VIEWPORT,
      deviceScaleFactor: 1,
      recordVideo: {
        dir: outDir,
        size: VIEWPORT,
      },
    });

    const page = await context.newPage();
    try {
      await page.goto(url, { waitUntil: "load", timeout: 120000 });
    } catch (err) {
      await context.close();
      console.error("Error al cargar:", url, err);
      throw err;
    }

    await new Promise((r) => setTimeout(r, clip.waitMs));
    await context.close();

    const produced = newestWebm(outDir);
    if (!produced) {
      console.warn("  (!) No se encontró .webm recién generado.");
      continue;
    }

    const from = path.join(outDir, produced);
    const to = path.join(outDir, clip.out);
    if (from !== to) {
      renameSync(from, to);
    }
    console.log("  →", clip.out);
  }

  await browser.close();
  console.log("\nListo (promos exactas).");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

