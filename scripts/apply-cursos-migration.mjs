/**
 * Aplica supabase/migrations/001_cursos.sql usando conexión directa a Postgres.
 *
 * Uso (una vez):
 *   1. Supabase → Project Settings → Database → Connection string → URI
 *   2. Añade a .env.local: SUPABASE_DB_URL=postgresql://postgres.[ref]:[PASSWORD]@...
 *   3. node scripts/apply-cursos-migration.mjs
 */
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

async function main() {
  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) {
    console.error(
      "Falta SUPABASE_DB_URL en el entorno.\n" +
        "Cópiala de Supabase → Settings → Database → Connection string (URI).\n" +
        "O ejecuta el SQL manualmente en SQL Editor: supabase/migrations/001_cursos.sql"
    );
    process.exit(1);
  }

  const { default: pg } = await import("pg");
  const sql = readFileSync(
    join(root, "supabase", "migrations", "001_cursos.sql"),
    "utf8"
  );

  const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query(sql);
    console.log("✓ Migración 001_cursos aplicada correctamente.");
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
