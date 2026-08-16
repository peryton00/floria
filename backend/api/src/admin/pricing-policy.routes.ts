// Floria API — Pricing Policy Admin Routes
import { Router } from "express";
import { pricingPolicyController } from "./pricing-policy.controller.js";
import { validateRequest } from "../middleware/validation.js";
import { z } from "zod";

const router = Router();

const uuidParamSchema = {
  params: z.object({
    id: z.string().uuid("Invalid Policy ID format"),
  }),
};

const createPolicySchema = {
  body: z.object({
    sellerCommissionRate: z.number().min(0).max(50),
    floriaProfitRate: z.number().min(0).max(50),
    platformMaintenanceFeePaise: z.number().min(0),
    freeDeliveryThresholdPaise: z.number().min(0),
    freeDeliveryRecoveryPaise: z.number().min(0),
    notes: z.string().optional(),
  }),
};

const overrideSchema = {
  body: z.object({
    productId: z.string().uuid("Invalid Product ID format"),
    customCustomerPricePaise: z.number().min(1),
    reason: z.string().min(1, "Reason is required"),
  }),
};

// Policies lifecycle
router.get("/", pricingPolicyController.listPolicies);
router.get("/active", pricingPolicyController.getActivePolicy);
router.get("/:id", validateRequest(uuidParamSchema), pricingPolicyController.getPolicyById);
router.post("/", validateRequest(createPolicySchema), pricingPolicyController.createDraftPolicy);
router.get("/:id/preview", validateRequest(uuidParamSchema), pricingPolicyController.previewPolicyImpact);
router.post("/:id/recalculate", validateRequest(uuidParamSchema), pricingPolicyController.startRecalculation);
router.get("/:id/recalculation-status", validateRequest(uuidParamSchema), pricingPolicyController.getRecalculationStatus);
router.post("/:id/activate", validateRequest(uuidParamSchema), pricingPolicyController.activatePolicy);

// Overrides
router.post("/overrides", validateRequest(overrideSchema), pricingPolicyController.setProductOverride);
router.delete("/overrides/:productId", pricingPolicyController.removeProductOverride);

export default router;
