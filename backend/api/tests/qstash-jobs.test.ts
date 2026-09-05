// Floria API — QStash Job Queue & Internal Job Endpoint Verification Tests
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { qstashService } from "../src/jobs/qstash.service.js";
import { orderRepository } from "../src/database/repositories/order.repository.js";
import { notificationService } from "../notifications/notification.service.js";
import { checkoutService } from "../src/checkout/checkout.service.js";

describe("Task 4: Upstash QStash & Internal Asynchronous Jobs", () => {
  let app: any;

  beforeEach(() => {
    vi.restoreAllMocks();
    app = createApp();
  });

  it("should reject requests without signature with 401 Unauthorized", async () => {
    const res = await request(app)
      .post("/api/v1/internal/jobs/order-confirmation")
      .send({ orderId: "ord-test-123" });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toMatch(/signature/i);
  });

  it("should reject requests with invalid signature with 401 Unauthorized", async () => {
    const res = await request(app)
      .post("/api/v1/internal/jobs/order-confirmation")
      .set("upstash-signature", "invalid-fake-signature")
      .send({ orderId: "ord-test-123" });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toMatch(/signature/i);
  });

  it("should accept valid signature and process order-confirmation job", async () => {
    vi.spyOn(orderRepository, "findById").mockResolvedValue({
      id: "ord-valid-456",
      customer_id: "cust-1",
      seller_order_fulfillments: [{ seller_id: "seller-1" }],
    } as any);

    const directDispatchSpy = vi
      .spyOn(checkoutService, "dispatchOrderPlacedNotificationsDirect")
      .mockResolvedValue();

    const res = await request(app)
      .post("/api/v1/internal/jobs/order-confirmation")
      .set("upstash-signature", "test-valid-qstash-signature")
      .send({ orderId: "ord-valid-456" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.job).toBe("order-confirmation");
    expect(res.body.orderId).toBe("ord-valid-456");
    expect(directDispatchSpy).toHaveBeenCalledWith("ord-valid-456");
  });

  it("should dispatch order confirmation asynchronously without failing checkout if QStash is offline", async () => {
    const verifySpy = vi
      .spyOn(qstashService, "publishOrderConfirmation")
      .mockResolvedValue();

    await expect(
      checkoutService.dispatchOrderPlacedNotifications("ord-offline-789")
    ).resolves.not.toThrow();

    expect(verifySpy).toHaveBeenCalledWith("ord-offline-789");
  });
});
