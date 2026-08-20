"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VALID_PROFILES = exports.MEDIA_QUEUE_NAME = void 0;
exports.validateMediaJobPayload = validateMediaJobPayload;
exports.getMediaQueue = getMediaQueue;
exports.enqueueMediaJob = enqueueMediaJob;
// Floria Media Infrastructure — BullMQ Job Queue
const bullmq_1 = require("bullmq");
const redis_js_1 = require("../../config/redis.js");
exports.MEDIA_QUEUE_NAME = "media-processing";
exports.VALID_PROFILES = new Set([
    "PRODUCT",
    "NURSERY",
    "SELLER_LOGO",
    "USER_AVATAR",
    "CATEGORY",
    "REVIEW_IMAGE",
]);
/**
 * MANDATORY ARCHITECTURAL CHECK: Validates job payload to ensure
 * ZERO binary data (Buffer, base64, data URIs) is placed in Redis.
 */
function validateMediaJobPayload(payload) {
    if (!payload || typeof payload !== "object") {
        throw new Error("Invalid job payload: Payload must be a non-null object");
    }
    const { assetId, sessionId, sellerId, uploadedByUserId, profile, stagingPath } = payload;
    if (!assetId || typeof assetId !== "string") {
        throw new Error("Invalid job payload: 'assetId' must be a valid UUID string");
    }
    if (!sessionId || typeof sessionId !== "string") {
        throw new Error("Invalid job payload: 'sessionId' must be a valid UUID string");
    }
    if (!uploadedByUserId || typeof uploadedByUserId !== "string") {
        throw new Error("Invalid job payload: 'uploadedByUserId' must be a valid UUID string");
    }
    if (!profile || !exports.VALID_PROFILES.has(profile)) {
        throw new Error(`Invalid job payload: 'profile' must be one of [${Array.from(exports.VALID_PROFILES).join(", ")}]`);
    }
    if (!stagingPath || typeof stagingPath !== "string") {
        throw new Error("Invalid job payload: 'stagingPath' must be a valid string");
    }
    // MANDATORY SECURITY RULE: Block binary data in Redis job payloads
    const payloadStr = JSON.stringify(payload);
    if (payloadStr.includes("data:image/") ||
        payloadStr.includes(";base64,") ||
        Buffer.isBuffer(payload.buffer) ||
        payload.buffer !== undefined ||
        payload.imageBinary !== undefined) {
        throw new Error("SECURITY VIOLATION: Binary image data must never be placed into Redis queues");
    }
    return {
        assetId,
        sessionId,
        sellerId: sellerId ? String(sellerId) : null,
        uploadedByUserId,
        profile: profile,
        stagingPath,
    };
}
let mediaQueueInstance = null;
/**
 * Returns singleton BullMQ Queue instance for media processing.
 */
function getMediaQueue() {
    if (!mediaQueueInstance) {
        mediaQueueInstance = new bullmq_1.Queue(exports.MEDIA_QUEUE_NAME, {
            connection: (0, redis_js_1.getRedisOptions)(),
            defaultJobOptions: {
                attempts: 3,
                backoff: {
                    type: "exponential",
                    delay: 1000, // Initial retry delay 1 second
                },
                removeOnComplete: {
                    age: 86400, // Keep completed jobs for 24 hours
                    count: 1000, // Max 1000 completed jobs
                },
                removeOnFail: {
                    age: 604800, // Keep failed jobs for 7 days
                    count: 5000, // Max 5000 failed jobs for debugging
                },
            },
        });
    }
    return mediaQueueInstance;
}
/**
 * Enqueues a lightweight media job into BullMQ.
 */
async function enqueueMediaJob(payload) {
    const validPayload = validateMediaJobPayload(payload);
    const queue = getMediaQueue();
    return queue.add(`process-${validPayload.assetId}`, validPayload, {
        jobId: `job_${validPayload.assetId}`, // Deterministic job ID prevents duplicate enqueueing
    });
}
