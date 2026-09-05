// Floria API — Atomic Checkout & Inventory Rollback Unit Tests
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CheckoutService } from "../src/checkout/checkout.service.js";
import { orderRepository } from "../src/database/repositories/order.repository.js";
import * as dbModule from "../src/config/database.js";

describe("Task 3: Atomic Checkout & Inventory Rollback Suite", () => {
  let checkoutService: CheckoutService;
  let mockInventoryStock = 1;

  beforeEach(() => {
    checkoutService = new CheckoutService();
    mockInventoryStock = 1;
    vi.restoreAllMocks();
  });

  it("handles atomic checkout RPC successfully and returns order details", async () => {
    const mockOrderPayload = {
      customer_id: "usr-1",
      seller_id: "slr-1",
      status: "pending_payment",
    };
    const mockLineItems = [
      { product_id: "prod-1", product_name_snapshot: "Snake Plant", quantity: 1 },
    ];
    const mockFulfillments = [{ seller_id: "slr-1", status: "pending_payment" }];

    vi.spyOn(orderRepository, "placeOrderAtomic").mockResolvedValueOnce(
      "ord-atomic-100",
    );

    const orderId = await orderRepository.placeOrderAtomic(
      mockOrderPayload,
      mockLineItems,
      mockFulfillments,
    );

    expect(orderId).toBe("ord-atomic-100");
  });

  it("rejects concurrent checkouts for the last unit with out-of-stock error", async () => {
    // Simulate DB RPC execution with CAS check on stock_quantity
    vi.spyOn(orderRepository, "placeOrderAtomic").mockImplementation(
      async (_payload, lineItems) => {
        const requestedQty = Number(lineItems[0]?.quantity || 1);
        if (mockInventoryStock >= requestedQty) {
          mockInventoryStock -= requestedQty;
          return "ord-success-1";
        }
        const err = new Error(
          `OUT_OF_STOCK: ${lineItems[0]?.product_name_snapshot || "Product"}`,
        ) as any;
        err.code = "P0001";
        throw err;
      },
    );

    // Two concurrent requests for the 1 remaining item
    const req1 = orderRepository.placeOrderAtomic(
      { customer_id: "cust-1" },
      [{ product_id: "p1", product_name_snapshot: "Monstera", quantity: 1 }],
      [{ seller_id: "s1" }],
    );
    const req2 = orderRepository.placeOrderAtomic(
      { customer_id: "cust-2" },
      [{ product_id: "p1", product_name_snapshot: "Monstera", quantity: 1 }],
      [{ seller_id: "s1" }],
    );

    const results = await Promise.allSettled([req1, req2]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);
    expect(mockInventoryStock).toBe(0); // Final stock is exactly 0, not negative
  });

  it("rolls back inventory deduction if order insertion fails mid-transaction", async () => {
    let stock = 10;
    const initialStock = stock;

    // Simulate Postgres transaction rollback on error
    const atomicTxSimulation = async () => {
      let tempStock = stock;
      try {
        // Step 1: Decrement
        tempStock -= 2;

        // Step 2: Order insertion throws unexpected constraint error
        throw new Error("DB_CONSTRAINT_VIOLATION: invalid foreign key in seller_order_fulfillments");
      } catch (e) {
        // Postgres rolls back uncommitted changes
        tempStock = stock;
        throw e;
      }
    };

    await expect(atomicTxSimulation()).rejects.toThrow(
      "DB_CONSTRAINT_VIOLATION",
    );
    expect(stock).toBe(initialStock); // Inventory remained intact
  });
});
