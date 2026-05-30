import { buildTemplateZip } from "../lib/cursos/zip-template.ts";
import { writeFileSync } from "fs";

async function main() {
  const z1 = await buildTemplateZip("test-token", { afterLevel: 1 });
  const z2 = await buildTemplateZip("test-token", { afterLevel: 2 });
  console.log("zip nivel 1 (starter):", z1.length, "bytes");
  console.log("zip nivel 2 (tras L1):", z2.length, "bytes");
  if (z1.length === z2.length) {
    console.warn("ADVERTENCIA: mismos tamaños — revisar milestones");
  } else {
    console.log("OK: zips distintos");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
