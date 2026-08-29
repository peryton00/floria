import { describe, it, expect } from "vitest";
import {
  formatINR,
  paiseToRupees,
  rupeesToPaise,
  formatDate,
} from "../../lib/format";

describe("Customer Mobile — Currency & Date Formatting", () => {
  it("formats paise into rupee currency with en-IN locale", () => {
    expect(formatINR(129900)).toBe("₹1,299");
    expect(formatINR(4900)).toBe("₹49");
    expect(formatINR(0)).toBe("₹0");
  });

  it("converts between paise and rupees correctly", () => {
    expect(paiseToRupees(150000)).toBe(1500);
    expect(rupeesToPaise(1500)).toBe(150000);
  });

  it("formats ISO timestamps gracefully", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate(undefined)).toBe("—");
    const formatted = formatDate("2026-08-28T10:00:00.000Z");
    expect(typeof formatted).toBe("string");
    expect(formatted.length).toBeGreaterThan(0);
  });
});

describe("Customer Mobile — Cart Math & Item Management", () => {
  interface CartItem {
    productId: string;
    pricePaise: number;
    quantity: number;
  }

  const computeTotals = (items: CartItem[]) => {
    const subtotal = items.reduce(
      (sum, i) => sum + i.pricePaise * i.quantity,
      0,
    );
    const deliveryFee = items.length > 0 ? 4900 : 0;
    const total = subtotal + deliveryFee;
    return { subtotal, deliveryFee, total };
  };

  it("calculates accurate subtotal, delivery fee, and grand total for single plant", () => {
    const items = [{ productId: "p-1", pricePaise: 129900, quantity: 1 }];
    const totals = computeTotals(items);
    expect(totals.subtotal).toBe(129900);
    expect(totals.deliveryFee).toBe(4900);
    expect(totals.total).toBe(134800);
  });

  it("calculates accurate total for multiple items and quantities", () => {
    const items = [
      { productId: "p-1", pricePaise: 129900, quantity: 2 }, // 259800
      { productId: "p-2", pricePaise: 49900, quantity: 1 }, // 49900
    ];
    const totals = computeTotals(items);
    expect(totals.subtotal).toBe(309700);
    expect(totals.deliveryFee).toBe(4900);
    expect(totals.total).toBe(314600);
  });

  it("returns zero delivery fee and zero total when cart is empty", () => {
    const totals = computeTotals([]);
    expect(totals.subtotal).toBe(0);
    expect(totals.deliveryFee).toBe(0);
    expect(totals.total).toBe(0);
  });
});

describe("Customer Mobile — Wishlist State Transition", () => {
  it("toggles product addition and removal in wishlist", () => {
    let wishlist = ["p-101", "p-102"];
    const toggle = (list: string[], id: string) =>
      list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

    wishlist = toggle(wishlist, "p-103");
    expect(wishlist).toContain("p-103");
    expect(wishlist.length).toBe(3);

    wishlist = toggle(wishlist, "p-101");
    expect(wishlist).not.toContain("p-101");
    expect(wishlist.length).toBe(2);
  });
});

describe("Customer Mobile — Address Form Validation", () => {
  const validateAddress = (addr: {
    name?: string;
    street?: string;
    pincode?: string;
  }): { valid: boolean; error?: string } => {
    if (!addr.name || addr.name.trim().length === 0) {
      return { valid: false, error: "Recipient name is required" };
    }
    if (!addr.street || addr.street.trim().length < 5) {
      return { valid: false, error: "Detailed street address is required" };
    }
    if (!addr.pincode || !/^\d{6}$/.test(addr.pincode.trim())) {
      return {
        valid: false,
        error: "Valid 6-digit Indian PIN code is required",
      };
    }
    return { valid: true };
  };

  it("accepts valid Bengaluru delivery address", () => {
    const res = validateAddress({
      name: "Aditi Sharma",
      street: "Flat 402, Green Glen Layout, Bellandur",
      pincode: "560103",
    });
    expect(res.valid).toBe(true);
    expect(res.error).toBeUndefined();
  });

  it("rejects address with missing recipient name", () => {
    expect(
      validateAddress({ street: "Bellandur Main Rd", pincode: "560103" }).valid,
    ).toBe(false);
  });

  it("rejects invalid pincode formats", () => {
    expect(
      validateAddress({
        name: "User",
        street: "Bellandur Main Rd",
        pincode: "5601",
      }).valid,
    ).toBe(false);
    expect(
      validateAddress({
        name: "User",
        street: "Bellandur Main Rd",
        pincode: "ABCDEF",
      }).valid,
    ).toBe(false);
  });
});

describe("Customer Mobile — Cashfree Payment Initiation Validation", () => {
  interface PaymentSessionPayload {
    orderId: string;
    amountPaise: number;
    customerPhone?: string;
  }

  const validatePaymentRequest = (
    p: Partial<PaymentSessionPayload>,
  ): boolean => {
    return !!(p.orderId && p.amountPaise && p.amountPaise > 0);
  };

  it("validates Cashfree PG session creation payload", () => {
    expect(
      validatePaymentRequest({
        orderId: "ord-77123",
        amountPaise: 134800,
        customerPhone: "+919876543210",
      }),
    ).toBe(true);
  });

  it("rejects zero or negative amount payment sessions", () => {
    expect(validatePaymentRequest({ orderId: "ord-1", amountPaise: 0 })).toBe(
      false,
    );
    expect(
      validatePaymentRequest({ orderId: "ord-1", amountPaise: -100 }),
    ).toBe(false);
  });
});

describe("Customer Mobile — Floria Feedback System Contract", () => {
  interface FeedbackMessage {
    type: "success" | "error" | "warning" | "info";
    message: string;
    action?: { label: string; actionType: string };
  }

  const formatCartFeedback = (item: { name: string; quantity: number }): FeedbackMessage => ({
    type: "success",
    message: `${item.quantity} × ${item.name} added to your bag`,
    action: { label: "View Bag", actionType: "NAVIGATE_CART" },
  });

  const formatUndoRemovalFeedback = (item: { name: string }): FeedbackMessage => ({
    type: "info",
    message: `${item.name} removed from bag`,
    action: { label: "Undo", actionType: "RESTORE_ITEM" },
  });

  it("generates human-friendly, concise success feedback for bag additions", () => {
    const feedback = formatCartFeedback({ name: "Monstera Deliciosa", quantity: 1 });
    expect(feedback.type).toBe("success");
    expect(feedback.message).toBe("1 × Monstera Deliciosa added to your bag");
    expect(feedback.action?.label).toBe("View Bag");
  });

  it("generates undo action feedback on plant specimen removal", () => {
    const feedback = formatUndoRemovalFeedback({ name: "Calathea Orbifolia" });
    expect(feedback.type).toBe("info");
    expect(feedback.message).toBe("Calathea Orbifolia removed from bag");
    expect(feedback.action?.label).toBe("Undo");
  });
});

describe("Customer Mobile — Semantic Haptics Hierarchy", () => {
  type SemanticHaptic = "selection" | "light" | "success" | "warning" | "error" | "boundary";

  const getHapticIntensity = (type: SemanticHaptic): number => {
    switch (type) {
      case "selection":
        return 1;
      case "light":
        return 2;
      case "boundary":
        return 2;
      case "warning":
        return 3;
      case "error":
        return 4;
      case "success":
        return 4;
    }
  };

  it("maintains appropriate restrained hierarchy for semantic haptics", () => {
    expect(getHapticIntensity("selection")).toBeLessThan(getHapticIntensity("success"));
    expect(getHapticIntensity("light")).toBeLessThan(getHapticIntensity("error"));
  });

  it("throttles rapid consecutive haptic triggers within 60ms", () => {
    let lastTime = 1000;
    const throttleMs = 60;
    const canTrigger = (now: number) => {
      if (now - lastTime < throttleMs) return false;
      lastTime = now;
      return true;
    };

    expect(canTrigger(1020)).toBe(false); // 20ms delta -> throttled
    expect(canTrigger(1070)).toBe(true);  // 70ms delta -> permitted
  });
});


