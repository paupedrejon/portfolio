import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { COURSE_SLUG_REACT, TOTAL_LEVELS, getLevelById, levels } from "@/lib/cursos/levels";

export type LevelProgressRow = {
  level_id: number;
  completed_checkpoints: Record<string, boolean>;
  passed: boolean;
  passed_at: string | null;
};

export async function ensureProfile(
  userId: string,
  displayName?: string | null,
  avatarUrl?: string | null
) {
  const supabase = getSupabaseAdmin();
  const { data: existing } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!existing) {
    await supabase.from("profiles").insert({
      user_id: userId,
      display_name: displayName ?? null,
      avatar_url: avatarUrl ?? null,
    });
  }
}

export async function getProfile(userId: string) {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}

export async function getProgressRows(
  userId: string,
  courseSlug = COURSE_SLUG_REACT
): Promise<LevelProgressRow[]> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("level_progress")
    .select("level_id, completed_checkpoints, passed, passed_at")
    .eq("user_id", userId)
    .eq("course_slug", courseSlug);
  return (data ?? []) as LevelProgressRow[];
}

export async function getCurrentLevelId(
  userId: string,
  courseSlug = COURSE_SLUG_REACT
): Promise<number> {
  const rows = await getProgressRows(userId, courseSlug);
  const passedSet = new Set(rows.filter((r) => r.passed).map((r) => r.level_id));

  for (let i = 1; i <= TOTAL_LEVELS; i++) {
    if (!passedSet.has(i)) return i;
  }
  return TOTAL_LEVELS + 1;
}

export async function validateStudentToken(token: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("student_tokens")
    .select("token, user_id, course_slug, revoked_at")
    .eq("token", token)
    .maybeSingle();

  if (error || !data || data.revoked_at) return null;
  return data as {
    token: string;
    user_id: string;
    course_slug: string;
    revoked_at: string | null;
  };
}

export async function createStudentToken(
  userId: string,
  courseSlug = COURSE_SLUG_REACT
) {
  const supabase = getSupabaseAdmin();
  await ensureProfile(userId);

  const { data, error } = await supabase
    .from("student_tokens")
    .insert({ user_id: userId, course_slug: courseSlug })
    .select("token")
    .single();

  if (error) throw error;
  return data.token as string;
}

export function allCheckpointsPassed(
  levelId: number,
  completed: Record<string, boolean>
): boolean {
  const level = getLevelById(levelId);
  if (!level) return false;
  return level.checkpoints.every((c) => completed[c.id] === true);
}

export async function upsertLevelProgress(
  userId: string,
  courseSlug: string,
  levelId: number,
  completedCheckpoints: Record<string, boolean>
) {
  const supabase = getSupabaseAdmin();
  const passed = allCheckpointsPassed(levelId, completedCheckpoints);

  const { data: existing } = await supabase
    .from("level_progress")
    .select("passed, passed_at")
    .eq("user_id", userId)
    .eq("course_slug", courseSlug)
    .eq("level_id", levelId)
    .maybeSingle();

  const passedAt =
    passed && !existing?.passed ? new Date().toISOString() : existing?.passed_at ?? null;

  const { error } = await supabase.from("level_progress").upsert(
    {
      user_id: userId,
      course_slug: courseSlug,
      level_id: levelId,
      completed_checkpoints: completedCheckpoints,
      passed,
      passed_at: passed ? passedAt ?? new Date().toISOString() : null,
    },
    { onConflict: "user_id,course_slug,level_id" }
  );

  if (error) throw error;
  return passed;
}

export function buildProgressPayload(
  rows: LevelProgressRow[],
  displayName: string | null
) {
  const rowMap = new Map(rows.map((r) => [r.level_id, r]));
  const currentLevelId = (() => {
    for (let i = 1; i <= TOTAL_LEVELS; i++) {
      const row = rowMap.get(i);
      if (!row?.passed) return i;
    }
    return TOTAL_LEVELS + 1;
  })();

  const levelStates = levels.map((level) => {
    const row = rowMap.get(level.id);
    const checkpoints = level.checkpoints.map((cp) => ({
      id: cp.id,
      label: cp.label,
      passed: row?.completed_checkpoints?.[cp.id] === true,
    }));
    const passed = row?.passed === true;
    const status: "locked" | "current" | "passed" = passed
      ? "passed"
      : level.id === currentLevelId
        ? "current"
        : level.id > currentLevelId
          ? "locked"
          : "current";

    return {
      id: level.id,
      slug: level.slug,
      title: level.title,
      block: level.block,
      description: level.description,
      status,
      passed,
      passedAt: row?.passed_at ?? null,
      checkpoints,
    };
  });

  const passedCount = levelStates.filter((l) => l.passed).length;
  const courseCompleted = passedCount >= TOTAL_LEVELS;

  return {
    courseSlug: COURSE_SLUG_REACT,
    totalLevels: TOTAL_LEVELS,
    passedCount,
    progressPercent: Math.round((passedCount / TOTAL_LEVELS) * 100),
    currentLevelId: Math.min(currentLevelId, TOTAL_LEVELS),
    courseCompleted,
    displayName,
    levels: levelStates,
  };
}

export async function issueDiploma(
  userId: string,
  nameOnDiploma: string,
  courseSlug = COURSE_SLUG_REACT
) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("diplomas").upsert(
    {
      user_id: userId,
      course_slug: courseSlug,
      name_on_diploma: nameOnDiploma,
      issued_at: new Date().toISOString(),
    },
    { onConflict: "user_id,course_slug" }
  );
  if (error) throw error;
}

export async function getDiploma(userId: string, courseSlug = COURSE_SLUG_REACT) {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("diplomas")
    .select("*")
    .eq("user_id", userId)
    .eq("course_slug", courseSlug)
    .maybeSingle();
  return data;
}
