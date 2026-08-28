// Floria API — Products Public Catalog Routes
import { Router } from "express";
import { productsController } from "./products.controller.js";
import { publicCatalogRateLimiter } from "../middleware/rateLimit.js";

const router = Router();

router.get("/", publicCatalogRateLimiter, productsController.getProducts);
router.get(
  "/trending",
  publicCatalogRateLimiter,
  productsController.getTrending,
);
router.get(
  "/:slug",
  publicCatalogRateLimiter,
  productsController.getProductBySlug,
);
router.get(
  "/:slug/related",
  publicCatalogRateLimiter,
  productsController.getRelated,
);

export default router;

// Nursery ranked listing is at /api/v1/catalog/sellers — mounted in reviews.routes.ts
