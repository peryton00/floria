import { describe, it, expect, vi, beforeEach } from "vitest";
import type { UserRole } from "@floria/types";

// Mock Supabase server client helper
const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  getSupabaseServerClient: async () => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  }),
  getSupabaseServiceClient: async () => ({
    from: mockFrom,
  }),
}));

describe("RBAC Authorization System (src/lib/server/auth.ts)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── 1. Unauthenticated Checks ──────────────────────────────────────────────

  describe("Unauthenticated Access", () => {
    it("requireUser throws 401 AUTH_REQUIRED when session is missing", async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("No session") });
      const { requireUser } = await import("@/lib/server/auth");
      const { FloriaError } = await import("@/lib/server/errors");

      await expect(requireUser()).rejects.toThrow(FloriaError);
      await expect(requireUser()).rejects.toHaveProperty("status", 401);
    });
  });

  // ── 2. Role Escalation Protection Matrix ──────────────────────────────────

  describe("Role Escalation Matrix", () => {
    const roles: UserRole[] = ["customer", "seller", "operations", "admin"];

    // Helper to mock Supabase user session and DB profile
    const setupUserMock = (userId: string, role: UserRole) => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: userId, email: `${role}@floria.test` } },
        error: null,
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === "user_profiles") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: { id: userId, role }, error: null }),
              }),
            }),
          };
        }
        if (table === "seller_profiles") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: {
                    id: `sel-${userId}`,
                    user_id: userId,
                    status: role === "seller" ? "approved" : "pending",
                    business_name: "Test Nursery",
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }) };
      });
    };

    it("requireAdmin only permits admin role", async () => {
      const { requireAdmin } = await import("@/lib/server/auth");

      for (const role of roles) {
        setupUserMock(`user-${role}`, role);
        if (role === "admin") {
          const user = await requireAdmin();
          expect(user.role).toBe("admin");
        } else {
          await expect(requireAdmin()).rejects.toHaveProperty("status", 403);
        }
      }
    });

    it("requireOperations permits operations and admin roles only", async () => {
      const { requireOperations } = await import("@/lib/server/auth");

      for (const role of roles) {
        setupUserMock(`user-${role}`, role);
        if (role === "operations" || role === "admin") {
          const user = await requireOperations();
          expect(["operations", "admin"]).toContain(user.role);
        } else {
          await expect(requireOperations()).rejects.toHaveProperty("status", 403);
        }
      }
    });

    it("requireRole checks exact role match", async () => {
      const { requireRole } = await import("@/lib/server/auth");

      setupUserMock("user-cust", "customer");
      await expect(requireRole("seller")).rejects.toHaveProperty("status", 403);
      await expect(requireRole("operations")).rejects.toHaveProperty("status", 403);
      await expect(requireRole("admin")).rejects.toHaveProperty("status", 403);

      const cust = await requireRole("customer");
      expect(cust.role).toBe("customer");
    });
  });

  // ── 3. Seller Application & Operational Status Rules ───────────────────────

  describe("Seller Application Status (Approved vs Pending vs Suspended)", () => {
    const setupSellerStatusMock = (status: "pending" | "approved" | "suspended") => {
      const userId = "seller-123";
      mockGetUser.mockResolvedValue({
        data: { user: { id: userId, email: "nursery@floria.test" } },
        error: null,
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === "user_profiles") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: { id: userId, role: "seller" }, error: null }),
              }),
            }),
          };
        }
        if (table === "seller_profiles") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: {
                    id: "sp-123",
                    user_id: userId,
                    status,
                    business_name: "Green Leaf Nursery",
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }) };
      });
    };

    it("requireSeller allows operational access ONLY for approved sellers", async () => {
      const { requireSeller } = await import("@/lib/server/auth");

      setupSellerStatusMock("approved");
      const approvedSeller = await requireSeller();
      expect(approvedSeller.sellerStatus).toBe("approved");

      setupSellerStatusMock("pending");
      await expect(requireSeller()).rejects.toHaveProperty("status", 403);

      setupSellerStatusMock("suspended");
      await expect(requireSeller()).rejects.toHaveProperty("status", 403);
    });

    it("requireSellerProfile(allowPendingOrSuspended: true) allows pending sellers to access onboarding", async () => {
      const { requireSellerProfile } = await import("@/lib/server/auth");

      setupSellerStatusMock("pending");
      const pendingSeller = await requireSellerProfile({ allowPendingOrSuspended: true });
      expect(pendingSeller.sellerStatus).toBe("pending");
      expect(pendingSeller.businessName).toBe("Green Leaf Nursery");
    });
  });

  // ── 4. Ownership Authorization (Products & Orders) ───────────────────────

  describe("Ownership Authorization (requireOwnedProduct & requireOwnedSellerOrder)", () => {
    it("prevents Seller A from accessing Seller B products", async () => {
      const { requireOwnedProduct } = await import("@/lib/server/auth");

      // Setup Seller A
      const userIdA = "user-seller-a";
      const sellerIdA = "seller-a";
      const sellerIdB = "seller-b";

      mockGetUser.mockResolvedValue({
        data: { user: { id: userIdA, email: "sellerA@floria.test" } },
        error: null,
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === "user_profiles") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: { id: userIdA, role: "seller" }, error: null }),
              }),
            }),
          };
        }
        if (table === "seller_profiles") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: { id: sellerIdA, user_id: userIdA, status: "approved", business_name: "Seller A" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "products") {
          return {
            select: () => ({
              eq: (field: string, val: string) => ({
                maybeSingle: async () => {
                  if (val === "p-seller-b") {
                    // Product belongs to Seller B
                    return { data: { id: "p-seller-b", seller_id: sellerIdB }, error: null };
                  }
                  if (val === "p-seller-a") {
                    return { data: { id: "p-seller-a", seller_id: sellerIdA }, error: null };
                  }
                  return { data: null, error: null };
                },
              }),
            }),
          };
        }
        return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }) };
      });

      // Seller A accessing own product -> allowed
      const ownProduct = await requireOwnedProduct("p-seller-a");
      expect(ownProduct.sellerId).toBe(sellerIdA);

      // Seller A accessing Seller B product -> 403 Forbidden
      await expect(requireOwnedProduct("p-seller-b")).rejects.toHaveProperty("status", 403);
    });

    it("prevents Seller A from modifying Seller B order fulfillment", async () => {
      const { requireOwnedSellerOrder } = await import("@/lib/server/auth");

      const userIdA = "user-seller-a";
      const sellerIdA = "seller-a";

      mockGetUser.mockResolvedValue({
        data: { user: { id: userIdA, email: "sellerA@floria.test" } },
        error: null,
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === "user_profiles") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: { id: userIdA, role: "seller" }, error: null }),
              }),
            }),
          };
        }
        if (table === "seller_profiles") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: { id: sellerIdA, user_id: userIdA, status: "approved", business_name: "Seller A" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "seller_order_fulfillments") {
          return {
            select: () => ({
              eq: (_f1: string, val1: string) => ({
                eq: (_f2: string, _val2: string) => ({
                  maybeSingle: async () => {
                    if (val1 === "order-seller-b-only") {
                      // Does not exist for Seller A
                      return { data: null, error: null };
                    }
                    return { data: { id: "ful-1", order_id: "order-own", seller_id: sellerIdA }, error: null };
                  },
                }),
              }),
            }),
          };
        }
        return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }) };
      });

      // Seller A accessing own order -> allowed
      const ownOrder = await requireOwnedSellerOrder("order-own");
      expect(ownOrder.sellerId).toBe(sellerIdA);

      // Seller A accessing Seller B order -> 404/403
      await expect(requireOwnedSellerOrder("order-seller-b-only")).rejects.toHaveProperty("status", 404);
    });
  });
});
