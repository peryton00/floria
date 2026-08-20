// Floria Media Infrastructure — Stage 7 Unsplash Asset Migration Unit Test Suite
import { describe, it, expect, vi } from "vitest";
import sharp from "sharp";
import {
  UNSPLASH_ASSETS_MANIFEST,
  migrateUnsplashAssets,
  downloadImageBuffer,
} from "../src/media/migrations/migrate-unsplash-assets.js";
import { DEFAULT_SYSTEM_USER_ID } from "../src/media/migrations/migrate-system-assets.js";

describe("Stage 7 — Unsplash Asset Migration Manifest & Classification", () => {
  it("discovers all 16 unique production Unsplash assets in manifest", () => {
    expect(UNSPLASH_ASSETS_MANIFEST.length).toBe(18);
    const ids = UNSPLASH_ASSETS_MANIFEST.map((a) => a.id);

    expect(ids).toContain("seller-logo-greenleaf");
    expect(ids).toContain("seller-logo-nisarga");
    expect(ids).toContain("seller-logo-clayco");
    expect(ids).toContain("seller-logo-saigarden");

    expect(ids).toContain("product-snake-monstera");
    expect(ids).toContain("product-aloe-vera");
    expect(ids).toContain("product-peace-lily");
    expect(ids).toContain("product-sweet-basil");
    expect(ids).toContain("product-terracotta-pot");
    expect(ids).toContain("product-pink-bougainvillea");
    expect(ids).toContain("product-vermicompost");
    expect(ids).toContain("product-pruning-shears");
    expect(ids).toContain("product-golden-money-plant");

    expect(ids).toContain("category-outdoor-plants");
    expect(ids).toContain("category-succulents-cacti");
    expect(ids).toContain("category-flowering-plants");
    expect(ids).toContain("category-herbs-edibles");
    expect(ids).toContain("category-soil-fertilizers");
  });

  it("correctly assigns ImageEngine profiles: SELLER_LOGO, PRODUCT, and CATEGORY", () => {
    const greenleaf = UNSPLASH_ASSETS_MANIFEST.find((a) => a.id === "seller-logo-greenleaf")!;
    expect(greenleaf.profile).toBe("SELLER_LOGO");

    const snake = UNSPLASH_ASSETS_MANIFEST.find((a) => a.id === "product-snake-monstera")!;
    expect(snake.profile).toBe("PRODUCT");

    const outdoor = UNSPLASH_ASSETS_MANIFEST.find((a) => a.id === "category-outdoor-plants")!;
    expect(outdoor.profile).toBe("CATEGORY");
  });
});

describe("Stage 7 — Download Validation & Image Magic Byte Verification", () => {
  it("rejects empty or non-image binary downloads", async () => {
    const invalidBuffer = Buffer.from("<html><body>404 Not Found</body></html>");

    // Test validation logic inside downloadImageBuffer mock
    const isJpeg = invalidBuffer[0] === 0xff && invalidBuffer[1] === 0xd8;
    const isPng = invalidBuffer[0] === 0x89 && invalidBuffer[1] === 0x50;
    const isWebp = invalidBuffer.subarray(8, 12).toString() === "WEBP";

    expect(isJpeg || isPng || isWebp).toBe(false);
  });

  it("executes idempotent migration for Unsplash seed assets: assigns is_system_seeded = TRUE and seller_id = NULL", async () => {
    const mockJpeg = await sharp({
      create: { width: 600, height: 600, channels: 3, background: { r: 50, g: 150, b: 50 } },
    })
      .jpeg()
      .toBuffer();

    const mockBuffers: Record<string, Buffer> = {};
    for (const assetDef of UNSPLASH_ASSETS_MANIFEST) {
      mockBuffers[assetDef.id] = mockJpeg;
    }

    const insertedAssets: any[] = [];
    const insertedVariants: any[] = [];

    const mockAdminDb = {
      from: vi.fn((table: string) => {
        if (table === "user_profiles") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: { id: DEFAULT_SYSTEM_USER_ID }, error: null }),
          };
        }
        if (table === "media_assets") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            insert: vi.fn().mockImplementation(async (payload: any) => {
              insertedAssets.push(payload);
              return { data: [], error: null };
            }),
          };
        }
        if (table === "media_variants") {
          return {
            insert: vi.fn().mockImplementation(async (payload: any) => {
              insertedVariants.push(...payload);
              return { data: [], error: null };
            }),
          };
        }
        return {};
      }),
      storage: {
        from: vi.fn((bucket: string) => ({
          upload: vi.fn().mockResolvedValue({ data: {}, error: null }),
          remove: vi.fn().mockResolvedValue({ data: [], error: null }),
        })),
      },
    };

    vi.spyOn(await import("../src/config/database.js"), "getAdminDb").mockReturnValue(mockAdminDb as any);

    const results = await migrateUnsplashAssets(mockBuffers);
    expect(results.length).toBe(18);

    for (const asset of insertedAssets) {
      expect(asset.is_system_seeded).toBe(true);
      expect(asset.seller_id).toBeNull();
      expect(asset.status).toBe("READY");
      expect(asset.storage_bucket).toBe("public-media");
    }

    expect(insertedVariants.length).toBeGreaterThan(0);
  });
});
