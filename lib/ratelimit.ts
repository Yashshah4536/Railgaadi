import { NextRequest } from "next/server";

interface RateLimitRecord {
  tokens: number;
  lastRefill: number;
}

const ipBuckets = new Map<string, RateLimitRecord>();

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSec: number;
}

/**
 * In-memory Token Bucket rate limiter per IP address.
 */
export function checkRateLimit(
  request: NextRequest,
  limit = 60,
  windowMs = 60_000
): RateLimitResult {
  // Extract client IP
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
  const key = `${ip}:${limit}`;

  const now = Date.now();
  const bucket = ipBuckets.get(key) ?? { tokens: limit, lastRefill: now };

  // Refill tokens proportionally to elapsed time
  const elapsed = now - bucket.lastRefill;
  if (elapsed > 0) {
    const tokensToAdd = (elapsed / windowMs) * limit;
    bucket.tokens = Math.min(limit, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
  }

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    ipBuckets.set(key, bucket);
    return {
      allowed: true,
      limit,
      remaining: Math.floor(bucket.tokens),
      retryAfterSec: 0,
    };
  }

  // Rate limit exceeded
  const retryAfterSec = Math.ceil(((1 - bucket.tokens) / limit) * (windowMs / 1000));
  ipBuckets.set(key, bucket);

  return {
    allowed: false,
    limit,
    remaining: 0,
    retryAfterSec: Math.max(1, retryAfterSec),
  };
}
