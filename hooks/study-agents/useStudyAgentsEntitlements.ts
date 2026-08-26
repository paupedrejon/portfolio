"use client";

import { useCallback, useEffect, useState } from "react";
import type { StudyAgentsEntitlements } from "@/lib/study-agents/plans";
import { hasConfiguredProviderKeys, type StudyAgentsAPIKeys } from "@/lib/study-agents/api-keys";

export function canUseStudyAgentsLlm(
  entitlements: StudyAgentsEntitlements | null | undefined,
  apiKeys: StudyAgentsAPIKeys | null | undefined,
  opts?: { loading?: boolean },
): boolean {
  if (hasConfiguredProviderKeys(apiKeys)) return true;
  // Mientras carga el plan, no bloqueamos (Free no exige keys).
  if (opts?.loading && !entitlements) return true;
  // Free con Groq de servidor, o Free en fallback sin saber aún si hay Groq
  // (el BFF devolverá error claro si falta GROQ_API_KEY).
  if (entitlements?.plan === "free") {
    return entitlements.freeServerReady || entitlements.source === "fallback";
  }
  return false;
}

export function useStudyAgentsEntitlements(userId: string | undefined | null) {
  const [entitlements, setEntitlements] = useState<StudyAgentsEntitlements | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) {
      setEntitlements(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/study-agents/entitlements?userId=${encodeURIComponent(userId)}`,
      );
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.entitlements) {
        setEntitlements(data.entitlements as StudyAgentsEntitlements);
      }
    } catch (e) {
      console.error("[entitlements] fetch failed", e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { entitlements, loading, refresh };
}
