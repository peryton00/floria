import { describe, it, expect, beforeEach, vi } from "vitest";
import { DomainMediaService } from "../src/media/domain-media.service.js";
import type { AuthenticatedUser } from "../src/middleware/auth.js";

// Mock dependencies for unit test isolation
vi.mock("../src/config/database.js", () => {
  return {
    getAdminDb: vi.fn(),
  };
});

describe("Stage 9 — Remaining Media Domains Security Test Matrix", () => {
  const mockSellerUser: AuthenticatedUser = {
    id: "user-seller-1",
    email: "seller@floria.in",
    role: "seller",
    sellerId: "seller-1",
    permissions: [],
  };

  const mockCustomerUser: AuthenticatedUser = {
    id: "user-cust-1",
    email: "cust@floria.in",
    role: "customer",
    permissions: [],
  };

  const mockAdminUser: AuthenticatedUser = {
    id: "user-admin-1",
    email: "admin@floria.in",
    role: "admin",
    permissions: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. SELLER LOGO INTEGRATION", () => {
    it("updates seller logo when seller owns profile and asset is READY", async () => {
      const { getAdminDb } = await import("../src/config/database.js");

      const mockDb = {
        from: vi.fn((table: string) => {
          if (table === "seller_profiles") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: "seller-1", user_id: "user-seller-1" },
                error: null,
              }),
              update: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: {
                  id: "seller-1",
                  logo_asset_id: "asset-logo-1",
                  logo_url: "https://example.com/logo.webp",
                },
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
                  id: "asset-logo-1",
                  seller_id: "seller-1",
                  status: "READY",
                  media_category: "IMAGE",
                  storage_bucket: "public-media",
                },
                error: null,
              }),
            };
          }
          if (table === "media_variants") {
            return {
              select: vi.fn().mockReturnThis(),
              in: vi.fn().mockResolvedValue({
                data: [
                  {
                    asset_id: "asset-logo-1",
                    variant_name: "standard",
                    storage_bucket: "public-media",
                    storage_path: "sellers/seller-1/asset-logo-1/standard.webp",
                  },
                ],
                error: null,
              }),
            };
          }
          return {};
        }),
      };

      (getAdminDb as any).mockReturnValue(mockDb);

      const res = await DomainMediaService.updateSellerLogo(
        mockSellerUser,
        "asset-logo-1",
      );
      expect(res.logo_asset_id).toBe("asset-logo-1");
    });

    it("rejects cross-seller logo attachment with 403 Forbidden", async () => {
      const { getAdminDb } = await import("../src/config/database.js");

      const mockDb = {
        from: vi.fn((table: string) => {
          if (table === "seller_profiles") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: "seller-1", user_id: "user-seller-1" },
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
                  id: "asset-logo-B",
                  seller_id: "seller-2", // Belongs to Seller 2!
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
        DomainMediaService.updateSellerLogo(mockSellerUser, "asset-logo-B"),
      ).rejects.toThrow("Cross-seller media asset attachment is prohibited.");
    });
  });

  describe("2. USER AVATAR INTEGRATION", () => {
    it("rejects cross-user avatar attachment with 403 Forbidden", async () => {
      const { getAdminDb } = await import("../src/config/database.js");

      const mockDb = {
        from: vi.fn((table: string) => {
          if (table === "user_profiles") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: "user-cust-1" },
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
                  id: "asset-avatar-2",
                  uploaded_by_user_id: "user-other-999", // Uploaded by another user!
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
        DomainMediaService.updateUserAvatar(mockCustomerUser, "asset-avatar-2"),
      ).rejects.toThrow("Cross-user media asset attachment is prohibited.");
    });
  });

  describe("3. CATEGORY BANNER INTEGRATION", () => {
    it("rejects non-admin category banner update with 403 Forbidden", async () => {
      await expect(
        DomainMediaService.updateCategoryBanner(
          mockSellerUser,
          "cat-1",
          "asset-cat-1",
        ),
      ).rejects.toThrow("Only administrators can update category banners.");
    });

    it("allows admin category banner update when asset is READY", async () => {
      const { getAdminDb } = await import("../src/config/database.js");

      const mockDb = {
        from: vi.fn((table: string) => {
          if (table === "categories") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: "cat-1", name: "Indoor Plants" },
                error: null,
              }),
              update: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: {
                  id: "cat-1",
                  name: "Indoor Plants",
                  banner_asset_id: "asset-cat-1",
                },
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
                  id: "asset-cat-1",
                  status: "READY",
                  media_category: "IMAGE",
                  storage_bucket: "public-media",
                },
                error: null,
              }),
            };
          }
          if (table === "media_variants") {
            return {
              select: vi.fn().mockReturnThis(),
              in: vi.fn().mockResolvedValue({
                data: [
                  {
                    asset_id: "asset-cat-1",
                    variant_name: "banner",
                    storage_bucket: "public-media",
                    storage_path: "categories/asset-cat-1/banner.webp",
                  },
                ],
                error: null,
              }),
            };
          }
          return {};
        }),
      };

      (getAdminDb as any).mockReturnValue(mockDb);

      const res = await DomainMediaService.updateCategoryBanner(
        mockAdminUser,
        "cat-1",
        "asset-cat-1",
      );
      expect(res.banner_asset_id).toBe("asset-cat-1");
    });
  });

  describe("4. SELLER PRIVATE DOCUMENTS INTEGRATION", () => {
    it("enforces private-documents storage bucket requirement", async () => {
      const { getAdminDb } = await import("../src/config/database.js");

      const mockDb = {
        from: vi.fn((table: string) => {
          if (table === "media_assets") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: "asset-doc-public",
                  seller_id: "seller-1",
                  status: "READY",
                  media_category: "DOCUMENT",
                  storage_bucket: "public-media", // INVALID! Must be private-documents
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
        DomainMediaService.attachSellerDocument(
          mockSellerUser,
          "gst_cert",
          "asset-doc-public",
        ),
      ).rejects.toThrow(
        "Seller documents must be stored in 'private-documents' bucket.",
      );
    });
  });
});
