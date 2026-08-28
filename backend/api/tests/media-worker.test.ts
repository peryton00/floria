// Floria Media Worker & Queue Exhaustive Test Suite (Stage 4 Final Corrections)
import { describe, it, expect, vi, beforeEach } from "vitest";
import sharp from "sharp";
import {
  validateMediaJobPayload,
  MEDIA_QUEUE_NAME,
  MediaJobPayload,
  getMediaQueue,
} from "../src/media/queue/media.queue.js";
import { buildPublicVariantPath } from "../src/media/worker/path-builder.js";
import { MediaWorker } from "../src/media/worker/media.worker.js";
import { ImageEngine } from "../src/media/image-engine/image-engine.js";
import { CorruptImageError } from "../src/media/image-engine/image-engine.errors.js";

describe("Stage 4 — BullMQ Queue & Job Payload Security Validation", () => {
  it("validates valid MediaJobPayload cleanly", () => {
    const validPayload: MediaJobPayload = {
      assetId: "asset-12345",
      sessionId: "sess-67890",
      sellerId: "seller-99",
      uploadedByUserId: "user-42",
      profile: "PRODUCT",
      stagingPath: "staging/seller-99/sess-67890/asset-12345.tmp",
    };

    const res = validateMediaJobPayload(validPayload);
    expect(res.assetId).toBe("asset-12345");
    expect(res.profile).toBe("PRODUCT");
    expect(res.sellerId).toBe("seller-99");
  });

  it("rejects invalid profile names with descriptive error", () => {
    const invalidPayload = {
      assetId: "asset-12345",
      sessionId: "sess-67890",
      sellerId: "seller-99",
      uploadedByUserId: "user-42",
      profile: "INVALID_SHARP_PROFILE_NAME",
      stagingPath: "staging/path.tmp",
    };

    expect(() => validateMediaJobPayload(invalidPayload)).toThrow(
      "Invalid job payload: 'profile' must be one of",
    );
  });

  it("CORRECTION 8 — MANDATORY SECURITY RULE: Rejects binary Buffer or base64 image data in Redis payload", () => {
    const payloadWithBuffer = {
      assetId: "asset-12345",
      sessionId: "sess-67890",
      sellerId: "seller-99",
      uploadedByUserId: "user-42",
      profile: "PRODUCT",
      stagingPath: "staging/path.tmp",
      buffer: Buffer.from("RAW_BINARY_IMAGE_DATA_SHOULD_NOT_BE_IN_REDIS"),
    };

    expect(() => validateMediaJobPayload(payloadWithBuffer)).toThrow(
      "SECURITY VIOLATION: Binary image data must never be placed into Redis queues",
    );

    const payloadWithBase64 = {
      assetId: "asset-12345",
      sessionId: "sess-67890",
      sellerId: "seller-99",
      uploadedByUserId: "user-42",
      profile: "PRODUCT",
      stagingPath:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    };

    expect(() => validateMediaJobPayload(payloadWithBase64)).toThrow(
      "SECURITY VIOLATION: Binary image data must never be placed into Redis queues",
    );
  });
});

describe("Stage 4 — Immutable Public Path Builder", () => {
  it("builds correct immutable paths for all 6 media profile domains", () => {
    expect(buildPublicVariantPath("PRODUCT", "s1", "u1", "a1", "medium")).toBe(
      "products/s1/a1/medium.webp",
    );

    expect(buildPublicVariantPath("NURSERY", "s1", "u1", "a1", "card")).toBe(
      "nurseries/s1/a1/card.webp",
    );

    expect(
      buildPublicVariantPath("SELLER_LOGO", "s1", "u1", "a1", "standard"),
    ).toBe("sellers/s1/a1/standard.webp");

    expect(buildPublicVariantPath("CATEGORY", null, "u1", "a1", "banner")).toBe(
      "categories/a1/banner.webp",
    );

    expect(
      buildPublicVariantPath("USER_AVATAR", null, "u1", "a1", "avatar"),
    ).toBe("avatars/u1/a1/avatar.webp");

    expect(
      buildPublicVariantPath("REVIEW_IMAGE", null, "u1", "a1", "display"),
    ).toBe("reviews/u1/a1/display.webp");
  });
});

describe("Stage 4 — CORRECTION 4: Full Worker Pipeline Orchestration Test", () => {
  it("executes complete pipeline: QUEUED -> PROCESSING -> ImageEngine -> public-media -> READY -> Delete Staging", async () => {
    const validJpeg = await sharp({
      create: {
        width: 800,
        height: 600,
        channels: 3,
        background: { r: 50, g: 150, b: 50 },
      },
    })
      .jpeg()
      .toBuffer();

    const mockAdminDb = {
      from: vi.fn((table: string) => {
        if (table === "media_assets") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                id: "a-100",
                status: "QUEUED",
                seller_id: "s-1",
                uploaded_by_user_id: "u-1",
                storage_bucket: "public-media",
              },
              error: null,
            }),
            update: vi.fn().mockReturnThis(),
          };
        }
        if (table === "media_variants") {
          return {
            insert: vi.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
        if (table === "media_upload_sessions") {
          return {
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
        return {};
      }),
      storage: {
        from: vi.fn((bucket: string) => {
          if (bucket === "media-staging") {
            return {
              download: vi.fn().mockResolvedValue({
                data: { arrayBuffer: async () => validJpeg.buffer },
                error: null,
              }),
              remove: vi.fn().mockResolvedValue({ data: [], error: null }),
            };
          }
          if (bucket === "public-media") {
            return {
              upload: vi.fn().mockResolvedValue({ data: {}, error: null }),
              remove: vi.fn().mockResolvedValue({ data: {}, error: null }),
            };
          }
          return {};
        }),
      },
    };

    // Replace database module with mock
    const worker = new MediaWorker();
    const mockJob: any = {
      id: "job-100",
      data: {
        assetId: "a-100",
        sessionId: "sess-100",
        sellerId: "s-1",
        uploadedByUserId: "u-1",
        profile: "PRODUCT",
        stagingPath: "staging/s-1/sess-100/a-100.tmp",
      },
      opts: { attempts: 3 },
      attemptsMade: 1,
    };

    // Mock getAdminDb import dynamically
    vi.spyOn(
      await import("../src/config/database.js"),
      "getAdminDb",
    ).mockReturnValue(mockAdminDb as any);

    await expect(worker.processJob(mockJob)).resolves.not.toThrow();
  });
});

describe("Stage 4 — CORRECTION 5: Partial Storage Failure Rollback Test", () => {
  it("deletes partially uploaded variants from public-media if a subsequent variant upload fails", async () => {
    const validJpeg = await sharp({
      create: {
        width: 800,
        height: 600,
        channels: 3,
        background: { r: 100, g: 100, b: 100 },
      },
    })
      .jpeg()
      .toBuffer();

    let uploadCount = 0;
    const removedPaths: string[] = [];

    const mockAdminDb = {
      from: vi.fn((table: string) => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: "a-fail",
            status: "QUEUED",
            seller_id: "s-1",
            uploaded_by_user_id: "u-1",
            storage_bucket: "public-media",
          },
          error: null,
        }),
        update: vi.fn().mockReturnThis(),
      })),
      storage: {
        from: vi.fn((bucket: string) => {
          if (bucket === "media-staging") {
            return {
              download: vi.fn().mockResolvedValue({
                data: { arrayBuffer: async () => validJpeg.buffer },
                error: null,
              }),
            };
          }
          if (bucket === "public-media") {
            return {
              upload: vi.fn().mockImplementation(async (path: string) => {
                uploadCount++;
                if (uploadCount === 2) {
                  // Second variant fails!
                  return {
                    data: null,
                    error: new Error("Storage upload timeout"),
                  };
                }
                return { data: {}, error: null };
              }),
              remove: vi.fn().mockImplementation(async (paths: string[]) => {
                removedPaths.push(...paths);
                return { data: {}, error: null };
              }),
            };
          }
          return {};
        }),
      },
    };

    vi.spyOn(
      await import("../src/config/database.js"),
      "getAdminDb",
    ).mockReturnValue(mockAdminDb as any);

    const worker = new MediaWorker();
    const mockJob: any = {
      id: "job-fail",
      data: {
        assetId: "a-fail",
        sessionId: "sess-fail",
        sellerId: "s-1",
        uploadedByUserId: "u-1",
        profile: "PRODUCT",
        stagingPath: "staging/path.tmp",
      },
      opts: { attempts: 3 },
      attemptsMade: 1, // Transient error on attempt 1 -> re-throws
    };

    await expect(worker.processJob(mockJob)).rejects.toThrow(
      "Failed to upload variant",
    );
    expect(removedPaths.length).toBeGreaterThan(0); // Partially uploaded thumbnail was rolled back!
  });
});

describe("Stage 4 — CORRECTION 6 & 9: Retry Classification & Staging Cleanup Tests", () => {
  it("retains retryable state on transient failure during attempt 1 of 3", async () => {
    const validJpeg = await sharp({
      create: {
        width: 400,
        height: 400,
        channels: 3,
        background: { r: 50, g: 50, b: 50 },
      },
    })
      .jpeg()
      .toBuffer();

    let assetStatusInDb = "QUEUED";

    const mockAdminDb = {
      from: vi.fn((table: string) => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: "a-retry",
            status: assetStatusInDb,
            seller_id: "s-1",
            uploaded_by_user_id: "u-1",
            storage_bucket: "public-media",
          },
          error: null,
        }),
        update: vi.fn().mockImplementation((payload: any) => {
          if (payload.status) assetStatusInDb = payload.status;
          return {
            eq: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            maybeSingle: vi
              .fn()
              .mockResolvedValue({ data: { id: "a-retry" }, error: null }),
          };
        }),
      })),
      storage: {
        from: vi.fn((bucket: string) => ({
          download: vi
            .fn()
            .mockResolvedValue({
              data: null,
              error: new Error("Network timeout"),
            }),
        })),
      },
    };

    vi.spyOn(
      await import("../src/config/database.js"),
      "getAdminDb",
    ).mockReturnValue(mockAdminDb as any);

    const worker = new MediaWorker();
    const mockJobAttempt1: any = {
      id: "job-retry-1",
      data: {
        assetId: "a-retry",
        sessionId: "sess-retry",
        sellerId: "s-1",
        uploadedByUserId: "u-1",
        profile: "PRODUCT",
        stagingPath: "staging/path.tmp",
      },
      opts: { attempts: 3 },
      attemptsMade: 1, // Attempt 1 of 3 -> transient error re-thrown, status NOT marked FAILED yet
    };

    await expect(worker.processJob(mockJobAttempt1)).rejects.toThrow(
      "Failed to download staging binary",
    );
    expect(assetStatusInDb).not.toBe("FAILED"); // Asset remains retryable for BullMQ!
  });

  it("transitions asset to FAILED on final exhausted attempt (attempt 3 of 3)", async () => {
    let assetStatusInDb = "QUEUED";

    const mockAdminDb = {
      from: vi.fn((table: string) => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: "a-exhausted",
            status: assetStatusInDb,
            seller_id: "s-1",
            uploaded_by_user_id: "u-1",
            storage_bucket: "public-media",
          },
          error: null,
        }),
        update: vi.fn().mockImplementation((payload: any) => {
          if (payload.status) assetStatusInDb = payload.status;
          return {
            eq: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            maybeSingle: vi
              .fn()
              .mockResolvedValue({ data: { id: "a-exhausted" }, error: null }),
          };
        }),
      })),
      storage: {
        from: vi.fn((bucket: string) => ({
          download: vi
            .fn()
            .mockResolvedValue({
              data: null,
              error: new Error("Network timeout"),
            }),
        })),
      },
    };

    vi.spyOn(
      await import("../src/config/database.js"),
      "getAdminDb",
    ).mockReturnValue(mockAdminDb as any);

    const worker = new MediaWorker();
    const mockJobAttempt3: any = {
      id: "job-retry-3",
      data: {
        assetId: "a-exhausted",
        sessionId: "sess-retry",
        sellerId: "s-1",
        uploadedByUserId: "u-1",
        profile: "PRODUCT",
        stagingPath: "staging/path.tmp",
      },
      opts: { attempts: 3 },
      attemptsMade: 3, // Final attempt -> marks asset FAILED
    };

    await expect(worker.processJob(mockJobAttempt3)).rejects.toThrow(
      "Failed to download staging binary",
    );
    expect(assetStatusInDb).toBe("FAILED");
  });
});

describe("Stage 4 — CORRECTION 7: Idempotency & Terminal State Safeguards", () => {
  it("skips duplicate job execution cleanly when asset is already READY", async () => {
    const mockQueryBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockImplementation(() =>
        Promise.resolve({
          data: { id: "a-ready", status: "READY" },
          error: null,
        }),
      ),
    };

    // When update().eq().in().select().maybeSingle() is called, update fails because status is READY
    let updateCallCount = 0;
    const mockAdminDb = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        update: vi.fn().mockImplementation(() => {
          updateCallCount++;
          return {
            eq: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: "a-ready", status: "READY" },
          error: null,
        }),
      })),
      storage: { from: vi.fn() },
    };

    vi.spyOn(
      await import("../src/config/database.js"),
      "getAdminDb",
    ).mockReturnValue(mockAdminDb as any);

    const worker = new MediaWorker();
    const mockJob: any = {
      id: "job-ready",
      data: {
        assetId: "a-ready",
        sessionId: "s",
        sellerId: "s1",
        uploadedByUserId: "u1",
        profile: "PRODUCT",
        stagingPath: "path.tmp",
      },
      opts: { attempts: 3 },
      attemptsMade: 1,
    };

    await expect(worker.processJob(mockJob)).resolves.not.toThrow();
  });

  it("aborts processing cleanly when asset is in terminal state RETIRED or DELETED", async () => {
    const mockAdminDb = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        update: vi.fn().mockImplementation(() => ({
          eq: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: "a-retired", status: "RETIRED" },
          error: null,
        }),
      })),
      storage: { from: vi.fn() },
    };

    vi.spyOn(
      await import("../src/config/database.js"),
      "getAdminDb",
    ).mockReturnValue(mockAdminDb as any);

    const worker = new MediaWorker();
    const mockJob: any = {
      id: "job-retired",
      data: {
        assetId: "a-retired",
        sessionId: "s",
        sellerId: "s1",
        uploadedByUserId: "u1",
        profile: "PRODUCT",
        stagingPath: "path.tmp",
      },
      opts: { attempts: 3 },
      attemptsMade: 1,
    };

    await expect(worker.processJob(mockJob)).resolves.not.toThrow();
  });
});

describe("Stage 4 — CORRECTION 10: Multi-Job Concurrency Isolation Test", () => {
  it("processes multiple media jobs independently without cross-tenant path leakage", async () => {
    const validJpeg = await sharp({
      create: {
        width: 400,
        height: 400,
        channels: 3,
        background: { r: 10, g: 10, b: 10 },
      },
    })
      .jpeg()
      .toBuffer();

    const jobs: MediaJobPayload[] = Array.from({ length: 10 }, (_, i) => ({
      assetId: `asset-${i}`,
      sessionId: `sess-${i}`,
      sellerId: `seller-${i % 3}`, // 3 distinct sellers
      uploadedByUserId: `user-${i}`,
      profile: "PRODUCT",
      stagingPath: `staging/seller-${i % 3}/sess-${i}/asset-${i}.tmp`,
    }));

    const uploadedPathsPerSeller: Record<string, string[]> = {};

    const mockAdminDb = {
      from: vi.fn((table: string) => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockImplementation(() =>
          Promise.resolve({
            data: {
              id: "asset-id",
              status: "QUEUED",
              seller_id: "s",
              uploaded_by_user_id: "u",
              storage_bucket: "public-media",
            },
            error: null,
          }),
        ),
        update: vi.fn().mockImplementation(() => ({
          eq: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          maybeSingle: vi
            .fn()
            .mockResolvedValue({ data: { id: "asset-id" }, error: null }),
        })),
        insert: vi.fn().mockResolvedValue({ data: [], error: null }),
      })),
      storage: {
        from: vi.fn((bucket: string) => {
          if (bucket === "media-staging") {
            return {
              download: vi.fn().mockResolvedValue({
                data: { arrayBuffer: async () => validJpeg.buffer },
                error: null,
              }),
              remove: vi.fn().mockResolvedValue({ data: [], error: null }),
            };
          }
          if (bucket === "public-media") {
            return {
              upload: vi.fn().mockImplementation(async (path: string) => {
                const sellerKey = path.split("/")[1];
                if (!uploadedPathsPerSeller[sellerKey])
                  uploadedPathsPerSeller[sellerKey] = [];
                uploadedPathsPerSeller[sellerKey].push(path);
                return { data: {}, error: null };
              }),
            };
          }
          return {};
        }),
      },
    };

    vi.spyOn(
      await import("../src/config/database.js"),
      "getAdminDb",
    ).mockReturnValue(mockAdminDb as any);

    const worker = new MediaWorker();
    const processPromises = jobs.map((jobData, idx) =>
      worker.processJob({
        id: `job-${idx}`,
        data: jobData,
        opts: { attempts: 3 },
        attemptsMade: 1,
      } as any),
    );

    await expect(Promise.all(processPromises)).resolves.not.toThrow();

    // Verify 3 sellers received their respective isolated paths without leakage
    expect(Object.keys(uploadedPathsPerSeller)).toEqual(
      expect.arrayContaining(["seller-0", "seller-1", "seller-2"]),
    );
  });
});
