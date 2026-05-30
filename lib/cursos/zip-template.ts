import {
  createReadStream,
  existsSync,
  readdirSync,
  statSync,
  mkdirSync,
  copyFileSync,
  rmSync,
  writeFileSync,
} from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { PassThrough } from "stream";
import archiver from "archiver";

function resolveTemplateDir(): string {
  const candidates = [
    join(process.cwd(), "templates", "react-starter"),
    join(process.cwd(), ".next", "standalone", "templates", "react-starter"),
  ];
  for (const dir of candidates) {
    if (existsSync(dir)) return dir;
  }
  return candidates[0];
}

function resolveMilestonesDir(): string {
  const candidates = [
    join(process.cwd(), "templates", "react-milestones"),
    join(process.cwd(), ".next", "standalone", "templates", "react-milestones"),
  ];
  for (const dir of candidates) {
    if (existsSync(dir)) return dir;
  }
  return candidates[0];
}

function addDirectory(
  archive: archiver.Archiver,
  dirPath: string,
  zipPath: string
) {
  if (!existsSync(dirPath)) return;

  for (const entry of readdirSync(dirPath)) {
    if (entry === "node_modules" || entry === ".git" || entry === "dist") {
      continue;
    }
    const fullPath = join(dirPath, entry);
    const entryZipPath = zipPath ? `${zipPath}/${entry}` : entry;

    if (statSync(fullPath).isDirectory()) {
      addDirectory(archive, fullPath, entryZipPath);
    } else {
      archive.append(createReadStream(fullPath), { name: entryZipPath });
    }
  }
}

/** Copia recursiva simple (sin node_modules) */
function copyDirRecursive(src: string, dest: string) {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src)) {
    if (entry === "node_modules" || entry === ".git" || entry === "dist") continue;
    const s = join(src, entry);
    const d = join(dest, entry);
    if (statSync(s).isDirectory()) copyDirRecursive(s, d);
    else copyFileSync(s, d);
  }
}

/**
 * Aplica snapshots acumulados: level-01 .. level-NN sobre una copia temporal del starter.
 * @param {string} tempRoot
 * @param {number} upToMilestone 0 = solo starter; 2 = tras completar nivel 2
 */
function applyMilestonesToDir(tempRoot: string, upToMilestone: number) {
  const milestonesDir = resolveMilestonesDir();
  for (let i = 1; i <= upToMilestone; i++) {
    const folder = join(
      milestonesDir,
      `level-${String(i).padStart(2, "0")}`
    );
    if (!existsSync(folder)) continue;
    copyDirRecursive(folder, tempRoot);
  }
}

export function getCourseApiBaseUrl(): string {
  if (process.env.COURSE_API_BASE_URL) {
    return process.env.COURSE_API_BASE_URL.replace(/\/$/, "");
  }
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

/** Materializa la plantilla del curso (starter + milestones) en un directorio. */
export function materializeCourseTemplate(
  destRoot: string,
  options: { afterLevel?: number } = {}
): void {
  const TEMPLATE_DIR = resolveTemplateDir();
  if (!existsSync(TEMPLATE_DIR)) {
    throw new Error(`Plantilla no encontrada: ${TEMPLATE_DIR}`);
  }

  const afterLevel = options.afterLevel ?? 0;
  const milestoneUpTo = Math.max(0, Math.min(29, afterLevel - 1));

  copyDirRecursive(TEMPLATE_DIR, destRoot);
  applyMilestonesToDir(destRoot, milestoneUpTo);
}

/**
 * @param studentToken Token del alumno
 * @param options.afterLevel Nivel del curso en el que descarga: zip = estado tras completar (afterLevel - 1). Default 0 = starter vacío.
 */
export async function buildTemplateZip(
  studentToken: string,
  options: { afterLevel?: number } = {}
): Promise<Buffer> {
  const TEMPLATE_DIR = resolveTemplateDir();
  if (!existsSync(TEMPLATE_DIR)) {
    throw new Error(`Plantilla no encontrada: ${TEMPLATE_DIR}`);
  }

  const afterLevel = options.afterLevel ?? 0;
  const milestoneUpTo = Math.max(0, Math.min(29, afterLevel - 1));

  const tempRoot = join(
    tmpdir(),
    `react-starter-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );

  try {
    materializeCourseTemplate(tempRoot, { afterLevel });

    const apiBaseUrl = getCourseApiBaseUrl();
    const courseConfig = JSON.stringify(
      {
        studentToken,
        apiBaseUrl,
        starterLevel: afterLevel,
        milestoneApplied: milestoneUpTo,
      },
      null,
      2
    );
    writeFileSync(join(tempRoot, "course.config.json"), courseConfig, "utf8");

    const levelsPath = join(process.cwd(), "courses", "react", "levels.js");
    if (existsSync(levelsPath)) {
      copyFileSync(levelsPath, join(tempRoot, "course-levels.js"));
    }

    return await new Promise((resolve, reject) => {
      const passthrough = new PassThrough();
      const chunks: Buffer[] = [];

      passthrough.on("data", (chunk: Buffer) => chunks.push(chunk));
      passthrough.on("end", () => resolve(Buffer.concat(chunks)));
      passthrough.on("error", reject);

      const archive = archiver("zip", { zlib: { level: 9 } });
      archive.on("error", reject);
      archive.pipe(passthrough);

      addDirectory(archive, tempRoot, "");
      archive.finalize();
    });
  } finally {
    try {
      rmSync(tempRoot, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
}
