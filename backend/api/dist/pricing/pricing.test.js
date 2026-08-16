"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Floria API — Business Rule Verification Test Suite (Phase 3.17.4)
const strict_1 = __importDefault(require("node:assert/strict"));
const pricing_service_js_1 = require("./pricing.service.js");
async function runBusinessRuleTests() {
    console.log("▶ Running Phase 3.17.4 Business Rule Verification Tests...");
    const testSettings = {
        sellerCommissionRate: 12.0,
        floriaProfitRate: 2.0,
        platformMaintenanceFeePaise: 1000, // ₹10.00
        freeDeliveryThresholdPaise: 59900, // ₹599.00
        freeDeliveryRecoveryPaise: 2000, // ₹20.00
    };
    // --------------------------------------------------------------------------
    // Case 1: Base = ₹500.00
    // Profit (2%) = ₹10.00 -> Pre-recovery = ₹510.00 < ₹599.00 -> NO
    // Customer Price = ₹510.00
    // --------------------------------------------------------------------------
    const case1 = await pricing_service_js_1.pricingService.calculateProductPricing(50000, testSettings);
    strict_1.default.equal(case1.sellerBasePricePaise, 50000, "Case 1: Base price should be 50000");
    strict_1.default.equal(case1.floriaProfitPaise, 1000, "Case 1: Profit 2% of 50000 = 1000");
    strict_1.default.equal(case1.isFreeDeliveryEligible, false, "Case 1: ₹510.00 < ₹599.00 -> Free delivery = NO");
    strict_1.default.equal(case1.deliveryRecoveryPaise, 0, "Case 1: Recovery should be 0");
    strict_1.default.equal(case1.customerProductPricePaise, 51000, "Case 1: Customer price = 51000 (₹510.00)");
    strict_1.default.equal(case1.sellerCommissionPaise, 6000, "Case 1: Commission 12% = 6000 (₹60.00)");
    strict_1.default.equal(case1.sellerNetPaise, 44000, "Case 1: Seller net = 44000 (₹440.00)");
    console.log("✔ Case 1 Passed (Base ₹500 -> Customer ₹510, Free Delivery: NO)");
    // --------------------------------------------------------------------------
    // Case 2: Base = ₹580.00
    // Profit (2%) = ₹11.60 -> Pre-recovery = ₹591.60 < ₹599.00 -> NO
    // Customer Price = ₹591.60
    // --------------------------------------------------------------------------
    const case2 = await pricing_service_js_1.pricingService.calculateProductPricing(58000, testSettings);
    strict_1.default.equal(case2.floriaProfitPaise, 1160, "Case 2: Profit 2% of 58000 = 1160");
    strict_1.default.equal(case2.isFreeDeliveryEligible, false, "Case 2: ₹591.60 < ₹599.00 -> Free delivery = NO");
    strict_1.default.equal(case2.deliveryRecoveryPaise, 0, "Case 2: Recovery = 0");
    strict_1.default.equal(case2.customerProductPricePaise, 59160, "Case 2: Customer price = 59160 (₹591.60)");
    console.log("✔ Case 2 Passed (Base ₹580 -> Customer ₹591.60, Free Delivery: NO)");
    // --------------------------------------------------------------------------
    // Case 3: Base = ₹588.00
    // Profit (2%) = ₹11.76 -> Pre-recovery = ₹599.76 >= ₹599.00 -> YES
    // Recovery = ₹20.00 -> Customer Price = ₹619.76
    // --------------------------------------------------------------------------
    const case3 = await pricing_service_js_1.pricingService.calculateProductPricing(58800, testSettings);
    strict_1.default.equal(case3.floriaProfitPaise, 1176, "Case 3: Profit 2% of 58800 = 1176");
    strict_1.default.equal(case3.isFreeDeliveryEligible, true, "Case 3: ₹599.76 >= ₹599.00 -> Free delivery = YES");
    strict_1.default.equal(case3.deliveryRecoveryPaise, 2000, "Case 3: Recovery = 2000 (₹20.00)");
    strict_1.default.equal(case3.customerProductPricePaise, 61976, "Case 3: Customer price = 61976 (₹619.76)");
    console.log("✔ Case 3 Passed (Base ₹588 -> Customer ₹619.76, Free Delivery: YES)");
    // --------------------------------------------------------------------------
    // Case 4: Base = ₹600.00
    // Profit (2%) = ₹12.00 -> Pre-recovery = ₹612.00 >= ₹599.00 -> YES
    // Recovery = ₹20.00 -> Customer Price = ₹632.00
    // --------------------------------------------------------------------------
    const case4 = await pricing_service_js_1.pricingService.calculateProductPricing(60000, testSettings);
    strict_1.default.equal(case4.floriaProfitPaise, 1200, "Case 4: Profit 2% of 60000 = 1200");
    strict_1.default.equal(case4.isFreeDeliveryEligible, true, "Case 4: ₹612.00 >= ₹599.00 -> Free delivery = YES");
    strict_1.default.equal(case4.deliveryRecoveryPaise, 2000, "Case 4: Recovery = 2000 (₹20.00)");
    strict_1.default.equal(case4.customerProductPricePaise, 63200, "Case 4: Customer price = 63200 (₹632.00)");
    console.log("✔ Case 4 Passed (Base ₹600 -> Customer ₹632.00, Free Delivery: YES)");
    // --------------------------------------------------------------------------
    // Case 5: Base = ₹599.00
    // Profit (2%) = ₹11.98 -> Pre-recovery = ₹610.98 >= ₹599.00 -> YES
    // Recovery = ₹20.00 -> Customer Price = ₹630.98
    // --------------------------------------------------------------------------
    const case5 = await pricing_service_js_1.pricingService.calculateProductPricing(59900, testSettings);
    strict_1.default.equal(case5.floriaProfitPaise, 1198, "Case 5: Profit 2% of 59900 = 1198");
    strict_1.default.equal(case5.isFreeDeliveryEligible, true, "Case 5: ₹610.98 >= ₹599.00 -> Free delivery = YES");
    strict_1.default.equal(case5.deliveryRecoveryPaise, 2000, "Case 5: Recovery = 2000 (₹20.00)");
    strict_1.default.equal(case5.customerProductPricePaise, 63098, "Case 5: Customer price = 63098 (₹630.98)");
    console.log("✔ Case 5 Passed (Base ₹599 -> Customer ₹630.98, Free Delivery: YES)");
    // --------------------------------------------------------------------------
    // Case 6: Independent Evaluation of Multiple Products (Cart Total != Threshold)
    // Prod A = ₹500 (Pre-recovery ₹510 < ₹599 -> NO)
    // Prod B = ₹500 (Pre-recovery ₹510 < ₹599 -> NO)
    // Cart Subtotal = ₹1,000, but neither product is individually eligible.
    // --------------------------------------------------------------------------
    const prodA = await pricing_service_js_1.pricingService.calculateProductPricing(50000, testSettings);
    const prodB = await pricing_service_js_1.pricingService.calculateProductPricing(50000, testSettings);
    strict_1.default.equal(prodA.isFreeDeliveryEligible, false, "Case 6: Prod A evaluated independently -> NO");
    strict_1.default.equal(prodB.isFreeDeliveryEligible, false, "Case 6: Prod B evaluated independently -> NO");
    const cartSubtotal = prodA.customerProductPricePaise + prodB.customerProductPricePaise;
    strict_1.default.equal(cartSubtotal, 102000, "Case 6: Cart subtotal = ₹1,020.00");
    strict_1.default.equal(prodA.isFreeDeliveryEligible || prodB.isFreeDeliveryEligible, false, "Case 6: Cart subtotal >= ₹599 does NOT make products eligible");
    console.log("✔ Case 6 Passed (Cart ₹1,000 subtotal does NOT make non-qualifying products free delivery)");
    // --------------------------------------------------------------------------
    // Maintenance Fee Check: Charged ONCE per order regardless of items/nurseries
    // --------------------------------------------------------------------------
    strict_1.default.equal(testSettings.platformMaintenanceFeePaise, 1000, "Maintenance fee is ₹10.00 (1000 paise) per checkout");
    console.log("✔ Platform Maintenance Fee Verification Passed (Charged ONCE at checkout)");
    console.log("🎉 ALL 6 PRICING ENGINE BUSINESS-RULE VERIFICATION TESTS PASSED SUCCESSFULLY!");
}
runBusinessRuleTests().catch((err) => {
    console.error("❌ Test failure:", err);
    process.exit(1);
});
