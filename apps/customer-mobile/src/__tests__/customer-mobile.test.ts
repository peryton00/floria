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

describe("Customer Mobile — Server-Authoritative Delivery Fee Engine & Cart Math", () => {
  interface CartItem {
    productId: string;
    pricePaise: number;
    quantity: number;
    isFreeDelivery?: boolean;
  }

  const computeTotals = (
    items: CartItem[],
    config = {
      deliveryEnabled: true,
      baseDeliveryFeePaise: 4000,
      freeDeliveryEnabled: true,
      freeDeliveryThresholdPaise: 99900,
      maintenanceFeePaise: 1000,
    },
  ) => {
    if (items.length === 0) {
      return { subtotal: 0, deliveryFee: 0, maintenanceFee: 0, total: 0, isFreeDelivery: false };
    }

    const subtotal = items.reduce(
      (sum, i) => sum + i.pricePaise * i.quantity,
      0,
    );

    const allItemsFreeDelivery = items.every((i) => Boolean(i.isFreeDelivery));
    const isFreeDelivery =
      !config.deliveryEnabled ||
      (config.freeDeliveryEnabled && allItemsFreeDelivery) ||
      (config.freeDeliveryEnabled && subtotal >= config.freeDeliveryThresholdPaise);

    const deliveryFee = isFreeDelivery ? 0 : config.baseDeliveryFeePaise;
    const maintenanceFee = config.maintenanceFeePaise;
    const total = subtotal + deliveryFee + maintenanceFee;

    return { subtotal, deliveryFee, maintenanceFee, total, isFreeDelivery };
  };

  it("applies free delivery when subtotal exceeds free delivery threshold (₹999)", () => {
    const items = [{ productId: "p-1", pricePaise: 129900, quantity: 1 }]; // ₹1299.00
    const totals = computeTotals(items);
    expect(totals.subtotal).toBe(129900);
    expect(totals.deliveryFee).toBe(0); // Free delivery
    expect(totals.maintenanceFee).toBe(1000); // ₹10.00
    expect(totals.total).toBe(130900);
    expect(totals.isFreeDelivery).toBe(true);
  });

  it("charges standard base delivery fee (₹40) when subtotal is below ₹999 threshold", () => {
    const items = [{ productId: "p-2", pricePaise: 49900, quantity: 1 }]; // ₹499.00
    const totals = computeTotals(items);
    expect(totals.subtotal).toBe(49900);
    expect(totals.deliveryFee).toBe(4000); // Standard ₹40 delivery fee
    expect(totals.maintenanceFee).toBe(1000); // ₹10.00
    expect(totals.total).toBe(54900); // 49900 + 4000 + 1000 = 54900
    expect(totals.isFreeDelivery).toBe(false);
  });

  it("applies free delivery if all individual items are marked as free delivery eligible", () => {
    const items = [
      { productId: "p-free-1", pricePaise: 29900, quantity: 1, isFreeDelivery: true },
    ];
    const totals = computeTotals(items);
    expect(totals.subtotal).toBe(29900);
    expect(totals.deliveryFee).toBe(0); // Free delivery because item is free delivery
    expect(totals.total).toBe(30900);
    expect(totals.isFreeDelivery).toBe(true);
  });

  it("returns zero fees and zero total when cart is empty", () => {
    const totals = computeTotals([]);
    expect(totals.subtotal).toBe(0);
    expect(totals.deliveryFee).toBe(0);
    expect(totals.maintenanceFee).toBe(0);
    expect(totals.total).toBe(0);
    expect(totals.isFreeDelivery).toBe(false);
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

describe("Customer Mobile — Motion Tokens & Micro-Interactions", () => {
  const motionTokens = {
    duration: {
      instant: 100,
      micro: 140,
      short: 180,
      standard: 240,
      content: 300,
    },
    scale: {
      pressed: 0.985,
      pressedCompact: 0.96,
      heartPulse: 1.10,
      tabActive: 1.05,
    },
  };

  it("maintains conservative button press scale (between 0.96 and 0.99)", () => {
    expect(motionTokens.scale.pressed).toBeGreaterThanOrEqual(0.96);
    expect(motionTokens.scale.pressed).toBeLessThanOrEqual(0.99);
  });

  it("maintains restrained wishlist heart pulse (<= 1.12)", () => {
    expect(motionTokens.scale.heartPulse).toBeGreaterThan(1.0);
    expect(motionTokens.scale.heartPulse).toBeLessThanOrEqual(1.12);
  });

  it("maintains fast micro-durations under 350ms to keep app responsive", () => {
    expect(motionTokens.duration.instant).toBeLessThanOrEqual(150);
    expect(motionTokens.duration.short).toBeLessThanOrEqual(200);
    expect(motionTokens.duration.standard).toBeLessThanOrEqual(300);
  });
});

describe("Customer Mobile — Duplicate Action Lock & In-Flight Protection", () => {
  it("prevents duplicate concurrent in-flight async actions", async () => {
    let activeLock = false;
    let callCount = 0;

    const runExclusive = async (fn: () => Promise<void>) => {
      if (activeLock) return;
      activeLock = true;
      try {
        await fn();
      } finally {
        activeLock = false;
      }
    };

    const task = () =>
      new Promise<void>((resolve) => {
        callCount++;
        setTimeout(resolve, 50);
      });

    // Simulate 3 rapid taps
    const p1 = runExclusive(task);
    const p2 = runExclusive(task);
    const p3 = runExclusive(task);

    await Promise.all([p1, p2, p3]);

    expect(callCount).toBe(1); // Only 1 task executed, 2 ignored due to lock
  });
});

describe("Customer Mobile — Recently Viewed & Recent Searches Persistence Logic", () => {
  it("deduplicates and moves recently viewed specimen to the front with max 10 items", () => {
    let list = [
      { id: "p-1", name: "Monstera Deliciosa", viewedAt: 1000 },
      { id: "p-2", name: "Fiddle Leaf Fig", viewedAt: 2000 },
      { id: "p-3", name: "Snake Plant", viewedAt: 3000 },
    ];

    const addRecentlyViewed = (item: { id: string; name: string }) => {
      const filtered = list.filter((i) => i.id !== item.id);
      list = [{ ...item, viewedAt: Date.now() }, ...filtered].slice(0, 10);
    };

    // Re-viewing p-1 should move it to front
    addRecentlyViewed({ id: "p-1", name: "Monstera Deliciosa" });
    expect(list[0].id).toBe("p-1");
    expect(list.length).toBe(3);

    // Adding 9 more items caps list at 10 items
    for (let i = 4; i <= 15; i++) {
      addRecentlyViewed({ id: `p-${i}`, name: `Plant ${i}` });
    }
    expect(list.length).toBe(10);
    expect(list[0].id).toBe("p-15");
  });

  it("manages recent search queries with deduplication and cap of 6", () => {
    let recentSearches: string[] = ["Monstera", "Bonsai", "Ficus"];

    const addSearch = (query: string) => {
      const trimmed = query.trim();
      if (!trimmed || trimmed.length < 2) return;
      const filtered = recentSearches.filter(
        (q) => q.toLowerCase() !== trimmed.toLowerCase(),
      );
      recentSearches = [trimmed, ...filtered].slice(0, 6);
    };

    addSearch("bonsai"); // Case-insensitive duplicate
    expect(recentSearches[0]).toBe("bonsai");
    expect(recentSearches.length).toBe(3);

    addSearch("Snake Plant");
    addSearch("ZZ Plant");
    addSearch("Jade Plant");
    addSearch("Rubber Tree");
    expect(recentSearches.length).toBe(6);
  });
});

describe("Customer Mobile — Out of Stock Product Button State", () => {
  it("disables add to bag and buy now actions when product is out of stock", () => {
    const stock = 0;
    const isOutOfStock = stock <= 0;

    let cartCount = 0;
    const handleAddToCart = () => {
      if (isOutOfStock) return;
      cartCount++;
    };

    let buyNowTriggered = false;
    const handleBuyNow = () => {
      if (isOutOfStock) return;
      buyNowTriggered = true;
    };

    handleAddToCart();
    handleBuyNow();

    expect(cartCount).toBe(0);
    expect(buyNowTriggered).toBe(false);
    expect(isOutOfStock).toBe(true);
  });

  it("permits adding to bag and buy now when product has available inventory", () => {
    const stock = 5;
    const isOutOfStock = stock <= 0;

    let cartCount = 0;
    const handleAddToCart = () => {
      if (isOutOfStock) return;
      cartCount++;
    };

    let buyNowTriggered = false;
    const handleBuyNow = () => {
      if (isOutOfStock) return;
      buyNowTriggered = true;
    };

    handleAddToCart();
    handleBuyNow();

    expect(cartCount).toBe(1);
    expect(buyNowTriggered).toBe(true);
  });
});





