// Floria — in-memory rate limiter (server-only)
// ponytail: single-process only. For multi-instance production, replace Map
//   with Upstash Redis: https://upstash.com/docs/redis/sdks/ts/ratelimit
//   Ceiling: this implementation is not safe across horizontal scale-out.

import "server-only";

import { Errors } from "./errors";

interface Bucket {
  count: number;
  resetAt: number;
}

// Module-level store — lives for the lifetime of the Node.js process
const store = new Map<string, Bucket>();

export interface RateLimitOptions {
  /** Unique identifier: IP, user ID, seller ID, endpoint combo */
  key: string;
  /** Max requests allowed in the window */
  limit: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

/**
 * Check and increment the rate limit counter for `key`.
 * Throws RATE_LIMITED (429) if the limit is exceeded.
 * Returns remaining requests in the current window.
 */
export function checkRateLimit(opts: RateLimitOptions): { remaining: number } {
  const now = Date.now();
  const existing = store.get(opts.key);

  if (!existing || now >= existing.resetAt) {
    store.set(opts.key, { count: 1, resetAt: now + opts.windowMs });
    return { remaining: opts.limit - 1 };
  }

  if (existing.count >= opts.limit) {
    throw Errors.rateLimited();
  }

  existing.count += 1;
  return { remaining: opts.limit - existing.count };
}

// ── Preset policy helpers ─────────────────────────────────────────────────────

/** 10 req / 60s — order creation */
export function rateLimitOrderCreation(userId: string) {
  return checkRateLimit({ key: `order:${userId}`, limit: 10, windowMs: 60_000 });
}

/** 30 req / 60s — seller product mutations */
export function rateLimitSellerProducts(sellerId: string) {
  return checkRateLimit({ key: `seller-products:${sellerId}`, limit: 30, windowMs: 60_000 });
}

/** 30 req / 60s — seller fulfillment mutations */
export function rateLimitSellerFulfillment(sellerId: string) {
  return checkRateLimit({ key: `seller-fulfillment:${sellerId}`, limit: 30, windowMs: 60_000 });
}

/** 60 req / 60s — search endpoint */
export function rateLimitSearch(ip: string) {
  return checkRateLimit({ key: `search:${ip}`, limit: 60, windowMs: 60_000 });
}

/** 120 req / 60s — general authenticated API */
export function rateLimitAuthenticated(userId: string) {
  return checkRateLimit({ key: `api:${userId}`, limit: 120, windowMs: 60_000 });
}
