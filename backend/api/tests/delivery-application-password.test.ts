// Floria API — Delivery Partner Application Password & Status Integration Tests
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

const mockGetUser = vi.fn();
const mockAdminCreateUser = vi.fn();
const mockFrom = vi.fn();

vi.mock("../src/config/database.js", () => {
  return {
    getAdminDb: () => ({
      from: mockFrom,
      auth: {
        admin: {
          createUser: mockAdminCreateUser,
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

describe("Delivery Partner Application Password & Status Flow", () => {
  let app: ReturnType<typeof createApp>;

  const mockApplications: any[] = [];
  const mockPartners: any[] = [];
  const mockCredentials: any[] = [];

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
          upsert: async () => ({ data: null, error: null }),
        };
      }

      if (table === "delivery_partner_applications") {
        return {
          select: () => ({
            ilike: (_field: string, val: string) => ({
              order: () => ({
                limit: () => ({
                  maybeSingle: async () => ({
                    data: mockApplications.find((a) => a.email.toLowerCase() === val.toLowerCase()) || null,
                    error: null,
                  }),
                }),
              }),
            }),
            eq: (_field: string, val: string) => ({
              maybeSingle: async () => ({
                data: mockApplications.find((a) => a.id === val || a.email.toLowerCase() === val.toLowerCase()) || null,
                error: null,
              }),
            }),
          }),
          insert: (data: any) => {
            const record = { id: `app-${Date.now()}`, ...data };
            mockApplications.push(record);
            return {
              select: () => ({
                single: async () => ({ data: record, error: null }),
              }),
            };
          },
          update: (data: any) => ({
            eq: (_field: string, val: string) => {
              const record = mockApplications.find((a) => a.id === val);
              if (record) Object.assign(record, data);
              return {
                select: () => ({
                  maybeSingle: async () => ({ data: record, error: null }),
                }),
              };
            },
          }),
        };
      }

      if (table === "delivery_partners") {
        return {
          insert: (data: any) => {
            const record = { id: `partner-${Date.now()}`, ...data };
            mockPartners.push(record);
            return {
              select: () => ({
                single: async () => ({ data: record, error: null }),
              }),
            };
          },
        };
      }

      if (table === "delivery_partner_credentials") {
        return {
          insert: (data: any) => {
            const record = { id: `cred-${Date.now()}`, ...data };
            mockCredentials.push(record);
            return {
              select: () => ({
                single: async () => ({ data: record, error: null }),
              }),
            };
          },
        };
      }

      return {
        select: () => ({
          eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }),
        }),
      };
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockApplications.length = 0;
    mockPartners.length = 0;
    mockCredentials.length = 0;
    setupAuth("anon-user", "customer");
    app = createApp();
  });

  it("submits application with password and hashes credentials securely", async () => {
    mockAdminCreateUser.mockResolvedValue({
      data: { user: { id: "auth-user-driver-1" } },
      error: null,
    });

    const res = await request(app)
      .post("/api/v1/delivery-partners/applications")
      .send({
        full_name: "Ramesh Courier",
        email: "ramesh@driver.floria.in",
        phone: "9876543210",
        city: "Bangalore",
        vehicle_type: "two_wheeler",
        vehicle_number: "KA01AB1234",
        driving_license: "DL-1420110012345",
        password: "SecretPassword123!",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.full_name).toBe("Ramesh Courier");
    expect(mockApplications.length).toBe(1);
    expect(mockApplications[0].password_hash).toBeDefined();
    expect(mockApplications[0].password_salt).toBeDefined();
  });

  it("rejects application when password is less than 8 characters", async () => {
    const res = await request(app)
      .post("/api/v1/delivery-partners/applications")
      .send({
        full_name: "Short Pass Driver",
        email: "short@driver.floria.in",
        phone: "9876543210",
        city: "Bangalore",
        vehicle_type: "two_wheeler",
        vehicle_number: "KA01AB1234",
        driving_license: "DL-1420110012345",
        password: "short",
      });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it("allows checking application status by email query", async () => {
    mockApplications.push({
      id: "app-ramesh-123",
      full_name: "Ramesh Courier",
      email: "ramesh@driver.floria.in",
      status: "pending",
      city: "Bangalore",
      vehicle_number: "KA01AB1234",
    });

    const res = await request(app)
      .get("/api/v1/delivery-partners/applications/status?email=ramesh@driver.floria.in");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("pending");
    expect(res.body.data.full_name).toBe("Ramesh Courier");
  });

  it("admin approval of application with pre-set password creates active courier credentials", async () => {
    setupAuth("admin-user-1", "admin");

    const existingApp = {
      id: "app-ramesh-123",
      full_name: "Ramesh Courier",
      email: "ramesh@driver.floria.in",
      phone: "9876543210",
      city: "Bangalore",
      vehicle_type: "two_wheeler",
      vehicle_number: "KA01AB1234",
      driving_license: "DL-1420110012345",
      password_hash: "mockhash123",
      password_salt: "mocksalt123",
      user_id: "auth-user-driver-1",
      status: "pending",
    };
    mockApplications.push(existingApp);

    const res = await request(app)
      .post("/api/v1/delivery-partners/admin/applications/app-ramesh-123/approve")
      .set("Authorization", "Bearer valid-admin-jwt");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockPartners.length).toBe(1);
    expect(mockCredentials.length).toBe(1);
    expect(mockCredentials[0].is_activated).toBe(true);
    expect(mockCredentials[0].password_hash).toBe("mockhash123");
  });
});
