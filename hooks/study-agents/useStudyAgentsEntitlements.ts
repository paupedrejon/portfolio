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
  // Premium exige BYOK
  if (entitlements?.plan === "premium") return false;
  // Free / cargando / sin entitlements → el BFF usa GROQ_API_KEY del servidor
  void opts;
  return true;
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
