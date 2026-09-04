// Floria API — Delivery Partner Ecosystem Integration Test Suite
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

describe("Delivery Partner Ecosystem Integration Tests", () => {
  let app: ReturnType<typeof createApp>;

  const defaultMockFrom = (userId = "user-1", role = "customer", partnerId = "partner-uuid-1") => {
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
          upsert: async () => ({ data: null, error: null }),
        };
      }
      if (table === "delivery_partners") {
        return {
          select: () => ({
            or: () => ({
              maybeSingle: async () => {
                if (partnerId) {
                  return {
                    data: {
                      id: partnerId,
                      user_id: userId,
                      public_partner_id: "FLR-DRV-TEST01",
                      full_name: "Test Driver",
                      email: `${role}@floria.test`,
                      status: "active",
                      on_duty: true,
                    },
                    error: null,
                  };
                }
                return { data: null, error: null };
              },
            }),
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  id: partnerId,
                  user_id: userId,
                  public_partner_id: "FLR-DRV-TEST01",
                  full_name: "Test Driver",
                  email: `${role}@floria.test`,
                  status: "active",
                  on_duty: true,
                },
                error: null,
              }),
            }),
            order: () => Promise.resolve({ data: [], error: null }),
          }),
          update: () => ({
            eq: () => ({
              select: () => ({
                maybeSingle: async () => ({
                  data: {
                    id: partnerId,
                    on_duty: true,
                    status: "active",
                  },
                  error: null,
                }),
              }),
            }),
          }),
          insert: () => ({
            select: () => ({
              single: async () => ({
                data: {
                  id: "partner-uuid-new",
                  public_partner_id: "FLR-DRV-NEW01",
                  full_name: "New Applicant",
                  status: "active",
                },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "delivery_partner_applications") {
        return {
          select: () => ({
            ilike: () => ({
              order: () => ({
                limit: () => ({
                  maybeSingle: async () => ({ data: null, error: null }),
                }),
              }),
            }),
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  id: "app-100",
                  full_name: "New Applicant",
                  email: "applicant@test.com",
                  phone: "9876543210",
                  city: "Bangalore",
                  vehicle_type: "two_wheeler",
                  vehicle_number: "KA01AB1234",
                  driving_license: "DL-KA01-20220001",
                  status: "pending",
                },
                error: null,
              }),
            }),
            order: () => Promise.resolve({ data: [], error: null }),
          }),
          insert: () => ({
            select: () => ({
              single: async () => ({
                data: {
                  id: "app-100",
                  full_name: "New Applicant",
                  email: "applicant@test.com",
                  status: "pending",
                },
                error: null,
              }),
            }),
          }),
          update: () => ({
            eq: () => ({
              select: () => ({
                maybeSingle: async () => ({
                  data: { id: "app-100", status: "approved" },
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      if (table === "delivery_partner_credentials") {
        return {
          insert: () => ({
            select: () => ({
              single: async () => ({
                data: { id: "cred-1", partner_id: "partner-uuid-new" },
                error: null,
              }),
            }),
          }),
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  id: "cred-1",
                  partner_id: "partner-uuid-1",
                  email: "applicant@test.com",
                  is_activated: false,
                  public_partner_id: "FLR-DRV-TEST01",
                },
                error: null,
              }),
            }),
          }),
          update: () => ({
            eq: () => ({
              select: () => ({
                maybeSingle: async () => ({
                  data: { id: "cred-1", is_activated: true },
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      if (table === "delivery_assignments") {
        return {
          select: () => ({
            or: () => ({
              order: () =>
                Promise.resolve({
                  data: [
                    {
                      id: "del-assigned-1",
                      order_id: "ord-1",
                      assigned_to: userId,
                      delivery_partner_id: partnerId,
                      status: "assigned",
                    },
                  ],
                  error: null,
                }),
            }),
            order: () => Promise.resolve({ data: [], error: null }),
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  id: "del-assigned-1",
                  order_id: "ord-1",
                  assigned_to: userId,
                  delivery_partner_id: partnerId,
                  status: "assigned",
                },
                error: null,
              }),
            }),
          }),
          update: () => ({
            eq: () => ({
              select: () => ({
                maybeSingle: async () => ({
                  data: {
                    id: "del-assigned-1",
                    status: "out_for_delivery",
                  },
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      if (table === "delivery_earnings") {
        return {
          select: () => ({
            eq: () => ({
              order: () =>
                Promise.resolve({
                  data: [
                    {
                      id: "earn-1",
                      partner_id: partnerId,
                      delivery_id: "del-assigned-1",
                      total_earning_paise: 8000,
                      status: "available",
                      created_at: new Date().toISOString(),
                    },
                  ],
                  error: null,
                }),
            }),
          }),
          insert: () => ({
            select: () => ({
              single: async () => ({
                data: {
                  id: "earn-1",
                  total_earning_paise: 8000,
                  status: "available",
                },
                error: null,
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
    defaultMockFrom();
    app = createApp();
  });

  const setupAuth = (userId: string, role: string, partnerId?: string) => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: userId, email: `${role}@floria.test` } },
      error: null,
    });
    defaultMockFrom(userId, role, partnerId);
  };

  it("POST /api/v1/delivery-partners/applications allows prospective couriers to apply", async () => {
    const payload = {
      full_name: "Rahul Sharma",
      email: "rahul.driver@floria.test",
      phone: "9876543210",
      city: "Bangalore",
      vehicle_type: "two_wheeler",
      vehicle_number: "KA01AB9999",
      driving_license: "DL-KA01-20229999",
    };

    const res = await request(app)
      .post("/api/v1/delivery-partners/applications")
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.full_name).toBe("New Applicant");
  });

  it("POST /api/v1/delivery-partners/admin/applications/:id/approve allows Admin to provision courier profile and token", async () => {
    setupAuth("admin-user-1", "admin");

    const res = await request(app)
      .post("/api/v1/delivery-partners/admin/applications/app-100/approve")
      .set("Authorization", "Bearer valid-admin-token")
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.activationToken).toBeDefined();
    expect(res.body.data.partner.public_partner_id).toBeDefined();
  });

  it("POST /api/v1/delivery-partners/auth/activate securely provisions password", async () => {
    const res = await request(app)
      .post("/api/v1/delivery-partners/auth/activate")
      .send({
        token: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
        password: "FloriaSecurePassword123!",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("GET /api/v1/delivery-partners/my-deliveries isolates assignments to authenticated courier", async () => {
    setupAuth("driver-user-1", "delivery_partner", "partner-uuid-1");

    const res = await request(app)
      .get("/api/v1/delivery-partners/my-deliveries")
      .set("Authorization", "Bearer valid-driver-token");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].id).toBe("del-assigned-1");
  });

  it("GET /api/v1/delivery-partners/my-earnings returns server-authoritative earnings", async () => {
    setupAuth("driver-user-1", "delivery_partner", "partner-uuid-1");

    const res = await request(app)
      .get("/api/v1/delivery-partners/my-earnings")
      .set("Authorization", "Bearer valid-driver-token");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.today).toBe(80);
    expect(res.body.data.completedCount).toBe(1);
  });
});
