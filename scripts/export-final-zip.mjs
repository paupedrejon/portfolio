import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { buildTemplateZip } from "../lib/cursos/zip-template.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "downloads");

/** Zip tras completar nivel 30 = milestones 1–29 acumulados */
const afterLevel = 30;

async function main() {
  mkdirSync(outDir, { recursive: true });
  const buffer = await buildTemplateZip("preview-download-no-token", { afterLevel });
  const filename = "react-portfolio-curso-completo-nivel-30.zip";
  const outPath = join(outDir, filename);
  writeFileSync(outPath, buffer);
  console.log(`Guardado: ${outPath}`);
  console.log(`Tamaño: ${buffer.length} bytes`);
  console.log("(Portfolio completo tras finalizar el curso — nivel 30)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
