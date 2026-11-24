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
      if (data.counts) setCounts(data.counts);
      if (Array.isArray(data.liked) && hasAnalyticsConsent()) {
        setLiked(new Set(data.liked));
      } else if (!hasAnalyticsConsent()) {
        setLiked(new Set());
      }
    } catch {
      /* silently keep last known */
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

  const toggleLike = useCallback(
    async (
      slug: string,
      nextLikedExplicit?: boolean,
    ): Promise<"ok" | "needs_consent" | "error"> => {
      if (!hasAnalyticsConsent()) {
        requestAnalyticsConsent("like");
        return "needs_consent";
      }

      const sessionId = getAnalyticsSessionId();
      if (!sessionId) {
        requestAnalyticsConsent("like");
        return "needs_consent";
      }

      const nextLiked =
        typeof nextLikedExplicit === "boolean"
          ? nextLikedExplicit
          : !liked.has(slug);

      if (nextLiked === liked.has(slug)) {
        return "ok";
      }

      setLiked((prev) => {
        const copy = new Set(prev);
        if (nextLiked) copy.add(slug);
        else copy.delete(slug);
        return copy;
      });
      setCounts((prev) => ({
        ...prev,
        [slug]: Math.max(0, (prev[slug] ?? 0) + (nextLiked ? 1 : -1)),
      }));

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
        if (!res.ok || !data.ok) {
          setLiked((prev) => {
            const copy = new Set(prev);
            if (nextLiked) copy.delete(slug);
            else copy.add(slug);
            return copy;
          });
          setCounts((prev) => ({
            ...prev,
            [slug]: Math.max(0, (prev[slug] ?? 0) + (nextLiked ? -1 : 1)),
          }));
          return "error";
        }
        if (typeof data.count === "number") {
          setCounts((prev) => ({ ...prev, [slug]: data.count as number }));
        }
        return "ok";
      } catch {
        setLiked((prev) => {
          const copy = new Set(prev);
          if (nextLiked) copy.delete(slug);
          else copy.add(slug);
          return copy;
        });
        setCounts((prev) => ({
          ...prev,
          [slug]: Math.max(0, (prev[slug] ?? 0) + (nextLiked ? -1 : 1)),
        }));
        return "error";
      }
    },
    [liked],
  );

  /** Tras aceptar cookies: publica como me gusta los favoritos locales pendientes. */
  const syncFavoritesAsLikes = useCallback(
    async (favoriteSlugs: string[]) => {
      if (!hasAnalyticsConsent() || favoriteSlugs.length === 0) return;
      const sessionId = getAnalyticsSessionId();
      if (!sessionId) return;

      for (const slug of favoriteSlugs) {
        if (liked.has(slug)) continue;
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
          if (res.ok && data.ok) {
            setLiked((prev) => new Set(prev).add(slug));
            if (typeof data.count === "number") {
              setCounts((prev) => ({ ...prev, [slug]: data.count as number }));
            } else {
              setCounts((prev) => ({
                ...prev,
                [slug]: (prev[slug] ?? 0) + 1,
              }));
            }
          }
        } catch {
          /* ignore per-slug */
        }
      }
    },
    [liked],
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
