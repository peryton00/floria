import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { deliveryRateCardService } from "../src/delivery-partners/delivery-rate-card.service.js";
import { pushNotificationProvider } from "../src/notifications/push-provider.js";

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

describe("Floria Delivery Partner — P1 Test Suite (Push Notifications & Dynamic Rate Card)", () => {
  let app: ReturnType<typeof createApp>;

  const mockDeviceTokens: any[] = [];
  const mockRateCards: any[] = [
    {
      id: "00000000-0000-0000-0000-000000000080",
      name: "Standard Bangalore Metro Delivery Rate Card",
      base_earning_paise: 8000,
      currency: "INR",
      effective_from: "2026-01-01T00:00:00.000Z",
      effective_to: null,
      status: "active",
      metadata: { version: 1 },
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    },
  ];

  const setupAuth = (userId: string, role: string, partnerId?: string) => {
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

      if (table === "delivery_partners") {
        return {
          select: () => ({
            or: () => ({
              maybeSingle: async () => ({
                data: { id: partnerId || "partner-A-uuid", user_id: userId, full_name: "Test Driver" },
                error: null,
              }),
            }),
            eq: () => ({
              maybeSingle: async () => ({
                data: { id: partnerId || "partner-A-uuid", user_id: userId },
                error: null,
              }),
            }),
          }),
        };
      }

      if (table === "device_tokens") {
        return {
          upsert: (data: any) => {
            const idx = mockDeviceTokens.findIndex(
              (t) => t.user_id === data.user_id && t.token === data.token,
            );
            const record = { id: `dt-${Date.now()}`, ...data };
            if (idx >= 0) {
              mockDeviceTokens[idx] = { ...mockDeviceTokens[idx], ...record };
            } else {
              mockDeviceTokens.push(record);
            }
            return {
              select: () => ({
                single: async () => ({ data: record, error: null }),
              }),
            };
          },
          select: () => ({
            eq: (field: string, val: any) => ({
              eq: (_field2: string, _val2: any) => ({
                order: async () => ({
                  data: mockDeviceTokens.filter(
                    (t) => t[field] === val && t.is_active === true,
                  ),
                  error: null,
                }),
              }),
              order: async () => ({
                data: mockDeviceTokens.filter((t) => t[field] === val),
                error: null,
              }),
            }),
          }),
          update: (data: any) => ({
            eq: async (field: string, val: any) => {
              mockDeviceTokens
                .filter((t) => t[field] === val)
                .forEach((t) => Object.assign(t, data));
              return { error: null };
            },
          }),
          delete: () => ({
            eq: (field: string, val: any) => ({
              eq: async (field2: string, val2: any) => {
                const idx = mockDeviceTokens.findIndex(
                  (t) => t[field] === val && t[field2] === val2,
                );
                if (idx >= 0) mockDeviceTokens.splice(idx, 1);
                return { error: null };
              },
            }),
          }),
        };
      }

      if (table === "delivery_rate_cards") {
        return {
          select: () => ({
            eq: (field: string, val: any) => ({
              lte: () => ({
                order: () => ({
                  limit: () => ({
                    maybeSingle: async () => ({
                      data: mockRateCards.find((r) => r[field] === val) || null,
                      error: null,
                    }),
                  }),
                }),
              }),
              order: () => ({
                limit: () => ({
                  maybeSingle: async () => ({
                    data: mockRateCards.find((r) => r[field] === val) || null,
                    error: null,
                  }),
                }),
              }),
              maybeSingle: async () => ({
                data: mockRateCards.find((r) => r[field] === val) || null,
                error: null,
              }),
            }),
            order: async () => ({
              data: [...mockRateCards],
              error: null,
            }),
          }),
          insert: (data: any) => {
            const record = { id: `rc-${Date.now()}`, ...data };
            mockRateCards.push(record);
            return {
              select: () => ({
                single: async () => ({ data: record, error: null }),
              }),
            };
          },
          update: (data: any) => ({
            eq: () => ({
              select: () => ({
                maybeSingle: async () => ({ data: { ...mockRateCards[0], ...data }, error: null }),
              }),
            }),
          }),
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
    app = createApp();
  });

  // ── P1-A: Device Token Management ──────────────────────────────────────────

  describe("P1-A: Device Token Management", () => {
    it("allows authenticated courier to register push device token", async () => {
      setupAuth("user-courier-A", "delivery_partner", "partner-A-uuid");

      const res = await request(app)
        .post("/api/v1/delivery-partners/device-token")
        .set("Authorization", "Bearer valid-jwt")
        .send({
          token: "ExponentPushToken[mock-token-courier-A]",
          platform: "android",
          deviceInfo: { model: "Pixel 8", osVersion: "14" },
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user_id).toBe("user-courier-A");
      expect(res.body.data.token).toBe("ExponentPushToken[mock-token-courier-A]");
    });

    it("prevents courier from registering token for another courier (forces caller JWT user_id)", async () => {
      setupAuth("user-courier-A", "delivery_partner", "partner-A-uuid");

      const res = await request(app)
        .post("/api/v1/delivery-partners/device-token")
        .set("Authorization", "Bearer valid-jwt")
        .send({
          user_id: "user-courier-B", // Attempt to spoof target user
          token: "ExponentPushToken[spoof-token]",
          platform: "android",
        });

      expect(res.status).toBe(201);
      // Confirms the server bound it to authenticated caller user-courier-A, not spoofed user-courier-B
      expect(res.body.data.user_id).toBe("user-courier-A");
    });

    it("allows courier to remove device token on logout", async () => {
      setupAuth("user-courier-A", "delivery_partner", "partner-A-uuid");

      const res = await request(app)
        .delete("/api/v1/delivery-partners/device-token")
        .set("Authorization", "Bearer valid-jwt")
        .send({
          token: "ExponentPushToken[mock-token-courier-A]",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("rejects unauthenticated requests to register device token", async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: "No session" } });

      const res = await request(app)
        .post("/api/v1/delivery-partners/device-token")
        .send({
          token: "ExponentPushToken[unauth-token]",
          platform: "android",
        });

      expect(res.status).toBe(401);
    });
  });

  // ── P1-B: Notification Push Dispatch Engine ───────────────────────────────

  describe("P1-B: Push Notification Provider & Dispatch Engine", () => {
    it("handles dispatch gracefully when user has registered device tokens", async () => {
      setupAuth("user-courier-A", "delivery_partner", "partner-A-uuid");

      const result = await pushNotificationProvider.sendToUser(
        "user-courier-A",
        "New Delivery Assigned",
        "Order #ORD-123 is ready for pickup",
        { orderId: "ORD-123" },
      );

      // Sent or gracefully degraded in test environment without throwing
      expect(result).toBeDefined();
      expect(typeof result.sent).toBe("number");
      expect(typeof result.failed).toBe("number");
    });

    it("returns zero counts gracefully when user has no active tokens", async () => {
      setupAuth("user-no-tokens", "delivery_partner");

      const result = await pushNotificationProvider.sendToUser(
        "user-no-tokens",
        "Test Title",
        "Test Body",
      );

      expect(result.sent).toBe(0);
      expect(result.failed).toBe(0);
    });
  });

  // ── P1-C: Dynamic Delivery Rate Card ──────────────────────────────────────

  describe("P1-C: Dynamic Delivery Rate Card & Calculation", () => {
    it("allows couriers and admin to retrieve the active delivery rate card", async () => {
      setupAuth("user-courier-A", "delivery_partner", "partner-A-uuid");

      const res = await request(app)
        .get("/api/v1/delivery-partners/rate-cards/active")
        .set("Authorization", "Bearer valid-jwt");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.base_earning_paise).toBe(8000);
      expect(res.body.data.currency).toBe("INR");
    });

    it("calculates server-authoritative earnings from active rate card", async () => {
      setupAuth("user-courier-A", "delivery_partner", "partner-A-uuid");

      const calculation = await deliveryRateCardService.calculateDeliveryEarning({
        id: "del-mock-1",
        order_id: "ord-mock-1",
      });

      expect(calculation.base_earning_paise).toBe(8000);
      expect(calculation.total_earning_paise).toBe(8000);
      expect(calculation.currency).toBe("INR");
      expect(calculation.rate_card_id).toBeDefined();
    });

    it("allows admin to create a new delivery rate card", async () => {
      setupAuth("user-admin-1", "admin");

      const res = await request(app)
        .post("/api/v1/delivery-partners/admin/rate-cards")
        .set("Authorization", "Bearer valid-jwt")
        .send({
          name: "Festival Season Surge Rate Card",
          base_earning_paise: 9500, // ₹95.00
          currency: "INR",
          status: "active",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.base_earning_paise).toBe(9500);
    });

    it("prevents couriers from creating or modifying rate cards (403 Forbidden)", async () => {
      setupAuth("user-courier-A", "delivery_partner", "partner-A-uuid");

      const res = await request(app)
        .post("/api/v1/delivery-partners/admin/rate-cards")
        .set("Authorization", "Bearer valid-jwt")
        .send({
          name: "Malicious Rate Card",
          base_earning_paise: 50000,
        });

      expect(res.status).toBe(403);
    });

    it("prevents unauthenticated callers from accessing admin rate card endpoints", async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: "No session" } });

      const res = await request(app)
        .get("/api/v1/delivery-partners/admin/rate-cards");

      expect(res.status).toBe(401);
    });
  });
});
