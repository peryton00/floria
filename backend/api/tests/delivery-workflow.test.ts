// Floria Delivery Mobile — Operational Workflow & State Machine Test Suite (Step 5B.2.1)
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

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
    getDbForUser: () => ({
      from: mockFrom,
    }),
  };
});

describe("Delivery Mobile Operational Workflow & State Machine (Step 5B.2.1)", () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createApp();
  });

  const mockDeliveriesData = [
    {
      id: "del-001",
      order_id: "ord-101",
      assigned_to: "usr-courier-1",
      status: "assigned",
      assigned_at: "2026-08-28T01:00:00Z",
      picked_up_at: null,
      out_for_delivery_at: null,
      delivered_at: null,
      created_at: "2026-08-28T01:00:00Z",
      updated_at: "2026-08-28T01:00:00Z",
    },
    {
      id: "del-002",
      order_id: "ord-102",
      assigned_to: "usr-courier-1",
      status: "out_for_delivery",
      assigned_at: "2026-08-28T00:30:00Z",
      picked_up_at: "2026-08-28T00:45:00Z",
      out_for_delivery_at: "2026-08-28T00:50:00Z",
      delivered_at: null,
      created_at: "2026-08-28T00:30:00Z",
      updated_at: "2026-08-28T00:50:00Z",
    },
    {
      id: "del-003",
      order_id: "ord-103",
      assigned_to: "usr-courier-1",
      status: "delivered",
      assigned_at: "2026-08-27T23:00:00Z",
      picked_up_at: "2026-08-27T23:15:00Z",
      out_for_delivery_at: "2026-08-27T23:20:00Z",
      delivered_at: "2026-08-27T23:45:00Z",
      created_at: "2026-08-27T23:00:00Z",
      updated_at: "2026-08-27T23:45:00Z",
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
                return { data: found || null, error: null };
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

  describe("Today & Queue Manifest Flow", () => {
    it("returns operational manifest for authenticated courier", async () => {
      setupAuth("usr-courier-1", "operations");

      const res = await request(app)
        .get("/api/v1/operations/deliveries")
        .set("Authorization", "Bearer valid-jwt");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(3);

      // Verify KPI metrics calculation from payload
      const assigned = res.body.data.filter(
        (d: any) => d.status === "assigned",
      ).length;
      const inTransit = res.body.data.filter(
        (d: any) => d.status === "picked_up" || d.status === "out_for_delivery",
      ).length;
      const delivered = res.body.data.filter(
        (d: any) => d.status === "delivered",
      ).length;

      expect(assigned).toBe(1);
      expect(inTransit).toBe(1);
      expect(delivered).toBe(1);
    });

    it("filters deliveries by status accurately", async () => {
      setupAuth("usr-courier-1", "operations");

      const res = await request(app)
        .get("/api/v1/operations/deliveries?status=assigned")
        .set("Authorization", "Bearer valid-jwt");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].status).toBe("assigned");
    });
  });

  describe("Delivery Detail & State Machine Transition Progression", () => {
    it("fetches single delivery detail with valid status timestamps", async () => {
      setupAuth("usr-courier-1", "operations");

      const res = await request(app)
        .get("/api/v1/operations/deliveries/del-002")
        .set("Authorization", "Bearer valid-jwt");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe("del-002");
      expect(res.body.data.status).toBe("out_for_delivery");
      expect(res.body.data.picked_up_at).toBeDefined();
    });

    it("returns 404 for unknown delivery ID", async () => {
      setupAuth("usr-courier-1", "operations");

      const res = await request(app)
        .get("/api/v1/operations/deliveries/del-nonexistent")
        .set("Authorization", "Bearer valid-jwt");

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it("advances status from assigned -> picked_up and records timestamp", async () => {
      setupAuth("usr-courier-1", "operations");

      const res = await request(app)
        .post("/api/v1/operations/deliveries/del-001/status")
        .set("Authorization", "Bearer valid-jwt")
        .send({ status: "picked_up" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("picked_up");
      expect(res.body.data.picked_up_at).toBeDefined();
    });

    it("advances status from picked_up -> out_for_delivery", async () => {
      setupAuth("usr-courier-1", "operations");

      const res = await request(app)
        .post("/api/v1/operations/deliveries/del-001/status")
        .set("Authorization", "Bearer valid-jwt")
        .send({ status: "out_for_delivery" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("out_for_delivery");
    });

    it("advances status from out_for_delivery -> delivered", async () => {
      setupAuth("usr-courier-1", "operations");

      const res = await request(app)
        .post("/api/v1/operations/deliveries/del-002/status")
        .set("Authorization", "Bearer valid-jwt")
        .send({ status: "delivered" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("delivered");
      expect(res.body.data.delivered_at).toBeDefined();
    });
  });

  describe("Security & Authorization Boundary", () => {
    it("rejects customers from performing delivery status mutations", async () => {
      setupAuth("usr-customer-9", "customer");

      const res = await request(app)
        .post("/api/v1/operations/deliveries/del-001/status")
        .set("Authorization", "Bearer valid-jwt")
        .send({ status: "delivered" });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it("rejects unauthenticated status mutations", async () => {
      const res = await request(app)
        .post("/api/v1/operations/deliveries/del-001/status")
        .send({ status: "delivered" });

      expect(res.status).toBe(401);
    });
  });
});
