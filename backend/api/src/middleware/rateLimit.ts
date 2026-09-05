// Floria API — Centralized Configurable Rate Limiting with Redis Store
import rateLimit, { type Store, type ClientRateLimitInfo, type Options } from "express-rate-limit";
import { Errors } from "../utils/errors.js";
import { getRedisClient } from "../config/redis.js";

/**
 * Native ioredis Store implementation for express-rate-limit v7.
 * Provides distributed rate limiting across horizontal API instances.
 */
export class RedisRateLimitStore implements Store {
  windowMs = 60000;
  prefix: string;
  localKeys = false;

  constructor(prefix = "rl:") {
    this.prefix = prefix;
  }

  init(options: Options): void {
    this.windowMs = options.windowMs;
  }

  async increment(key: string): Promise<ClientRateLimitInfo> {
    const redis = getRedisClient();
    const fullKey = `${this.prefix}${key}`;

    const results = await redis
      .multi()
      .incr(fullKey)
      .pttl(fullKey)
      .exec();

    if (!results) {
      throw new Error("Redis transaction execution failed");
    }

    const [incrErr, hitsResult] = results[0];
    const [ttlErr, ttlResult] = results[1];

    if (incrErr) throw incrErr as Error;
    if (ttlErr) throw ttlErr as Error;

    const totalHits = Number(hitsResult);
    let ttlMs = Number(ttlResult);

    // If key was just created and has no TTL (-1 or -2), set window expiration
    if (ttlMs < 0) {
      await redis.pexpire(fullKey, this.windowMs);
      ttlMs = this.windowMs;
    }

    const resetTime = new Date(Date.now() + Math.max(0, ttlMs));
    return { totalHits, resetTime };
  }

  async decrement(key: string): Promise<void> {
    const redis = getRedisClient();
    await redis.decr(`${this.prefix}${key}`);
  }

  async resetKey(key: string): Promise<void> {
    const redis = getRedisClient();
    await redis.del(`${this.prefix}${key}`);
  }

  async resetAll(): Promise<void> {
    const redis = getRedisClient();
    const keys = await redis.keys(`${this.prefix}*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
}

function getStore(prefix: string): Store | undefined {
  const isTest = process.env.NODE_ENV === "test" || process.env.VITEST === "true";
  if (isTest) {
    // Keep in-memory store in unit test suite to avoid shared Redis interference
    return undefined;
  }
  return new RedisRateLimitStore(prefix);
}

// Configurable policies:
// Auth: 10 requests / minute / IP
// Checkout: 10 requests / minute / user (or IP)
// Seller fulfillment: 30 requests / minute / user
// Public catalog: 120 requests / minute / IP

export const authRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore("rl:auth:"),
  passOnStoreError: true,
  handler: (_req, _res, next) => {
    next(
      Errors.rateLimited(
        "Too many authentication requests. Please try again in a minute.",
      ),
    );
  },
});

export const checkoutRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.user?.id || req.ip || "unknown",
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore("rl:checkout:"),
  passOnStoreError: true,
  handler: (_req, _res, next) => {
    next(
      Errors.rateLimited(
        "Too many checkout attempts. Please try again in a minute.",
      ),
    );
  },
});

export const sellerFulfillmentRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: (req) =>
    req.user?.sellerId || req.user?.id || req.ip || "unknown",
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore("rl:fulfillment:"),
  passOnStoreError: true,
  handler: (_req, _res, next) => {
    next(
      Errors.rateLimited(
        "Fulfillment status update rate limit reached. Please slow down.",
      ),
    );
  },
});

export const adminRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  keyGenerator: (req) => req.user?.id || req.ip || "unknown",
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore("rl:admin:"),
  passOnStoreError: true,
  handler: (_req, _res, next) => {
    next(Errors.rateLimited("Admin API rate limit reached."));
  },
});

export const publicCatalogRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore("rl:catalog:"),
  passOnStoreError: true,
  handler: (_req, _res, next) => {
    next(
      Errors.rateLimited(
        "Public catalog rate limit reached. Please slow down.",
      ),
    );
  },
});

export const mediaUploadRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: (req) => req.user?.id || req.ip || "unknown",
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore("rl:media:"),
  passOnStoreError: true,
  handler: (_req, _res, next) => {
    next(
      Errors.rateLimited(
        "Media upload rate limit reached. Maximum 30 uploads per minute allowed.",
      ),
    );
  },
});
