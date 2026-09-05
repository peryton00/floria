// Floria API — Health Check Endpoint Verification Tests
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import * as dbModule from "../src/config/database.js";
import * as redisModule from "../src/config/redis.js";

describe("Task 6: Health-Check Endpoint for UptimeRobot", () => {
  let app: any;

  beforeEach(() => {
    vi.restoreAllMocks();
    app = createApp();
  });

  it("should return 200 healthy when DB and Redis are connected", async () => {
    // Mock DB success
    vi.spyOn(dbModule, "getAdminDb").mockReturnValue({
      from: () => ({
        select: () => ({
          limit: () => Promise.resolve({ data: [{ id: "cat-1" }], error: null }),
        }),
      }),
    } as any);

    // Mock Redis success
    vi.spyOn(redisModule, "getRedisClient").mockReturnValue({
      ping: () => Promise.resolve("PONG"),
    } as any);

    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("healthy");
    expect(res.body.checks.database).toBe("connected");
    expect(res.body.checks.redis).toBe("connected");
  });

  it("should return 200 degraded when Redis is down but DB is healthy", async () => {
    // Mock DB success
    vi.spyOn(dbModule, "getAdminDb").mockReturnValue({
      from: () => ({
        select: () => ({
          limit: () => Promise.resolve({ data: [{ id: "cat-1" }], error: null }),
        }),
      }),
    } as any);

    // Mock Redis failure
    vi.spyOn(redisModule, "getRedisClient").mockReturnValue({
      ping: () => Promise.reject(new Error("Redis connection refused")),
    } as any);

    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("degraded");
    expect(res.body.checks.database).toBe("connected");
    expect(res.body.checks.redis).toBe("disconnected");
    expect(res.body.note).toMatch(/Redis is unreachable/i);
  });

  it("should return 503 unhealthy when DB query fails", async () => {
    // Mock DB failure
    vi.spyOn(dbModule, "getAdminDb").mockReturnValue({
      from: () => ({
        select: () => ({
          limit: () => Promise.resolve({ data: null, error: { message: "DB timeout" } }),
        }),
      }),
    } as any);

    // Mock Redis success
    vi.spyOn(redisModule, "getRedisClient").mockReturnValue({
      ping: () => Promise.resolve("PONG"),
    } as any);

    const res = await request(app).get("/health");

    expect(res.status).toBe(503);
    expect(res.body.status).toBe("unhealthy");
    expect(res.body.checks.database).toBe("disconnected");
  });
});
