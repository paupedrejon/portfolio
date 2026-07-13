"use client";

import { useCallback } from "react";
import { getOpenAIApiKey } from "@/lib/study-agents/api-keys";
import type { StudyAgentsApiResponse } from "@/lib/study-agents/types";

const DEFAULT_TIMEOUT_MS = 120_000;

export type SaFetchResult<T> = {
  ok: boolean;
  status: number;
  data: T;
};

function resolveStudyAgentsPath(path: string): string {
  if (path.startsWith("/api/")) return path;
  const normalized = path.replace(/^\//, "");
  return `/api/study-agents/${normalized}`;
}

/**
 * Cliente HTTP centralizado para Study Agents.
 * Timeout 120s, 1 reintento en fallo de red, respuestas tipadas.
 */
export async function saFetch<T = StudyAgentsApiResponse>(
  path: string,
  options: RequestInit & { timeout?: number } = {},
): Promise<SaFetchResult<T>> {
  const { timeout = DEFAULT_TIMEOUT_MS, ...init } = options;
  const url = resolveStudyAgentsPath(path);

  const doRequest = async (): Promise<Response> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      return await fetch(url, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  };

  let response: Response;
  try {
    response = await doRequest();
  } catch {
    try {
      response = await doRequest();
    } catch (retryError) {
      const message =
        retryError instanceof Error ? retryError.message : "Error de red";
      return {
        ok: false,
        status: 0,
        data: { success: false, error: message } as T,
      };
    }
  }

  let data: T;
  const text = await response.text();
  try {
    data = (text ? JSON.parse(text) : {}) as T;
  } catch {
    data = { success: false, error: text || response.statusText } as T;
  }

  return { ok: response.ok, status: response.status, data };
}

export function useApiClient() {
  const getApiKey = useCallback(() => getOpenAIApiKey(), []);

  const fetchStudyAgents = useCallback(
    <T = StudyAgentsApiResponse>(path: string, options?: RequestInit & { timeout?: number }) =>
      saFetch<T>(path, options),
    [],
  );

  return { saFetch: fetchStudyAgents, getApiKey };
}

/** POST JSON a un endpoint de study-agents */
export async function saPost<T = StudyAgentsApiResponse>(
  path: string,
  body: unknown,
  options?: { timeout?: number },
): Promise<SaFetchResult<T>> {
  return saFetch<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    ...options,
  });
}

/**
 * Sustituto drop-in de `fetch` para `/api/study-agents/*`.
 * Permite migrar llamadas existentes sin reescribir la lógica de respuesta.
 */
export async function studyAgentsFetch(
  endpoint: string,
  init?: RequestInit & { timeout?: number },
): Promise<{
  ok: boolean;
  status: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  json: () => Promise<any>;
  text: () => Promise<string>;
}> {
  const path = endpoint.startsWith("/api/study-agents/")
    ? endpoint.slice("/api/study-agents/".length)
    : endpoint.replace(/^\//, "");
  const result = await saFetch(path, init ?? {});
  const payload = result.data;
  return {
    ok: result.ok,
    status: result.status,
    json: async () => payload,
    text: async () =>
      typeof payload === "string" ? payload : JSON.stringify(payload),
  };
}
