import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";
import { TOTAL_LEVELS, COURSE_SLUG_REACT } from "@/lib/cursos/levels";
import {
  isExcludedAnalyticsEvent,
  isExcludedAnalyticsPath,
  localDateKey,
} from "@/lib/analytics/filters";
import type { AnalyticsEventInput } from "@/lib/analytics/types";

type EventRow = {
  event_type: string;
  path: string | null;
  session_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export async function insertAnalyticsEvent(
  input: AnalyticsEventInput,
): Promise<{ ok: boolean; error?: string }> {
  if (isExcludedAnalyticsEvent({ path: input.path, metadata: input.metadata })) {
    return { ok: true };
  }

  if (!isSupabaseConfigured()) {
    return { ok: false, error: "supabase_not_configured" };
  }

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("analytics_events").insert({
      event_type: input.event_type,
      path: input.path ?? null,
      session_id: input.session_id ?? null,
      metadata: input.metadata ?? {},
    });

    if (error) {
      if (error.code === "PGRST205" || error.message.includes("schema cache")) {
        return { ok: false, error: "analytics_table_missing" };
      }
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "unknown_error",
    };
  }
}

async function fetchEventsSince(since: Date): Promise<EventRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("analytics_events")
    .select("event_type, path, session_id, metadata, created_at")
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false })
    .limit(50000);

  if (error) {
    console.error("fetchEventsSince:", error.message);
    return [];
  }
  return (data ?? []) as EventRow[];
}

function filterEvents(events: EventRow[]): EventRow[] {
  return events.filter((e) => !isExcludedAnalyticsEvent(e));
}

function countInRange(events: EventRow[], start: Date, end: Date): number {
  const startMs = start.getTime();
  const endMs = end.getTime();
  return events.filter((e) => {
    const t = new Date(e.created_at).getTime();
    return t >= startMs && t < endMs;
  }).length;
}

function pageViews(events: EventRow[]): EventRow[] {
  return events.filter((e) => e.event_type === "page_view");
}

function tallyByKey(
  events: EventRow[],
  pick: (e: EventRow) => string | null | undefined,
): { key: string; count: number }[] {
  const map = new Map<string, number>();
  for (const e of events) {
    const key = pick(e);
    if (!key) continue;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);
}

function visitsByPageLocale(events: EventRow[]): AdminAnalyticsSummary["visitsByPageLocale"] {
  const map = new Map<string, number>();
  for (const e of pageViews(events)) {
    const page = e.path ?? "unknown";
    const locale = metaString(e, "locale") ?? "unknown";
    const key = `${page}\u0000${locale}`;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([key, count]) => {
      const [page, locale] = key.split("\u0000");
      return { page, locale, count };
    })
    .sort((a, b) => b.count - a.count || a.page.localeCompare(b.page));
}

function visitsByDay(events: EventRow[], days: number) {
  const views = pageViews(events);
  const buckets = new Map<string, number>();
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    buckets.set(localDateKey(d), 0);
  }
  for (const e of views) {
    const day = localDateKey(new Date(e.created_at));
    if (buckets.has(day)) buckets.set(day, (buckets.get(day) ?? 0) + 1);
  }
  return [...buckets.entries()].map(([date, count]) => ({ date, count }));
}

function metaString(e: EventRow, field: string): string | null {
  const v = e.metadata?.[field];
  return typeof v === "string" && v.trim() ? v : null;
}

export type AdminAnalyticsSummary = {
  configured: boolean;
  tableReady: boolean;
  visits: { today: number; month: number; year: number };
  visitsByDay: { date: string; count: number }[];
  visitsByPage: { key: string; count: number }[];
  projectsViewModes: { key: string; count: number }[];
  projectFilters: { key: string; count: number }[];
  projectViews: { key: string; count: number }[];
  studyAgentsViews: { key: string; count: number }[];
  studyAgentsTotal: number;
  reactCourseUsers: {
    user_id: string;
    display_name: string | null;
    current_level: number;
    passed_levels: number;
    last_activity: string | null;
  }[];
  cvDownloads: { key: string; count: number }[];
  cvDownloadsTotal: number;
  locales: { key: string; count: number }[];
  visitsByPageLocale: { page: string; locale: string; count: number }[];
  referrers: { key: string; count: number }[];
  avgPagesPerSession: number;
  totalEvents: number;
  studyAgentsBackend: {
    total_courses: number;
    total_enrollments: number;
    total_revenue: number;
    active_users: number;
  } | null;
};

export async function getAdminAnalyticsSummary(): Promise<AdminAnalyticsSummary> {
  const empty: AdminAnalyticsSummary = {
    configured: isSupabaseConfigured(),
    tableReady: false,
    visits: { today: 0, month: 0, year: 0 },
    visitsByDay: [],
    visitsByPage: [],
    projectsViewModes: [],
    projectFilters: [],
    projectViews: [],
    studyAgentsViews: [],
    studyAgentsTotal: 0,
    reactCourseUsers: [],
    cvDownloads: [],
    cvDownloadsTotal: 0,
    locales: [],
    visitsByPageLocale: [],
    referrers: [],
    avgPagesPerSession: 0,
    totalEvents: 0,
    studyAgentsBackend: null,
  };

  if (!isSupabaseConfigured()) return empty;

  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const events = filterEvents(await fetchEventsSince(yearStart));

  if (events.length === 0) {
    const supabase = getSupabaseAdmin();
    const { error: probeError } = await supabase
      .from("analytics_events")
      .select("id")
      .limit(1);
    if (probeError) {
      if (
        probeError.code === "PGRST205" ||
        probeError.message.includes("schema cache") ||
        probeError.message.includes("does not exist")
      ) {
        empty.tableReady = false;
        return empty;
      }
    }
  }

  empty.tableReady = true;

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(todayStart);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const views = pageViews(events);

  const sessionPages = new Map<string, number>();
  for (const e of views) {
    if (!e.session_id) continue;
    sessionPages.set(e.session_id, (sessionPages.get(e.session_id) ?? 0) + 1);
  }
  const sessionCounts = [...sessionPages.values()];
  const avgPagesPerSession =
    sessionCounts.length > 0
      ? Math.round(
          (sessionCounts.reduce((a, b) => a + b, 0) / sessionCounts.length) * 10,
        ) / 10
      : 0;

  empty.visits = {
    today: countInRange(views, todayStart, tomorrow),
    month: countInRange(views, monthStart, nextMonth),
    year: views.length,
  };
  empty.visitsByDay = visitsByDay(events, 30);
  empty.visitsByPage = tallyByKey(views, (e) => e.path).filter(
    (x) => x.key && !isExcludedAnalyticsPath(x.key),
  );
  empty.projectsViewModes = tallyByKey(
    events.filter((e) => e.event_type === "projects_view_change"),
    (e) => metaString(e, "view") ?? "list",
  );
  empty.projectFilters = tallyByKey(
    events.filter((e) => e.event_type === "project_filter"),
    (e) => metaString(e, "section") ?? "all",
  );
  empty.projectViews = tallyByKey(
    events.filter((e) => e.event_type === "project_view"),
    (e) => metaString(e, "slug"),
  ).filter((x) => x.key);

  const saEvents = events.filter(
    (e) =>
      e.event_type === "study_agents_view" ||
      (e.event_type === "page_view" && e.path?.startsWith("/study-agents")),
  );
  empty.studyAgentsTotal = saEvents.length;
  empty.studyAgentsViews = tallyByKey(saEvents, (e) => e.path);

  empty.cvDownloads = tallyByKey(
    events.filter((e) => e.event_type === "cv_download"),
    (e) => metaString(e, "source") ?? e.path ?? "unknown",
  ).filter((x) => !isExcludedAnalyticsPath(x.key));
  empty.cvDownloadsTotal = events.filter((e) => e.event_type === "cv_download").length;

  empty.locales = tallyByKey(views, (e) => metaString(e, "locale") ?? "unknown");
  empty.visitsByPageLocale = visitsByPageLocale(events).filter(
    (row) => !isExcludedAnalyticsPath(row.page),
  );
  empty.referrers = tallyByKey(views, (e) => {
    const ref = metaString(e, "referrer");
    if (!ref || ref === "direct") return "direct";
    try {
      return new URL(ref).hostname;
    } catch {
      return ref;
    }
  });

  empty.totalEvents = events.length;
  empty.avgPagesPerSession = avgPagesPerSession;
  empty.reactCourseUsers = await getReactCourseUsers();
  empty.studyAgentsBackend = await fetchStudyAgentsBackendStats();

  return empty;
}

async function getReactCourseUsers(): Promise<AdminAnalyticsSummary["reactCourseUsers"]> {
  try {
    const supabase = getSupabaseAdmin();
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, updated_at");

    const { data: progress } = await supabase
      .from("level_progress")
      .select("user_id, level_id, passed, passed_at")
      .eq("course_slug", COURSE_SLUG_REACT);

    const byUser = new Map<
      string,
      { passed: number; maxLevel: number; last: string | null }
    >();

    for (const row of progress ?? []) {
      const cur = byUser.get(row.user_id) ?? {
        passed: 0,
        maxLevel: 1,
        last: null,
      };
      if (row.passed) cur.passed += 1;
      cur.maxLevel = Math.max(cur.maxLevel, row.level_id);
      if (row.passed_at && (!cur.last || row.passed_at > cur.last)) {
        cur.last = row.passed_at;
      }
      byUser.set(row.user_id, cur);
    }

    const profileMap = new Map(
      (profiles ?? []).map((p) => [p.user_id, p] as const),
    );

    const userIds = new Set([
      ...(profiles ?? []).map((p) => p.user_id),
      ...byUser.keys(),
    ]);

    return [...userIds].map((user_id) => {
      const p = profileMap.get(user_id);
      const prog = byUser.get(user_id);
      const passed = prog?.passed ?? 0;
      let current = TOTAL_LEVELS + 1;
      if (prog) {
        current = passed >= TOTAL_LEVELS ? TOTAL_LEVELS + 1 : prog.maxLevel;
      }
      return {
        user_id,
        display_name: p?.display_name ?? null,
        current_level: current,
        passed_levels: passed,
        last_activity: prog?.last ?? p?.updated_at ?? null,
      };
    }).sort((a, b) => b.passed_levels - a.passed_levels || b.current_level - a.current_level);
  } catch (e) {
    console.error("getReactCourseUsers:", e);
    return [];
  }
}

async function fetchStudyAgentsBackendStats(): Promise<AdminAnalyticsSummary["studyAgentsBackend"]> {
  const base = process.env.FASTAPI_URL?.trim();
  if (!base) return null;
  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/api/admin-stats`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admin_user_id: "portfolio-admin" }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.success) return null;
    return {
      total_courses: data.total_courses ?? 0,
      total_enrollments: data.total_enrollments ?? 0,
      total_revenue: data.total_revenue ?? 0,
      active_users: data.active_users ?? 0,
    };
  } catch {
    return null;
  }
}
