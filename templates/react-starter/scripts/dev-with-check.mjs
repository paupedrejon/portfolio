import { spawn } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { startWatchCheck } from "./watch-check.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const isWin = process.platform === "win32";

console.log("\n\x1b[1mCurso de React — Modo desarrollo\x1b[0m\n");
console.log(
  "\x1b[2m1) Se abre tu app en el navegador\x1b[0m\n\x1b[2m2) Cada vez que guardes, se comprueba el nivel automáticamente\x1b[0m\n"
);

const vite = spawn(isWin ? "npm.cmd" : "npm", ["run", "dev:only"], {
  cwd: root,
  shell: false,
  stdio: "inherit",
  env: { ...process.env, BROWSER: "default" },
});

startWatchCheck();

vite.on("exit", (code) => process.exit(code ?? 0));

process.on("SIGINT", () => {
  vite.kill("SIGTERM");
  process.exit(0);
});
