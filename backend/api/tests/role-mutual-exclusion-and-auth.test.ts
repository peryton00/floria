// Floria API — Role Mutual Exclusion & Courier Login Test Suite
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

const mockGetUser = vi.fn();
const mockAdminCreateUser = vi.fn();
const mockAdminUpdateUser = vi.fn();
const mockFrom = vi.fn();
const mockSignInWithPassword = vi.fn();

vi.mock("../src/config/database.js", () => {
  return {
    getAdminDb: () => ({
      from: mockFrom,
      auth: {
        admin: {
          createUser: mockAdminCreateUser,
          updateUserById: mockAdminUpdateUser,
        },
        signInWithPassword: mockSignInWithPassword,
      },
    }),
    getAnonDb: () => ({
      auth: {
        getUser: mockGetUser,
        signInWithPassword: mockSignInWithPassword,
      },
    }),
    getUserDb: () => ({}),
    getDbForUser: () => ({
      from: mockFrom,
    }),
  };
});

describe("Role Mutual Exclusion & Courier Login", () => {
  let app: ReturnType<typeof createApp>;

  const store = {
    seller_profiles: [
      { id: "slr-existing-1", contact_email: "active.seller@floria.in", status: "active" },
    ],
    seller_applications: [
      { id: "app-slr-2", email: "pending.seller@floria.in", status: "under_review" },
    ],
    delivery_partners: [
      {
        id: "drv-existing-1",
        user_id: "usr-drv-1",
        public_partner_id: "FLR-DRV-ABC12345",
        email: "active.courier@floria.in",
        status: "active",
        full_name: "Active Courier Driver",
      },
    ],
    delivery_partner_applications: [
      {
        id: "app-drv-2",
        email: "pending.courier@floria.in",
        status: "pending",
        full_name: "Pending Driver",
        submitted_at: new Date().toISOString(),
      },
    ],
    delivery_partner_credentials: [
      {
        id: "cred-1",
        partner_id: "drv-existing-1",
        user_id: "usr-drv-1",
        email: "active.courier@floria.in",
        password_hash: "mocked_hash",
        password_salt: "mocked_salt",
      },
    ],
    user_profiles: [
      { id: "usr-customer-1", email: "google.customer@gmail.com", role: "customer" },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    app = createApp();

    mockAdminCreateUser.mockResolvedValue({
      data: { user: { id: "usr-new-created", email: "new@user.com" } },
      error: null,
    });
    mockAdminUpdateUser.mockResolvedValue({
      data: { user: { id: "usr-updated" } },
      error: null,
    });
    mockSignInWithPassword.mockImplementation(({ email, password }: any) => {
      if (password === "Password123!") {
        return Promise.resolve({
          data: { session: { access_token: "mock-supabase-jwt" }, user: { id: "usr-drv-1", email } },
          error: null,
        });
      }
      return Promise.resolve({ data: null, error: new Error("Invalid login credentials") });
    });

    mockFrom.mockImplementation((tableName: string) => {
      let filterField: string | null = null;
      let filterValue: any = null;

      const builder: any = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockImplementation((records: any) => {
          const arr = Array.isArray(records) ? records : [records];
          const withIds = arr.map((r: any) => ({ id: `rec-${Date.now()}-${Math.random()}`, ...r }));
          (store as any)[tableName] = [...((store as any)[tableName] || []), ...withIds];
          return {
            select: () => ({
              single: async () => ({ data: withIds[0], error: null }),
              maybeSingle: async () => ({ data: withIds[0], error: null }),
            }),
            single: async () => ({ data: withIds[0], error: null }),
          };
        }),
        update: vi.fn().mockImplementation((updates: any) => {
          return {
            eq: vi.fn().mockImplementation((field: string, val: any) => {
              const items = (store as any)[tableName] || [];
              const idx = items.findIndex((item: any) => item[field] === val);
              if (idx >= 0) {
                items[idx] = { ...items[idx], ...updates };
              }
              return {
                select: () => ({
                  maybeSingle: async () => ({ data: items[idx] || updates, error: null }),
                }),
              };
            }),
          };
        }),
        eq: vi.fn().mockImplementation((field: string, val: any) => {
          filterField = field;
          filterValue = val;
          return builder;
        }),
        ilike: vi.fn().mockImplementation((field: string, val: any) => {
          filterField = field;
          filterValue = String(val).toLowerCase();
          return builder;
        }),
        or: vi.fn().mockImplementation(() => {
          return builder;
        }),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockImplementation(() => {
          const items = (store as any)[tableName] || [];
          if (!filterField) return Promise.resolve({ data: items[0] || null, error: null });
          const match = items.find((item: any) => {
            const itemVal = item[filterField!];
            if (typeof itemVal === "string" && typeof filterValue === "string") {
              return itemVal.toLowerCase() === filterValue.toLowerCase();
            }
            return itemVal === filterValue;
          });
          return Promise.resolve({ data: match || null, error: null });
        }),
      };
      return builder;
    });
  });

  it("rejects an existing Seller from registering as a Delivery Partner", async () => {
    const res = await request(app)
      .post("/api/v1/delivery-partners/applications")
      .send({
        full_name: "Active Seller Person",
        email: "active.seller@floria.in",
        phone: "9876543210",
        city: "Bangalore",
        vehicle_type: "two_wheeler",
        vehicle_number: "KA01AB1234",
        driving_license: "DL1234567890123",
        password: "Password123!",
      });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain("already registered as a Nursery Seller");
  });

  it("rejects an existing Delivery Partner from registering as a Seller", async () => {
    const res = await request(app)
      .post("/api/v1/seller/auth/register")
      .send({
        username: "activecourier",
        email: "active.courier@floria.in",
        password: "Password123!",
        business_name: "Illegal Nursery By Driver",
        contact_phone: "9876543210",
        address: "123 Green St",
        city: "Bangalore",
        state: "Karnataka",
        postal_code: "560001",
      });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain("already registered as a Delivery Partner");
  });

  it("allows a customer to register as a Delivery Partner and syncs password", async () => {
    const res = await request(app)
      .post("/api/v1/delivery-partners/applications")
      .send({
        full_name: "Google Customer",
        email: "google.customer@gmail.com",
        phone: "9876543210",
        city: "Bangalore",
        vehicle_type: "two_wheeler",
        vehicle_number: "KA01XY9999",
        driving_license: "DL9876543210987",
        password: "SecurePassword123!",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe("google.customer@gmail.com");
  });

  it("authenticates an active courier via POST /api/v1/delivery-partners/auth/login with email", async () => {
    const res = await request(app)
      .post("/api/v1/delivery-partners/auth/login")
      .send({
        identifier: "active.courier@floria.in",
        password: "Password123!",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe("delivery_partner");
    expect(res.body.data.user.email).toBe("active.courier@floria.in");
    expect(res.body.data.token).toBeDefined();
  });

  it("authenticates an active courier via POST /api/v1/delivery-partners/auth/login with Public Partner ID", async () => {
    const res = await request(app)
      .post("/api/v1/delivery-partners/auth/login")
      .send({
        identifier: "FLR-DRV-ABC12345",
        password: "Password123!",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.publicPartnerId).toBe("FLR-DRV-ABC12345");
  });

  it("rejects login when courier application is pending review", async () => {
    const res = await request(app)
      .post("/api/v1/delivery-partners/auth/login")
      .send({
        identifier: "pending.courier@floria.in",
        password: "Password123!",
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain("under review");
  });

  it("rejects login when incorrect password is provided", async () => {
    const res = await request(app)
      .post("/api/v1/delivery-partners/auth/login")
      .send({
        identifier: "active.courier@floria.in",
        password: "WrongPassword!",
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
