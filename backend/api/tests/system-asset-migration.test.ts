// Floria Media Infrastructure — Stage 6 System Asset Migration Unit Test Suite
import { describe, it, expect, vi } from "vitest";
import sharp from "sharp";
import { SYSTEM_ASSETS_MANIFEST } from "../src/media/migrations/system-assets-manifest.js";
import {
  migrateSystemAssets,
  resolveSystemUploaderUserId,
  DEFAULT_SYSTEM_USER_ID,
} from "../src/media/migrations/migrate-system-assets.js";

describe("Stage 6 — System Asset Migration Manifest & Security Validation", () => {
  it("discovers all 10 target system raster assets in manifest", () => {
    expect(SYSTEM_ASSETS_MANIFEST.length).toBe(10);
    const filenames = SYSTEM_ASSETS_MANIFEST.map((a) => a.originalFilename);

    expect(filenames).toContain("cat-plants.png");
    expect(filenames).toContain("cat-seeds.png");
    expect(filenames).toContain("cat-pots.png");
    expect(filenames).toContain("cat-fertilizers.png");
    expect(filenames).toContain("cat-tools.png");
    expect(filenames).toContain("nursery-1.png");
    expect(filenames).toContain("nursery-2.png");
    expect(filenames).toContain("nursery-3.png");
    expect(filenames).toContain("nursery-4.png");
    expect(filenames).toContain("hero-plants.png");
  });

  it("CRITICAL RULE: Rejects floria-logo.png, favicon.ico, or SVGs from system migration manifest", () => {
    const filenames = SYSTEM_ASSETS_MANIFEST.map((a) => a.originalFilename);

    expect(filenames).not.toContain("floria-logo.png");
    expect(filenames).not.toContain("favicon.ico");

    const svgFiles = filenames.filter((f) => f.endsWith(".svg"));
    expect(svgFiles.length).toBe(0);
  });

  it("correctly maps category assets to CATEGORY profile and nursery/hero assets to NURSERY profile", () => {
    const catPlants = SYSTEM_ASSETS_MANIFEST.find((a) => a.originalFilename === "cat-plants.png")!;
    expect(catPlants.profile).toBe("CATEGORY");

    const nursery1 = SYSTEM_ASSETS_MANIFEST.find((a) => a.originalFilename === "nursery-1.png")!;
    expect(nursery1.profile).toBe("NURSERY");

    const hero = SYSTEM_ASSETS_MANIFEST.find((a) => a.originalFilename === "hero-plants.png")!;
    expect(hero.profile).toBe("NURSERY");
  });
});

describe("Stage 6 — System Asset Migration Execution & Idempotency", () => {
  it("resolves valid system uploader user_profiles ID satisfying FK constraints", async () => {
    const mockAdminDb = {
      from: vi.fn((table: string) => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: DEFAULT_SYSTEM_USER_ID, role: "admin" },
          error: null,
        }),
      })),
    };

    vi.spyOn(await import("../src/config/database.js"), "getAdminDb").mockReturnValue(mockAdminDb as any);

    const userId = await resolveSystemUploaderUserId();
    expect(userId).toBe(DEFAULT_SYSTEM_USER_ID);
  });

  it("executes idempotent migration: assigns is_system_seeded = TRUE and seller_id = NULL", async () => {
    const mockPng = await sharp({
      create: { width: 400, height: 300, channels: 4, background: { r: 30, g: 130, b: 30, alpha: 1 } },
    })
      .png()
      .toBuffer();

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
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }), // No existing asset
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
        })),
      },
    };

    vi.spyOn(await import("../src/config/database.js"), "getAdminDb").mockReturnValue(mockAdminDb as any);

    const results = await migrateSystemAssets();
    expect(results.length).toBeGreaterThan(0);

    for (const asset of insertedAssets) {
      expect(asset.is_system_seeded).toBe(true);
      expect(asset.seller_id).toBeNull();
      expect(asset.status).toBe("READY");
      expect(asset.storage_bucket).toBe("public-media");
    }
  });
});
