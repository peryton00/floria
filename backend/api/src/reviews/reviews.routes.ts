// Floria API — Reviews Routes
import { Router } from "express";
import { reviewsController } from "./reviews.controller.js";
import { authenticateToken } from "../middleware/auth.js";
import {
  requireAdmin,
  requireApprovedSeller,
} from "../middleware/authorization.js";
import { publicCatalogRateLimiter } from "../middleware/rateLimit.js";
import { productsController } from "../products/products.controller.js";

const router = Router();

// ── PUBLIC: ranked nursery listing ────────────────────────────────────────
router.get(
  "/catalog/sellers",
  publicCatalogRateLimiter,
  productsController.getRankedNurseries,
);

// ── PUBLIC: product reviews list + summary ────────────────────────────────
// Mounted at /api/v1  →  GET /api/v1/catalog/products/:id/reviews
// (registered from app.ts via productsRoutes OR directly here — see app.ts mount)
router.get(
  "/catalog/products/:id/reviews",
  publicCatalogRateLimiter,
  reviewsController.getProductReviews,
);

// ── AUTH: check review eligibility ───────────────────────────────────────
router.get(
  "/catalog/products/:id/review-eligibility",
  authenticateToken,
  reviewsController.getReviewEligibility,
);

// ── AUTH: submit review (verified purchase enforced server-side) ──────────
router.post(
  "/catalog/products/:id/reviews",
  authenticateToken,
  reviewsController.submitReview,
);

// ── AUTH: mark review helpful ─────────────────────────────────────────────
router.post(
  "/catalog/products/:id/reviews/:rid/helpful",
  authenticateToken,
  reviewsController.markHelpful,
);

// ── CUSTOMER: own reviews ─────────────────────────────────────────────────
router.get(
  "/customer/reviews",
  authenticateToken,
  reviewsController.getMyReviews,
);

router.patch(
  "/customer/reviews/:id",
  authenticateToken,
  reviewsController.updateMyReview,
);

// ── SELLER: list reviews for seller's products ────────────────────────────
router.get(
  "/seller/reviews",
  authenticateToken,
  requireApprovedSeller,
  reviewsController.getSellerReviews,
);

// ── SELLER: flag a review ─────────────────────────────────────────────────
router.patch(
  "/seller/reviews/:id/flag",
  authenticateToken,
  requireApprovedSeller,
  reviewsController.flagReview,
);

// ── ADMIN: list + moderate reviews ───────────────────────────────────────
router.get(
  "/admin/reviews",
  authenticateToken,
  requireAdmin,
  reviewsController.adminListReviews,
);

router.patch(
  "/admin/reviews/:id",
  authenticateToken,
  requireAdmin,
  reviewsController.adminModerateReview,
);

export default router;
