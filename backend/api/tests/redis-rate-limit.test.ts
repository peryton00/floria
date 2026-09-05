// Floria API — Redis Rate Limit Store Unit Tests
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { RedisRateLimitStore } from "../src/middleware/rateLimit.js";
import { getRedisClient } from "../src/config/redis.js";

describe("M2: RedisRateLimitStore Distributed Adapter", () => {
  const store = new RedisRateLimitStore("rl:test:");
  const testKey = "user_123_action";

  beforeAll(async () => {
    store.init({ windowMs: 10000 } as any);
    await store.resetKey(testKey);
  });

  afterAll(async () => {
    await store.resetKey(testKey);
  });

  it("increments hits and assigns positive reset time in Redis", async () => {
    const res1 = await store.increment(testKey);
    expect(res1.totalHits).toBe(1);
    expect(res1.resetTime).toBeInstanceOf(Date);
    expect(res1.resetTime!.getTime()).toBeGreaterThan(Date.now());

    const res2 = await store.increment(testKey);
    expect(res2.totalHits).toBe(2);

    const redis = getRedisClient();
    const rawVal = await redis.get(`rl:test:${testKey}`);
    expect(rawVal).toBe("2");
  });

  it("decrements hit count in Redis correctly", async () => {
    await store.decrement(testKey);
    const redis = getRedisClient();
    const rawVal = await redis.get(`rl:test:${testKey}`);
    expect(rawVal).toBe("1");
  });

  it("resets key cleanly from Redis", async () => {
    await store.resetKey(testKey);
    const redis = getRedisClient();
    const rawVal = await redis.get(`rl:test:${testKey}`);
    expect(rawVal).toBeNull();
  });

  it("gracefully falls back to in-memory store when Redis throws an error", async () => {
    const fallbackStore = new RedisRateLimitStore("rl:fallback:");
    fallbackStore.init({ windowMs: 10000 } as any);

    const redis = getRedisClient();
    const originalMulti = redis.multi;

    // Simulate Redis failure
    redis.multi = (() => {
      throw new Error("Simulated Redis network disconnection");
    }) as any;

    try {
      const fallbackRes = await fallbackStore.increment("failing_client_ip");
      expect(fallbackRes.totalHits).toBe(1);
      expect(fallbackRes.resetTime).toBeInstanceOf(Date);

      const fallbackRes2 = await fallbackStore.increment("failing_client_ip");
      expect(fallbackRes2.totalHits).toBe(2);
    } finally {
      redis.multi = originalMulti;
    }
  });
});
