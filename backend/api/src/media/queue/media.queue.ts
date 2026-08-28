// Floria Media Infrastructure — BullMQ Job Queue
import { Queue, Job } from "bullmq";
import { getRedisOptions } from "../../config/redis.js";
import type { ImageProfileName } from "../image-engine/image-engine.types.js";

export const MEDIA_QUEUE_NAME = "media-processing";

export interface MediaJobPayload {
  assetId: string;
  sessionId: string;
  sellerId: string | null;
  uploadedByUserId: string;
  profile: ImageProfileName;
  stagingPath: string;
}

export const VALID_PROFILES: Set<ImageProfileName> = new Set([
  "PRODUCT",
  "NURSERY",
  "SELLER_LOGO",
  "USER_AVATAR",
  "CATEGORY",
  "REVIEW_IMAGE",
  "DOCUMENT",
]);

/**
 * MANDATORY ARCHITECTURAL CHECK: Validates job payload to ensure
 * ZERO binary data (Buffer, base64, data URIs) is placed in Redis.
 */
export function validateMediaJobPayload(payload: any): MediaJobPayload {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid job payload: Payload must be a non-null object");
  }

  const {
    assetId,
    sessionId,
    sellerId,
    uploadedByUserId,
    profile,
    stagingPath,
  } = payload;

  if (!assetId || typeof assetId !== "string") {
    throw new Error(
      "Invalid job payload: 'assetId' must be a valid UUID string",
    );
  }

  if (!sessionId || typeof sessionId !== "string") {
    throw new Error(
      "Invalid job payload: 'sessionId' must be a valid UUID string",
    );
  }

  if (!uploadedByUserId || typeof uploadedByUserId !== "string") {
    throw new Error(
      "Invalid job payload: 'uploadedByUserId' must be a valid UUID string",
    );
  }

  if (!profile || !VALID_PROFILES.has(profile as ImageProfileName)) {
    throw new Error(
      `Invalid job payload: 'profile' must be one of [${Array.from(VALID_PROFILES).join(", ")}]`,
    );
  }

  if (!stagingPath || typeof stagingPath !== "string") {
    throw new Error(
      "Invalid job payload: 'stagingPath' must be a valid string",
    );
  }

  // MANDATORY SECURITY RULE: Block binary data in Redis job payloads
  const payloadStr = JSON.stringify(payload);
  if (
    payloadStr.includes("data:image/") ||
    payloadStr.includes(";base64,") ||
    Buffer.isBuffer((payload as any).buffer) ||
    (payload as any).buffer !== undefined ||
    (payload as any).imageBinary !== undefined
  ) {
    throw new Error(
      "SECURITY VIOLATION: Binary image data must never be placed into Redis queues",
    );
  }

  return {
    assetId,
    sessionId,
    sellerId: sellerId ? String(sellerId) : null,
    uploadedByUserId,
    profile: profile as ImageProfileName,
    stagingPath,
  };
}

let mediaQueueInstance: Queue<MediaJobPayload> | null = null;

/**
 * Returns singleton BullMQ Queue instance for media processing.
 */
export function getMediaQueue(): Queue<MediaJobPayload> {
  if (!mediaQueueInstance) {
    mediaQueueInstance = new Queue<MediaJobPayload>(MEDIA_QUEUE_NAME, {
      connection: getRedisOptions(),
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
export async function enqueueMediaJob(
  payload: MediaJobPayload,
): Promise<Job<MediaJobPayload>> {
  const validPayload = validateMediaJobPayload(payload);
  const queue = getMediaQueue();
  return queue.add(`process-${validPayload.assetId}`, validPayload, {
    jobId: `job_${validPayload.assetId}`, // Deterministic job ID prevents duplicate enqueueing
  });
}
