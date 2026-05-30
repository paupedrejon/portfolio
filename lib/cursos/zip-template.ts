import { createReadStream, existsSync, readdirSync, statSync } from "fs";
import { join } from "path";
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
  const TEMPLATE_DIR = resolveTemplateDir();
  if (!existsSync(TEMPLATE_DIR)) {
    throw new Error(`Plantilla no encontrada: ${TEMPLATE_DIR}`);
  }

  const apiBaseUrl = getCourseApiBaseUrl();
  const courseConfig = JSON.stringify({ studentToken, apiBaseUrl }, null, 2);

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
