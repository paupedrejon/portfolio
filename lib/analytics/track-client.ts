"use client";

const SESSION_KEY = "portfolio_sid";

export function getAnalyticsSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "anonymous";
  }
}

type TrackPayload = {
  event_type: string;
  path?: string;
  metadata?: Record<string, unknown>;
};

const LOCALE_PREFIX_RE = /^\/(es|en|it)(?=\/|$)/;

function detectLocale(pathname: string): string | undefined {
  const fromPath = pathname.match(LOCALE_PREFIX_RE)?.[1];
  if (fromPath) return fromPath;
  if (typeof document !== "undefined") {
    const lang = document.documentElement.lang?.trim().slice(0, 2);
    if (lang && ["es", "en", "it"].includes(lang)) return lang;
  }
  return undefined;
}

export function trackPortfolioEvent(
  event_type: string,
  metadata?: Record<string, unknown>,
  path?: string,
) {
  if (typeof window === "undefined") return;
  if (window.location.pathname.startsWith("/admin")) return;

  const resolvedPath = path ?? window.location.pathname;
  const locale = detectLocale(resolvedPath);

  const body: TrackPayload = {
    event_type,
    path: resolvedPath,
    metadata: {
      ...metadata,
      locale: locale ?? "unknown",
      referrer: document.referrer || "direct",
    },
  };

  fetch("/api/analytics/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...body,
      session_id: getAnalyticsSessionId(),
    }),
    keepalive: true,
  }).catch(() => {});
}
