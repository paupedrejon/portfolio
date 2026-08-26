import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";
import {
  FREE_DAILY_REQUEST_LIMIT,
  type StudyAgentsEntitlements,
  type StudyAgentsPlan,
  type StudyAgentsSubscriptionStatus,
} from "./plans";

function todayUtcDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function freeServerReady(): boolean {
  return Boolean(process.env.GROQ_API_KEY?.trim());
}

function fallbackEntitlements(plan: StudyAgentsPlan = "free"): StudyAgentsEntitlements {
  const dailyLimit = plan === "premium" ? Number.POSITIVE_INFINITY : FREE_DAILY_REQUEST_LIMIT;
  return {
    plan,
    status: "active",
    requestsToday: 0,
    dailyLimit,
    remainingToday: dailyLimit === Number.POSITIVE_INFINITY ? Number.POSITIVE_INFINITY : dailyLimit,
    freeServerReady: freeServerReady(),
    stripeReady: Boolean(process.env.STRIPE_SECRET_KEY?.trim()),
    source: "fallback",
  };
}

/** Premium de prueba vía env (coma-separado), útil antes de Stripe live. */
function premiumAllowlist(): Set<string> {
  const raw = process.env.STUDY_AGENTS_PREMIUM_USER_IDS || "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

export async function ensureStudyAgentsUser(input: {
  userId: string;
  email?: string | null;
  displayName?: string | null;
}): Promise<void> {
  if (!isSupabaseConfigured() || !input.userId) return;

  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  await supabase.from("sa_users").upsert(
    {
      user_id: input.userId,
      email: input.email ?? null,
      display_name: input.displayName ?? null,
      updated_at: now,
    },
    { onConflict: "user_id" },
  );

  const { data: existing } = await supabase
    .from("sa_subscriptions")
    .select("user_id")
    .eq("user_id", input.userId)
    .maybeSingle();

  if (!existing) {
    const plan: StudyAgentsPlan = premiumAllowlist().has(input.userId)
      ? "premium"
      : "free";
    await supabase.from("sa_subscriptions").insert({
      user_id: input.userId,
      plan,
      status: "active",
      updated_at: now,
    });
  }
}

export async function getStudyAgentsEntitlements(
  userId: string,
): Promise<StudyAgentsEntitlements> {
  if (!userId) return fallbackEntitlements("free");

  if (premiumAllowlist().has(userId) && !isSupabaseConfigured()) {
    return fallbackEntitlements("premium");
  }

  if (!isSupabaseConfigured()) {
    return fallbackEntitlements("free");
  }

  try {
    await ensureStudyAgentsUser({ userId });

    const supabase = getSupabaseAdmin();
    const { data: sub } = await supabase
      .from("sa_subscriptions")
      .select("plan, status")
      .eq("user_id", userId)
      .maybeSingle();

    let plan = (sub?.plan as StudyAgentsPlan) || "free";
    const status = (sub?.status as StudyAgentsSubscriptionStatus) || "active";

    if (premiumAllowlist().has(userId)) {
      plan = "premium";
    }

    if (plan === "premium" && status === "active") {
      return {
        plan: "premium",
        status,
        requestsToday: 0,
        dailyLimit: Number.POSITIVE_INFINITY,
        remainingToday: Number.POSITIVE_INFINITY,
        freeServerReady: freeServerReady(),
        stripeReady: Boolean(process.env.STRIPE_SECRET_KEY?.trim()),
        source: "supabase",
      };
    }

    const { data: usage } = await supabase
      .from("sa_usage_daily")
      .select("requests")
      .eq("user_id", userId)
      .eq("day", todayUtcDate())
      .maybeSingle();

    const requestsToday = usage?.requests ?? 0;
    const dailyLimit = FREE_DAILY_REQUEST_LIMIT;
    const remainingToday = Math.max(0, dailyLimit - requestsToday);

    return {
      plan: "free",
      status,
      requestsToday,
      dailyLimit,
      remainingToday,
      freeServerReady: freeServerReady(),
      stripeReady: Boolean(process.env.STRIPE_SECRET_KEY?.trim()),
      source: "supabase",
    };
  } catch (e) {
    console.error("[sa-entitlements] get failed, fallback free:", e);
    return fallbackEntitlements(
      premiumAllowlist().has(userId) ? "premium" : "free",
    );
  }
}

export async function incrementStudyAgentsUsage(input: {
  userId: string;
  requests?: number;
  tokensIn?: number;
  tokensOut?: number;
}): Promise<void> {
  if (!input.userId || !isSupabaseConfigured()) return;

  try {
    await ensureStudyAgentsUser({ userId: input.userId });
    const supabase = getSupabaseAdmin();
    const day = todayUtcDate();
    const deltaReq = input.requests ?? 1;
    const deltaIn = input.tokensIn ?? 0;
    const deltaOut = input.tokensOut ?? 0;

    const { data: row } = await supabase
      .from("sa_usage_daily")
      .select("requests, tokens_in, tokens_out")
      .eq("user_id", input.userId)
      .eq("day", day)
      .maybeSingle();

    if (!row) {
      await supabase.from("sa_usage_daily").insert({
        user_id: input.userId,
        day,
        requests: deltaReq,
        tokens_in: deltaIn,
        tokens_out: deltaOut,
      });
      return;
    }

    await supabase
      .from("sa_usage_daily")
      .update({
        requests: (row.requests ?? 0) + deltaReq,
        tokens_in: (row.tokens_in ?? 0) + deltaIn,
        tokens_out: (row.tokens_out ?? 0) + deltaOut,
      })
      .eq("user_id", input.userId)
      .eq("day", day);
  } catch (e) {
    console.error("[sa-entitlements] increment usage failed:", e);
  }
}
