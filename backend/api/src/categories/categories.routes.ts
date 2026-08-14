// Floria API — Categories Routes
import { Router } from "express";
import { categoriesController } from "./categories.controller.js";
import { publicCatalogRateLimiter } from "../middleware/rateLimit.js";

const router = Router();

router.get("/", publicCatalogRateLimiter, categoriesController.getCategories);
router.get("/:slug", publicCatalogRateLimiter, categoriesController.getCategoryBySlug);

export default router;
