import { spawnVite } from "./spawn-vite.mjs";
import { spawnAuthApi } from "./spawn-auth-api.mjs";
import { startWatchCheck } from "./watch-check.mjs";

console.log("\n\x1b[1mCurso de React — Modo desarrollo\x1b[0m\n");
console.log(
  "\x1b[2m1) Se abre tu app en el navegador\x1b[0m\n\x1b[2m2) Cada vez que guardes, se comprueba el nivel automáticamente\x1b[0m\n"
);

const authApi = spawnAuthApi({ stdio: "inherit" });

const vite = spawnVite({
  stdio: "inherit",
  env: { BROWSER: "default" },
});

vite.on("error", (err) => {
  console.error("\n\x1b[31mNo se pudo arrancar Vite:\x1b[0m", err.message);
  console.error("Ejecuta antes: npm install\n");
  process.exit(1);
});

startWatchCheck();

vite.on("exit", (code) => process.exit(code ?? 0));

process.on("SIGINT", () => {
  try {
    vite.kill();
    authApi?.kill();
  } catch {
    /* ignore */
  }
  process.exit(0);
});
