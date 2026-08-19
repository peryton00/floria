// Floria Media Infrastructure — Async BullMQ Worker
import { Worker, Job } from "bullmq";
import { getRedisOptions } from "../../config/redis.js";
import { getAdminDb } from "../../config/database.js";
import { ImageEngine } from "../image-engine/image-engine.js";
import { ImageEngineError } from "../image-engine/image-engine.errors.js";
import {
  MEDIA_QUEUE_NAME,
  MediaJobPayload,
  validateMediaJobPayload,
} from "../queue/media.queue.js";
import { buildPublicVariantPath } from "./path-builder.js";

export const DEFAULT_WORKER_CONCURRENCY = parseInt(
  process.env.MEDIA_WORKER_CONCURRENCY || "4",
  10
);

export class MediaWorker {
  private worker: Worker<MediaJobPayload> | null = null;

  /**
   * Starts the BullMQ worker listener.
   */
  public start(): Worker<MediaJobPayload> {
    if (this.worker) {
      return this.worker;
    }

    this.worker = new Worker<MediaJobPayload>(
      MEDIA_QUEUE_NAME,
      async (job: Job<MediaJobPayload>) => {
        return this.processJob(job);
      },
      {
        connection: getRedisOptions(),
        concurrency: DEFAULT_WORKER_CONCURRENCY,
      }
    );

    this.worker.on("completed", (job) => {
      console.log(`[MediaWorker] Job ${job.id} (Asset ${job.data.assetId}) completed successfully.`);
    });

    this.worker.on("failed", (job, err) => {
      console.error(
        `[MediaWorker] Job ${job?.id} (Asset ${job?.data?.assetId}) failed: ${err.message}`
      );
    });

    return this.worker;
  }

  /**
   * Core Job Processing Logic with Race-Safe State Transitions and Retry Classification
   */
  public async processJob(job: Job<MediaJobPayload>): Promise<void> {
    const startTime = Date.now();
    const payload = validateMediaJobPayload(job.data);
    const adminDb = getAdminDb();
    const uploadedVariantPaths: string[] = [];

    // 1. Race-Safe Atomic Transition: QUEUED -> PROCESSING
    // Guarantees only eligible assets (QUEUED, RECEIVED, VALIDATING) are picked up
    const { data: updatedAsset, error: updateErr } = await adminDb
      .from("media_assets")
      .update({
        status: "PROCESSING",
        updated_at: new Date().toISOString(),
      })
      .eq("id", payload.assetId)
      .in("status", ["QUEUED", "RECEIVED", "VALIDATING"])
      .select("id, status, seller_id, uploaded_by_user_id, storage_bucket")
      .maybeSingle();

    if (updateErr || !updatedAsset) {
      // Check current asset status for diagnostic logging
      const { data: current } = await adminDb
        .from("media_assets")
        .select("status")
        .eq("id", payload.assetId)
        .maybeSingle();

      if (current?.status === "READY") {
        console.log(`[MediaWorker] Asset '${payload.assetId}' is already READY. Skipping duplicate job.`);
        return;
      }
      if (current?.status === "RETIRED" || current?.status === "DELETED") {
        console.warn(`[MediaWorker] Asset '${payload.assetId}' is in terminal state '${current.status}'. Aborting job.`);
        return;
      }
      if (!current) {
        console.error(`[MediaWorker] Media asset '${payload.assetId}' not found in database.`);
        return;
      }
      console.warn(`[MediaWorker] Asset '${payload.assetId}' status is '${current.status}'. Aborting redundant job.`);
      return;
    }

    try {
      // 2. Download Raw Staging Binary from Supabase Storage (media-staging)
      const { data: fileData, error: downloadErr } = await adminDb.storage
        .from("media-staging")
        .download(payload.stagingPath);

      if (downloadErr || !fileData) {
        throw new Error(
          `Failed to download staging binary from '${payload.stagingPath}': ${downloadErr?.message}`
        );
      }

      // Convert downloaded Blob / ArrayBuffer to Node.js Buffer
      const arrayBuffer = await fileData.arrayBuffer();
      const inputBuffer = Buffer.from(arrayBuffer);

      // 3. Pass Buffer to ImageEngine for Sharp Transformations
      const engineResult = await ImageEngine.process(inputBuffer, payload.profile);

      // 4. State Transition: STORING
      await adminDb
        .from("media_assets")
        .update({
          status: "STORING",
          updated_at: new Date().toISOString(),
        })
        .eq("id", payload.assetId);

      // 5. Upload Generated Variants to public-media with Immutable Cache Headers
      const variantRecords: Array<{
        asset_id: string;
        variant_name: string;
        format: string;
        width: number;
        height: number;
        size_bytes: number;
        storage_bucket: string;
        storage_path: string;
      }> = [];

      for (const variant of engineResult.variants) {
        const publicPath = buildPublicVariantPath(
          payload.profile,
          payload.sellerId,
          payload.uploadedByUserId,
          payload.assetId,
          variant.variantName
        );

        const { error: uploadErr } = await adminDb.storage
          .from("public-media")
          .upload(publicPath, variant.buffer, {
            contentType: "image/webp",
            cacheControl: "public, max-age=31536000, immutable",
            upsert: true,
          });

        if (uploadErr) {
          throw new Error(`Failed to upload variant '${variant.variantName}' to '${publicPath}': ${uploadErr.message}`);
        }

        uploadedVariantPaths.push(publicPath);

        variantRecords.push({
          asset_id: payload.assetId,
          variant_name: variant.variantName,
          format: variant.format,
          width: variant.width,
          height: variant.height,
          size_bytes: variant.sizeBytes,
          storage_bucket: "public-media",
          storage_path: publicPath,
        });
      }

      // 6. Database Finalization: Insert media_variants
      const { error: insertErr } = await adminDb.from("media_variants").insert(variantRecords);
      if (insertErr) {
        throw new Error(`Failed to insert media_variants records: ${insertErr.message}`);
      }

      // 7. Race-Safe Atomic Finalization: Transition STORING -> READY
      const { data: finalAsset, error: finalErr } = await adminDb
        .from("media_assets")
        .update({
          status: "READY",
          updated_at: new Date().toISOString(),
        })
        .eq("id", payload.assetId)
        .in("status", ["PROCESSING", "STORING"])
        .select("id")
        .maybeSingle();

      if (finalErr || !finalAsset) {
        throw new Error(`Asset '${payload.assetId}' changed state concurrently during finalization. Storage rollback triggered.`);
      }

      // Complete Upload Session if present
      if (payload.sessionId) {
        await adminDb
          .from("media_upload_sessions")
          .update({
            status: "COMPLETED",
            completed_at: new Date().toISOString(),
            resolved_asset_id: payload.assetId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", payload.sessionId);
      }

      // 8. Purge Temporary Raw Binary from media-staging after reaching READY
      await adminDb.storage.from("media-staging").remove([payload.stagingPath]);

      const durationMs = Date.now() - startTime;
      const totalOutputBytes = variantRecords.reduce((acc, v) => acc + v.size_bytes, 0);

      // Structured Worker Logging
      console.log(
        JSON.stringify({
          event: "MEDIA_PROCESSING_COMPLETE",
          assetId: payload.assetId,
          sessionId: payload.sessionId,
          sellerId: payload.sellerId,
          profile: payload.profile,
          durationMs,
          inputSizeBytes: engineResult.input.sizeBytes,
          outputSizeBytes: totalOutputBytes,
          variantsGenerated: variantRecords.map((v) => ({ name: v.variant_name, path: v.storage_path })),
        })
      );
    } catch (err: any) {
      // ROLLBACK: Delete any partial storage variants uploaded during this attempt
      if (uploadedVariantPaths.length > 0) {
        try {
          await adminDb.storage.from("public-media").remove(uploadedVariantPaths);
        } catch (cleanupErr: any) {
          console.error(`[MediaWorker] Cleanup error for asset '${payload.assetId}': ${cleanupErr.message}`);
        }
      }

      const isImageEngineError = err instanceof ImageEngineError;
      const failureStage = updatedAsset?.status === "STORING" ? "STORAGE" : "PROCESSING";
      const failureCode = isImageEngineError ? err.code : "PROCESSING_ERROR";

      const maxAttempts = job.opts?.attempts || 3;
      const isFinalAttempt = (job.attemptsMade || 1) >= maxAttempts;
      const isPermanentError = isImageEngineError || err.message?.includes("not found");

      // Record FAILED status in DB ONLY IF permanent error OR final BullMQ attempt
      if (isPermanentError || isFinalAttempt) {
        await adminDb
          .from("media_assets")
          .update({
            status: "FAILED",
            failure_stage: failureStage,
            failure_code: failureCode,
            failure_message: err.message || "Unknown error",
            updated_at: new Date().toISOString(),
          })
          .eq("id", payload.assetId);

        if (payload.sessionId) {
          await adminDb
            .from("media_upload_sessions")
            .update({
              status: "FAILED",
              failure_stage: failureStage,
              failure_code: failureCode,
              failure_message: err.message || "Unknown error",
              updated_at: new Date().toISOString(),
            })
            .eq("id", payload.sessionId);
        }
      } else {
        console.warn(
          `[MediaWorker] Transient failure on attempt ${job.attemptsMade || 1}/${maxAttempts} for asset '${payload.assetId}'. Retaining retryable state for BullMQ.`
        );
      }

      // Re-throw transient infrastructure errors so BullMQ executes exponential backoff retry
      if (!isPermanentError) {
        throw err;
      }
    }
  }

  /**
   * Graceful Worker Shutdown
   */
  public async close(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
      this.worker = null;
    }
  }
}

export const mediaWorkerInstance = new MediaWorker();
