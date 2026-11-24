import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";

export type ProjectLikeCounts = Record<string, number>;

const LIKE_EVENT = "project_like";

type LikeRow = {
  project_slug?: string;
  session_id?: string | null;
  metadata?: { slug?: unknown } | null;
};

function slugFromRow(row: LikeRow): string {
  if (typeof row.project_slug === "string" && row.project_slug) {
    return row.project_slug;
  }
  const metaSlug = row.metadata?.slug;
  return typeof metaSlug === "string" ? metaSlug : "";
}

function aggregateCounts(rows: LikeRow[]): ProjectLikeCounts {
  /** session+slug → evita doble conteo si hay filas duplicadas */
  const seen = new Set<string>();
  const counts: ProjectLikeCounts = {};

  for (const row of rows) {
    const slug = slugFromRow(row);
    const session = typeof row.session_id === "string" ? row.session_id : "";
    if (!slug) continue;
    const key = `${slug}::${session || Math.random().toString(36)}`;
    if (session && seen.has(key)) continue;
    if (session) seen.add(key);
    counts[slug] = (counts[slug] ?? 0) + 1;
  }

  return counts;
}

async function readFromProjectLikesTable(slugs?: string[]) {
  const supabase = getSupabaseAdmin();
  let query = supabase.from("project_likes").select("project_slug, session_id");
  if (slugs && slugs.length > 0) {
    query = query.in("project_slug", slugs);
  }
  return query;
}

async function readFromAnalyticsEvents(slugs?: string[]) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("analytics_events")
    .select("session_id, metadata")
    .eq("event_type", LIKE_EVENT)
    .limit(20000);

  if (error) return { data: null, error };

  const rows = (data ?? []) as LikeRow[];
  if (!slugs || slugs.length === 0) {
    return { data: rows, error: null };
  }

  const allowed = new Set(slugs);
  return {
    data: rows.filter((row) => allowed.has(slugFromRow(row))),
    error: null,
  };
}

export async function getProjectLikeCounts(
  slugs?: string[],
): Promise<{ ok: boolean; counts: ProjectLikeCounts; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: true, counts: {} };
  }

  try {
    const tableResult = await readFromProjectLikesTable(slugs);
    if (!tableResult.error) {
      return {
        ok: true,
        counts: aggregateCounts((tableResult.data ?? []) as LikeRow[]),
      };
    }

    // Tabla dedicada aún no migrada → usar analytics_events (ya en prod)
    const fallback = await readFromAnalyticsEvents(slugs);
    if (fallback.error) {
      return { ok: false, counts: {}, error: fallback.error.message };
    }

    return { ok: true, counts: aggregateCounts(fallback.data ?? []) };
  } catch (err) {
    return {
      ok: false,
      counts: {},
      error: err instanceof Error ? err.message : "likes_error",
    };
  }
}

export async function getLikedSlugsForSession(
  sessionId: string,
): Promise<{ ok: boolean; liked: string[]; error?: string }> {
  if (!isSupabaseConfigured() || !sessionId) {
    return { ok: true, liked: [] };
  }

  try {
    const supabase = getSupabaseAdmin();

    const table = await supabase
      .from("project_likes")
      .select("project_slug")
      .eq("session_id", sessionId);

    if (!table.error) {
      const liked = (table.data ?? [])
        .map((row) => row.project_slug)
        .filter((slug): slug is string => typeof slug === "string");
      return { ok: true, liked };
    }

    const events = await supabase
      .from("analytics_events")
      .select("metadata")
      .eq("event_type", LIKE_EVENT)
      .eq("session_id", sessionId)
      .limit(500);

    if (events.error) {
      return { ok: false, liked: [], error: events.error.message };
    }

    const liked = [
      ...new Set(
        ((events.data ?? []) as LikeRow[])
          .map(slugFromRow)
          .filter(Boolean),
      ),
    ];
    return { ok: true, liked };
  } catch (err) {
    return {
      ok: false,
      liked: [],
      error: err instanceof Error ? err.message : "likes_error",
    };
  }
}

async function countSlug(slug: string): Promise<number> {
  const result = await getProjectLikeCounts([slug]);
  return result.counts[slug] ?? 0;
}

async function setLikeViaTable(params: {
  slug: string;
  sessionId: string;
  liked: boolean;
}): Promise<{ ok: boolean; error?: string; missingTable?: boolean }> {
  const supabase = getSupabaseAdmin();
  const { slug, sessionId, liked } = params;

  if (liked) {
    const { error } = await supabase.from("project_likes").upsert(
      { project_slug: slug, session_id: sessionId },
      { onConflict: "project_slug,session_id", ignoreDuplicates: true },
    );
    if (error) {
      const missing =
        error.code === "PGRST205" ||
        error.message.includes("schema cache") ||
        error.message.includes("does not exist") ||
        error.code === "42P01";
      return { ok: false, error: error.message, missingTable: missing };
    }
    return { ok: true };
  }

  const { error } = await supabase
    .from("project_likes")
    .delete()
    .eq("project_slug", slug)
    .eq("session_id", sessionId);

  if (error) {
    const missing =
      error.code === "PGRST205" ||
      error.message.includes("schema cache") ||
      error.message.includes("does not exist") ||
      error.code === "42P01";
    return { ok: false, error: error.message, missingTable: missing };
  }
  return { ok: true };
}

async function setLikeViaAnalytics(params: {
  slug: string;
  sessionId: string;
  liked: boolean;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabaseAdmin();
  const { slug, sessionId, liked } = params;

  const existing = await supabase
    .from("analytics_events")
    .select("id")
    .eq("event_type", LIKE_EVENT)
    .eq("session_id", sessionId)
    .contains("metadata", { slug })
    .limit(20);

  if (existing.error) {
    return { ok: false, error: existing.error.message };
  }

  const ids = (existing.data ?? [])
    .map((row) => (row as { id?: number | string }).id)
    .filter((id): id is number | string => id != null);

  if (liked) {
    if (ids.length > 0) return { ok: true };
    const { error } = await supabase.from("analytics_events").insert({
      event_type: LIKE_EVENT,
      path: `/proyectos/${slug}`,
      session_id: sessionId,
      metadata: { slug },
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }

  if (ids.length === 0) return { ok: true };
  const { error } = await supabase
    .from("analytics_events")
    .delete()
    .in("id", ids);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function setProjectLike(params: {
  slug: string;
  sessionId: string;
  liked: boolean;
}): Promise<{ ok: boolean; count: number; liked: boolean; error?: string }> {
  const { slug, sessionId, liked } = params;

  if (!isSupabaseConfigured()) {
    return { ok: false, count: 0, liked: false, error: "supabase_not_configured" };
  }

  try {
    const viaTable = await setLikeViaTable(params);
    if (!viaTable.ok) {
      if (!viaTable.missingTable) {
        return { ok: false, count: 0, liked: false, error: viaTable.error };
      }
      const viaEvents = await setLikeViaAnalytics(params);
      if (!viaEvents.ok) {
        return { ok: false, count: 0, liked: false, error: viaEvents.error };
      }
    }

    const count = await countSlug(slug);
    return { ok: true, count, liked };
  } catch (err) {
    return {
      ok: false,
      count: 0,
      liked: false,
      error: err instanceof Error ? err.message : "likes_error",
    };
  }
}
