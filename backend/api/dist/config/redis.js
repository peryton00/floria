"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedisOptions = getRedisOptions;
exports.getRedisClient = getRedisClient;
// Floria API — Redis Client & Connection Configuration
const ioredis_1 = require("ioredis");
const env_js_1 = require("./env.js");
/**
 * Returns connection options for BullMQ & ioredis clients.
 * BullMQ requires `maxRetriesPerRequest: null`.
 */
function getRedisOptions() {
    const env = (0, env_js_1.getEnv)();
    const redisUrl = env.REDIS_URL;
    const urlObj = new URL(redisUrl);
    const isTls = urlObj.protocol === "rediss:";
    return {
        host: urlObj.hostname || "127.0.0.1",
        port: parseInt(urlObj.port || "6379", 10),
        username: urlObj.username ? decodeURIComponent(urlObj.username) : undefined,
        password: urlObj.password ? decodeURIComponent(urlObj.password) : undefined,
        tls: isTls ? { rejectUnauthorized: false } : undefined,
        maxRetriesPerRequest: null, // Required by BullMQ
        enableReadyCheck: false,
        lazyConnect: true,
    };
}
let redisInstance = null;
/**
 * Creates or retrieves standalone Redis client connection.
 */
function getRedisClient() {
    if (!redisInstance) {
        redisInstance = new ioredis_1.Redis(getRedisOptions());
        redisInstance.on("error", (err) => {
            console.error("[Redis] Client connection error:", err.message);
        });
    }
    return redisInstance;
}
