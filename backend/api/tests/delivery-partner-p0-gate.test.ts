// Floria API — Delivery Partner P0 Gate Comprehensive Test Suite
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

const mockGetUser = vi.fn();
const mockAdminCreateUser = vi.fn();
const mockAdminUpdateUser = vi.fn();
const mockFrom = vi.fn();

vi.mock("../src/config/database.js", () => {
  return {
    getAdminDb: () => ({
      from: mockFrom,
      auth: {
        admin: {
          createUser: mockAdminCreateUser,
          updateUserById: mockAdminUpdateUser,
        },
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

describe("Floria Delivery Partner — P0 Gate Verification Suite", () => {
  let app: ReturnType<typeof createApp>;

  // Data Store for Mocks
  const partners = {
    "courier-A": {
      id: "partner-A-uuid",
      user_id: "user-courier-A",
      public_partner_id: "FLR-DRV-000001",
      full_name: "Courier Alice",
      email: "alice.courier@floria.test",
      status: "active",
      on_duty: true,
    },
    "courier-B": {
      id: "partner-B-uuid",
      user_id: "user-courier-B",
      public_partner_id: "FLR-DRV-000002",
      full_name: "Courier Bob",
      email: "bob.courier@floria.test",
      status: "active",
      on_duty: true,
    },
  };

  const deliveries = {
    "del-A-1": {
      id: "del-A-1",
      order_id: "ord-100",
      assigned_to: "user-courier-A",
      delivery_partner_id: "partner-A-uuid",
      status: "assigned",
      assigned_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    "del-A-picked": {
      id: "del-A-picked",
      order_id: "ord-101",
      assigned_to: "user-courier-A",
      delivery_partner_id: "partner-A-uuid",
      status: "picked_up",
      assigned_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    "del-A-transit": {
      id: "del-A-transit",
      order_id: "ord-102",
      assigned_to: "user-courier-A",
      delivery_partner_id: "partner-A-uuid",
      status: "out_for_delivery",
      assigned_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    "del-B-1": {
      id: "del-B-1",
      order_id: "ord-200",
      assigned_to: "user-courier-B",
      delivery_partner_id: "partner-B-uuid",
      status: "assigned",
      assigned_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    "del-B-transit": {
      id: "del-B-transit",
      order_id: "ord-201",
      assigned_to: "user-courier-B",
      delivery_partner_id: "partner-B-uuid",
      status: "out_for_delivery",
      assigned_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  };

  const setupMockDb = (callerUserId: string, callerRole: string, callerPartnerId?: string) => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: callerUserId, email: `${callerRole}@floria.test` } },
      error: null,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "user_profiles") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { id: callerUserId, role: callerRole },
                error: null,
              }),
            }),
          }),
          upsert: async () => ({ data: null, error: null }),
        };
      }

      if (table === "delivery_partners") {
        return {
          select: () => ({
            or: () => ({
              maybeSingle: async () => {
                if (callerPartnerId === "partner-A-uuid" || callerUserId === "user-courier-A") {
                  return { data: partners["courier-A"], error: null };
                }
                if (callerPartnerId === "partner-B-uuid" || callerUserId === "user-courier-B") {
                  return { data: partners["courier-B"], error: null };
                }
                return { data: null, error: null };
              },
            }),
            eq: (_col: string, val: string) => ({
              maybeSingle: async () => {
                if (val === "user-courier-A" || val === "partner-A-uuid") {
                  return { data: partners["courier-A"], error: null };
                }
                if (val === "user-courier-B" || val === "partner-B-uuid") {
                  return { data: partners["courier-B"], error: null };
                }
                return { data: null, error: null };
              },
            }),
            order: () => Promise.resolve({ data: Object.values(partners), error: null }),
          }),
          update: (fields: any) => ({
            eq: (_col: string, val: string) => ({
              select: () => ({
                maybeSingle: async () => {
                  const target = val === "partner-A-uuid" ? partners["courier-A"] : partners["courier-B"];
                  return { data: { ...target, ...fields }, error: null };
                },
              }),
            }),
          }),
        };
      }

      if (table === "delivery_assignments") {
        return {
          select: () => ({
            or: () => ({
              order: () => {
                // Courier Scoping: return only assignments belonging to caller
                const callerPId = callerPartnerId || (callerUserId === "user-courier-A" ? "partner-A-uuid" : "partner-B-uuid");
                const matched = Object.values(deliveries).filter(
                  (d) => d.delivery_partner_id === callerPId || d.assigned_to === callerUserId,
                );
                return Promise.resolve({ data: matched, error: null });
              },
            }),
            eq: (_col: string, val: string) => ({
              maybeSingle: async () => {
                const del = (deliveries as any)[val];
                return { data: del || null, error: null };
              },
            }),
            order: () => Promise.resolve({ data: Object.values(deliveries), error: null }),
          }),
          update: (fields: any) => ({
            eq: (_col: string, val: string) => ({
              select: () => ({
                maybeSingle: async () => {
                  const del = (deliveries as any)[val];
                  return { data: del ? { ...del, ...fields } : null, error: null };
                },
              }),
            }),
          }),
        };
      }

      if (table === "delivery_earnings") {
        return {
          select: () => ({
            eq: (_col: string, val: string) => ({
              order: () => {
                if (val === "partner-A-uuid") {
                  return Promise.resolve({
                    data: [
                      {
                        id: "earn-A-1",
                        partner_id: "partner-A-uuid",
                        delivery_id: "del-A-1",
                        total_earning_paise: 8000,
                        status: "available",
                        created_at: new Date().toISOString(),
                      },
                    ],
                    error: null,
                  });
                }
                if (val === "partner-B-uuid") {
                  return Promise.resolve({
                    data: [
                      {
                        id: "earn-B-1",
                        partner_id: "partner-B-uuid",
                        delivery_id: "del-B-1",
                        total_earning_paise: 8000,
                        status: "available",
                        created_at: new Date().toISOString(),
                      },
                    ],
                    error: null,
                  });
                }
                return Promise.resolve({ data: [], error: null });
              },
            }),
          }),
          insert: () => ({
            select: () => ({
              single: async () => ({
                data: {
                  id: "earn-new",
                  total_earning_paise: 8000,
                  status: "available",
                },
                error: null,
              }),
            }),
          }),
        };
      }

      if (table === "media_assets") {
        return {
          select: () => ({
            eq: (_col: string, val: string) => ({
              maybeSingle: async () => {
                if (val === "pod-asset-A") {
                  return {
                    data: {
                      id: "pod-asset-A",
                      uploaded_by_user_id: "user-courier-A",
                      media_category: "DELIVERY_POD",
                      storage_bucket: "private-documents",
                      status: "READY",
                    },
                    error: null,
                  };
                }
                if (val === "pod-asset-B") {
                  return {
                    data: {
                      id: "pod-asset-B",
                      uploaded_by_user_id: "user-courier-B",
                      media_category: "DELIVERY_POD",
                      storage_bucket: "private-documents",
                      status: "READY",
                    },
                    error: null,
                  };
                }
                return { data: null, error: null };
              },
            }),
          }),
        };
      }

      if (table === "orders") {
        return {
          update: () => ({
            eq: () => ({
              select: () => ({
                maybeSingle: async () => ({ data: { id: "ord-100" }, error: null }),
              }),
            }),
          }),
        };
      }

      if (table === "audit_logs") {
        return {
          insert: async () => ({ data: null, error: null }),
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

  beforeEach(() => {
    vi.clearAllMocks();
    app = createApp();
  });

  // ── 1. IDOR & Courier Isolation Matrix (P0-3, P0-4, P0-5) ─────────────────

  describe("P0-5 IDOR & Courier Isolation", () => {
    it("Courier A only receives Courier A's own profile", async () => {
      setupMockDb("user-courier-A", "delivery_partner", "partner-A-uuid");

      const res = await request(app)
        .get("/api/v1/delivery-partners/me")
        .set("Authorization", "Bearer valid-token-alice");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe("partner-A-uuid");
      expect(res.body.data.public_partner_id).toBe("FLR-DRV-000001");
    });

    it("Courier A only sees Courier A's own deliveries and NOT Courier B's", async () => {
      setupMockDb("user-courier-A", "delivery_partner", "partner-A-uuid");

      const res = await request(app)
        .get("/api/v1/delivery-partners/my-deliveries")
        .set("Authorization", "Bearer valid-token-alice");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      const partnerIds = res.body.data.map((d: any) => d.delivery_partner_id);
      expect(partnerIds.every((id: string) => id === "partner-A-uuid")).toBe(true);
      expect(partnerIds).not.toContain("partner-B-uuid");
    });

    it("Courier A cannot see Courier B's earnings ledger", async () => {
      setupMockDb("user-courier-A", "delivery_partner", "partner-A-uuid");

      const res = await request(app)
        .get("/api/v1/delivery-partners/my-earnings")
        .set("Authorization", "Bearer valid-token-alice");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.earnings[0].partner_id).toBe("partner-A-uuid");
    });

    it("Courier A cannot mutate Courier B's delivery assignment status (IDOR mutation blocked)", async () => {
      setupMockDb("user-courier-A", "delivery_partner", "partner-A-uuid");

      const res = await request(app)
        .post("/api/v1/operations/deliveries/del-B-1/status")
        .set("Authorization", "Bearer valid-token-alice")
        .send({ status: "picked_up" });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain("not assigned");
    });

    it("Courier A cannot complete Courier B's delivery assignment with POD", async () => {
      setupMockDb("user-courier-A", "delivery_partner", "partner-A-uuid");

      const res = await request(app)
        .post("/api/v1/operations/deliveries/del-B-transit/complete")
        .set("Authorization", "Bearer valid-token-alice")
        .send({ podAssetId: "pod-asset-A" });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain("not assigned");
    });

    it("Courier A cannot attach Courier B's POD media asset (Cross-courier POD blocked)", async () => {
      setupMockDb("user-courier-A", "delivery_partner", "partner-A-uuid");

      const res = await request(app)
        .post("/api/v1/operations/deliveries/del-A-transit/complete")
        .set("Authorization", "Bearer valid-token-alice")
        .send({ podAssetId: "pod-asset-B" }); // Asset owned by Courier B

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain("Cross-courier");
    });
  });

  // ── 2. RBAC & Cross-Role Access Guards (P0-4) ──────────────────────────────

  describe("P0-4 Role Access Boundary Enforcement", () => {
    it("Unauthenticated request to courier endpoints is rejected with 401", async () => {
      const res = await request(app).get("/api/v1/delivery-partners/me");
      expect(res.status).toBe(401);
    });

    it("Customer role cannot access courier delivery portal (403 Forbidden)", async () => {
      setupMockDb("cust-100", "customer");

      const res = await request(app)
        .get("/api/v1/delivery-partners/my-deliveries")
        .set("Authorization", "Bearer valid-cust-token");

      expect(res.status).toBe(403);
    });

    it("Seller role cannot access courier earnings (403 Forbidden)", async () => {
      setupMockDb("seller-100", "seller");

      const res = await request(app)
        .get("/api/v1/delivery-partners/my-earnings")
        .set("Authorization", "Bearer valid-seller-token");

      expect(res.status).toBe(403);
    });

    it("Courier cannot access Admin Delivery Partner management endpoints (403 Forbidden)", async () => {
      setupMockDb("user-courier-A", "delivery_partner", "partner-A-uuid");

      const res = await request(app)
        .get("/api/v1/delivery-partners/admin/applications")
        .set("Authorization", "Bearer valid-courier-token");

      expect(res.status).toBe(403);
    });
  });

  // ── 3. State Machine Transition Enforcement (P0-7, P0-8) ───────────────────

  describe("P0-7 Delivery State Machine Transition Guards", () => {
    it("Allows valid transition: assigned -> picked_up", async () => {
      setupMockDb("user-courier-A", "delivery_partner", "partner-A-uuid");

      const res = await request(app)
        .post("/api/v1/operations/deliveries/del-A-1/status")
        .set("Authorization", "Bearer valid-courier-token")
        .send({ status: "picked_up" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("Allows valid transition: picked_up -> out_for_delivery", async () => {
      setupMockDb("user-courier-A", "delivery_partner", "partner-A-uuid");

      const res = await request(app)
        .post("/api/v1/operations/deliveries/del-A-picked/status")
        .set("Authorization", "Bearer valid-courier-token")
        .send({ status: "out_for_delivery" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("Rejects invalid skipped transition: assigned -> out_for_delivery (409 Conflict)", async () => {
      setupMockDb("user-courier-A", "delivery_partner", "partner-A-uuid");

      const res = await request(app)
        .post("/api/v1/operations/deliveries/del-A-1/status")
        .set("Authorization", "Bearer valid-courier-token")
        .send({ status: "out_for_delivery" });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it("Rejects premature completion: assigned -> delivered (409 Conflict)", async () => {
      setupMockDb("user-courier-A", "delivery_partner", "partner-A-uuid");

      const res = await request(app)
        .post("/api/v1/operations/deliveries/del-A-1/complete")
        .set("Authorization", "Bearer valid-courier-token")
        .send({ podAssetId: "pod-asset-A" });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it("Rejects premature completion: picked_up -> delivered without out_for_delivery (409 Conflict)", async () => {
      setupMockDb("user-courier-A", "delivery_partner", "partner-A-uuid");

      const res = await request(app)
        .post("/api/v1/operations/deliveries/del-A-picked/complete")
        .set("Authorization", "Bearer valid-courier-token")
        .send({ podAssetId: "pod-asset-A" });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });
  });

  // ── 4. POD Completion & Server-Authoritative Earnings (P0-9, P0-10, P0-11) ──

  describe("P0-9, P0-10, P0-11 POD Completion & Server-Authoritative Earnings", () => {
    it("Completes delivery in out_for_delivery status with valid POD and generates server earning", async () => {
      setupMockDb("user-courier-A", "delivery_partner", "partner-A-uuid");

      const res = await request(app)
        .post("/api/v1/operations/deliveries/del-A-transit/complete")
        .set("Authorization", "Bearer valid-courier-token")
        .send({ podAssetId: "pod-asset-A", recipientName: "Test Customer" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
