export const API_KEYS_STORAGE_KEY = "study_agents_api_keys";
const LEGACY_API_KEY = "openai_api_key";

export type StudyAgentsAPIKeys = {
  openai: string;
  deepseek?: string;
  groq?: string;
  openrouter?: string;
};

function trimOrEmpty(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export function isValidOpenAIKey(key: string): boolean {
  const trimmed = key.trim();
  return trimmed.startsWith("sk-") && trimmed.length > 20;
}

/** Keys opcionales: aceptamos cualquier string razonable (sk- / gsk_ / or-…). */
export function isValidOptionalKey(key: string): boolean {
  const t = key.trim();
  return t.length >= 8;
}

export function getStoredAPIKeys(): StudyAgentsAPIKeys | null {
  if (typeof window === "undefined") return null;

  try {
    const saved = localStorage.getItem(API_KEYS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as StudyAgentsAPIKeys;
      if (parsed.openai && isValidOpenAIKey(parsed.openai)) {
        return {
          openai: parsed.openai.trim(),
          deepseek: trimOrEmpty(parsed.deepseek) || undefined,
          groq: trimOrEmpty(parsed.groq) || undefined,
          openrouter: trimOrEmpty(parsed.openrouter) || undefined,
        };
      }
    }

    const legacy = localStorage.getItem(LEGACY_API_KEY);
    if (legacy && isValidOpenAIKey(legacy)) {
      const keys = { openai: legacy.trim() };
      saveAPIKeys(keys);
      localStorage.removeItem(LEGACY_API_KEY);
      return keys;
    }
  } catch {
    /* storage blocked or invalid JSON */
  }

  return null;
}

export function saveAPIKeys(keys: StudyAgentsAPIKeys): void {
  if (typeof window === "undefined") return;

  const normalized: StudyAgentsAPIKeys = {
    openai: keys.openai.trim(),
  };
  if (trimOrEmpty(keys.deepseek)) normalized.deepseek = keys.deepseek!.trim();
  if (trimOrEmpty(keys.groq)) normalized.groq = keys.groq!.trim();
  if (trimOrEmpty(keys.openrouter)) normalized.openrouter = keys.openrouter!.trim();

  localStorage.setItem(API_KEYS_STORAGE_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent("apiKeysUpdated"));
}

export function getOpenAIApiKey(): string | null {
  return getStoredAPIKeys()?.openai ?? null;
}

/** Payload para el backend (solo keys no vacías). */
export function getProviderKeysForRequest(): Record<string, string> {
  const stored = getStoredAPIKeys();
  if (!stored) return {};
  const out: Record<string, string> = { openai: stored.openai };
  if (stored.deepseek) out.deepseek = stored.deepseek;
  if (stored.groq) out.groq = stored.groq;
  if (stored.openrouter) out.openrouter = stored.openrouter;
  return out;
}

export const OPEN_API_KEY_MODAL_EVENT = "openApiKeyConfig";

export function openAPIKeyModal(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_API_KEY_MODAL_EVENT));
}
