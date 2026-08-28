import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Error system ──────────────────────────────────────────────────────────────

describe("FloriaError", () => {
  it("has correct code and status", async () => {
    const { FloriaError, Errors } = await import("@/lib/server/errors");
    const err = Errors.authRequired();
    expect(err).toBeInstanceOf(FloriaError);
    expect(err.code).toBe("AUTH_REQUIRED");
    expect(err.status).toBe(401);
  });

  it("notFound includes resource name", async () => {
    const { Errors } = await import("@/lib/server/errors");
    const err = Errors.notFound("Order");
    expect(err.message).toContain("Order");
    expect(err.status).toBe(404);
  });

  it("invalidTransition includes from/to in message", async () => {
    const { Errors } = await import("@/lib/server/errors");
    const err = Errors.invalidTransition("Order Placed", "Picked Up");
    expect(err.message).toContain("Order Placed");
    expect(err.message).toContain("Picked Up");
    expect(err.status).toBe(409);
  });

  it("outOfStock includes product name", async () => {
    const { Errors } = await import("@/lib/server/errors");
    const err = Errors.outOfStock("Snake Plant");
    expect(err.message).toContain("Snake Plant");
    expect(err.status).toBe(409);
  });
});

// ─── Input validation ─────────────────────────────────────────────────────────

describe("validateAddress", () => {
  it("accepts a valid Indian address", async () => {
    const { validateAddress } = await import("@/lib/server/validate");
    const result = validateAddress({
      full_name: "Sudip Karan",
      phone: "9876543210",
      line1: "House 42, Green Avenue",
      city: "Raipur",
      state: "Chhattisgarh",
      pincode: "492001",
    });
    expect(result.pincode).toBe("492001");
    expect(result.full_name).toBe("Sudip Karan");
  });

  it("rejects a 5-digit PIN code", async () => {
    const { validateAddress } = await import("@/lib/server/validate");
    const { FloriaError } = await import("@/lib/server/errors");
    expect(() =>
      validateAddress({
        full_name: "A Customer",
        phone: "9876543210",
        line1: "12, Main Road",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "40001",
      }),
    ).toThrow(FloriaError);
  });

  it("rejects an invalid phone number", async () => {
    const { validateAddress } = await import("@/lib/server/validate");
    const { FloriaError } = await import("@/lib/server/errors");
    expect(() =>
      validateAddress({
        full_name: "A Customer",
        phone: "12345",
        line1: "12, Main Road",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
      }),
    ).toThrow(FloriaError);
  });

  it("rejects a missing full_name", async () => {
    const { validateAddress } = await import("@/lib/server/validate");
    const { FloriaError } = await import("@/lib/server/errors");
    expect(() =>
      validateAddress({
        full_name: "A",
        phone: "9876543210",
        line1: "12, Main Road",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
      }),
    ).toThrow(FloriaError);
  });
});

describe("validatePaymentMethod", () => {
  it("accepts online", async () => {
    const { validatePaymentMethod } = await import("@/lib/server/validate");
    expect(validatePaymentMethod("online")).toBe("online");
  });

  it("accepts cod", async () => {
    const { validatePaymentMethod } = await import("@/lib/server/validate");
    expect(validatePaymentMethod("cod")).toBe("cod");
  });

  it("rejects invalid method", async () => {
    const { validatePaymentMethod } = await import("@/lib/server/validate");
    const { FloriaError } = await import("@/lib/server/errors");
    expect(() => validatePaymentMethod("crypto")).toThrow(FloriaError);
  });
});

describe("validateUuid", () => {
  it("accepts valid UUID", async () => {
    const { validateUuid } = await import("@/lib/server/validate");
    const id = "550e8400-e29b-41d4-a716-446655440000";
    expect(validateUuid(id, "id")).toBe(id);
  });

  it("rejects non-UUID string", async () => {
    const { validateUuid } = await import("@/lib/server/validate");
    const { FloriaError } = await import("@/lib/server/errors");
    expect(() => validateUuid("FLR-260812-7020", "id")).toThrow(FloriaError);
  });

  it("rejects empty string", async () => {
    const { validateUuid } = await import("@/lib/server/validate");
    const { FloriaError } = await import("@/lib/server/errors");
    expect(() => validateUuid("", "id")).toThrow(FloriaError);
  });
});

// ─── Rate limiter ─────────────────────────────────────────────────────────────

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("allows requests under the limit", async () => {
    const { checkRateLimit } = await import("@/lib/server/rate-limit");
    const key = `test-under-${Date.now()}-${Math.random()}`;
    // Should not throw
    for (let i = 0; i < 5; i++) {
      expect(() =>
        checkRateLimit({ key, limit: 10, windowMs: 60_000 }),
      ).not.toThrow();
    }
  });

  it("throws RATE_LIMITED when limit exceeded", async () => {
    const { checkRateLimit } = await import("@/lib/server/rate-limit");
    const { FloriaError } = await import("@/lib/server/errors");
    const key = `test-limit-${Date.now()}-${Math.random()}`;
    for (let i = 0; i < 3; i++) {
      checkRateLimit({ key, limit: 3, windowMs: 60_000 });
    }
    expect(() => checkRateLimit({ key, limit: 3, windowMs: 60_000 })).toThrow(
      FloriaError,
    );
  });

  it("resets after window expires", async () => {
    const { checkRateLimit } = await import("@/lib/server/rate-limit");
    const key = `test-reset-${Date.now()}-${Math.random()}`;
    for (let i = 0; i < 2; i++) {
      checkRateLimit({ key, limit: 2, windowMs: 1_000 });
    }
    // Advance clock past the window
    vi.advanceTimersByTime(1_001);
    // Should be allowed again
    expect(() =>
      checkRateLimit({ key, limit: 2, windowMs: 1_000 }),
    ).not.toThrow();
  });
});

// ─── Seller status transition validation ──────────────────────────────────────

describe("validateSellerStatusTransition (sellerOrders service)", () => {
  it("allows sequential forward transitions", async () => {
    const { validateSellerStatusTransition } =
      await import("@/lib/services/sellerOrders");
    expect(
      validateSellerStatusTransition("Order Placed", "Nursery Confirmed"),
    ).toBe(true);
    expect(
      validateSellerStatusTransition("Nursery Confirmed", "Preparing"),
    ).toBe(true);
    expect(
      validateSellerStatusTransition("Preparing", "Ready for Pickup"),
    ).toBe(true);
    expect(
      validateSellerStatusTransition("Ready for Pickup", "Picked Up"),
    ).toBe(true);
  });

  it("rejects skipping a stage", async () => {
    const { validateSellerStatusTransition } =
      await import("@/lib/services/sellerOrders");
    expect(validateSellerStatusTransition("Order Placed", "Preparing")).toBe(
      false,
    );
    expect(validateSellerStatusTransition("Order Placed", "Picked Up")).toBe(
      false,
    );
  });

  it("rejects backward transitions", async () => {
    const { validateSellerStatusTransition } =
      await import("@/lib/services/sellerOrders");
    expect(validateSellerStatusTransition("Preparing", "Order Placed")).toBe(
      false,
    );
    expect(validateSellerStatusTransition("Picked Up", "Preparing")).toBe(
      false,
    );
  });
});
