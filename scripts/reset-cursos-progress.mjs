/**
 * Borra todo el progreso del curso React (y diplomas) de todos los alumnos.
 * Uso: node scripts/reset-cursos-progress.mjs
 * Requiere .env.local con SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY
 */
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  const path = join(root, ".env.local");
  if (!existsSync(path)) {
    console.error("No se encontró .env.local");
    process.exit(1);
  }
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnv();

const url = process.env.SUPABASE_URL?.replace(/\/$/, "").replace(/\/rest\/v1\/?$/i, "");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const COURSE = "react";

async function countRows(table) {
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq("course_slug", COURSE);
  if (error) throw error;
  return count ?? 0;
}

async function main() {
  const beforeProgress = await countRows("level_progress");
  const beforeDiplomas = await countRows("diplomas");

  console.log(`Curso: ${COURSE}`);
  console.log(`Filas level_progress: ${beforeProgress}`);
  console.log(`Filas diplomas: ${beforeDiplomas}`);

  const { error: errProgress } = await supabase
    .from("level_progress")
    .delete()
    .eq("course_slug", COURSE);

  if (errProgress) throw errProgress;

  const { error: errDiplomas } = await supabase
    .from("diplomas")
    .delete()
    .eq("course_slug", COURSE);

  if (errDiplomas) throw errDiplomas;

  const afterProgress = await countRows("level_progress");
  const afterDiplomas = await countRows("diplomas");

  console.log("\n✓ Progreso reiniciado para todos los alumnos.");
  console.log(`  level_progress: ${beforeProgress} → ${afterProgress}`);
  console.log(`  diplomas: ${beforeDiplomas} → ${afterDiplomas}`);
  console.log("\nPerfiles y tokens de descarga se mantienen.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
