// Floria API — Products Public Catalog Routes
import { Router } from "express";
import { productsController } from "./products.controller.js";
import { publicCatalogRateLimiter } from "../middleware/rateLimit.js";

const router = Router();

router.get("/", publicCatalogRateLimiter, productsController.getProducts);
router.get("/:slug", publicCatalogRateLimiter, productsController.getProductBySlug);

export default router;
