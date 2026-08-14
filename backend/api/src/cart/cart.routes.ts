// Floria API — Cart Routes
import { Router } from "express";
import { cartController } from "./cart.controller.js";
import { authenticateToken } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validation.js";
import { z } from "zod";

const router = Router();

const addToCartSchema = {
  body: z.object({
    productId: z.string().uuid("Invalid product ID format"),
    quantity: z.number().int().positive("Quantity must be positive"),
  }),
};

const updateQuantitySchema = {
  params: z.object({
    productId: z.string().uuid("Invalid product ID format"),
  }),
  body: z.object({
    quantity: z.number().int().nonnegative("Quantity cannot be negative"),
  }),
};

const mergeCartSchema = {
  body: z.object({
    items: z.array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().positive(),
      })
    ),
  }),
};

router.use(authenticateToken);

router.get("/", cartController.getCart);
router.post("/items", validateRequest(addToCartSchema), cartController.addItem);
router.patch("/items/:productId", validateRequest(updateQuantitySchema), cartController.updateQuantity);
router.delete("/items/:productId", cartController.removeItem);
router.delete("/", cartController.clearCart);
router.post("/merge", validateRequest(mergeCartSchema), cartController.mergeCart);

export default router;
