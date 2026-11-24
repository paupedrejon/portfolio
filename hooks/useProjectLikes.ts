"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ANALYTICS_CONSENT_EVENT,
  hasAnalyticsConsent,
  requestAnalyticsConsent,
} from "@/lib/analytics/consent";
import { getAnalyticsSessionId } from "@/lib/analytics/track-client";

type LikeCounts = Record<string, number>;

type LikesResponse = {
  ok?: boolean;
  counts?: LikeCounts;
  liked?: string[];
  count?: number;
};

const LOCAL_COUNTS_KEY = "portfolio_project_like_counts";
const LOCAL_LIKED_KEY = "portfolio_project_liked";

function readLocalCounts(): LikeCounts {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(LOCAL_COUNTS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out: LikeCounts = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === "number" && value > 0) out[key] = value;
    }
    return out;
  } catch {
    return {};
  }
}

function writeLocalCounts(counts: LikeCounts) {
  try {
    localStorage.setItem(LOCAL_COUNTS_KEY, JSON.stringify(counts));
  } catch {
    /* ignore */
  }
}

function readLocalLiked(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(LOCAL_LIKED_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((s): s is string => typeof s === "string"));
  } catch {
    return new Set();
  }
}

function writeLocalLiked(liked: Set<string>) {
  try {
    localStorage.setItem(LOCAL_LIKED_KEY, JSON.stringify([...liked]));
  } catch {
    /* ignore */
  }
}

function mergeCounts(server: LikeCounts, local: LikeCounts): LikeCounts {
  const out: LikeCounts = { ...server };
  for (const [slug, n] of Object.entries(local)) {
    out[slug] = Math.max(out[slug] ?? 0, n);
  }
  return out;
}

/**
 * Contadores públicos de me gusta + registro con consentimiento de analítica.
 * Sin consentimiento se pueden ver los números; al votar se pide aceptar cookies.
 */
export function useProjectLikes(slugs: string[]) {
  const [counts, setCounts] = useState<LikeCounts>({});
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  const slugsKey = slugs.join(",");

  const refresh = useCallback(async () => {
    if (slugs.length === 0) {
      setCounts({});
      setLiked(new Set());
      setReady(true);
      return;
    }

    const localCounts = readLocalCounts();
    const localLiked = hasAnalyticsConsent() ? readLocalLiked() : new Set<string>();

    const params = new URLSearchParams({ slugs: slugsKey });
    if (hasAnalyticsConsent()) {
      const sid = getAnalyticsSessionId();
      if (sid) params.set("session_id", sid);
    }

    try {
      const res = await fetch(`/api/projects/likes?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      });
      const data = (await res.json()) as LikesResponse;
      if (res.ok && data.ok !== false && data.counts && typeof data.counts === "object") {
        const merged = mergeCounts(data.counts, localCounts);
        setCounts(merged);
        writeLocalCounts(merged);
      } else {
        setCounts(localCounts);
      }
      if (res.ok && Array.isArray(data.liked) && hasAnalyticsConsent()) {
        const next = new Set([...data.liked, ...localLiked]);
        setLiked(next);
        writeLocalLiked(next);
      } else if (hasAnalyticsConsent()) {
        setLiked(localLiked);
      } else {
        setLiked(new Set());
      }
    } catch {
      setCounts(localCounts);
      if (hasAnalyticsConsent()) setLiked(localLiked);
    } finally {
      setReady(true);
    }
  }, [slugs, slugsKey]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onConsent = () => {
      void refresh();
    };
    window.addEventListener(ANALYTICS_CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(ANALYTICS_CONSENT_EVENT, onConsent);
  }, [refresh]);

  const getCount = useCallback(
    (slug: string) => counts[slug] ?? 0,
    [counts],
  );

  const isLiked = useCallback((slug: string) => liked.has(slug), [liked]);

  const applyLocal = useCallback((slug: string, nextLiked: boolean, nextCount: number) => {
    setLiked((prev) => {
      const copy = new Set(prev);
      if (nextLiked) copy.add(slug);
      else copy.delete(slug);
      writeLocalLiked(copy);
      return copy;
    });
    setCounts((prev) => {
      const next = { ...prev, [slug]: Math.max(0, nextCount) };
      writeLocalCounts(next);
      return next;
    });
  }, []);

  const toggleLike = useCallback(
    async (
      slug: string,
      nextLikedExplicit?: boolean,
    ): Promise<"ok" | "needs_consent" | "error"> => {
      const nextLiked =
        typeof nextLikedExplicit === "boolean"
          ? nextLikedExplicit
          : !liked.has(slug);

      if (!hasAnalyticsConsent()) {
        // Mantener el número visible en este navegador y pedir cookies para publicarlo
        if (nextLiked) {
          applyLocal(slug, true, Math.max(1, (counts[slug] ?? 0) + (liked.has(slug) ? 0 : 1)));
        } else {
          applyLocal(slug, false, Math.max(0, (counts[slug] ?? 0) - 1));
        }
        requestAnalyticsConsent("like");
        return "needs_consent";
      }

      const sessionId = getAnalyticsSessionId();
      if (!sessionId) {
        if (nextLiked) {
          applyLocal(slug, true, Math.max(1, (counts[slug] ?? 0) + (liked.has(slug) ? 0 : 1)));
        }
        requestAnalyticsConsent("like");
        return "needs_consent";
      }

      if (nextLiked === liked.has(slug)) {
        return "ok";
      }

      const optimisticCount = Math.max(
        0,
        (counts[slug] ?? 0) + (nextLiked ? 1 : -1),
      );
      applyLocal(slug, nextLiked, optimisticCount);

      try {
        const res = await fetch("/api/projects/likes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug,
            session_id: sessionId,
            liked: nextLiked,
          }),
        });
        const data = (await res.json()) as LikesResponse;
        if (res.ok && data.ok && typeof data.count === "number") {
          applyLocal(slug, nextLiked, data.count);
          return "ok";
        }
        // Servidor falló: mantener el número local (no hacer rollback visual)
        return res.ok && data.ok ? "ok" : "error";
      } catch {
        return "error";
      }
    },
    [liked, counts, applyLocal],
  );

  /** Tras aceptar cookies: publica como me gusta los favoritos locales pendientes. */
  const syncFavoritesAsLikes = useCallback(
    async (favoriteSlugs: string[]) => {
      if (!hasAnalyticsConsent() || favoriteSlugs.length === 0) return;
      const sessionId = getAnalyticsSessionId();
      if (!sessionId) return;

      for (const slug of favoriteSlugs) {
        if (liked.has(slug)) continue;
        const optimisticCount = (counts[slug] ?? 0) + 1;
        applyLocal(slug, true, optimisticCount);

        try {
          const res = await fetch("/api/projects/likes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              slug,
              session_id: sessionId,
              liked: true,
            }),
          });
          const data = (await res.json()) as LikesResponse;
          if (res.ok && data.ok && typeof data.count === "number") {
            applyLocal(slug, true, data.count);
          }
        } catch {
          /* keep local */
        }
      }
    },
    [liked, counts, applyLocal],
  );

  return {
    ready,
    getCount,
    isLiked,
    toggleLike,
    syncFavoritesAsLikes,
    refresh,
  };
}
