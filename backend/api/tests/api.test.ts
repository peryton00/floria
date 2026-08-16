import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { checkoutService } from "../src/checkout/checkout.service.js";
import { paymentsService } from "../src/payments/payments.service.js";

const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock("../src/config/database.js", () => {
  return {
    getAdminDb: () => ({
      from: mockFrom,
    }),
    getAnonDb: () => ({
      auth: {
        getUser: mockGetUser,
      },
    }),
    getUserDb: () => ({}),
  };
});

describe("Floria Security Test Matrix & Hardening Audit (Phase 3.8A)", () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createApp();
  });

  const setupAuthUser = (userId: string, role: string, sellerStatus = "approved") => {
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
                data: { id: `sel-${userId}`, user_id: userId, status: sellerStatus },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "carts") {
        return {
          select: () => ({
            eq: (col: string, val: string) => ({
              maybeSingle: async () => {
                if (val === userId) return { data: { id: `cart-${userId}`, user_id: userId }, error: null };
                return { data: null, error: null };
              },
            }),
          }),
        };
      }
      if (table === "cart_items") {
        return {
          delete: () => ({ eq: async () => ({ error: null }) }),
          select: () => ({ eq: async () => ({ data: [], error: null }) }),
        };
      }
      if (table === "payments") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null, error: null }),
            }),
          }),
          insert: async () => ({ error: null }),
        };
      }
      if (table === "orders") {
        return {
          select: () => ({
            order: () => ({
              eq: async () => ({ data: [], error: null }),
              limit: async () => ({ data: [], error: null }),
              maybeSingle: async () => ({ data: null, error: null }),
            }),
            eq: () => ({
              maybeSingle: async () => ({ data: null, error: null }),
            }),
          }),
          insert: () => ({ select: () => ({ single: async () => ({ data: { id: "FLR-NEW-1" } }) }) }),
          delete: () => ({ eq: async () => ({ error: null }) }),
        };
      }
      if (table === "delivery_assignments") {
        return {
          select: () => ({
            order: () => ({
              eq: async () => ({ data: [], error: null }),
            }),
          }),
        };
      }
      if (table === "platform_settings") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: { key: "platform_commission_rate", value: 12.0 }, error: null }),
            }),
          }),
          upsert: (_payload: any) => ({
            select: () => ({
              single: async () => ({ data: { key: "platform_commission_rate", value: _payload?.value ?? 15.0 }, error: null }),
            }),
          }),
        };
      }
      if (table === "audit_logs") {
        return {
          select: () => ({
            order: () => ({
              limit: async () => ({ data: [], error: null }),
            }),
          }),
          insert: async () => ({ error: null }),
        };
      }
      if (table === "products") {
        return {
          select: () => ({
            eq: () => ({
              order: async () => ({ data: [], error: null }),
              maybeSingle: async () => ({ data: null, error: null }),
            }),
            in: () => ({ eq: async () => ({ data: [] }) }),
          }),
        };
      }
      return {
        select: () => ({
          eq: () => ({
            order: async () => ({ data: [], error: null }),
            maybeSingle: async () => ({ data: null }),
          }),
          order: async () => ({ data: [], error: null }),
        }),
        insert: async () => ({ error: null }),
        delete: () => ({ eq: async () => ({ error: null }) }),
      };
    });
  };

  // ── 1. Health Endpoints ──────────────────────────────────────────────────

  describe("1. System Health", () => {
    it("1. returns 200 OK for /health endpoint", async () => {
      const res = await request(app).get("/health");
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("healthy");
    });
  });

  // ── 2. Authentication Verification ───────────────────────────────────────

  describe("2. Authentication Matrix", () => {
    it("8. Missing JWT returns 401 AUTH_REQUIRED", async () => {
      const res = await request(app).get("/api/v1/admin/dashboard");
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("AUTH_REQUIRED");
    });

    it("9. Invalid JWT returns 401 AUTH_REQUIRED", async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("Invalid token") });

      const res = await request(app)
        .get("/api/v1/admin/dashboard")
        .set("Authorization", "Bearer invalid_token_123");

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("AUTH_REQUIRED");
    });
  });

  // ── 3. RBAC Boundaries ───────────────────────────────────────────────────

  describe("3. RBAC Security Matrix", () => {
    it("1. Customer -> Admin dashboard = 403 FORBIDDEN", async () => {
      setupAuthUser("cust-1", "customer");
      const res = await request(app)
        .get("/api/v1/admin/dashboard")
        .set("Authorization", "Bearer valid_cust_token");

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("2. Customer -> Admin users = 403 FORBIDDEN", async () => {
      setupAuthUser("cust-1", "customer");
      const res = await request(app)
        .get("/api/v1/admin/users")
        .set("Authorization", "Bearer valid_cust_token");

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("3. Customer -> Operations dashboard = 403 FORBIDDEN", async () => {
      setupAuthUser("cust-1", "customer");
      const res = await request(app)
        .get("/api/v1/operations/dashboard")
        .set("Authorization", "Bearer valid_cust_token");

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("4. Seller -> Admin dashboard = 403 FORBIDDEN", async () => {
      setupAuthUser("seller-1", "seller");
      const res = await request(app)
        .get("/api/v1/admin/dashboard")
        .set("Authorization", "Bearer valid_seller_token");

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("5. Seller -> Operations dashboard = 403 FORBIDDEN", async () => {
      setupAuthUser("seller-1", "seller");
      const res = await request(app)
        .get("/api/v1/operations/dashboard")
        .set("Authorization", "Bearer valid_seller_token");

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("6. Operations -> Seller approval = 403 FORBIDDEN", async () => {
      setupAuthUser("op-1", "operations");
      const res = await request(app)
        .post("/api/v1/admin/sellers/11111111-1111-1111-1111-111111111111/approve")
        .set("Authorization", "Bearer valid_op_token");

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("7. Operations -> Admin user management = 403 FORBIDDEN", async () => {
      setupAuthUser("op-1", "operations");
      const res = await request(app)
        .get("/api/v1/admin/users")
        .set("Authorization", "Bearer valid_op_token");

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("19. Seller cannot access admin order data (403 FORBIDDEN)", async () => {
      setupAuthUser("seller-1", "seller");
      const res = await request(app)
        .get("/api/v1/admin/orders")
        .set("Authorization", "Bearer valid_seller_token");

      expect(res.status).toBe(403);
    });

    it("21. Non-admin cannot read audit logs (403 FORBIDDEN)", async () => {
      setupAuthUser("op-1", "operations");
      const res = await request(app)
        .get("/api/v1/admin/audit-logs")
        .set("Authorization", "Bearer valid_op_token");

      expect(res.status).toBe(403);
    });

    it("24. Suspended seller is blocked from operational seller actions (403 FORBIDDEN)", async () => {
      setupAuthUser("seller-suspended", "seller", "suspended");
      const res = await request(app)
        .post("/api/v1/seller/products")
        .set("Authorization", "Bearer valid_suspended_token")
        .send({ name: "Plant", category_id: "cat-1", price_paise: 100, stock_quantity: 5 });

      expect(res.status).toBe(403);
    });

    it("25. Customer cannot access delivery management (403 FORBIDDEN)", async () => {
      setupAuthUser("cust-1", "customer");
      const res = await request(app)
        .get("/api/v1/operations/deliveries")
        .set("Authorization", "Bearer valid_cust_token");

      expect(res.status).toBe(403);
    });

    it("26. Operations cannot approve sellers (403 FORBIDDEN)", async () => {
      setupAuthUser("op-1", "operations");
      const res = await request(app)
        .post("/api/v1/admin/sellers/11111111-1111-1111-1111-111111111111/approve")
        .set("Authorization", "Bearer valid_op_token");

      expect(res.status).toBe(403);
    });
  });

  // ── 4. Validation & IDOR Tests ───────────────────────────────────────────

  describe("4. Validation & IDOR Security", () => {
    it("22. Invalid UUID is rejected with 422 VALIDATION_ERROR", async () => {
      setupAuthUser("admin-1", "admin");
      const res = await request(app)
        .post("/api/v1/admin/sellers/invalid-uuid-string/approve")
        .set("Authorization", "Bearer valid_admin_token");

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  // ── 5. Payment Webhook Idempotency ──────────────────────────────────────

  describe("5. Payment Webhook Idempotency (28)", () => {
    it("28. Duplicate payment webhook processed idempotently", async () => {
      setupAuthUser("system", "admin");
      const payload = { eventId: "evt_test_unique_999", orderId: "FLR-260812-7020", amountPaise: 29900, status: "captured" };

      // First webhook delivery -> processed
      const res1 = await paymentsService.processWebhook(payload);
      expect(res1.success).toBe(true);
      expect(res1.idempotent).toBe(false);

      // Duplicate webhook delivery -> safely ignored
      const res2 = await paymentsService.processWebhook(payload);
      expect(res2.success).toBe(true);
      expect(res2.idempotent).toBe(true);
      expect(res2.message).toContain("already processed");
    });
  });

  // ── 6. Concurrent Inventory Reservation ──────────────────────────────────

  describe("6. Concurrent Inventory Reservation (27)", () => {
    it("27. Prevents oversale when stock = 1 and concurrent requests arrive", async () => {
      let currentStock = 1;

      mockFrom.mockImplementation((table: string) => {
        if (table === "addresses") {
          return { select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { id: "addr-1" } }) }) }) }) };
        }
        if (table === "carts") {
          return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { id: "cart-1" } }) }) }) };
        }
        if (table === "cart_items") {
          return {
            select: () => ({ eq: async () => ({ data: [{ product_id: "prod-1", quantity: 1 }] }) }),
            delete: () => ({ eq: async () => ({ error: null }) }),
          };
        }
        if (table === "products") {
          return { select: () => ({ in: () => ({ eq: async () => ({ data: [{ id: "prod-1", name: "Plant", seller_id: "sel-1", status: "active" }] }) }) }) };
        }
        if (table === "inventory") {
          return {
            select: () => ({
              in: async () => ({ data: [{ product_id: "prod-1", price_paise: 29900, stock_quantity: currentStock }] }),
            }),
            update: (payload: any) => ({
              eq: () => ({
                gte: () => ({
                  select: async () => {
                    if (currentStock >= 1) {
                      currentStock -= 1;
                      return { data: [{ product_id: "prod-1", stock_quantity: currentStock }], error: null };
                    }
                    return { data: [], error: null };
                  },
                }),
              }),
            }),
          };
        }
        if (table === "orders") {
          return {
            insert: () => ({ select: () => ({ single: async () => ({ data: { id: "FLR-NEW-1" } }) }) }),
            delete: () => ({ eq: async () => ({}) }),
          };
        }
        if (table === "order_items" || table === "seller_order_fulfillments") {
          return { insert: async () => ({ error: null }) };
        }
        if (table === "audit_logs") {
          return { insert: async () => ({ error: null }) };
        }
        return {
          select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }),
          insert: async () => ({ error: null }),
          delete: () => ({ eq: async () => ({ error: null }) }),
        };
      });

      // Request A (Stock = 1 -> 0)
      const resA = await checkoutService.processCheckout({ userId: "cust-1", addressId: "addr-1", paymentMethod: "online" });
      expect(resA.orderId).toBe("FLR-NEW-1");

      // Request B (Stock = 0 -> throws OUT_OF_STOCK)
      await expect(
        checkoutService.processCheckout({ userId: "cust-2", addressId: "addr-1", paymentMethod: "online" })
      ).rejects.toThrow("out of stock");
    });
  });

  // ── 7. Phase 3.6A Seller Dashboard Security & Integrity Matrix ────────────

  describe("7. Phase 3.6A Seller Dashboard Security & Integrity", () => {
    it("Seller A -> Seller A Dashboard = 200 OK", async () => {
      setupAuthUser("seller-A", "seller", "approved");
      const res = await request(app)
        .get("/api/v1/seller/dashboard")
        .set("Authorization", "Bearer valid_sellerA_token");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.kpis).toBeDefined();
    });

    it("Pending Seller -> Product Creation = 403 FORBIDDEN", async () => {
      setupAuthUser("seller-pending-1", "seller", "pending");
      const res = await request(app)
        .post("/api/v1/seller/products")
        .set("Authorization", "Bearer pending_token")
        .send({ name: "Unapproved Plant", price_paise: 5000, stock_quantity: 10 });

      expect(res.status).toBe(403);
      expect(res.body.error.message).toContain("pending approval");
    });

    it("Pending Seller -> Inventory Update = 403 FORBIDDEN", async () => {
      setupAuthUser("seller-pending-1", "seller", "pending");
      const res = await request(app)
        .patch("/api/v1/seller/inventory/11111111-1111-1111-1111-111111111111")
        .set("Authorization", "Bearer pending_token")
        .send({ stock_quantity: 20 });

      expect(res.status).toBe(403);
    });

    it("Pending Seller -> Fulfillment Update = 403 FORBIDDEN", async () => {
      setupAuthUser("seller-pending-1", "seller", "pending");
      const res = await request(app)
        .post("/api/v1/seller/fulfillment")
        .set("Authorization", "Bearer pending_token")
        .send({ masterOrderId: "FLR-101", newStatus: "Nursery Confirmed" });

      expect(res.status).toBe(403);
    });

    it("Inventory Mutation -> Negative Stock = 422 VALIDATION_ERROR", async () => {
      setupAuthUser("seller-A", "seller", "approved");
      const res = await request(app)
        .patch("/api/v1/seller/inventory/11111111-1111-1111-1111-111111111111")
        .set("Authorization", "Bearer sellerA_token")
        .send({ stock_quantity: -10 });

      expect(res.status).toBe(422);
      expect(res.body.error.message).toContain("cannot be negative");
    });

    it("Customer Account -> Seller Dashboard = 403 FORBIDDEN", async () => {
      setupAuthUser("cust-100", "customer");
      const res = await request(app)
        .get("/api/v1/seller/dashboard")
        .set("Authorization", "Bearer cust_token");

      expect(res.status).toBe(403);
    });
  });

  // ── 8. Phase 3.9.1 Platform Commission Configuration & Financial Security ──

  describe("8. Phase 3.9.1 Platform Commission Configuration & Financial Security", () => {
    it("Admin -> GET /api/v1/admin/settings/platform = 200 OK", async () => {
      setupAuthUser("admin-1", "admin");
      const res = await request(app)
        .get("/api/v1/admin/settings/platform")
        .set("Authorization", "Bearer admin_token");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.commissionRate).toBe(12.0);
    });

    it("Customer -> GET /api/v1/admin/settings/platform = 403 FORBIDDEN", async () => {
      setupAuthUser("cust-1", "customer");
      const res = await request(app)
        .get("/api/v1/admin/settings/platform")
        .set("Authorization", "Bearer cust_token");

      expect(res.status).toBe(403);
    });

    it("Seller -> PATCH /api/v1/admin/settings/commission = 403 FORBIDDEN", async () => {
      setupAuthUser("seller-1", "seller");
      const res = await request(app)
        .patch("/api/v1/admin/settings/commission")
        .set("Authorization", "Bearer seller_token")
        .send({ commissionRate: 5.0 });

      expect(res.status).toBe(403);
    });

    it("Admin -> PATCH valid commission rate = 200 OK", async () => {
      setupAuthUser("admin-1", "admin");
      const res = await request(app)
        .patch("/api/v1/admin/settings/commission")
        .set("Authorization", "Bearer admin_token")
        .send({ commissionRate: 15.0 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.commissionRate).toBe(15.0);
    });

    it("Admin -> PATCH negative commission rate = 422 VALIDATION_ERROR", async () => {
      setupAuthUser("admin-1", "admin");
      const res = await request(app)
        .patch("/api/v1/admin/settings/commission")
        .set("Authorization", "Bearer admin_token")
        .send({ commissionRate: -5.0 });

      expect(res.status).toBe(422);
      expect(res.body.error.message).toContain("cannot be negative");
    });

    it("Admin -> PATCH oversized commission rate (>50%) = 422 VALIDATION_ERROR", async () => {
      setupAuthUser("admin-1", "admin");
      const res = await request(app)
        .patch("/api/v1/admin/settings/commission")
        .set("Authorization", "Bearer admin_token")
        .send({ commissionRate: 75.0 });

      expect(res.status).toBe(422);
      expect(res.body.error.message).toContain("cannot exceed maximum");
    });
  });

  describe("Phase 3.12.1 — Seller Profile Persistence & Notifications Audit", () => {
    it("Unauthenticated GET /api/v1/seller/profile = 401 UNAUTHORIZED", async () => {
      const res = await request(app).get("/api/v1/seller/profile");
      expect(res.status).toBe(401);
    });

    it("Customer -> GET /api/v1/seller/profile = 403 FORBIDDEN", async () => {
      setupAuthUser("cust-1", "customer");
      const res = await request(app)
        .get("/api/v1/seller/profile")
        .set("Authorization", "Bearer cust_token");
      expect(res.status).toBe(403);
    });

    it("Seller -> PATCH invalid phone = 400 BAD REQUEST", async () => {
      setupAuthUser("seller-1", "seller");
      mockFrom.mockImplementation((table: string) => {
        if (table === "user_profiles") {
          return {
            select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { id: "seller-1", role: "seller" }, error: null }) }) }),
          };
        }
        if (table === "seller_profiles") {
          return {
            select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { id: "sel-prof-1", user_id: "seller-1", business_name: "Green Nursery", status: "approved" }, error: null }) }) }),
          };
        }
        return {};
      });

      const res = await request(app)
        .patch("/api/v1/seller/profile")
        .set("Authorization", "Bearer seller_token")
        .send({ contact_phone: "123" });

      expect(res.status).toBe(422);
      expect(res.body.error.message).toContain("Invalid phone number");
    });

    it("Unauthenticated GET /api/v1/notifications = 401 UNAUTHORIZED", async () => {
      const res = await request(app).get("/api/v1/notifications");
      expect(res.status).toBe(401);
    });

    it("Authenticated User -> GET /api/v1/notifications = 200 OK", async () => {
      setupAuthUser("user-1", "customer");
      mockFrom.mockImplementation((table: string) => {
        if (table === "user_profiles") {
          return {
            select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { id: "user-1", role: "customer" }, error: null }) }) }),
          };
        }
        if (table === "notifications") {
          return {
            select: () => ({
              eq: () => ({
                order: () => ({
                  is: () => ({
                    range: async () => ({
                      data: [{ id: "notif-1", user_id: "user-1", title: "Test", message: "Hello", read_at: null, created_at: new Date().toISOString() }],
                      count: 1,
                      error: null,
                    }),
                  }),
                  range: async () => ({
                    data: [{ id: "notif-1", user_id: "user-1", title: "Test", message: "Hello", read_at: null, created_at: new Date().toISOString() }],
                    count: 1,
                    error: null,
                  }),
                }),
                is: async () => ({ count: 1, error: null }),
              }),
            }),
          };
        }
        return {};
      });

      const res = await request(app)
        .get("/api/v1/notifications")
        .set("Authorization", "Bearer user_token");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.notifications).toBeDefined();
    });

    it("Authenticated User -> GET /api/v1/notifications/unread-count = 200 OK", async () => {
      setupAuthUser("user-1", "customer");
      mockFrom.mockImplementation((table: string) => {
        if (table === "user_profiles") {
          return {
            select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { id: "user-1", role: "customer" }, error: null }) }) }),
          };
        }
        if (table === "notifications") {
          return {
            select: () => ({
              eq: () => ({
                is: async () => ({ count: 3, error: null }),
              }),
            }),
          };
        }
        return {};
      });

      const res = await request(app)
        .get("/api/v1/notifications/unread-count")
        .set("Authorization", "Bearer user_token");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.unreadCount).toBe(3);
    });

    it("Authenticated User -> PATCH /api/v1/notifications/read-all = 200 OK", async () => {
      setupAuthUser("user-1", "customer");
      mockFrom.mockImplementation((table: string) => {
        if (table === "user_profiles") {
          return {
            select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { id: "user-1", role: "customer" }, error: null }) }) }),
          };
        }
        if (table === "notifications") {
          return {
            update: () => ({
              eq: () => ({
                is: async () => ({ error: null }),
              }),
            }),
          };
        }
        return {};
      });

      const res = await request(app)
        .patch("/api/v1/notifications/read-all")
        .set("Authorization", "Bearer user_token");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("Seller Documents -> Valid PDF upload returns 200 OK with pending status", async () => {
      setupAuthUser("seller-1", "seller");
      mockFrom.mockImplementation((table: string) => {
        if (table === "user_profiles") {
          return {
            select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { id: "seller-1", role: "seller" }, error: null }) }) }),
          };
        }
        if (table === "seller_profiles") {
          return {
            select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { id: "sel-prof-1", user_id: "seller-1", business_name: "Green Nursery", status: "approved" }, error: null }) }) }),
          };
        }
        if (table === "seller_documents") {
          return {
            insert: () => ({
              select: () => ({
                single: async () => ({
                  data: {
                    id: "doc-1",
                    seller_id: "sel-prof-1",
                    document_type: "gstin",
                    file_name: "gstin.pdf",
                    file_url: "https://storage.floria.in/gstin.pdf",
                    file_size_bytes: 100000,
                    mime_type: "application/pdf",
                    status: "pending",
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      const res = await request(app)
        .post("/api/v1/seller/documents")
        .set("Authorization", "Bearer seller_token")
        .send({
          documentType: "gstin",
          fileName: "gstin.pdf",
          fileUrl: "https://storage.floria.in/gstin.pdf",
          fileSize: 100000,
          mimeType: "application/pdf",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("pending");
    });

    it("Seller Documents -> Rejects invalid MIME type (exe file) with 422 VALIDATION_ERROR", async () => {
      setupAuthUser("seller-1", "seller");
      mockFrom.mockImplementation((table: string) => {
        if (table === "user_profiles") {
          return {
            select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { id: "seller-1", role: "seller" }, error: null }) }) }),
          };
        }
        if (table === "seller_profiles") {
          return {
            select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { id: "sel-prof-1", user_id: "seller-1", business_name: "Green Nursery", status: "approved" }, error: null }) }) }),
          };
        }
        return {};
      });

      const res = await request(app)
        .post("/api/v1/seller/documents")
        .set("Authorization", "Bearer seller_token")
        .send({
          documentType: "gstin",
          fileName: "virus.exe",
          fileUrl: "https://storage.floria.in/virus.exe",
          fileSize: 1000,
          mimeType: "application/x-msdownload",
        });

      expect(res.status).toBe(422);
      expect(res.body.error.message).toContain("Invalid document file type");
    });

    it("Seller Settings -> GET /api/v1/seller/settings/notifications returns settings", async () => {
      setupAuthUser("seller-1", "seller");
      mockFrom.mockImplementation((table: string) => {
        if (table === "user_profiles") {
          return {
            select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { id: "seller-1", role: "seller" }, error: null }) }) }),
          };
        }
        if (table === "seller_profiles") {
          return {
            select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { id: "sel-prof-1", user_id: "seller-1", status: "approved" }, error: null }) }) }),
          };
        }
        if (table === "seller_settings") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: {
                    seller_id: "sel-prof-1",
                    new_order_notifications: true,
                    low_stock_notifications: true,
                    email_notifications: true,
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      const res = await request(app)
        .get("/api/v1/seller/settings/notifications")
        .set("Authorization", "Bearer seller_token");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.new_order_notifications).toBe(true);
    });
  });
});
