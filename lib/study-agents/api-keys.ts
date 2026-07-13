export const API_KEYS_STORAGE_KEY = "study_agents_api_keys";
const LEGACY_API_KEY = "openai_api_key";

export type StudyAgentsAPIKeys = {
  openai: string;
};

export function isValidOpenAIKey(key: string): boolean {
  const trimmed = key.trim();
  return trimmed.startsWith("sk-") && trimmed.length > 20;
}

export function getStoredAPIKeys(): StudyAgentsAPIKeys | null {
  if (typeof window === "undefined") return null;

  try {
    const saved = localStorage.getItem(API_KEYS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as StudyAgentsAPIKeys;
      if (parsed.openai && isValidOpenAIKey(parsed.openai)) {
        return { openai: parsed.openai.trim() };
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

  const normalized = { openai: keys.openai.trim() };
  localStorage.setItem(API_KEYS_STORAGE_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent("apiKeysUpdated"));
}

export function getOpenAIApiKey(): string | null {
  return getStoredAPIKeys()?.openai ?? null;
}

export const OPEN_API_KEY_MODAL_EVENT = "openApiKeyConfig";

export function openAPIKeyModal(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_API_KEY_MODAL_EVENT));
}
