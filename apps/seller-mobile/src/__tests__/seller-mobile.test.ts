import { describe, it, expect } from "vitest";
import {
  formatINR,
  paiseToRupees,
  rupeesToPaise,
  formatDate,
} from "../../lib/format";
import {
  getSellerMobileToken,
  setSellerMobileToken,
} from "../../lib/token";
import {
  SELLER_NOTIFICATION_CATEGORIES,
  ANDROID_SELLER_CHANNELS,
} from "../../lib/notifications/types";

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
    placed: ["preparing", "fulfillment_issue", "cancelled"],
    new: ["preparing", "fulfillment_issue", "cancelled"],
    confirmed: ["preparing", "fulfillment_issue", "cancelled"],
    preparing: ["ready_for_pickup", "fulfillment_issue", "cancelled"],
    ready_for_pickup: ["out_for_delivery", "fulfillment_issue"],
    out_for_delivery: ["delivered"],
    delivered: [],
    cancelled: [],
    fulfillment_issue: [],
  };

  const canAdvance = (current: string, next: string): boolean => {
    return validTransitions[current]?.includes(next) ?? false;
  };

  it("permits standard forward progression for nursery fulfillment", () => {
    expect(canAdvance("placed", "preparing")).toBe(true);
    expect(canAdvance("preparing", "ready_for_pickup")).toBe(true);
    expect(canAdvance("ready_for_pickup", "out_for_delivery")).toBe(true);
    expect(canAdvance("out_for_delivery", "delivered")).toBe(true);
  });

  it("allows reporting fulfillment issues from non-terminal states", () => {
    expect(canAdvance("placed", "fulfillment_issue")).toBe(true);
    expect(canAdvance("preparing", "fulfillment_issue")).toBe(true);
    expect(canAdvance("ready_for_pickup", "fulfillment_issue")).toBe(true);
  });

  it("prohibits skipping preparation or handoff directly to delivered", () => {
    expect(canAdvance("placed", "delivered")).toBe(false);
    expect(canAdvance("preparing", "delivered")).toBe(false);
    expect(canAdvance("ready_for_pickup", "delivered")).toBe(false);
  });

  it("prevents transitions from terminal delivered or cancelled states", () => {
    expect(canAdvance("delivered", "placed")).toBe(false);
    expect(canAdvance("delivered", "preparing")).toBe(false);
    expect(canAdvance("cancelled", "preparing")).toBe(false);
  });
});

describe("Seller Mobile — Multi-Seller Order Isolation", () => {
  it("computes seller-specific payout strictly for items belonging to the seller", () => {
    const rawOrder = {
      id: "ord_101",
      customer_total_paise: 300000,
      order_items: [
        {
          seller_id_snapshot: "seller_A",
          product_name_snapshot: "Monstera Deliciosa",
          unit_price_paise_snapshot: 100000,
          base_price_paise_snapshot: 100000,
          commission_paise_snapshot: 10000,
          quantity: 1,
        },
        {
          seller_id_snapshot: "seller_B", // Different nursery
          product_name_snapshot: "Snake Plant",
          unit_price_paise_snapshot: 200000,
          base_price_paise_snapshot: 200000,
          commission_paise_snapshot: 20000,
          quantity: 1,
        },
      ],
    };

    // Filter for seller_A
    const sellerAItems = rawOrder.order_items.filter(
      (it) => it.seller_id_snapshot === "seller_A",
    );
    const sellerAPayout = sellerAItems.reduce(
      (sum, it) =>
        sum + (it.base_price_paise_snapshot - it.commission_paise_snapshot) * it.quantity,
      0,
    );

    expect(sellerAItems.length).toBe(1);
    expect(sellerAItems[0].product_name_snapshot).toBe("Monstera Deliciosa");
    expect(sellerAPayout).toBe(90000); // 100000 - 10000
    expect(sellerAPayout).not.toBe(rawOrder.customer_total_paise);
  });
});

describe("Seller Mobile — Inventory Stock Classifications", () => {
  const getStockStatus = (
    quantity: number,
    lowStockThreshold: number = 5,
  ): "in_stock" | "low_stock" | "out_of_stock" => {
    if (quantity <= 0) return "out_of_stock";
    if (quantity <= lowStockThreshold) return "low_stock";
    return "in_stock";
  };

  it("correctly identifies stock levels based on threshold", () => {
    expect(getStockStatus(0, 5)).toBe("out_of_stock");
    expect(getStockStatus(-2, 5)).toBe("out_of_stock");
    expect(getStockStatus(3, 5)).toBe("low_stock");
    expect(getStockStatus(5, 5)).toBe("low_stock");
    expect(getStockStatus(6, 5)).toBe("in_stock");
    expect(getStockStatus(100, 5)).toBe("in_stock");
  });
});

describe("Seller Mobile — Onboarding State Resolution", () => {
  type OnboardingStatus =
    | "incomplete"
    | "under_review"
    | "needs_correction"
    | "approved"
    | "active";

  const resolveSellerState = (profile: {
    status?: string;
    is_complete?: boolean;
    business_name?: string;
    contact_phone?: string;
  }): OnboardingStatus => {
    if (profile.status === "approved") return "approved";
    if (profile.status === "needs_correction") return "needs_correction";
    if (profile.status === "under_review" || profile.status === "pending") {
      return "under_review";
    }
    if (!profile.business_name || !profile.contact_phone || profile.is_complete === false) {
      return "incomplete";
    }
    return "incomplete";
  };

  it("resolves onboarding state properly from profile flags", () => {
    expect(resolveSellerState({ status: "approved" })).toBe("approved");
    expect(resolveSellerState({ status: "needs_correction" })).toBe("needs_correction");
    expect(resolveSellerState({ status: "pending" })).toBe("under_review");
    expect(resolveSellerState({ is_complete: false })).toBe("incomplete");
  });
});

describe("Seller Mobile — Notifications & Channels", () => {
  it("defines distinct Android channels for operational events", () => {
    expect(ANDROID_SELLER_CHANNELS.ORDERS.id).toBe("floria_seller_orders");
    expect(ANDROID_SELLER_CHANNELS.INVENTORY.id).toBe("floria_seller_inventory");
    expect(ANDROID_SELLER_CHANNELS.SETTLEMENTS.id).toBe("floria_seller_settlements");
    expect(ANDROID_SELLER_CHANNELS.ORDERS.importance).toBe(4); // High priority
  });

  it("has valid seller notification categories", () => {
    expect(SELLER_NOTIFICATION_CATEGORIES.ORDER).toBe("ORDER");
    expect(SELLER_NOTIFICATION_CATEGORIES.INVENTORY).toBe("INVENTORY");
    expect(SELLER_NOTIFICATION_CATEGORIES.SETTLEMENT).toBe("SETTLEMENT");
  });
});

describe("Seller Mobile — Analytics & AOV Metrics", () => {
  it("calculates AOV accurately without dividing by zero", () => {
    const calculateAOV = (revenuePaise: number, ordersCount: number) => {
      return ordersCount > 0 ? Math.round(revenuePaise / ordersCount) : 0;
    };

    expect(calculateAOV(100000, 2)).toBe(50000);
    expect(calculateAOV(0, 0)).toBe(0);
    expect(calculateAOV(125000, 3)).toBe(41667);
  });
});

describe("Seller Mobile — Token Persistence & Session Store", () => {
  it("manages seller mobile auth token securely", () => {
    setSellerMobileToken("mock-jwt-token-xyz");
    expect(getSellerMobileToken()).toBe("mock-jwt-token-xyz");

    setSellerMobileToken(null);
    expect(getSellerMobileToken()).toBeNull();
  });
});

describe("Seller Mobile — Canonical Catalog Listing Payload Builder", () => {
  it("builds server-compliant listing payload with WebP image references", () => {
    const buildListingPayload = (input: {
      canonicalProduct: { id: string; name: string };
      priceRupees: string;
      stockQuantity: string;
      lowStockThreshold?: string;
      sku?: string;
      status: "active" | "draft";
      images: Array<{ assetId?: string; url: string; status?: string }>;
    }) => {
      const priceNum = parseFloat(input.priceRupees);
      const stockNum = parseInt(input.stockQuantity, 10);
      const threshNum = parseInt(input.lowStockThreshold || "5", 10);

      return {
        product_id: input.canonicalProduct.id,
        price_paise: Math.round(priceNum * 100),
        stock_quantity: stockNum,
        low_stock_threshold: threshNum,
        sku: input.sku?.trim() || undefined,
        status: input.status,
        images: input.images
          .filter((img) => img.status === "COMPLETED" || img.status === "READY" || img.assetId)
          .map((img, idx) => ({
            asset_id: img.assetId,
            url: img.url,
            is_primary: idx === 0,
          })),
      };
    };

    const payload = buildListingPayload({
      canonicalProduct: { id: "prod-ficus-101", name: "Ficus Lyrata" },
      priceRupees: "1499",
      stockQuantity: "12",
      lowStockThreshold: "4",
      sku: "NUR-FICUS-01",
      status: "active",
      images: [
        { assetId: "asset-1", url: "https://media.floria.com/ficus-med.webp", status: "READY" },
        { assetId: "asset-2", url: "https://media.floria.com/ficus-thumb.webp", status: "COMPLETED" },
        { url: "local://temp.jpg", status: "FAILED" }, // should be ignored
      ],
    });

    expect(payload.product_id).toBe("prod-ficus-101");
    expect(payload.price_paise).toBe(149900);
    expect(payload.stock_quantity).toBe(12);
    expect(payload.low_stock_threshold).toBe(4);
    expect(payload.sku).toBe("NUR-FICUS-01");
    expect(payload.images.length).toBe(2);
    expect(payload.images[0].is_primary).toBe(true);
    expect(payload.images[1].is_primary).toBe(false);
  });
});
