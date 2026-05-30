import { createReadStream, existsSync, readdirSync, statSync } from "fs";
import { join } from "path";
import { PassThrough } from "stream";
import type Archiver from "archiver";

const TEMPLATE_DIR = join(process.cwd(), "templates", "react-starter");

function addDirectory(archive: Archiver.Archiver, dirPath: string, zipPath: string) {
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

export async function buildTemplateZip(studentToken: string): Promise<Buffer> {
  if (!existsSync(TEMPLATE_DIR)) {
    throw new Error(`Plantilla no encontrada: ${TEMPLATE_DIR}`);
  }

  const apiBaseUrl = getCourseApiBaseUrl();
  const courseConfig = JSON.stringify({ studentToken, apiBaseUrl }, null, 2);

  const archiverModule = await import("archiver");
  const archiver =
    (archiverModule as { default: typeof archiverModule.default }).default ??
    archiverModule;

  return new Promise((resolve, reject) => {
    const passthrough = new PassThrough();
    const chunks: Buffer[] = [];

    passthrough.on("data", (chunk: Buffer) => chunks.push(chunk));
    passthrough.on("end", () => resolve(Buffer.concat(chunks)));
    passthrough.on("error", reject);

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.on("error", reject);
    archive.pipe(passthrough);

    addDirectory(archive, TEMPLATE_DIR, "");

    archive.append(courseConfig, { name: "course.config.json" });

    const levelsPath = join(process.cwd(), "courses", "react", "levels.js");
    if (existsSync(levelsPath)) {
      archive.append(createReadStream(levelsPath), {
        name: "course-levels.js",
      });
    }

    archive.finalize();
  });
}
