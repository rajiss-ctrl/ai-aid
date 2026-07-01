// lib/rateLimit.ts
// Simple in-memory rate limiter.
// On serverless (Vercel) each function instance has its own map, so this
// limits bursts within a single instance rather than globally. For full
// global rate limiting, replace with an Upstash Redis / Vercel KV store.

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) store.delete(key);
  }
}, 5 * 60 * 1000);

/**
 * Check whether a key has exceeded the rate limit.
 * @param key      — usually the caller's IP address
 * @param limit    — max requests allowed in the window
 * @param windowMs — rolling window in milliseconds
 * @returns { allowed: boolean; remaining: number; retryAfter: number }
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; retryAfter: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    // First request in this window
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfter: 0 };
  }

  if (entry.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  entry.count += 1;
  return { allowed: true, remaining: limit - entry.count, retryAfter: 0 };
}

/**
 * Get the caller's IP from a Next.js request.
 * Vercel sets x-forwarded-for; falls back to a static string if unavailable.
 */
export function getIp(req: Request): string {
  return (
    (req.headers as any).get?.("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}
