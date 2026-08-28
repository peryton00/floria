// Floria API — Seller Fulfillment Routes
import { Router } from "express";
import { fulfillmentController } from "./fulfillment.controller.js";
import { authenticateToken } from "../middleware/auth.js";
import { requireApprovedSeller } from "../middleware/authorization.js";
import { sellerFulfillmentRateLimiter } from "../middleware/rateLimit.js";
import { validateRequest } from "../middleware/validation.js";
import { z } from "zod";

const router = Router();

const fulfillmentSchema = {
  body: z.object({
    masterOrderId: z.string().uuid("Invalid master order ID"),
    newStatus: z.string().min(1, "newStatus is required"),
  }),
};

router.get(
  "/",
  authenticateToken,
  requireApprovedSeller,
  fulfillmentController.getMyFulfillments,
);

router.post(
  "/",
  authenticateToken,
  requireApprovedSeller,
  sellerFulfillmentRateLimiter,
  validateRequest(fulfillmentSchema),
  fulfillmentController.updateStatus,
);

export default router;
