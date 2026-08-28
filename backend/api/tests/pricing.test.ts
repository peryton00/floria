// Floria API — Business Rule Verification Test Suite (Phase 3.17.4 & Phase 3.23)
import { describe, it, expect } from "vitest";
import { pricingService } from "../src/pricing/pricing.service.js";

describe("Pricing Engine & Business Rule Verification Suite", () => {
  const testSettings = {
    sellerCommissionRate: 12.0,
    floriaProfitRate: 2.0,
    platformMaintenanceFeePaise: 1000, // ₹10.00
    freeDeliveryThresholdPaise: 59900, // ₹599.00
    freeDeliveryRecoveryPaise: 2000, // ₹20.00
  };

  it("Case 1: Base = ₹500.00 -> Pre-recovery ₹510.00 < ₹599.00 -> Not free delivery", async () => {
    const res = await pricingService.calculateProductPricing(
      50000,
      testSettings,
    );
    expect(res.sellerBasePricePaise).toBe(50000);
    expect(res.floriaProfitPaise).toBe(1000);
    expect(res.isFreeDeliveryEligible).toBe(false);
    expect(res.deliveryRecoveryPaise).toBe(0);
    expect(res.customerProductPricePaise).toBe(51000);
    expect(res.sellerCommissionPaise).toBe(6000);
    expect(res.sellerNetPaise).toBe(44000);
  });

  it("Case 2: Base = ₹580.00 -> Pre-recovery ₹591.60 < ₹599.00 -> Not free delivery", async () => {
    const res = await pricingService.calculateProductPricing(
      58000,
      testSettings,
    );
    expect(res.floriaProfitPaise).toBe(1160);
    expect(res.isFreeDeliveryEligible).toBe(false);
    expect(res.deliveryRecoveryPaise).toBe(0);
    expect(res.customerProductPricePaise).toBe(59160);
  });

  it("Case 3: Base = ₹588.00 -> Pre-recovery ₹599.76 >= ₹599.00 -> Free delivery eligible (+₹20 recovery)", async () => {
    const res = await pricingService.calculateProductPricing(
      58800,
      testSettings,
    );
    expect(res.floriaProfitPaise).toBe(1176);
    expect(res.isFreeDeliveryEligible).toBe(true);
    expect(res.deliveryRecoveryPaise).toBe(2000);
    expect(res.customerProductPricePaise).toBe(61976);
  });

  it("Case 4: Base = ₹600.00 -> Pre-recovery ₹612.00 >= ₹599.00 -> Free delivery eligible (+₹20 recovery)", async () => {
    const res = await pricingService.calculateProductPricing(
      60000,
      testSettings,
    );
    expect(res.floriaProfitPaise).toBe(1200);
    expect(res.isFreeDeliveryEligible).toBe(true);
    expect(res.deliveryRecoveryPaise).toBe(2000);
    expect(res.customerProductPricePaise).toBe(63200);
    expect(res.sellerCommissionPaise).toBe(7200);
    expect(res.sellerNetPaise).toBe(52800);
  });

  it("Case 5: Base = ₹599.00 -> Pre-recovery ₹610.98 >= ₹599.00 -> Free delivery eligible (+₹20 recovery)", async () => {
    const res = await pricingService.calculateProductPricing(
      59900,
      testSettings,
    );
    expect(res.floriaProfitPaise).toBe(1198);
    expect(res.isFreeDeliveryEligible).toBe(true);
    expect(res.deliveryRecoveryPaise).toBe(2000);
    expect(res.customerProductPricePaise).toBe(63098);
  });

  it("Case 6: Dynamic settings override (e.g. 15% commission, 3% profit, ₹25 recovery)", async () => {
    const customSettings = {
      sellerCommissionRate: 15.0,
      floriaProfitRate: 3.0,
      platformMaintenanceFeePaise: 1500,
      freeDeliveryThresholdPaise: 69900,
      freeDeliveryRecoveryPaise: 2500,
    };
    const res = await pricingService.calculateProductPricing(
      60000,
      customSettings,
    );
    expect(res.floriaProfitPaise).toBe(1800);
    expect(res.isFreeDeliveryEligible).toBe(false); // 61800 < 69900
    expect(res.deliveryRecoveryPaise).toBe(0);
    expect(res.customerProductPricePaise).toBe(61800);
    expect(res.sellerCommissionPaise).toBe(9000);
    expect(res.sellerNetPaise).toBe(51000);
  });
});
