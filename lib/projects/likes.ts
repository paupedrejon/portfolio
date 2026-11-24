import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";

export type ProjectLikeCounts = Record<string, number>;

export async function getProjectLikeCounts(
  slugs?: string[],
): Promise<{ ok: boolean; counts: ProjectLikeCounts; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: true, counts: {} };
  }

  try {
    const supabase = getSupabaseAdmin();
    let query = supabase.from("project_likes").select("project_slug");

    if (slugs && slugs.length > 0) {
      query = query.in("project_slug", slugs);
    }

    const { data, error } = await query;
    if (error) {
      return { ok: false, counts: {}, error: error.message };
    }

    const counts: ProjectLikeCounts = {};
    for (const row of data ?? []) {
      const slug = typeof row.project_slug === "string" ? row.project_slug : "";
      if (!slug) continue;
      counts[slug] = (counts[slug] ?? 0) + 1;
    }

    return { ok: true, counts };
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
    const { data, error } = await supabase
      .from("project_likes")
      .select("project_slug")
      .eq("session_id", sessionId);

    if (error) {
      return { ok: false, liked: [], error: error.message };
    }

    const liked = (data ?? [])
      .map((row) => row.project_slug)
      .filter((slug): slug is string => typeof slug === "string");

    return { ok: true, liked };
  } catch (err) {
    return {
      ok: false,
      liked: [],
      error: err instanceof Error ? err.message : "likes_error",
    };
  }
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
    const supabase = getSupabaseAdmin();

    if (liked) {
      const { error } = await supabase.from("project_likes").upsert(
        { project_slug: slug, session_id: sessionId },
        { onConflict: "project_slug,session_id", ignoreDuplicates: true },
      );
      if (error) {
        return { ok: false, count: 0, liked: false, error: error.message };
      }
    } else {
      const { error } = await supabase
        .from("project_likes")
        .delete()
        .eq("project_slug", slug)
        .eq("session_id", sessionId);
      if (error) {
        return { ok: false, count: 0, liked: true, error: error.message };
      }
    }

    const { count, error: countError } = await supabase
      .from("project_likes")
      .select("*", { count: "exact", head: true })
      .eq("project_slug", slug);

    if (countError) {
      return { ok: true, count: 0, liked, error: countError.message };
    }

    return { ok: true, count: count ?? 0, liked };
  } catch (err) {
    return {
      ok: false,
      count: 0,
      liked: false,
      error: err instanceof Error ? err.message : "likes_error",
    };
  }
}
