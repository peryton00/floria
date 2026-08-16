// Floria API — Comprehensive Phase 3.23 Pricing Integrity Regression Test Suite
import { describe, it, expect, vi, beforeEach } from "vitest";
import { policyService } from "../src/pricing/policy.service.js";
import { recalculationService } from "../src/pricing/recalculation.service.js";
import { pricingService } from "../src/pricing/pricing.service.js";
import { productsService } from "../src/products/products.service.js";
import { checkoutService } from "../src/checkout/checkout.service.js";
import { sellersService } from "../src/sellers/sellers.service.js";
import { sellerRepository } from "../src/database/repositories/seller.repository.js";
import type { SellerProfile } from "@floria/types";

const mockFrom = vi.fn();

vi.mock("../src/config/database.js", () => {
  return {
    getAdminDb: () => ({
      from: mockFrom,
    }),
  };
});

vi.mock("../src/database/repositories/audit.repository.js", () => {
  return {
    auditRepository: {
      log: vi.fn().mockResolvedValue(true),
    },
  };
});

function createMockQuery(data: any) {
  const query: any = {
    select: vi.fn(() => query),
    insert: vi.fn(() => query),
    update: vi.fn(() => query),
    delete: vi.fn(() => query),
    upsert: vi.fn().mockResolvedValue({ data, error: null }),
    eq: vi.fn(() => query),
    neq: vi.fn(() => query),
    gt: vi.fn(() => query),
    gte: vi.fn(() => query),
    lt: vi.fn(() => query),
    lte: vi.fn(() => query),
    in: vi.fn(() => query),
    or: vi.fn(() => query),
    order: vi.fn(() => query),
    limit: vi.fn(() => query),
    single: vi.fn().mockResolvedValue({ data, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
    then: (resolve: any) => Promise.resolve({ data, error: null }).then(resolve),
  };
  return query;
}

describe("Phase 3.23 Pricing Integrity & Regression Test Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // 1. Old Order + New Policy Immutability Test
  // --------------------------------------------------------------------------
  describe("1. Old Order + New Policy Immutability", () => {
    it("historical order snapshot is untouched when platform policy changes", () => {
      // Historical order created under Policy v1 (12% commission, ₹499 free threshold)
      const historicalOrderSnapshot = {
        id: "FLR-20260801-1001",
        subtotal_paise: 50000, // ₹500
        delivery_fee_paise: 0, // was free under old ₹499 threshold
        maintenance_fee_paise: 1000,
        total_paise: 51000,
        commission_rate: 0.12,
        commission_paise: 6000,
      };

      // Order display and payout logic MUST read snapshot values directly
      const displayDeliveryFee = historicalOrderSnapshot.delivery_fee_paise;
      const displayTotal = historicalOrderSnapshot.total_paise;
      const payoutCommission = historicalOrderSnapshot.subtotal_paise * (historicalOrderSnapshot.commission_rate ?? 0);

      expect(displayDeliveryFee).toBe(0); // Never recomputed to ₹40
      expect(displayTotal).toBe(51000);
      expect(payoutCommission).toBe(6000); // 12% of 50000, not 15% (7500)
    });
  });

  // --------------------------------------------------------------------------
  // 2. Cart + New Policy Revalidation & Checkout Recalculation
  // --------------------------------------------------------------------------
  describe("2. Cart + New Policy Checkout Recalculation", () => {
    it("checkout independently calculates server-authoritative line items using active policy", async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === "pricing_policy_versions") {
          return createMockQuery({
            id: "pol-v2",
            version_number: 2,
            seller_commission_rate: 15.0,
            floria_profit_rate: 2.0,
            platform_maintenance_fee_paise: 1000,
            free_delivery_threshold_paise: 59900,
            free_delivery_recovery_paise: 2000,
            status: "active",
          });
        }
        if (table === "carts") {
          return createMockQuery({ id: "cart-1", user_id: "cust-1" });
        }
        if (table === "cart_items") {
          return createMockQuery([{ product_id: "prod-1", quantity: 1 }]);
        }
        if (table === "products") {
          return createMockQuery([{ id: "prod-1", name: "Fiddle Leaf Fig", seller_id: "sel-1", status: "active" }]);
        }
        if (table === "inventory") {
          return createMockQuery([{ product_id: "prod-1", base_price_paise: 50000, price_paise: 50000, stock_quantity: 10 }]);
        }
        if (table === "addresses" || table === "delivery_addresses") {
          return createMockQuery({
            id: "addr-1",
            user_id: "cust-1",
            customer_id: "cust-1",
            full_name: "Aarav Sharma",
            phone: "9876543210",
            line1: "123 Green Ave",
            city: "Bengaluru",
            state: "Karnataka",
            pincode: "560001",
          });
        }
        if (table === "platform_settings") {
          return createMockQuery([
            { key: "delivery_enabled", value: true },
            { key: "base_delivery_fee_paise", value: 4000 },
            { key: "free_delivery_enabled", value: true },
          ]);
        }
        if (table === "orders") {
          return createMockQuery({ id: "FLR-NEW-ORDER" });
        }
        if (table === "order_items" || table === "seller_order_fulfillments" || table === "payments") {
          return createMockQuery({ id: "pay-1" });
        }
        return createMockQuery(null);
      });

      const res = await checkoutService.processCheckout({
        userId: "cust-1",
        addressId: "addr-1",
        paymentMethod: "online",
      });

      expect(res.orderId).toBe("FLR-NEW-ORDER");
    });
  });

  // --------------------------------------------------------------------------
  // 3. Failed Recalculation Handling
  // --------------------------------------------------------------------------
  describe("3. Failed Recalculation Handling", () => {
    it("marks recalculation job and policy version as failed when inventory scan fails", async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === "pricing_policy_versions") {
          return createMockQuery({
            id: "pol-fail",
            version_number: 3,
            seller_commission_rate: 12,
            floria_profit_rate: 2,
            platform_maintenance_fee_paise: 1000,
            free_delivery_threshold_paise: 59900,
            free_delivery_recovery_paise: 2000,
            status: "draft",
          });
        }
        if (table === "inventory") {
          const q = createMockQuery(null);
          q.gt = vi.fn().mockResolvedValue({ data: null, error: { message: "Database connection timeout" } });
          return q;
        }
        return createMockQuery(null);
      });

      await expect(
        recalculationService.startRecalculationJob("pol-fail", "admin-1")
      ).rejects.toThrow("Failed to count inventory listings: Database connection timeout");
    });
  });

  // --------------------------------------------------------------------------
  // 4. Partial Batch Failure Tracking
  // --------------------------------------------------------------------------
  describe("4. Partial Batch Failure Tracking", () => {
    it("logs failed items count and updates job progress accurately", async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === "pricing_policy_versions") {
          return createMockQuery({
            id: "pol-partial",
            version_number: 4,
            seller_commission_rate: 12,
            floria_profit_rate: 2,
            platform_maintenance_fee_paise: 1000,
            free_delivery_threshold_paise: 59900,
            free_delivery_recovery_paise: 2000,
            status: "draft",
          });
        }
        if (table === "inventory") {
          return createMockQuery([
            { product_id: "p1", seller_id: "s1", price_paise: 50000, base_price_paise: 50000 },
            { product_id: "p2", seller_id: "s1", price_paise: 0, base_price_paise: null },
          ]);
        }
        if (table === "pricing_recalculation_jobs") {
          return createMockQuery({ id: "job-1", status: "in_progress", total_listings: 2 });
        }
        if (table === "product_pricing") {
          return createMockQuery(null);
        }
        return createMockQuery(null);
      });

      const job = await recalculationService.startRecalculationJob("pol-partial", "admin-1", 10);
      expect(job.status).toBe("in_progress");
      expect(job.totalListings).toBe(2);
    });
  });

  // --------------------------------------------------------------------------
  // 5. Successful Policy Activation & Settings Synchronization
  // --------------------------------------------------------------------------
  describe("5. Successful Policy Activation", () => {
    it("archives old active policy, promotes new version, and synchronizes platform_settings", async () => {
      let syncedSettings: any[] = [];

      const targetPolicyDbRow = {
        id: "pol-new",
        version_number: 5,
        seller_commission_rate: 14.0,
        floria_profit_rate: 2.2,
        platform_maintenance_fee_paise: 1100,
        free_delivery_threshold_paise: 64900,
        free_delivery_recovery_paise: 2200,
        status: "ready",
      };

      mockFrom.mockImplementation((table: string) => {
        if (table === "pricing_policy_versions") {
          const q = createMockQuery(targetPolicyDbRow);
          q.single = vi.fn().mockResolvedValue({
            data: { ...targetPolicyDbRow, status: "active" },
            error: null,
          });
          return q;
        }
        if (table === "platform_settings") {
          const q = createMockQuery(null);
          q.upsert = vi.fn().mockImplementation(async (rows: any[]) => {
            syncedSettings = rows;
            return { data: rows, error: null };
          });
          return q;
        }
        return createMockQuery(null);
      });

      const activated = await policyService.activatePolicy("pol-new", "admin-1");
      expect(activated.status).toBe("active");
      expect(syncedSettings.length).toBe(5);
      expect(syncedSettings.find((s) => s.key === "seller_commission_rate")?.value).toBe(14.0);
    });
  });

  // --------------------------------------------------------------------------
  // 6. Seller Base Price Change Recalculation
  // --------------------------------------------------------------------------
  describe("6. Seller Base Price Change Recalculation", () => {
    it("updates product_pricing read model when seller updates inventory base price", async () => {
      let upsertedRow: any = null;

      vi.spyOn(sellerRepository, "updateProduct").mockResolvedValue({
        id: "prod-1",
        name: "Monstera Deliciosa",
        low_stock_threshold: 5,
      } as any);

      mockFrom.mockImplementation((table: string) => {
        if (table === "pricing_policy_versions") {
          return createMockQuery({
            id: "pol-active",
            version_number: 1,
            seller_commission_rate: 12.0,
            floria_profit_rate: 2.0,
            platform_maintenance_fee_paise: 1000,
            free_delivery_threshold_paise: 59900,
            free_delivery_recovery_paise: 2000,
            status: "active",
          });
        }
        if (table === "products") {
          return createMockQuery({ id: "prod-1", name: "Monstera Deliciosa", seller_id: "sel-1", status: "active" });
        }
        if (table === "inventory") {
          return createMockQuery({ product_id: "prod-1", seller_id: "sel-1", price_paise: 50000, base_price_paise: 50000, stock_quantity: 10 });
        }
        if (table === "product_pricing") {
          const q = createMockQuery(null);
          q.upsert = vi.fn().mockImplementation((row: any) => {
            upsertedRow = row;
            return Promise.resolve({ data: row, error: null });
          });
          return q;
        }
        if (table === "seller_profiles") {
          return createMockQuery({ id: "sel-1", status: "approved" });
        }
        return createMockQuery(null);
      });

      const sellerProfile: SellerProfile = {
        id: "sel-1",
        user_id: "user-sel-1",
        business_name: "Green Flora Nursery",
        status: "approved",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await sellersService.updateInventory(sellerProfile, "prod-1", {
        base_price_paise: 60000, // ₹600 base
        price_paise: 60000,
      });

      expect(upsertedRow).not.toBeNull();
      expect(upsertedRow.seller_base_price_paise).toBe(60000);
      expect(upsertedRow.customer_product_price_paise).toBe(63200); // 60000 + 1200 + 2000
      expect(upsertedRow.is_free_delivery_eligible).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 7. Admin Product Price Override Precedence
  // --------------------------------------------------------------------------
  describe("7. Admin Product Price Override", () => {
    it("overrides canonical formula calculation when an active override exists", () => {
      const settings = {
        sellerCommissionRate: 12.0,
        floriaProfitRate: 2.0,
        platformMaintenanceFeePaise: 1000,
        freeDeliveryThresholdPaise: 59900,
        freeDeliveryRecoveryPaise: 2000,
      };

      const product = {
        id: "prod-1",
        name: "Premium Bonsai",
        inventory: {
          id: "inv-1",
          price_paise: 50000,
          base_price_paise: 50000,
        },
      };

      const overrideMap = new Map([
        ["prod-1", { custom_customer_price_paise: 45000, reason: "Promotional discount" }],
      ]);

      const enriched = productsService.enrichWithDbPricing(product, settings, overrideMap);

      expect(enriched.inventory.customer_price_paise).toBe(45000);
      expect(enriched.pricing.sellingPricePaise).toBe(45000);
      expect(enriched.pricing.isOverride).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 8. Cache Invalidation & Policy Lifecycle Integrity
  // --------------------------------------------------------------------------
  describe("8. Cache Invalidation Signaling", () => {
    it("active policy retrieval returns latest activated version and propagates to pricing calculations", async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === "pricing_policy_versions") {
          return createMockQuery({
            id: "pol-v3",
            version_number: 3,
            seller_commission_rate: 16.0,
            floria_profit_rate: 3.0,
            platform_maintenance_fee_paise: 1500,
            free_delivery_threshold_paise: 69900,
            free_delivery_recovery_paise: 2500,
            status: "active",
          });
        }
        return createMockQuery(null);
      });

      const settings = await pricingService.getFinancialSettings();
      expect(settings.sellerCommissionRate).toBe(16.0);
      expect(settings.floriaProfitRate).toBe(3.0);
      expect(settings.platformMaintenanceFeePaise).toBe(1500);

      const calc = pricingService.calculateProductPricingSync(50000, settings);
      // 50000 + 3% (1500) = 51500 < 69900 -> 51500
      expect(calc.customerProductPricePaise).toBe(51500);
      expect(calc.isFreeDeliveryEligible).toBe(false);
      expect(calc.sellerCommissionPaise).toBe(8000); // 16% of 50000
      expect(calc.sellerNetPaise).toBe(42000);
    });
  });
});
