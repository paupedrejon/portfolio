/**
 * Catálogo de modelos Study Agents (UI + costes).
 * Los IDs deben coincidir con study_agents/model_manager.py
 */

export type ModelProviderId =
  | "auto"
  | "openai"
  | "ollama"
  | "deepseek"
  | "groq"
  | "openrouter";

export type StudyModelOption = {
  value: string;
  label: string;
  subtitle?: string;
  provider: ModelProviderId;
  group: "auto" | "free" | "chinese" | "openai";
  /** Coste estimado por 1k tokens (input/output USD). 0 = gratis/local/tier free */
  pricing: { input: number; output: number };
};

export const STUDY_MODEL_OPTIONS: StudyModelOption[] = [
  {
    value: "auto",
    label: "Automático",
    subtitle: "Elige el más barato disponible",
    provider: "auto",
    group: "auto",
    pricing: { input: 0, output: 0 },
  },
  // —— Chinos / OpenAI-compat ——
  {
    value: "deepseek-chat",
    label: "DeepSeek Chat",
    subtitle: "Chino · muy barato",
    provider: "deepseek",
    group: "chinese",
    pricing: { input: 0.00014, output: 0.00028 },
  },
  {
    value: "deepseek-reasoner",
    label: "DeepSeek Reasoner",
    subtitle: "Chino · razonamiento",
    provider: "deepseek",
    group: "chinese",
    pricing: { input: 0.00055, output: 0.0022 },
  },
  {
    value: "openrouter/qwen-2.5-72b-free",
    label: "Qwen 2.5 72B",
    subtitle: "OpenRouter · gratis",
    provider: "openrouter",
    group: "chinese",
    pricing: { input: 0, output: 0 },
  },
  {
    value: "openrouter/deepseek-chat-free",
    label: "DeepSeek V3",
    subtitle: "OpenRouter · gratis",
    provider: "openrouter",
    group: "chinese",
    pricing: { input: 0, output: 0 },
  },
  {
    value: "openrouter/glm-4-9b-free",
    label: "GLM-4 9B",
    subtitle: "Zhipu · OpenRouter gratis",
    provider: "openrouter",
    group: "chinese",
    pricing: { input: 0, output: 0 },
  },
  // —— Otras alternativas gratis ——
  {
    value: "groq/llama-3.3-70b",
    label: "Llama 3.3 70B",
    subtitle: "Groq · tier gratis",
    provider: "groq",
    group: "free",
    pricing: { input: 0, output: 0 },
  },
  {
    value: "groq/gemma2-9b",
    label: "Gemma 2 9B",
    subtitle: "Groq · tier gratis",
    provider: "groq",
    group: "free",
    pricing: { input: 0, output: 0 },
  },
  {
    value: "llama3.1",
    label: "Llama 3.1 (Ollama)",
    subtitle: "Local · gratis",
    provider: "ollama",
    group: "free",
    pricing: { input: 0, output: 0 },
  },
  {
    value: "openrouter/llama-3.2-3b-free",
    label: "Llama 3.2 3B",
    subtitle: "OpenRouter · gratis",
    provider: "openrouter",
    group: "free",
    pricing: { input: 0, output: 0 },
  },
  // —— OpenAI ——
  {
    value: "gpt-4o-mini",
    label: "GPT-4o mini",
    subtitle: "OpenAI · barato",
    provider: "openai",
    group: "openai",
    pricing: { input: 0.00015, output: 0.0006 },
  },
  {
    value: "gpt-4o",
    label: "GPT-4o",
    subtitle: "OpenAI",
    provider: "openai",
    group: "openai",
    pricing: { input: 0.005, output: 0.015 },
  },
  {
    value: "gpt-5",
    label: "GPT-5",
    subtitle: "OpenAI · premium",
    provider: "openai",
    group: "openai",
    pricing: { input: 0.015, output: 0.06 },
  },
];

export const MODEL_GROUP_LABELS: Record<StudyModelOption["group"], string> = {
  auto: "Recomendado",
  chinese: "Modelos chinos",
  free: "Gratis / locales",
  openai: "OpenAI",
};

export function getStudyModelOption(value: string): StudyModelOption | undefined {
  return STUDY_MODEL_OPTIONS.find((m) => m.value === value);
}

export function buildModelPricingMap(): Record<string, { input: number; output: number }> {
  const map: Record<string, { input: number; output: number }> = {};
  for (const m of STUDY_MODEL_OPTIONS) {
    map[m.value] = m.pricing;
  }
  return map;
}
