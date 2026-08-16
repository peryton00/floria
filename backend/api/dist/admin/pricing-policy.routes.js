"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Floria API — Pricing Policy Admin Routes
const express_1 = require("express");
const pricing_policy_controller_js_1 = require("./pricing-policy.controller.js");
const validation_js_1 = require("../middleware/validation.js");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const uuidParamSchema = {
    params: zod_1.z.object({
        id: zod_1.z.string().uuid("Invalid Policy ID format"),
    }),
};
const createPolicySchema = {
    body: zod_1.z.object({
        sellerCommissionRate: zod_1.z.number().min(0).max(50),
        floriaProfitRate: zod_1.z.number().min(0).max(50),
        platformMaintenanceFeePaise: zod_1.z.number().min(0),
        freeDeliveryThresholdPaise: zod_1.z.number().min(0),
        freeDeliveryRecoveryPaise: zod_1.z.number().min(0),
        notes: zod_1.z.string().optional(),
    }),
};
const overrideSchema = {
    body: zod_1.z.object({
        productId: zod_1.z.string().uuid("Invalid Product ID format"),
        customCustomerPricePaise: zod_1.z.number().min(1),
        reason: zod_1.z.string().min(1, "Reason is required"),
    }),
};
// Policies lifecycle
router.get("/", pricing_policy_controller_js_1.pricingPolicyController.listPolicies);
router.get("/active", pricing_policy_controller_js_1.pricingPolicyController.getActivePolicy);
router.get("/:id", (0, validation_js_1.validateRequest)(uuidParamSchema), pricing_policy_controller_js_1.pricingPolicyController.getPolicyById);
router.post("/", (0, validation_js_1.validateRequest)(createPolicySchema), pricing_policy_controller_js_1.pricingPolicyController.createDraftPolicy);
router.get("/:id/preview", (0, validation_js_1.validateRequest)(uuidParamSchema), pricing_policy_controller_js_1.pricingPolicyController.previewPolicyImpact);
router.post("/:id/recalculate", (0, validation_js_1.validateRequest)(uuidParamSchema), pricing_policy_controller_js_1.pricingPolicyController.startRecalculation);
router.get("/:id/recalculation-status", (0, validation_js_1.validateRequest)(uuidParamSchema), pricing_policy_controller_js_1.pricingPolicyController.getRecalculationStatus);
router.post("/:id/activate", (0, validation_js_1.validateRequest)(uuidParamSchema), pricing_policy_controller_js_1.pricingPolicyController.activatePolicy);
// Overrides
router.post("/overrides", (0, validation_js_1.validateRequest)(overrideSchema), pricing_policy_controller_js_1.pricingPolicyController.setProductOverride);
router.delete("/overrides/:productId", pricing_policy_controller_js_1.pricingPolicyController.removeProductOverride);
exports.default = router;
