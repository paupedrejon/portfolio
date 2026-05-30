import { spawn } from "child_process";

/**
 * Arranca npm de forma compatible con Windows (evita spawn EINVAL en Node 22+).
 */
export function spawnNpm(args, options = {}) {
  const { cwd, stdio = "inherit", env, windowsHide } = options;
  return spawn("npm", args, {
    cwd,
    shell: true,
    stdio,
    env: env ? { ...process.env, ...env } : process.env,
    windowsHide: windowsHide ?? false,
  });
}
