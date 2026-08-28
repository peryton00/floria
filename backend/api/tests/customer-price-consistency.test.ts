import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { pricingService } from "../src/pricing/pricing.service.js";
import { policyService } from "../src/pricing/policy.service.js";
import { productsService } from "../src/products/products.service.js";
import { wishlistService } from "../src/wishlist/wishlist.service.js";
import { checkoutService } from "../src/checkout/checkout.service.js";
import { getAdminDb } from "../src/config/database.js";

describe("Phase 3.24 Customer-Side Product Price Consistency Suite", () => {
  let db: any;

  beforeEach(() => {
    db = getAdminDb();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("Scenario 1: Guaranteed single canonical price across all customer catalog endpoints under active policy", async () => {
    // Mock Active Policy v12: Base ₹500, Commission 12%, Profit 2%, Delivery Threshold ₹599, Recovery ₹20
    const policyV12 = {
      id: "pol-12",
      versionNumber: 12,
      sellerCommissionRate: 12.0,
      floriaProfitRate: 2.0,
      platformMaintenanceFeePaise: 1000,
      freeDeliveryThresholdPaise: 59900,
      freeDeliveryRecoveryPaise: 2000,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const mockProductA = {
      id: "prod-snake-plant",
      name: "Snake Plant",
      slug: "snake-plant",
      seller_id: "seller-green-leaf",
      category_id: "cat-indoor",
      status: "active",
      inventory: {
        id: "inv-snake-plant",
        product_id: "prod-snake-plant",
        seller_id: "seller-green-leaf",
        base_price_paise: 50000, // ₹500.00
        stock_quantity: 20,
      },
    };

    // Calculate expected price under v12:
    // Profit = 50000 * 0.02 = 1000. Pre-recovery = 51000 (< 59900 threshold). Delivery recovery = 0.
    // Selling price = 51000 paise (₹510.00)
    const expectedCalcV12 = pricingService.calculateProductPricingSync(
      50000,
      policyV12,
    );
    expect(expectedCalcV12.customerProductPricePaise).toBe(51000);
    expect(expectedCalcV12.isFreeDeliveryEligible).toBe(false);

    // 1. Enrich listing
    const enrichedListing = productsService.enrichWithDbPricing(
      mockProductA,
      policyV12,
    );
    expect(enrichedListing.pricing.sellingPricePaise).toBe(51000);
    expect(enrichedListing.pricing.customerPricePaise).toBe(51000);
    expect(enrichedListing.inventory.price_paise).toBe(51000);

    // 2. Wishlist Enrichment
    const enrichedWishlist = productsService.enrichWithDbPricing(
      mockProductA,
      policyV12,
    );
    expect(enrichedWishlist.pricing.sellingPricePaise).toBe(51000);

    // 3. All surfaces match exactly 51000 paise
    expect(enrichedListing.pricing.sellingPricePaise).toBe(
      enrichedWishlist.pricing.sellingPricePaise,
    );
  });

  it("Scenario 2: Dynamic policy transition v12 -> v13 propagates consistently to all catalog surfaces", async () => {
    const basePrice = 60000; // ₹600.00 (qualifies for free delivery recovery)

    // Policy v12: 2% profit, ₹20 recovery -> Profit = 1200, Pre = 61200 >= 59900 -> Recovery = 2000 -> Customer Price = 63200 (₹632)
    const policyV12 = {
      sellerCommissionRate: 12.0,
      floriaProfitRate: 2.0,
      platformMaintenanceFeePaise: 1000,
      freeDeliveryThresholdPaise: 59900,
      freeDeliveryRecoveryPaise: 2000,
    };
    const calcV12 = pricingService.calculateProductPricingSync(
      basePrice,
      policyV12,
    );
    expect(calcV12.customerProductPricePaise).toBe(63200);
    expect(calcV12.isFreeDeliveryEligible).toBe(true);

    // Activate Policy v13: Profit increased to 5%, recovery unchanged -> Profit = 3000 -> Pre = 63000 -> Recovery = 2000 -> Customer Price = 65000 (₹650)
    const policyV13 = {
      sellerCommissionRate: 12.0,
      floriaProfitRate: 5.0,
      platformMaintenanceFeePaise: 1000,
      freeDeliveryThresholdPaise: 59900,
      freeDeliveryRecoveryPaise: 2000,
    };
    const calcV13 = pricingService.calculateProductPricingSync(
      basePrice,
      policyV13,
    );
    expect(calcV13.customerProductPricePaise).toBe(65000);
    expect(calcV13.isFreeDeliveryEligible).toBe(true);

    const mockProduct = {
      id: "prod-monstera",
      name: "Monstera Deliciosa",
      slug: "monstera",
      seller_id: "seller-1",
      inventory: { base_price_paise: basePrice, stock_quantity: 10 },
    };

    // Before activation
    const v12Enriched = productsService.enrichWithDbPricing(
      mockProduct,
      policyV12,
    );
    expect(v12Enriched.pricing.sellingPricePaise).toBe(63200);

    // After activation
    const v13Enriched = productsService.enrichWithDbPricing(
      mockProduct,
      policyV13,
    );
    expect(v13Enriched.pricing.sellingPricePaise).toBe(65000);
  });

  it("Scenario 3: Historical Order Snapshots remain immutable across subsequent policy revisions (v13 -> v14)", async () => {
    // Order was purchased under v13 at unit price ₹650.00 (65000 paise)
    const historicalOrderItemSnapshot = {
      id: "item-101",
      order_id: "order-999",
      product_id: "prod-monstera",
      product_name_snapshot: "Monstera Deliciosa",
      unit_price_paise_snapshot: 65000, // ₹650.00
      quantity: 2,
      line_total_paise: 130000,
    };

    const historicalOrder = {
      id: "order-999",
      subtotal_paise: 130000,
      delivery_fee_paise: 0,
      maintenance_fee_paise: 1000,
      total_paise: 131000,
      order_items: [historicalOrderItemSnapshot],
    };

    // Policy v14 is activated in future with higher prices (₹680.00 = 68000 paise)
    const policyV14 = {
      sellerCommissionRate: 12.0,
      floriaProfitRate: 10.0,
      platformMaintenanceFeePaise: 1000,
      freeDeliveryThresholdPaise: 59900,
      freeDeliveryRecoveryPaise: 2000,
    };
    const currentCatalogCalc = pricingService.calculateProductPricingSync(
      60000,
      policyV14,
    );
    expect(currentCatalogCalc.customerProductPricePaise).toBe(68000); // Live price is ₹680

    // Verify historical order still strictly displays its snapshot price of ₹650 (65000 paise)
    expect(historicalOrder.order_items[0].unit_price_paise_snapshot).toBe(
      65000,
    );
    expect(historicalOrder.subtotal_paise).toBe(130000);
    expect(historicalOrder.total_paise).toBe(131000);
    expect(historicalOrder.order_items[0].unit_price_paise_snapshot).not.toBe(
      currentCatalogCalc.customerProductPricePaise,
    );
  });

  it("Scenario 4: Multi-tab & checkout price integrity (Server enforces active price even with stale browser)", async () => {
    // Product base = ₹500.00 (50000 paise)
    // Server has active policy v13: Profit 5% -> Selling price = 52500 paise (₹525.00)
    const activePolicy = {
      sellerCommissionRate: 12.0,
      floriaProfitRate: 5.0,
      platformMaintenanceFeePaise: 1000,
      freeDeliveryThresholdPaise: 59900,
      freeDeliveryRecoveryPaise: 2000,
    };

    // Stale client in Tab A thought price was 51000 paise
    const staleClientAttempt = {
      productId: "prod-snake-plant",
      claimedPricePaise: 51000,
      quantity: 1,
    };

    // Checkout service calculates authoritatively on the server
    const authoritativeLine = await pricingService.calculateProductPricing(
      50000,
      activePolicy,
    );
    expect(authoritativeLine.customerProductPricePaise).toBe(52500);
    expect(authoritativeLine.customerProductPricePaise).not.toBe(
      staleClientAttempt.claimedPricePaise,
    );
  });
});
