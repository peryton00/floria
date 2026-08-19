// Floria API — Redis Client & Connection Configuration
import { Redis, RedisOptions } from "ioredis";
import { getEnv } from "./env.js";

/**
 * Returns connection options for BullMQ & ioredis clients.
 * BullMQ requires `maxRetriesPerRequest: null`.
 */
export function getRedisOptions(): RedisOptions {
  const env = getEnv();
  const redisUrl = env.REDIS_URL;

  const urlObj = new URL(redisUrl);

  return {
    host: urlObj.hostname || "127.0.0.1",
    port: parseInt(urlObj.port || "6379", 10),
    username: urlObj.username || undefined,
    password: urlObj.password || undefined,
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false,
    lazyConnect: true,
  };
}

let redisInstance: Redis | null = null;

/**
 * Creates or retrieves standalone Redis client connection.
 */
export function getRedisClient(): Redis {
  if (!redisInstance) {
    redisInstance = new Redis(getRedisOptions());
    redisInstance.on("error", (err) => {
      console.error("[Redis] Client connection error:", err.message);
    });
  }
  return redisInstance;
}
