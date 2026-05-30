/**
 * Marca todos los niveles del curso React como superados para todos los alumnos.
 * Uso: node scripts/max-cursos-progress.mjs
 * Requiere .env.local con SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY
 */
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import { levels } from "../courses/react/levels.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const COURSE = "react";

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

function completedCheckpointsForLevel(levelId) {
  const level = levels.find((l) => l.id === levelId);
  if (!level) return {};
  const completed = {};
  for (const cp of level.checkpoints) {
    completed[cp.id] = true;
  }
  return completed;
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

async function main() {
  const { data: profiles, error: profilesErr } = await supabase
    .from("profiles")
    .select("user_id, display_name");

  if (profilesErr) throw profilesErr;

  if (!profiles?.length) {
    console.log("No hay perfiles de alumnos.");
    return;
  }

  const now = new Date().toISOString();
  const rows = [];

  for (const profile of profiles) {
    for (const level of levels) {
      rows.push({
        user_id: profile.user_id,
        course_slug: COURSE,
        level_id: level.id,
        completed_checkpoints: completedCheckpointsForLevel(level.id),
        passed: true,
        passed_at: now,
      });
    }
  }

  console.log(`Curso: ${COURSE}`);
  console.log(`Alumnos: ${profiles.length}`);
  console.log(`Niveles: ${levels.length}`);
  console.log(`Filas a upsert: ${rows.length}`);

  const chunkSize = 100;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase.from("level_progress").upsert(chunk, {
      onConflict: "user_id,course_slug,level_id",
    });
    if (error) throw error;
  }

  for (const profile of profiles) {
    const name = profile.display_name?.trim() || "Alumno";
    const { error } = await supabase.from("diplomas").upsert(
      {
        user_id: profile.user_id,
        course_slug: COURSE,
        name_on_diploma: name,
        issued_at: now,
      },
      { onConflict: "user_id,course_slug" }
    );
    if (error) throw error;
  }

  console.log("\n✓ Todos los alumnos están al nivel máximo (curso completado).");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
