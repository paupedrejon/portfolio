/**
 * Feature flags de Study Agents (producción /study-agents).
 * Activar gradualmente en Fase 1+.
 */
export const studyAgentsFlags = {
  conceptMap: false,
  srsReview: false,
  studyPlan: true,
  tutorOrchestrator: false,
  socraticMode: false,
  learnerProfile: false,
  hybridRag: false,
  supabaseStorage: false,
} as const;

export type StudyAgentsFlag = keyof typeof studyAgentsFlags;

export function isStudyAgentsFlagEnabled(flag: StudyAgentsFlag): boolean {
  return studyAgentsFlags[flag];
}
