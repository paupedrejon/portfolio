/**
 * Feature flags de Study Agents (producción /study-agents).
 * Activar gradualmente en Fase 1+.
 */
export const studyAgentsFlags = {
  conceptMap: true,
  srsReview: true,
  studyPlan: true,
  tutorOrchestrator: false,
  socraticMode: false,
  learnerProfile: false,
  hybridRag: false,
  /** Chats/cursos siguen en JSON; plan/uso ya van a Supabase. */
  supabaseStorage: false,
  /** Free (Groq servidor) vs Premium (BYOK). */
  planGating: true,
  serverGroqFree: true,
} as const;

export type StudyAgentsFlag = keyof typeof studyAgentsFlags;

export function isStudyAgentsFlagEnabled(flag: StudyAgentsFlag): boolean {
  return studyAgentsFlags[flag];
}
