// Floria API — Operations & Delivery Logistics Test Suite (Step 5B.1)
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

describe("Operations & Delivery Logistics API (Step 5B.1)", () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createApp();
  });

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
              eq: () =>
                Promise.resolve({
                  data: [
                    {
                      id: "del-101",
                      order_id: "ord-701",
                      assigned_to: userId,
                      status: "assigned",
                      assigned_at: new Date().toISOString(),
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                    },
                  ],
                  error: null,
                }),
            }),
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  id: "del-101",
                  order_id: "ord-701",
                  assigned_to: userId,
                  status: "assigned",
                  assigned_at: new Date().toISOString(),
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
                error: null,
              }),
            }),
          }),
          update: (payload: any) => ({
            eq: () => ({
              select: () => ({
                maybeSingle: async () => ({
                  data: {
                    id: "del-101",
                    order_id: "ord-701",
                    assigned_to: userId,
                    ...payload,
                  },
                  error: null,
                }),
              }),
            }),
          }),
          insert: (payload: any) => ({
            select: () => ({
              single: async () => ({
                data: {
                  id: "del-102",
                  ...payload,
                },
                error: null,
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

  it("rejects unauthenticated requests to delivery endpoints", async () => {
    const res = await request(app).get("/api/v1/operations/deliveries");
    expect(res.status).toBe(401);
  });

  it("rejects unauthorized customers from accessing operations delivery endpoints", async () => {
    setupAuth("cust-123", "customer");
    const res = await request(app)
      .get("/api/v1/operations/deliveries")
      .set("Authorization", "Bearer valid-jwt");
    expect(res.status).toBe(403);
  });

  it("allows operations personnel to list assigned deliveries", async () => {
    setupAuth("ops-456", "operations");
    const res = await request(app)
      .get("/api/v1/operations/deliveries?status=assigned")
      .set("Authorization", "Bearer valid-jwt");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("allows operations personnel to retrieve a specific delivery by ID", async () => {
    setupAuth("ops-456", "operations");
    const res = await request(app)
      .get("/api/v1/operations/deliveries/del-101")
      .set("Authorization", "Bearer valid-jwt");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe("del-101");
  });

  it("allows operations personnel to update delivery status", async () => {
    setupAuth("ops-456", "operations");
    const res = await request(app)
      .post("/api/v1/operations/deliveries/del-101/status")
      .set("Authorization", "Bearer valid-jwt")
      .send({ status: "picked_up" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("picked_up");
  });
});
