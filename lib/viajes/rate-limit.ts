type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();

function prune(now: number) {
  if (store.size < 500) return;
  for (const [key, bucket] of store) {
    if (bucket.resetAt <= now) store.delete(key);
  }
}

/** In-memory IP rate limit (resets after windowMs). Fine for low-traffic portfolio. */
export function consumeRateLimit(
  key: string,
  limit: number,
  windowMs = 24 * 60 * 60 * 1000,
): { ok: true; remaining: number } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  prune(now);
  const bucket = store.get(key);
  if (!bucket || bucket.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }
  if (bucket.count >= limit) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }
  bucket.count += 1;
  return { ok: true, remaining: limit - bucket.count };
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") || "unknown";
}
