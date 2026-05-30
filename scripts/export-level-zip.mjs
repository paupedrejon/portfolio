import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { buildTemplateZip } from "../lib/cursos/zip-template.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "downloads");
const levelId = 17; // milestones 1–16 = portfolio con routing (referencia nivel 16+)

async function main() {
  mkdirSync(outDir, { recursive: true });
  const buffer = await buildTemplateZip("preview-download-no-token", {
    afterLevel: levelId,
  });
  const filename = `react-portfolio-nivel-16-con-routing.zip`;
  const outPath = join(outDir, filename);
  writeFileSync(outPath, buffer);
  console.log(`Guardado: ${outPath}`);
  console.log(`Tamaño: ${buffer.length} bytes`);
  console.log(
    `(Equivalente a descargar plantilla en nivel ${levelId} = código tras completar nivel ${levelId - 1})`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
