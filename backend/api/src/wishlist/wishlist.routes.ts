// Floria API — Wishlist Routes
import { Router } from "express";
import { wishlistController } from "./wishlist.controller.js";
import { authenticateToken } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validation.js";
import { z } from "zod";

const router = Router();

const addItemSchema = {
  body: z.object({
    productId: z.string().uuid("Invalid product ID"),
  }),
};

const mergeSchema = {
  body: z.object({
    productIds: z.array(z.string().uuid()),
  }),
};

router.use(authenticateToken);

router.get("/", wishlistController.getWishlist);
router.post("/items", validateRequest(addItemSchema), wishlistController.addItem);
router.delete("/items/:productId", wishlistController.removeItem);
router.post("/merge", validateRequest(mergeSchema), wishlistController.mergeWishlist);

export default router;
