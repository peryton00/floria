"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Floria API — Reviews Routes
const express_1 = require("express");
const reviews_controller_js_1 = require("./reviews.controller.js");
const auth_js_1 = require("../middleware/auth.js");
const authorization_js_1 = require("../middleware/authorization.js");
const rateLimit_js_1 = require("../middleware/rateLimit.js");
const products_controller_js_1 = require("../products/products.controller.js");
const router = (0, express_1.Router)();
// ── PUBLIC: ranked nursery listing ────────────────────────────────────────
router.get("/catalog/sellers", rateLimit_js_1.publicCatalogRateLimiter, products_controller_js_1.productsController.getRankedNurseries);
// ── PUBLIC: product reviews list + summary ────────────────────────────────
// Mounted at /api/v1  →  GET /api/v1/catalog/products/:id/reviews
// (registered from app.ts via productsRoutes OR directly here — see app.ts mount)
router.get("/catalog/products/:id/reviews", rateLimit_js_1.publicCatalogRateLimiter, reviews_controller_js_1.reviewsController.getProductReviews);
// ── AUTH: check review eligibility ───────────────────────────────────────
router.get("/catalog/products/:id/review-eligibility", auth_js_1.authenticateToken, reviews_controller_js_1.reviewsController.getReviewEligibility);
// ── AUTH: submit review (verified purchase enforced server-side) ──────────
router.post("/catalog/products/:id/reviews", auth_js_1.authenticateToken, reviews_controller_js_1.reviewsController.submitReview);
// ── AUTH: mark review helpful ─────────────────────────────────────────────
router.post("/catalog/products/:id/reviews/:rid/helpful", auth_js_1.authenticateToken, reviews_controller_js_1.reviewsController.markHelpful);
// ── CUSTOMER: own reviews ─────────────────────────────────────────────────
router.get("/customer/reviews", auth_js_1.authenticateToken, reviews_controller_js_1.reviewsController.getMyReviews);
// ── SELLER: list reviews for seller's products ────────────────────────────
router.get("/seller/reviews", auth_js_1.authenticateToken, authorization_js_1.requireApprovedSeller, reviews_controller_js_1.reviewsController.getSellerReviews);
// ── SELLER: flag a review ─────────────────────────────────────────────────
router.patch("/seller/reviews/:id/flag", auth_js_1.authenticateToken, authorization_js_1.requireApprovedSeller, reviews_controller_js_1.reviewsController.flagReview);
// ── ADMIN: list + moderate reviews ───────────────────────────────────────
router.get("/admin/reviews", auth_js_1.authenticateToken, authorization_js_1.requireAdmin, reviews_controller_js_1.reviewsController.adminListReviews);
router.patch("/admin/reviews/:id", auth_js_1.authenticateToken, authorization_js_1.requireAdmin, reviews_controller_js_1.reviewsController.adminModerateReview);
exports.default = router;
