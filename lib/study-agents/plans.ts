/** Planes y límites de Study Agents (Fase 1). */

export type StudyAgentsPlan = "free" | "premium";

export type StudyAgentsSubscriptionStatus =
  | "active"
  | "canceled"
  | "past_due"
  | "trialing";

export type StudyAgentsEntitlements = {
  plan: StudyAgentsPlan;
  status: StudyAgentsSubscriptionStatus;
  /** Peticiones LLM usadas hoy (plan free). */
  requestsToday: number;
  /** Tope diario Free (Infinity en Premium). */
  dailyLimit: number;
  remainingToday: number;
  /** El servidor puede servir Free con GROQ_API_KEY. */
  freeServerReady: boolean;
  /** Stripe subscription listo (estructura; live más adelante). */
  stripeReady: boolean;
  source: "supabase" | "fallback";
};

export const FREE_DAILY_REQUEST_LIMIT = Number(
  process.env.STUDY_AGENTS_FREE_DAILY_REQUESTS || 40,
);

export const FREE_DEFAULT_MODEL = "groq/gpt-oss-20b";

export function isPremiumPlan(plan: StudyAgentsPlan): boolean {
  return plan === "premium";
}
