import { createReadStream, existsSync, readdirSync, statSync } from "fs";
import { join } from "path";
import { PassThrough } from "stream";
import archiver from "archiver";

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "target",
  ".next",
]);

function resolveTealcodeDir(): string {
  const candidates = [
    join(process.cwd(), "tealcode"),
    join(process.cwd(), ".next", "standalone", "tealcode"),
  ];
  for (const dir of candidates) {
    if (existsSync(dir)) return dir;
  }
  throw new Error("Carpeta tealcode no encontrada");
}

function addDirectory(
  archive: archiver.Archiver,
  dirPath: string,
  zipPath: string
) {
  if (!existsSync(dirPath)) return;

  for (const entry of readdirSync(dirPath)) {
    if (SKIP_DIRS.has(entry)) continue;

    const fullPath = join(dirPath, entry);
    const entryZipPath = zipPath ? `${zipPath}/${entry}` : entry;

    if (statSync(fullPath).isDirectory()) {
      addDirectory(archive, fullPath, entryZipPath);
    } else {
      archive.append(createReadStream(fullPath), { name: entryZipPath });
    }
  }
}

export async function buildTealcodeSourceZip(): Promise<Buffer> {
  const root = resolveTealcodeDir();
  const archive = archiver("zip", { zlib: { level: 9 } });
  const stream = new PassThrough();
  const chunks: Buffer[] = [];

  const done = new Promise<Buffer>((resolve, reject) => {
    stream.on("data", (chunk: Buffer) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
    archive.on("error", reject);
  });

  archive.pipe(stream);
  addDirectory(archive, root, "tealcode");
  await archive.finalize();
  return done;
}
