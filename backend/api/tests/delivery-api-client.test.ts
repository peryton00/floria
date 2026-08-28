// Floria API Client — Delivery Methods Unit Test Suite
import { describe, it, expect, vi, beforeEach } from "vitest";
import { FloriaApiClient } from "../../../packages/api-client/src/index.js";

describe("FloriaApiClient - Delivery Logistics Client Unit Tests", () => {
  let client: FloriaApiClient;
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    client = new FloriaApiClient({
      baseUrl: "https://api.floria.test",
      getAccessToken: () => "mock-jwt-token-123",
      fetch: mockFetch as any,
    });
  });

  describe("getDeliveries", () => {
    it("sends GET request with Authorization header and parses response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: [
            {
              id: "del-001",
              order_id: "ord-101",
              assigned_to: "usr-courier-1",
              status: "assigned",
              assigned_at: "2026-08-28T00:00:00Z",
              created_at: "2026-08-28T00:00:00Z",
              updated_at: "2026-08-28T00:00:00Z",
            },
          ],
        }),
      });

      const res = await client.getDeliveries({ status: "assigned" });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe(
        "https://api.floria.test/api/v1/operations/deliveries?status=assigned",
      );
      expect(options?.method || "GET").toBe("GET");
      expect(options.headers["Authorization"]).toBe(
        "Bearer mock-jwt-token-123",
      );
      expect(res.success).toBe(true);
      expect(res.data).toHaveLength(1);
      expect(res.data?.[0].id).toBe("del-001");
      expect(res.data?.[0].status).toBe("assigned");
    });

    it("handles backend error responses gracefully without throwing", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Courier role required for delivery access",
          },
        }),
      });

      const res = await client.getDeliveries();

      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("FORBIDDEN");
      expect(res.error?.message).toBe(
        "Courier role required for delivery access",
      );
    });
  });

  describe("getDeliveryById", () => {
    it("sends GET request for specific delivery ID with auth", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            id: "del-002",
            order_id: "ord-102",
            assigned_to: "usr-courier-1",
            status: "out_for_delivery",
            assigned_at: "2026-08-28T00:00:00Z",
            created_at: "2026-08-28T00:00:00Z",
            updated_at: "2026-08-28T00:00:00Z",
          },
        }),
      });

      const res = await client.getDeliveryById("del-002");

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe(
        "https://api.floria.test/api/v1/operations/deliveries/del-002",
      );
      expect(options?.method || "GET").toBe("GET");
      expect(options.headers["Authorization"]).toBe(
        "Bearer mock-jwt-token-123",
      );
      expect(res.success).toBe(true);
      expect(res.data?.id).toBe("del-002");
      expect(res.data?.status).toBe("out_for_delivery");
    });
  });

  describe("updateDeliveryStatus", () => {
    it("sends POST request with JSON payload and auth", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            id: "del-002",
            order_id: "ord-102",
            assigned_to: "usr-courier-1",
            status: "delivered",
            assigned_at: "2026-08-28T00:00:00Z",
            delivered_at: "2026-08-28T01:00:00Z",
            created_at: "2026-08-28T00:00:00Z",
            updated_at: "2026-08-28T01:00:00Z",
          },
        }),
      });

      const res = await client.updateDeliveryStatus("del-002", "delivered");

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe(
        "https://api.floria.test/api/v1/operations/deliveries/del-002/status",
      );
      expect(options.method).toBe("POST");
      expect(options.headers["Content-Type"]).toBe("application/json");
      expect(options.headers["Authorization"]).toBe(
        "Bearer mock-jwt-token-123",
      );
      expect(JSON.parse(options.body)).toEqual({ status: "delivered" });
      expect(res.success).toBe(true);
      expect(res.data?.status).toBe("delivered");
    });
  });
});
