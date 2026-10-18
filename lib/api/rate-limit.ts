/** Best-effort in-memory rate limiter. Resets per serverless instance, so it
 * guards against accidental abuse rather than a determined attack. */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

export interface RateLimit {
  allowed: boolean;
  retryAfterSeconds: number;
  limit: number;
  remaining: number;
}

export function checkRateLimit(
  key: string,
  limit = 60,
  windowMs = 60_000
): RateLimit {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    if (buckets.size >= MAX_BUCKETS && !existing) {
      // Shed load: drop the oldest entry.
      const first = buckets.keys().next();
      if (!first.done) buckets.delete(first.value);
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0, limit, remaining: limit - 1 };
  }

  existing.count += 1;
  if (existing.count > limit) {
    const retryAfterSeconds = Math.ceil((existing.resetAt - now) / 1000);
    return { allowed: false, retryAfterSeconds, limit, remaining: 0 };
  }
  return {
    allowed: true,
    retryAfterSeconds: 0,
    limit,
    remaining: limit - existing.count,
  };
}

export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
