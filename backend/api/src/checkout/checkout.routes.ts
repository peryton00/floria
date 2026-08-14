// Floria API — Checkout Routes
import { Router } from "express";
import { checkoutController } from "./checkout.controller.js";
import { authenticateToken } from "../middleware/auth.js";
import { checkoutRateLimiter } from "../middleware/rateLimit.js";
import { validateRequest } from "../middleware/validation.js";
import { z } from "zod";

const router = Router();

const checkoutSchema = {
  body: z.object({
    addressId: z.string().uuid("Invalid address ID").optional(),
    address: z.record(z.unknown()).optional(),
    paymentMethod: z.enum(["online", "cod"]),
  }),
};

router.post(
  "/",
  authenticateToken,
  checkoutRateLimiter,
  validateRequest(checkoutSchema),
  checkoutController.processCheckout
);

export default router;
