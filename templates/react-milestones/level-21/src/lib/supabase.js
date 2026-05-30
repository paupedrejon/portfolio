/** Cliente Supabase opcional — requiere npm install @supabase/supabase-js */

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export function isSupabaseConfigured() {
  return Boolean(url && anonKey);
}

/** Placeholder: conecta aquí cuando instales @supabase/supabase-js */
export async function fetchProjectsFromSupabase() {
  if (!isSupabaseConfigured()) return null;
  // import { createClient } from "@supabase/supabase-js";
  // const supabase = createClient(url, anonKey);
  // const { data } = await supabase.from("projects").select("*");
  // return data;
  return null;
}
