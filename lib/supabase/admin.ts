import { createClient, SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | null = null;

/** Normaliza URL de Supabase (sin /rest/v1 ni barra final). */
export function normalizeSupabaseUrl(raw?: string): string | null {
  if (!raw?.trim()) return null;
  return raw
    .trim()
    .replace(/\/$/, "")
    .replace(/\/rest\/v1\/?$/i, "");
}

export function getSupabaseAdmin(): SupabaseClient {
  const url = normalizeSupabaseUrl(process.env.SUPABASE_URL);
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar configurados"
    );
  }

  if (!adminClient) {
    adminClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  return adminClient;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}
