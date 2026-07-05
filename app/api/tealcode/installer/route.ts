import { createReadStream, existsSync, readdirSync, statSync } from "fs";
import { join } from "path";
import { NextResponse } from "next/server";
import { Readable } from "stream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INSTALLER_NAME = "PauStudio-setup.exe";

/** Encuentra el setup.exe más reciente en bundle/nsis (PauStudio_X.Y.Z_x64-setup.exe). */
function findLatestNsisBundle(cwd: string): string | null {
  const nsisDir = join(
    cwd,
    "tealcode",
    "src-tauri",
    "target",
    "release",
    "bundle",
    "nsis"
  );
  if (!existsSync(nsisDir)) return null;

  const files = readdirSync(nsisDir).filter(
    (f) =>
      /^PauStudio_\d+\.\d+\.\d+_x64-setup\.exe$/i.test(f) ||
      /^PauStudio-setup\.exe$/i.test(f)
  );
  if (files.length === 0) return null;

  const scored = files
    .map((f) => {
      const m = f.match(/PauStudio_(\d+)\.(\d+)\.(\d+)_/i);
      const ver = m
        ? parseInt(m[1], 10) * 10000 +
          parseInt(m[2], 10) * 100 +
          parseInt(m[3], 10)
        : 0;
      const full = join(nsisDir, f);
      return { full, ver, mtime: statSync(full).mtimeMs };
    })
    .sort((a, b) => b.ver - a.ver || b.mtime - a.mtime);

  return scored[0]?.full ?? null;
}

function resolveInstallerPath(): string {
  const cwd = process.cwd();
  const candidates = [
    join(cwd, "public", "downloads", INSTALLER_NAME),
    findLatestNsisBundle(cwd),
    join(
      cwd,
      "tealcode",
      "src-tauri",
      "target",
      "release",
      "bundle",
      "nsis",
      "PauStudio_0.8.2_x64-setup.exe"
    ),
    join(
      cwd,
      ".next",
      "standalone",
      "public",
      "downloads",
      INSTALLER_NAME
    ),
  ].filter((p): p is string => !!p && existsSync(p));

  if (candidates.length > 0) return candidates[0];

  throw new Error(
    "Instalador no encontrado. Ejecuta: cd tealcode && npm run release"
  );
}

export async function GET() {
  try {
    const filePath = resolveInstallerPath();
    const { size } = statSync(filePath);
    const stream = createReadStream(filePath);
    const webStream = Readable.toWeb(stream) as ReadableStream;

    return new NextResponse(webStream, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${INSTALLER_NAME}"`,
        "Content-Length": String(size),
        "X-PauStudio-Installer-Source": filePath.split(/[/\\]/).pop() ?? "",
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al descargar instalador";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
