const LOCAL_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "[::1]",
  "::1",
]);

export function isLocalHostname(host: string | null | undefined): boolean {
  if (!host) return false;
  const h = host.toLowerCase().trim();
  if (LOCAL_HOSTS.has(h)) return true;
  if (h.endsWith(".local")) return true;
  return false;
}

export function isExcludedAnalyticsPath(path: string | null | undefined): boolean {
  if (!path) return false;
  const p = path.toLowerCase();
  if (p === "/admin" || p.startsWith("/admin/")) return true;
  if (p.includes("localhost")) return true;
  if (p.includes("127.0.0.1")) return true;
  return false;
}

export function isExcludedAnalyticsReferrer(
  referrer: string | null | undefined,
): boolean {
  if (!referrer || referrer === "direct") return false;
  try {
    const url = new URL(referrer);
    return isLocalHostname(url.hostname);
  } catch {
    const r = referrer.toLowerCase();
    return r.includes("localhost") || r.includes("127.0.0.1");
  }
}

export function isExcludedAnalyticsEvent(event: {
  path?: string | null;
  metadata?: Record<string, unknown> | null;
}): boolean {
  if (isExcludedAnalyticsPath(event.path)) return true;

  const host = event.metadata?.hostname;
  if (typeof host === "string" && isLocalHostname(host)) return true;

  const ref = event.metadata?.referrer;
  if (typeof ref === "string" && isExcludedAnalyticsReferrer(ref)) return true;

  return false;
}

export function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
