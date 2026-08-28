import { describe, it, expect } from "vitest";
import {
  formatINR,
  paiseToRupees,
  rupeesToPaise,
  formatDate,
} from "../../lib/format";

describe("Seller Mobile — Currency & Date Formatting", () => {
  it("formats paise into rupee currency with en-IN locale", () => {
    expect(formatINR(129900)).toBe("₹1,299");
    expect(formatINR(250000)).toBe("₹2,500");
    expect(formatINR(0)).toBe("₹0");
  });

  it("converts correctly between paise and rupees", () => {
    expect(paiseToRupees(199900)).toBe(1999);
    expect(rupeesToPaise(1999)).toBe(199900);
  });

  it("formats date strings reliably", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate(undefined)).toBe("—");
    const formatted = formatDate("2026-08-28T12:00:00.000Z");
    expect(typeof formatted).toBe("string");
  });
});

describe("Seller Mobile — Order Fulfillment State Machine", () => {
  const validTransitions: Record<string, string[]> = {
    pending: ["preparing", "cancelled"],
    preparing: ["ready_for_pickup", "cancelled"],
    ready_for_pickup: ["out_for_delivery", "cancelled"],
    out_for_delivery: ["delivered"],
    delivered: [],
    cancelled: [],
  };

  const canAdvance = (current: string, next: string): boolean => {
    return validTransitions[current]?.includes(next) ?? false;
  };

  it("permits standard forward progression for nursery fulfillment", () => {
    expect(canAdvance("pending", "preparing")).toBe(true);
    expect(canAdvance("preparing", "ready_for_pickup")).toBe(true);
    expect(canAdvance("ready_for_pickup", "out_for_delivery")).toBe(true);
    expect(canAdvance("out_for_delivery", "delivered")).toBe(true);
  });

  it("prohibits skipping preparation or handoff directly to delivered", () => {
    expect(canAdvance("pending", "delivered")).toBe(false);
    expect(canAdvance("preparing", "delivered")).toBe(false);
    expect(canAdvance("ready_for_pickup", "delivered")).toBe(false);
  });

  it("prevents transitions from terminal delivered or cancelled states", () => {
    expect(canAdvance("delivered", "pending")).toBe(false);
    expect(canAdvance("delivered", "preparing")).toBe(false);
    expect(canAdvance("cancelled", "preparing")).toBe(false);
  });
});

describe("Seller Mobile — Role Authorization Matrix", () => {
  const canAccessSellerMobile = (role: string | undefined): boolean => {
    return role === "seller" || role === "admin" || role === "super_admin";
  };

  it("grants access to verified sellers and platform admins", () => {
    expect(canAccessSellerMobile("seller")).toBe(true);
    expect(canAccessSellerMobile("admin")).toBe(true);
    expect(canAccessSellerMobile("super_admin")).toBe(true);
  });

  it("denies access to regular customers and delivery couriers", () => {
    expect(canAccessSellerMobile("customer")).toBe(false);
    expect(canAccessSellerMobile("courier")).toBe(false);
    expect(canAccessSellerMobile("operations")).toBe(false);
    expect(canAccessSellerMobile(undefined)).toBe(false);
  });
});

describe("Seller Mobile — Inventory & Product Payload Validation", () => {
  const validateProductInput = (input: {
    name?: string;
    pricePaise?: number;
    stockQuantity?: number;
  }): { valid: boolean; error?: string } => {
    if (!input.name || input.name.trim().length === 0) {
      return { valid: false, error: "Plant specimen name is required" };
    }
    if (typeof input.pricePaise !== "number" || input.pricePaise <= 0) {
      return { valid: false, error: "Valid price in paise is required" };
    }
    if (typeof input.stockQuantity !== "number" || input.stockQuantity < 0) {
      return {
        valid: false,
        error: "Valid non-negative stock quantity is required",
      };
    }
    return { valid: true };
  };

  it("validates correct plant specimen creation input", () => {
    const res = validateProductInput({
      name: "Monstera Deliciosa",
      pricePaise: 149900,
      stockQuantity: 12,
    });
    expect(res.valid).toBe(true);
    expect(res.error).toBeUndefined();
  });

  it("rejects input with empty name, zero price, or negative stock", () => {
    expect(
      validateProductInput({ name: "", pricePaise: 1000, stockQuantity: 5 })
        .valid,
    ).toBe(false);
    expect(
      validateProductInput({ name: "Plant", pricePaise: 0, stockQuantity: 5 })
        .valid,
    ).toBe(false);
    expect(
      validateProductInput({
        name: "Plant",
        pricePaise: 1000,
        stockQuantity: -1,
      }).valid,
    ).toBe(false);
  });
});
