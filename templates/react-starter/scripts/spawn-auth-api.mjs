import { spawn } from "child_process";
import { existsSync } from "fs";
import { join } from "path";
import { projectRoot } from "./spawn-vite.mjs";

/** Arranca el servidor de auth local si existe server/auth-api.mjs */
export function spawnAuthApi(options = {}) {
  const serverPath = join(projectRoot, "server", "auth-api.mjs");
  if (!existsSync(serverPath)) return null;

  return spawn(process.execPath, [serverPath], {
    cwd: projectRoot,
    stdio: options.stdio ?? "inherit",
    env: options.env ? { ...process.env, ...options.env } : process.env,
    windowsHide: options.windowsHide ?? false,
  });
}
