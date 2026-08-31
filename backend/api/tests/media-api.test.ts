// Floria Media Infrastructure — Stage 5 Media API Comprehensive Test Suite
import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import sharp from "sharp";
import { createApp } from "../src/app.js";

// Mock BullMQ Enqueue helper for isolated unit tests
vi.mock("../src/media/queue/media.queue.js", async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    enqueueMediaJob: vi.fn().mockResolvedValue({ id: "mock-job-id" }),
  };
});

// Helper creating chainable mock query builder
function createMockQueryBuilder(
  resolvedData: any = null,
  resolvedError: any = null,
) {
  const builder: any = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    in: vi.fn(() => builder),
    is: vi.fn(() => builder),
    update: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    maybeSingle: vi
      .fn()
      .mockResolvedValue({ data: resolvedData, error: resolvedError }),
    single: vi
      .fn()
      .mockResolvedValue({ data: resolvedData, error: resolvedError }),
    then: (resolve: any) =>
      resolve({ data: resolvedData, error: resolvedError }),
  };
  return builder;
}

const { mockGetAdminDb } = vi.hoisted(() => {
  const createMockBuilder = (resolvedData: any = null, resolvedError: any = null) => {
    const builder: any = {
      select: vi.fn(() => builder),
      insert: vi.fn(() => builder),
      update: vi.fn(() => builder),
      delete: vi.fn(() => builder),
      upsert: vi.fn(() => builder),
      eq: vi.fn(() => builder),
      in: vi.fn(() => builder),
      order: vi.fn(() => builder),
      limit: vi.fn(() => builder),
      range: vi.fn(() => builder),
      single: vi.fn(async () => ({ data: resolvedData, error: resolvedError })),
      maybeSingle: vi.fn(async () => ({
        data: resolvedData,
        error: resolvedError,
      })),
      then: (resolve: any) =>
        resolve({ data: resolvedData, error: resolvedError }),
    };
    return builder;
  };

  const getAdminDbFn = vi.fn(() => {
    const mockJpeg = Buffer.from("FAKE_JPEG_IMAGE_HEADER_BINARY");

    return {
      from: vi.fn((table: string) => {
        if (table === "user_profiles") {
          const builder = createMockBuilder();
          builder.eq = vi.fn((col: string, val: string) => {
            let role = "customer";
            if (val === "user-seller-1") role = "seller";
            if (val === "user-admin-1") role = "admin";
            return createMockBuilder({ role });
          });
          return builder;
        }

        if (table === "seller_profiles") {
          const builder = createMockBuilder();
          builder.eq = vi.fn((col: string, val: string) => {
            if (val === "user-seller-1" || val === "seller-1") {
              return createMockBuilder({
                id: "seller-1",
                status: "approved",
              });
            }
            return createMockBuilder(null);
          });
          return builder;
        }

        if (table === "media_assets") {
          const builder = createMockBuilder();
          builder.eq = vi.fn((col: string, val: string) => {
            if (val === "asset-1" || val === "asset-completed") {
              return createMockBuilder({
                id: val,
                owner_type: "SELLER",
                owner_id: "seller-1",
                purpose: "PRODUCT_IMAGE",
                status: "READY",
                variants: [
                  {
                    variant_name: "ORIGINAL",
                    storage_path: "products/seller-1/test.jpg",
                  },
                ],
              });
            }
            if (val === "asset-admin-1") {
              return createMockBuilder({
                id: "asset-admin-1",
                owner_type: "SYSTEM",
                owner_id: "system",
                purpose: "HERO_BANNER",
                status: "READY",
                variants: [],
              });
            }
            return createMockBuilder(null);
          });
          return builder;
        }

        if (table === "media_upload_sessions") {
          const builder = createMockBuilder();
          builder.eq = vi.fn((col: string, val: string) => {
            if (val === "sess-1" || val === "sess-valid") {
              return createMockBuilder({
                id: "sess-valid",
                seller_id: "seller-1",
                uploaded_by_user_id: "user-seller-1",
                status: "CREATED",
                expected_profile: "PRODUCT",
                bucket_name: "media-staging",
                temp_storage_path: "staging/seller-1/sess-valid/asset-1.tmp",
                expires_at: new Date(Date.now() + 600000).toISOString(),
              });
            }
            if (val === "sess-completed") {
              return createMockBuilder({
                id: "sess-completed",
                seller_id: "seller-1",
                uploaded_by_user_id: "user-seller-1",
                status: "COMPLETED",
                expected_profile: "PRODUCT",
                resolved_asset_id: "asset-completed",
                created_at: new Date().toISOString(),
                completed_at: new Date().toISOString(),
              });
            }
            if (val === "sess-expired") {
              return createMockBuilder({
                id: "sess-expired",
                seller_id: "seller-1",
                uploaded_by_user_id: "user-seller-1",
                status: "CREATED",
                expires_at: new Date(Date.now() - 600000).toISOString(), // Expired
              });
            }
            return createMockBuilder(null);
          });
          return builder;
        }

        if (table === "products") {
          const builder = createMockBuilder();
          builder.eq = vi.fn((col: string, val: string) => {
            if (val === "prod-1") {
              return createMockBuilder({
                id: "prod-1",
                seller_id: "seller-1",
                name: "Monstera Deliciosa",
              });
            }
            return createMockBuilder(null);
          });
          return builder;
        }

        if (table === "product_images") {
          const builder = createMockBuilder();
          builder.eq = vi.fn((col: string, val: string) => {
            if (val === "img-1") {
              return createMockBuilder({
                id: "img-1",
                product_id: "prod-1",
                media_asset_id: "asset-1",
              });
            }
            return createMockBuilder(null);
          });
          return builder;
        }

        if (table === "audit_logs" || table === "media_variants") {
          return createMockBuilder();
        }

        return createMockBuilder();
      }),
      storage: {
        from: vi.fn((bucket: string) => ({
          createSignedUploadUrl: vi.fn().mockResolvedValue({
            data: { signedUrl: "https://supabase.co/storage/v1/upload/sign" },
            error: null,
          }),
          download: vi.fn().mockImplementation(async () => {
            return {
              data: { arrayBuffer: async () => mockJpeg.buffer },
              error: null,
            };
          }),
          remove: vi.fn().mockResolvedValue({ data: [], error: null }),
        })),
      },
    };
  });

  return { mockGetAdminDb: getAdminDbFn };
});

vi.mock("../src/config/database.js", () => {
  return {
    getAnonDb: vi.fn(() => ({
      auth: {
        getUser: vi.fn(async (token: string) => {
          if (token === "token-seller") {
            return {
              data: {
                user: { id: "user-seller-1", email: "seller@floria.test" },
              },
              error: null,
            };
          }
          if (token === "token-customer") {
            return {
              data: { user: { id: "user-cust-1", email: "customer@floria.test" } },
              error: null,
            };
          }
          if (token === "token-admin") {
            return {
              data: {
                user: { id: "user-admin-1", email: "admin@floria.test" },
              },
              error: null,
            };
          }
          return { data: { user: null }, error: new Error("Invalid token") };
        }),
      },
    })),
    getAdminDb: mockGetAdminDb,
    getUserDb: mockGetAdminDb,
    getDbForUser: mockGetAdminDb,
  };
});

describe("Stage 5 — Media API Test Matrix", () => {
  const app = createApp();

  describe("Session Creation (POST /api/v1/media/upload-session)", () => {
    it("1. authenticated seller creates PRODUCT upload session -> 201 Created", async () => {
      const res = await request(app)
        .post("/api/v1/media/upload-session")
        .set("Authorization", "Bearer token-seller")
        .send({
          profile: "PRODUCT",
          filename: "monstera.jpg",
          mimeType: "image/jpeg",
          sizeBytes: 2048500,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.profile).toBe("PRODUCT");
      expect(res.body.data.sessionId).toBeDefined();
      expect(res.body.data.assetId).toBeDefined();
      expect(res.body.data.stagingPath).toContain("staging/seller-1/");
    });

    it("2. unauthenticated user rejected with 401", async () => {
      const res = await request(app).post("/api/v1/media/upload-session").send({
        profile: "PRODUCT",
        filename: "test.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 1024,
      });

      expect(res.status).toBe(401);
    });

    it("3. customer user cannot create seller-owned PRODUCT session -> 403 Forbidden", async () => {
      const res = await request(app)
        .post("/api/v1/media/upload-session")
        .set("Authorization", "Bearer token-customer")
        .send({
          profile: "PRODUCT",
          filename: "test.jpg",
          mimeType: "image/jpeg",
          sizeBytes: 1024,
        });

      expect(res.status).toBe(403);
    });

    it("4. invalid profile rejected with 422", async () => {
      const res = await request(app)
        .post("/api/v1/media/upload-session")
        .set("Authorization", "Bearer token-seller")
        .send({
          profile: "INVALID_PROFILE_NAME",
          filename: "test.jpg",
          mimeType: "image/jpeg",
          sizeBytes: 1024,
        });

      expect(res.status).toBe(422);
    });

    it("5. invalid MIME rejected with 422", async () => {
      const res = await request(app)
        .post("/api/v1/media/upload-session")
        .set("Authorization", "Bearer token-seller")
        .send({
          profile: "PRODUCT",
          filename: "test.exe",
          mimeType: "application/x-msdownload",
          sizeBytes: 1024,
        });

      expect(res.status).toBe(422);
    });

    it("6. GIF format rejected with 422", async () => {
      const res = await request(app)
        .post("/api/v1/media/upload-session")
        .set("Authorization", "Bearer token-seller")
        .send({
          profile: "PRODUCT",
          filename: "test.gif",
          mimeType: "image/gif",
          sizeBytes: 1024,
        });

      expect(res.status).toBe(422);
    });

    it("7. SVG vector format rejected with 422", async () => {
      const res = await request(app)
        .post("/api/v1/media/upload-session")
        .set("Authorization", "Bearer token-seller")
        .send({
          profile: "PRODUCT",
          filename: "vector.svg",
          mimeType: "image/svg+xml",
          sizeBytes: 1024,
        });

      expect(res.status).toBe(422);
    });

    it("8. size > 10 MB rejected with 422", async () => {
      const res = await request(app)
        .post("/api/v1/media/upload-session")
        .set("Authorization", "Bearer token-seller")
        .send({
          profile: "PRODUCT",
          filename: "giant.jpg",
          mimeType: "image/jpeg",
          sizeBytes: 10 * 1024 * 1024 + 1,
        });

      expect(res.status).toBe(422);
    });

    it("9. zero or negative size rejected with 422", async () => {
      const res = await request(app)
        .post("/api/v1/media/upload-session")
        .set("Authorization", "Bearer token-seller")
        .send({
          profile: "PRODUCT",
          filename: "empty.jpg",
          mimeType: "image/jpeg",
          sizeBytes: 0,
        });

      expect(res.status).toBe(422);
    });

    it("13 & 14. client cannot override server-controlled seller ID or asset ID", async () => {
      const res = await request(app)
        .post("/api/v1/media/upload-session")
        .set("Authorization", "Bearer token-seller")
        .send({
          profile: "PRODUCT",
          filename: "test.jpg",
          mimeType: "image/jpeg",
          sizeBytes: 1024,
          sellerId: "FORGED_SELLER_ID",
          assetId: "FORGED_ASSET_ID",
        });

      expect(res.status).toBe(201);
      expect(res.body.data.stagingPath).toContain("staging/seller-1/");
      expect(res.body.data.assetId).not.toBe("FORGED_ASSET_ID");
    });
  });

  describe("Batch Sessions Creation (POST /api/v1/media/upload-session)", () => {
    it("creates independent sessions for batch request", async () => {
      const res = await request(app)
        .post("/api/v1/media/upload-session")
        .set("Authorization", "Bearer token-seller")
        .send([
          {
            profile: "PRODUCT",
            filename: "img1.jpg",
            mimeType: "image/jpeg",
            sizeBytes: 1024,
          },
          {
            profile: "PRODUCT",
            filename: "img2.jpg",
            mimeType: "image/jpeg",
            sizeBytes: 2048,
          },
        ]);

      expect(res.status).toBe(201);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(2);
    });

    it("enforces maximum batch size limit of 10 items", async () => {
      const items = Array.from({ length: 11 }, (_, i) => ({
        profile: "PRODUCT",
        filename: `img${i}.jpg`,
        mimeType: "image/jpeg",
        sizeBytes: 1024,
      }));

      const res = await request(app)
        .post("/api/v1/media/upload-session")
        .set("Authorization", "Bearer token-seller")
        .send(items);

      expect(res.status).toBe(422);
    });
  });

  describe("Session Finalization (POST /api/v1/media/upload-session/:sessionId/complete)", () => {
    it("17. completes valid upload session and enqueues BullMQ job -> 200 OK", async () => {
      const res = await request(app)
        .post("/api/v1/media/upload-session/sess-valid/complete")
        .set("Authorization", "Bearer token-seller");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.sessionId).toBe("sess-valid");
      expect(res.body.data.sessionStatus).toBe("COMPLETED");
      expect(res.body.data.assetStatus).toBe("QUEUED");
    });

    it("18 & 19. rejects completion attempt by unauthorized non-owner", async () => {
      const res = await request(app)
        .post("/api/v1/media/upload-session/sess-valid/complete")
        .set("Authorization", "Bearer token-customer");

      expect(res.status).toBe(403);
    });

    it("20. rejects completion attempt on expired upload session", async () => {
      const res = await request(app)
        .post("/api/v1/media/upload-session/sess-expired/complete")
        .set("Authorization", "Bearer token-seller");

      expect(res.status).toBe(422);
    });

    it("29 & 30. completion endpoint is idempotent on already COMPLETED session", async () => {
      const res = await request(app)
        .post("/api/v1/media/upload-session/sess-completed/complete")
        .set("Authorization", "Bearer token-seller");

      expect(res.status).toBe(200);
      expect(res.body.data.sessionStatus).toBe("COMPLETED");
    });
  });

  describe("Session Status (GET /api/v1/media/upload-session/:sessionId)", () => {
    it("32 & 36. owner can retrieve session status and variants when READY", async () => {
      const res = await request(app)
        .get("/api/v1/media/upload-session/sess-completed")
        .set("Authorization", "Bearer token-seller");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.sessionId).toBe("sess-completed");
      expect(res.body.data.assetStatus).toBe("READY");
      expect(res.body.data.variants.thumbnail).toBeDefined();
      expect(res.body.data.variants.medium).toBeDefined();
    });

    it("33. unauthorized user cannot retrieve another user's session status -> 403", async () => {
      const res = await request(app)
        .get("/api/v1/media/upload-session/sess-completed")
        .set("Authorization", "Bearer token-customer");

      expect(res.status).toBe(403);
    });
  });
});
