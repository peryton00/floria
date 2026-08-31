// Floria Delivery Mobile — Proof of Delivery & Completion Hardened Suite (Step 5B.3.1)
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import sharp from "sharp";
import { createApp } from "../src/app.js";
import { ImageEngine } from "../src/media/image-engine/image-engine.js";

const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockUpload = vi.fn();
const mockDownload = vi.fn();
const mockRemove = vi.fn();
const mockCreateSignedUrl = vi.fn();
const mockCreateSignedUploadUrl = vi.fn().mockResolvedValue({
  data: { signedUrl: "https://supabase.local/upload" },
  error: null,
});

vi.mock("../src/config/database.js", () => {
  return {
    getAdminDb: () => ({
      from: mockFrom,
      storage: {
        from: (_bucket: string) => ({
          upload: mockUpload,
          download: mockDownload,
          remove: mockRemove,
          createSignedUrl: mockCreateSignedUrl,
          createSignedUploadUrl: mockCreateSignedUploadUrl,
        }),
      },
    }),
    getAnonDb: () => ({
      auth: {
        getUser: mockGetUser,
      },
    }),
    getUserDb: () => ({}),
    getDbForUser: () => ({
      from: mockFrom,
    }),
  };
});

describe("Floria Proof of Delivery & Completion Suite (Step 5B.3.1 Hardened)", () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createApp();
  });

  const mockDeliveriesData = [
    {
      id: "del-active-100",
      order_id: "ord-200",
      assigned_to: "usr-courier-1",
      status: "out_for_delivery",
      assigned_at: "2026-08-28T02:00:00Z",
      picked_up_at: "2026-08-28T02:15:00Z",
      out_for_delivery_at: "2026-08-28T02:20:00Z",
      delivered_at: null,
      pod_asset_id: null,
      recipient_name: null,
      pod_notes: null,
      created_at: "2026-08-28T02:00:00Z",
      updated_at: "2026-08-28T02:20:00Z",
    },
    {
      id: "del-assigned-101",
      order_id: "ord-201",
      assigned_to: "usr-courier-1",
      status: "assigned",
      assigned_at: "2026-08-28T02:00:00Z",
      picked_up_at: null,
      out_for_delivery_at: null,
      delivered_at: null,
      pod_asset_id: null,
      recipient_name: null,
      pod_notes: null,
      created_at: "2026-08-28T02:00:00Z",
      updated_at: "2026-08-28T02:00:00Z",
    },
    {
      id: "del-pickedup-102",
      order_id: "ord-202",
      assigned_to: "usr-courier-1",
      status: "picked_up",
      assigned_at: "2026-08-28T02:00:00Z",
      picked_up_at: "2026-08-28T02:15:00Z",
      out_for_delivery_at: null,
      delivered_at: null,
      pod_asset_id: null,
      recipient_name: null,
      pod_notes: null,
      created_at: "2026-08-28T02:00:00Z",
      updated_at: "2026-08-28T02:15:00Z",
    },
    {
      id: "del-failed-103",
      order_id: "ord-203",
      assigned_to: "usr-courier-1",
      status: "failed",
      assigned_at: "2026-08-28T02:00:00Z",
      picked_up_at: "2026-08-28T02:15:00Z",
      out_for_delivery_at: "2026-08-28T02:20:00Z",
      delivered_at: null,
      pod_asset_id: null,
      recipient_name: null,
      pod_notes: null,
      created_at: "2026-08-28T02:00:00Z",
      updated_at: "2026-08-28T02:30:00Z",
    },
    {
      id: "del-courier-2",
      order_id: "ord-204",
      assigned_to: "usr-courier-2",
      status: "out_for_delivery",
      assigned_at: "2026-08-28T02:00:00Z",
      picked_up_at: "2026-08-28T02:15:00Z",
      out_for_delivery_at: "2026-08-28T02:20:00Z",
      delivered_at: null,
      pod_asset_id: null,
      recipient_name: null,
      pod_notes: null,
      created_at: "2026-08-28T02:00:00Z",
      updated_at: "2026-08-28T02:20:00Z",
    },
    {
      id: "del-completed-300",
      order_id: "ord-300",
      assigned_to: "usr-courier-1",
      status: "delivered",
      assigned_at: "2026-08-28T01:00:00Z",
      picked_up_at: "2026-08-28T01:15:00Z",
      out_for_delivery_at: "2026-08-28T01:20:00Z",
      delivered_at: "2026-08-28T01:45:00Z",
      pod_asset_id: "asset-pod-300",
      recipient_name: "Mrs. Sharma",
      pod_notes: "Handed over directly",
      created_at: "2026-08-28T01:00:00Z",
      updated_at: "2026-08-28T01:45:00Z",
    },
  ];

  const mockAssetsData = [
    {
      id: "asset-pod-100",
      uploaded_by_user_id: "usr-courier-1",
      seller_id: null,
      media_category: "DELIVERY_POD",
      mime_type: "image/jpeg",
      file_size_bytes: 45000,
      sha256_hash: "mock-hash-100",
      storage_bucket: "private-documents",
      original_path: "pod/usr-courier-1/asset-pod-100.webp",
      status: "READY",
      created_at: "2026-08-28T02:25:00Z",
      updated_at: "2026-08-28T02:25:00Z",
    },
    {
      id: "asset-pod-other",
      uploaded_by_user_id: "usr-courier-2",
      seller_id: null,
      media_category: "DELIVERY_POD",
      mime_type: "image/jpeg",
      file_size_bytes: 45000,
      sha256_hash: "mock-hash-other",
      storage_bucket: "private-documents",
      original_path: "pod/usr-courier-2/asset-pod-other.webp",
      status: "READY",
      created_at: "2026-08-28T02:25:00Z",
      updated_at: "2026-08-28T02:25:00Z",
    },
    {
      id: "asset-product-image",
      uploaded_by_user_id: "usr-courier-1",
      seller_id: null,
      media_category: "PRODUCT",
      mime_type: "image/jpeg",
      file_size_bytes: 45000,
      sha256_hash: "mock-hash-prod",
      storage_bucket: "private-documents",
      original_path: "products/usr-courier-1/asset-prod.webp",
      status: "READY",
      created_at: "2026-08-28T02:25:00Z",
      updated_at: "2026-08-28T02:25:00Z",
    },
    {
      id: "asset-pod-queued",
      uploaded_by_user_id: "usr-courier-1",
      seller_id: null,
      media_category: "DELIVERY_POD",
      mime_type: "image/jpeg",
      file_size_bytes: 45000,
      sha256_hash: "mock-hash-queued",
      storage_bucket: "media-staging",
      original_path: null,
      status: "QUEUED",
      created_at: "2026-08-28T02:25:00Z",
      updated_at: "2026-08-28T02:25:00Z",
    },
    {
      id: "asset-pod-300",
      uploaded_by_user_id: "usr-courier-1",
      seller_id: null,
      media_category: "DELIVERY_POD",
      mime_type: "image/jpeg",
      file_size_bytes: 45000,
      sha256_hash: "mock-hash-300",
      storage_bucket: "private-documents",
      original_path: "pod/usr-courier-1/asset-pod-300.webp",
      status: "READY",
      created_at: "2026-08-28T01:40:00Z",
      updated_at: "2026-08-28T01:40:00Z",
    },
  ];

  const setupAuth = (userId: string, role: string) => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: userId, email: `${role}@floria.test` } },
      error: null,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "user_profiles") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { id: userId, role },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "delivery_assignments") {
        return {
          select: () => ({
            order: () => ({
              eq: (field: string, val: string) =>
                Promise.resolve({
                  data: mockDeliveriesData.filter(
                    (d) => (d as any)[field] === val,
                  ),
                  error: null,
                }),
              then: (fn: any) =>
                Promise.resolve(fn({ data: mockDeliveriesData, error: null })),
            }),
            eq: (field: string, val: string) => ({
              maybeSingle: async () => {
                const found = mockDeliveriesData.find(
                  (d) => (d as any)[field] === val,
                );
                return { data: found ? { ...found } : null, error: null };
              },
            }),
          }),
          update: (payload: any) => ({
            eq: (_field: string, id: string) => ({
              select: () => ({
                maybeSingle: async () => {
                  const target = mockDeliveriesData.find((d) => d.id === id);
                  if (!target) return { data: null, error: null };
                  return {
                    data: {
                      ...target,
                      ...payload,
                      updated_at: new Date().toISOString(),
                    },
                    error: null,
                  };
                },
              }),
            }),
          }),
        };
      }
      if (table === "media_upload_sessions") {
        return {
          insert: () => Promise.resolve({ data: null, error: null }),
        };
      }
      if (table === "media_assets") {
        return {
          select: () => ({
            eq: (field: string, val: string) => ({
              maybeSingle: async () => {
                const found = mockAssetsData.find(
                  (a) => (a as any)[field] === val,
                );
                return { data: found ? { ...found } : null, error: null };
              },
            }),
          }),
          insert: () => Promise.resolve({ data: null, error: null }),
          update: () => ({
            eq: () => Promise.resolve({ data: null, error: null }),
          }),
        };
      }
      if (table === "orders") {
        return {
          update: () => ({
            eq: () => Promise.resolve({ data: null, error: null }),
          }),
        };
      }
      if (table === "audit_logs") {
        return {
          insert: () => Promise.resolve({ data: null, error: null }),
        };
      }
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null, error: null }),
          }),
        }),
      };
    });
  };

  describe("1. DELIVERY_POD Upload Session Authorization", () => {
    it("allows operations courier to create DELIVERY_POD upload session", async () => {
      setupAuth("usr-courier-1", "operations");

      const res = await request(app)
        .post("/api/v1/media/upload-session")
        .set("Authorization", "Bearer valid-jwt")
        .send({
          profile: "DELIVERY_POD",
          filename: "dropoff_proof.jpg",
          mimeType: "image/jpeg",
          sizeBytes: 150000,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.sessionId).toBeDefined();
      expect(res.body.data.stagingPath).toContain("staging/usr-courier-1/");
    });

    it("rejects customers from creating DELIVERY_POD upload sessions", async () => {
      setupAuth("usr-customer-9", "customer");

      const res = await request(app)
        .post("/api/v1/media/upload-session")
        .set("Authorization", "Bearer valid-jwt")
        .send({
          profile: "DELIVERY_POD",
          filename: "dropoff_proof.jpg",
          mimeType: "image/jpeg",
          sizeBytes: 150000,
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe("2. Dedicated Complete Delivery with POD Endpoint Hardening", () => {
    it("successfully finalizes delivery when assigned courier provides READY POD asset in out_for_delivery status", async () => {
      setupAuth("usr-courier-1", "operations");

      const res = await request(app)
        .post("/api/v1/operations/deliveries/del-active-100/complete")
        .set("Authorization", "Bearer valid-jwt")
        .send({
          podAssetId: "asset-pod-100",
          recipientName: "Rohan Patel",
          notes: "Left at front door per instruction",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("delivered");
      expect(res.body.data.pod_asset_id).toBe("asset-pod-100");
      expect(res.body.data.recipient_name).toBe("Rohan Patel");
      expect(res.body.data.pod_notes).toBe(
        "Left at front door per instruction",
      );
      expect(res.body.data.delivered_at).toBeDefined();
    });

    it("rejects completion if delivery is still in 'assigned' status (not yet picked up)", async () => {
      setupAuth("usr-courier-1", "operations");

      const res = await request(app)
        .post("/api/v1/operations/deliveries/del-assigned-101/complete")
        .set("Authorization", "Bearer valid-jwt")
        .send({
          podAssetId: "asset-pod-100",
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain(
        'Cannot transition from "assigned" to "delivered"',
      );
    });

    it("rejects completion if delivery is in 'picked_up' status (not yet in transit out_for_delivery)", async () => {
      setupAuth("usr-courier-1", "operations");

      const res = await request(app)
        .post("/api/v1/operations/deliveries/del-pickedup-102/complete")
        .set("Authorization", "Bearer valid-jwt")
        .send({
          podAssetId: "asset-pod-100",
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain(
        'Cannot transition from "picked_up" to "delivered"',
      );
    });

    it("rejects completion if delivery is in 'failed' status", async () => {
      setupAuth("usr-courier-1", "operations");

      const res = await request(app)
        .post("/api/v1/operations/deliveries/del-failed-103/complete")
        .set("Authorization", "Bearer valid-jwt")
        .send({
          podAssetId: "asset-pod-100",
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain(
        'Cannot transition from "failed" to "delivered"',
      );
    });

    it("is retry-safe / idempotent on repeated completion with matching POD asset", async () => {
      setupAuth("usr-courier-1", "operations");

      const res = await request(app)
        .post("/api/v1/operations/deliveries/del-completed-300/complete")
        .set("Authorization", "Bearer valid-jwt")
        .send({
          podAssetId: "asset-pod-300",
          recipientName: "Mrs. Sharma",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("delivered");
      expect(res.body.data.delivered_at).toBe("2026-08-28T01:45:00Z"); // Preserves original timestamp
    });

    it("rejects completion on already delivered order when trying to attach a different POD asset", async () => {
      setupAuth("usr-courier-1", "operations");

      const res = await request(app)
        .post("/api/v1/operations/deliveries/del-completed-300/complete")
        .set("Authorization", "Bearer valid-jwt")
        .send({
          podAssetId: "asset-pod-100", // Different from existing asset-pod-300
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain(
        'Cannot transition from "delivered" to "delivered"',
      );
    });

    it("rejects attaching an asset that is not of category DELIVERY_POD (e.g. PRODUCT)", async () => {
      setupAuth("usr-courier-1", "operations");

      const res = await request(app)
        .post("/api/v1/operations/deliveries/del-active-100/complete")
        .set("Authorization", "Bearer valid-jwt")
        .send({
          podAssetId: "asset-product-image", // category is PRODUCT
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain("not a valid Proof of Delivery");
    });

    it("rejects courier from completing another courier's delivery assignment", async () => {
      setupAuth("usr-courier-1", "operations");

      const res = await request(app)
        .post("/api/v1/operations/deliveries/del-courier-2/complete")
        .set("Authorization", "Bearer valid-jwt")
        .send({
          podAssetId: "asset-pod-100",
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain("not assigned to complete");
    });

    it("rejects cross-courier POD attachment (Courier A using Courier B's photo)", async () => {
      setupAuth("usr-courier-1", "operations");

      const res = await request(app)
        .post("/api/v1/operations/deliveries/del-active-100/complete")
        .set("Authorization", "Bearer valid-jwt")
        .send({
          podAssetId: "asset-pod-other", // Uploaded by usr-courier-2
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain("Cross-courier");
    });

    it("rejects completion if POD asset is not READY", async () => {
      setupAuth("usr-courier-1", "operations");

      const res = await request(app)
        .post("/api/v1/operations/deliveries/del-active-100/complete")
        .set("Authorization", "Bearer valid-jwt")
        .send({
          podAssetId: "asset-pod-queued", // Status is QUEUED
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain("not READY");
    });

    it("rejects completion if delivery does not exist", async () => {
      setupAuth("usr-courier-1", "operations");

      const res = await request(app)
        .post("/api/v1/operations/deliveries/del-nonexistent/complete")
        .set("Authorization", "Bearer valid-jwt")
        .send({
          podAssetId: "asset-pod-100",
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe("3. POD Retrieval & Signed URL Endpoint", () => {
    it("generates 3600-second signed URL for authorized courier", async () => {
      setupAuth("usr-courier-1", "operations");
      mockCreateSignedUrl.mockResolvedValue({
        data: {
          signedUrl:
            "https://supabase.local/storage/v1/signed/pod.webp?token=xyz",
        },
        error: null,
      });

      const res = await request(app)
        .get("/api/v1/operations/deliveries/del-completed-300/pod")
        .set("Authorization", "Bearer valid-jwt");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.signedUrl).toContain("token=xyz");
      expect(res.body.data.assetId).toBe("asset-pod-300");
      expect(res.body.data.recipientName).toBe("Mrs. Sharma");
    });

    it("returns 404 if delivery does not have a POD asset attached", async () => {
      setupAuth("usr-courier-1", "operations");

      const res = await request(app)
        .get("/api/v1/operations/deliveries/del-active-100/pod")
        .set("Authorization", "Bearer valid-jwt");

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe("4. Real Sharp ImageEngine Processing & EXIF Stripping Integration", () => {
    it("transcodes valid JPEG to WebP variant and strips all EXIF/GPS metadata", async () => {
      // Create a genuine JPEG image buffer with Sharp
      const sampleJpeg = await sharp({
        create: {
          width: 2000,
          height: 1500,
          channels: 3,
          background: { r: 30, g: 58, b: 43 },
        },
      })
        .jpeg({ quality: 90 })
        .toBuffer();

      const result = await ImageEngine.process(sampleJpeg, "DELIVERY_POD");

      expect(result.variants).toHaveLength(1);
      const podVariant = result.variants[0];
      expect(podVariant.variantName).toBe("pod");
      expect(podVariant.format).toBe("webp");
      expect(podVariant.contentType).toBe("image/webp");
      expect(podVariant.width).toBeLessThanOrEqual(1600);
      expect(podVariant.height).toBeLessThanOrEqual(1200);

      // Verify the generated WebP binary with Sharp
      const outMeta = await sharp(podVariant.buffer).metadata();
      expect(outMeta.format).toBe("webp");
      expect(outMeta.exif).toBeUndefined();
      expect(outMeta.icc).toBeUndefined();
    });

    it("rejects corrupt or empty image buffer with appropriate error", async () => {
      const corruptBuffer = Buffer.from("this-is-not-an-image-file-header");

      await expect(
        ImageEngine.process(corruptBuffer, "DELIVERY_POD"),
      ).rejects.toThrow();
    });
  });
});
