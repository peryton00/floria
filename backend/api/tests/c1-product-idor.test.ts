// Floria API — C1 Product IDOR Protection Test Suite
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock("../src/config/database.js", () => {
  return {
    getAdminDb: () => ({
      from: mockFrom,
      auth: {
        getUser: mockGetUser,
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

describe("C1: Product IDOR Protection", () => {
  let app: ReturnType<typeof createApp>;

  const store = {
    products: [
      {
        id: "prod-a",
        seller_id: "slr-seller-a",
        name: "Seller A Monstera",
        status: "active",
        category_id: "cat-1",
      },
      {
        id: "prod-b",
        seller_id: "slr-seller-b",
        name: "Seller B Ficus",
        status: "active",
        category_id: "cat-1",
      },
    ],
    inventory: [
      { id: "inv-a", product_id: "prod-a", seller_id: "slr-seller-a", stock_quantity: 10, price_paise: 50000 },
      { id: "inv-b", product_id: "prod-b", seller_id: "slr-seller-b", stock_quantity: 20, price_paise: 80000 },
    ],
  };

  const setupSellerAuth = (userId: string, sellerId: string) => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: userId,
          email: `${sellerId}@floria.test`,
          app_metadata: { role: "seller" },
        },
      },
      error: null,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "user_profiles") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { id: userId, role: "seller" },
                error: null,
              }),
            }),
          }),
        };
      }

      if (table === "seller_profiles") {
        return {
          select: () => ({
            eq: (f: string, v: any) => ({
              maybeSingle: async () => ({
                data: { id: sellerId, user_id: userId, status: "approved" },
                error: null,
              }),
            }),
            or: (clause: string) => ({
              maybeSingle: async () => ({
                data: { id: sellerId, user_id: userId, status: "approved" },
                error: null,
              }),
            }),
          }),
        };
      }

      if (table === "products") {
        return {
          select: () => ({
            eq: (f: string, v: any) => ({
              neq: () => ({
                maybeSingle: async () => {
                  const p = store.products.find((prod: any) => prod[f] === v);
                  return { data: p || null, error: null };
                },
              }),
              maybeSingle: async () => {
                const p = store.products.find((prod: any) => prod[f] === v);
                return { data: p || null, error: null };
              },
            }),
            or: () => ({
              order: () => Promise.resolve({ data: store.products, error: null }),
            }),
          }),
          update: (payload: any) => ({
            eq: (f: string, v: any) => ({
              or: (clause: string) => ({
                select: async () => {
                  const target = store.products.find((p: any) => p[f] === v);
                  // Check if caller's sellerId or userId matches product's seller_id
                  if (target && (target.seller_id === sellerId || target.seller_id === userId)) {
                    Object.assign(target, payload);
                    return { data: [target], error: null };
                  }
                  return { data: [], error: null };
                },
              }),
            }),
          }),
        };
      }

      if (table === "inventory") {
        return {
          select: () => ({
            eq: (f1: string, v1: any) => ({
              or: (clause: string) => ({
                maybeSingle: async () => {
                  const inv = store.inventory.find(
                    (i: any) => i[f1] === v1 && (i.seller_id === sellerId || i.seller_id === userId),
                  );
                  return { data: inv || null, error: null };
                },
              }),
              eq: (f2: string, v2: any) => ({
                maybeSingle: async () => {
                  const inv = store.inventory.find(
                    (i: any) => i[f1] === v1 && i[f2] === v2,
                  );
                  return { data: inv || null, error: null };
                },
              }),
            }),
          }),
          update: (payload: any) => ({
            eq: (f: string, v: any) => ({
              or: () => {
                const inv = store.inventory.find((i: any) => i[f] === v);
                if (inv && (inv.seller_id === sellerId || inv.seller_id === userId)) {
                  Object.assign(inv, payload);
                }
                return Promise.resolve({ data: null, error: null });
              },
            }),
          }),
          insert: async () => ({ data: null, error: null }),
        };
      }

      if (table === "product_images") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: null, error: null }),
              }),
            }),
          }),
          insert: async () => ({ data: null, error: null }),
          update: () => ({
            eq: async () => ({ data: null, error: null }),
          }),
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
    store.products[0].name = "Seller A Monstera";
    store.products[0].status = "active";
    store.products[1].name = "Seller B Ficus";
    store.products[1].status = "active";
  });

  it("prevents Seller A from updating Product B owned by Seller B (returns 404)", async () => {
    setupSellerAuth("usr-seller-a", "slr-seller-a");

    const res = await request(app)
      .patch("/api/v1/seller/products/prod-b")
      .set("Authorization", "Bearer mock-seller-token")
      .send({
        name: "Hacked Product Name by Seller A",
        description: "Malicious override",
      });

    expect(res.status).toBe(404);
    // Verify Product B was not mutated in DB
    expect(store.products[1].name).toBe("Seller B Ficus");
  });

  it("prevents Seller A from changing the status of Product B owned by Seller B", async () => {
    setupSellerAuth("usr-seller-a", "slr-seller-a");

    const res = await request(app)
      .patch("/api/v1/seller/products/prod-b/status")
      .set("Authorization", "Bearer mock-seller-token")
      .send({
        status: "inactive",
      });

    expect(res.status).toBe(404);
    // Verify Product B status was not mutated
    expect(store.products[1].status).toBe("active");
  });

  it("allows Seller A to update their own Product A", async () => {
    setupSellerAuth("usr-seller-a", "slr-seller-a");

    const res = await request(app)
      .patch("/api/v1/seller/products/prod-a")
      .set("Authorization", "Bearer mock-seller-token")
      .send({
        name: "Seller A Monstera (Updated)",
      });

    expect(res.status).toBe(200);
    expect(store.products[0].name).toBe("Seller A Monstera (Updated)");
  });
});
