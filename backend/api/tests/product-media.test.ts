import { describe, it, expect, beforeEach, vi } from "vitest";
import { ProductMediaService } from "../src/products/product-media.service.js";

// Mock dependencies for unit test isolation
vi.mock("../src/config/database.js", () => {
  return {
    getAdminDb: vi.fn(),
  };
});

describe("Stage 8 — Product Media Integration & Security Test Matrix", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Server-Side Security Checks for Media Asset Attachment", () => {
    it("rejects cross-seller media asset attachment with 403 Forbidden", async () => {
      const { getAdminDb } = await import("../src/config/database.js");

      const mockDb = {
        from: vi.fn((table: string) => {
          if (table === "products") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: "prod-1", name: "Monstera", seller_id: "seller-A" },
                error: null,
              }),
            };
          }
          if (table === "media_assets") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: "asset-B",
                  seller_id: "seller-B", // Belongs to Seller B!
                  status: "READY",
                  media_category: "IMAGE",
                  storage_bucket: "public-media",
                },
                error: null,
              }),
            };
          }
          return {};
        }),
      };

      (getAdminDb as any).mockReturnValue(mockDb);

      await expect(
        ProductMediaService.attachMediaAssetToProduct("seller-A", "prod-1", { assetId: "asset-B" })
      ).rejects.toThrow("Cross-seller media asset attachment is prohibited.");
    });

    it("rejects non-READY media asset attachment with 422 Validation Error", async () => {
      const { getAdminDb } = await import("../src/config/database.js");

      const mockDb = {
        from: vi.fn((table: string) => {
          if (table === "products") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: "prod-1", name: "Monstera", seller_id: "seller-A" },
                error: null,
              }),
            };
          }
          if (table === "media_assets") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: "asset-1",
                  seller_id: "seller-A",
                  status: "PROCESSING", // Not READY!
                  media_category: "IMAGE",
                  storage_bucket: "public-media",
                },
                error: null,
              }),
            };
          }
          return {};
        }),
      };

      (getAdminDb as any).mockReturnValue(mockDb);

      await expect(
        ProductMediaService.attachMediaAssetToProduct("seller-A", "prod-1", { assetId: "asset-1" })
      ).rejects.toThrow("Media asset is not READY for product attachment.");
    });

    it("rejects DOCUMENT media asset attachment with 422 Validation Error", async () => {
      const { getAdminDb } = await import("../src/config/database.js");

      const mockDb = {
        from: vi.fn((table: string) => {
          if (table === "products") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: "prod-1", name: "Monstera", seller_id: "seller-A" },
                error: null,
              }),
            };
          }
          if (table === "media_assets") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: "doc-1",
                  seller_id: "seller-A",
                  status: "READY",
                  media_category: "DOCUMENT", // Not IMAGE!
                  storage_bucket: "private-documents",
                },
                error: null,
              }),
            };
          }
          return {};
        }),
      };

      (getAdminDb as any).mockReturnValue(mockDb);

      await expect(
        ProductMediaService.attachMediaAssetToProduct("seller-A", "prod-1", { assetId: "doc-1" })
      ).rejects.toThrow("Only image assets can be attached to products.");
    });
  });

  describe("2. Product Image Association Removal", () => {
    it("deletes only product_images association record, preserving media_assets", async () => {
      const { getAdminDb } = await import("../src/config/database.js");

      const deleteMock = vi.fn().mockResolvedValue({ error: null });

      const mockDb = {
        from: vi.fn((table: string) => {
          if (table === "products") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: "prod-1", seller_id: "seller-A" },
                error: null,
              }),
            };
          }
          if (table === "product_images") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              order: vi.fn().mockReturnThis(),
              limit: vi.fn().mockResolvedValue({ data: [], error: null }),
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: "img-1", product_id: "prod-1", asset_id: "asset-1", is_primary: false },
                error: null,
              }),
              delete: () => ({
                eq: deleteMock,
              }),
            };
          }
          return {};
        }),
      };

      (getAdminDb as any).mockReturnValue(mockDb);

      await ProductMediaService.removeProductImage("seller-A", "prod-1", "img-1");
      expect(deleteMock).toHaveBeenCalledWith("id", "img-1");
    });
  });
});
