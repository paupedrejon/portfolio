import { buildTemplateZip } from "../lib/cursos/zip-template.ts";
import { writeFileSync } from "fs";

async function main() {
  const z1 = await buildTemplateZip("test-token", { afterLevel: 1 });
  const z2 = await buildTemplateZip("test-token", { afterLevel: 2 });
  const z7 = await buildTemplateZip("test-token", { afterLevel: 7 });
  const z8 = await buildTemplateZip("test-token", { afterLevel: 8 });
  console.log("zip nivel 1 (starter):", z1.length, "bytes");
  console.log("zip nivel 2 (tras L1):", z2.length, "bytes");
  console.log("zip nivel 7 (tras L6):", z7.length, "bytes");
  console.log("zip nivel 8 (tras L7):", z8.length, "bytes");
  const sizes = [z1.length, z2.length, z7.length, z8.length];
  const unique = new Set(sizes).size;
  if (unique < sizes.length) {
    console.warn("ADVERTENCIA: algunos zips tienen el mismo tamaño");
  } else {
    console.log("OK: zips con tamaños distintos");
  }
  if (z8.length <= z7.length) {
    console.warn("ADVERTENCIA: zip nivel 8 debería ser mayor que 7 (más archivos)");
  } else {
    console.log("OK: zip 8 > zip 7 (componentes Projects)");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
