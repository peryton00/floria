// Floria API — C2 Fulfillment Hijack Protection Test Suite
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

describe("C2: Fulfillment Hijack Protection", () => {
  let app: ReturnType<typeof createApp>;

  const store = {
    orders: [
      { id: "11111111-1111-1111-1111-111111111100", status: "order_placed", seller_id: "slr-seller-b" },
    ],
    order_items: [
      {
        id: "22222222-2222-2222-2222-222222222200",
        order_id: "11111111-1111-1111-1111-111111111100",
        seller_id_snapshot: "slr-seller-b",
        product_id: "33333333-3333-3333-3333-333333333300",
      },
    ],
    seller_order_fulfillments: [] as any[],
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
            or: () => ({
              maybeSingle: async () => ({
                data: { id: sellerId, user_id: userId, status: "approved" },
                error: null,
              }),
            }),
          }),
        };
      }

      if (table === "orders") {
        return {
          select: () => ({
            eq: (f: string, v: any) => ({
              maybeSingle: async () => {
                const order = store.orders.find((o: any) => o[f] === v);
                return { data: order || null, error: null };
              },
            }),
          }),
        };
      }

      if (table === "order_items") {
        return {
          select: () => ({
            eq: (f: string, v: any) => {
              const items = store.order_items.filter((item: any) => item[f] === v);
              return Promise.resolve({ data: items, error: null });
            },
          }),
        };
      }

      if (table === "seller_order_fulfillments") {
        return {
          select: () => ({
            eq: (f1: string, v1: any) => ({
              eq: (f2: string, v2: any) => ({
                maybeSingle: async () => {
                  const record = store.seller_order_fulfillments.find(
                    (f: any) => f[f1] === v1 && f[f2] === v2,
                  );
                  return { data: record || null, error: null };
                },
              }),
            }),
          }),
          insert: (payload: any) => {
            const newRecord = {
              id: `ful-${Date.now()}`,
              ...payload,
            };
            store.seller_order_fulfillments.push(newRecord);
            return {
              select: () => ({
                maybeSingle: async () => ({ data: newRecord, error: null }),
              }),
            };
          },
          update: (payload: any) => ({
            eq: (f1: string, v1: any) => ({
              eq: (f2: string, v2: any) => {
                const record = store.seller_order_fulfillments.find(
                  (f: any) => f[f1] === v1 && f[f2] === v2,
                );
                if (record) Object.assign(record, payload);
                return Promise.resolve({ data: record, error: null });
              },
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
    store.seller_order_fulfillments = [];
  });

  it("prevents Seller A from hijacking an order containing only Seller B items (returns 403)", async () => {
    setupSellerAuth("usr-seller-a", "slr-seller-a");

    const res = await request(app)
      .post("/api/v1/seller/fulfillment")
      .set("Authorization", "Bearer mock-seller-token")
      .send({
        masterOrderId: "11111111-1111-1111-1111-111111111100",
        newStatus: "Nursery Confirmed",
      });

    expect(res.status).toBe(403);
    expect(res.body.error.message).toContain("You do not have items in this order");
    // Verify no fulfillment record was created for Seller A
    const sellerARecord = store.seller_order_fulfillments.find(
      (f: any) => f.seller_id === "slr-seller-a",
    );
    expect(sellerARecord).toBeUndefined();
  });

  it("allows Seller B (who owns items in the order) to advance fulfillment status", async () => {
    setupSellerAuth("usr-seller-b", "slr-seller-b");

    const res = await request(app)
      .post("/api/v1/seller/fulfillment")
      .set("Authorization", "Bearer mock-seller-token")
      .send({
        masterOrderId: "11111111-1111-1111-1111-111111111100",
        newStatus: "Nursery Confirmed",
      });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("Nursery Confirmed");
    // Verify fulfillment record exists for Seller B
    const sellerBRecord = store.seller_order_fulfillments.find(
      (f: any) => f.seller_id === "slr-seller-b",
    );
    expect(sellerBRecord).toBeDefined();
    expect(sellerBRecord.status).toBe("Nursery Confirmed");
  });
});
