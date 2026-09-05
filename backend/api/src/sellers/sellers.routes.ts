// Floria API — Seller Portal Routes
import { Router } from "express";
import { sellersController } from "./sellers.controller.js";
import { authenticateToken } from "../middleware/auth.js";
import {
  requireApprovedSeller,
  requireRole,
} from "../middleware/authorization.js";
import { sellerFulfillmentRateLimiter } from "../middleware/rateLimit.js";
import { productsController } from "../products/products.controller.js";

const router = Router();

// Dedicated Seller Auth & Lifecycle Routes (Public & Unauthenticated)
router.post("/auth/login", sellerFulfillmentRateLimiter, sellersController.login);
router.post("/auth/register", sellerFulfillmentRateLimiter, sellersController.apply);
router.post("/auth/apply", sellerFulfillmentRateLimiter, sellersController.apply);
router.post("/auth/forgot-password", sellerFulfillmentRateLimiter, sellersController.forgotPassword);
router.post("/auth/reset-password", sellerFulfillmentRateLimiter, sellersController.resetPassword);

// Public Business Landing Endpoints
router.get("/public/stats", sellerFulfillmentRateLimiter, productsController.getPublicStats);
router.get("/public/top", sellerFulfillmentRateLimiter, productsController.getRankedNurseries);

// Profile & Onboarding
router.get(
  "/profile",
  authenticateToken,
  requireRole("seller", "admin", "super_admin"),
  sellersController.getProfile,
);
router.patch(
  "/profile",
  authenticateToken,
  sellerFulfillmentRateLimiter,
  requireRole("seller", "admin", "super_admin"),
  sellersController.updateProfile,
);
router.post(
  "/applications",
  sellerFulfillmentRateLimiter,
  sellersController.submitApplication,
);
router.get(
  "/applications",
  authenticateToken,
  requireRole("seller", "customer", "admin"),
  sellersController.getApplication,
);
router.get(
  "/application",
  authenticateToken,
  requireRole("seller", "customer", "admin"),
  sellersController.getApplication,
);
router.get(
  "/application/status",
  authenticateToken,
  sellersController.getApplicationStatus,
);
router.post(
  "/application/resubmit",
  authenticateToken,
  sellerFulfillmentRateLimiter,
  sellersController.resubmitApplication,
);

// Seller Dashboard KPIs
router.get(
  "/dashboard",
  authenticateToken,
  requireRole("seller", "admin"),
  sellersController.getDashboard,
);

// Seller Products Management
router.get(
  "/products",
  authenticateToken,
  requireRole("seller", "admin"),
  sellersController.getProducts,
);
router.get(
  "/products/:id",
  authenticateToken,
  requireRole("seller", "admin"),
  sellersController.getProductById,
);
router.post(
  "/products",
  authenticateToken,
  sellerFulfillmentRateLimiter,
  requireApprovedSeller,
  sellersController.createProduct,
);
router.patch(
  "/products/:id",
  authenticateToken,
  sellerFulfillmentRateLimiter,
  requireApprovedSeller,
  sellersController.updateProduct,
);
router.patch(
  "/products/:id/status",
  authenticateToken,
  sellerFulfillmentRateLimiter,
  requireApprovedSeller,
  sellersController.updateProductStatus,
);
router.delete(
  "/products/:id",
  authenticateToken,
  sellerFulfillmentRateLimiter,
  requireApprovedSeller,
  sellersController.deleteProduct,
);
router.post(
  "/products/:id/restore",
  authenticateToken,
  sellerFulfillmentRateLimiter,
  requireApprovedSeller,
  sellersController.restoreProduct,
);
router.delete(
  "/products/:id/permanent",
  authenticateToken,
  sellerFulfillmentRateLimiter,
  requireApprovedSeller,
  sellersController.permanentlyDeleteProduct,
);

// Seller Product Media Asset Management
router.post(
  "/products/:productId/images",
  authenticateToken,
  sellerFulfillmentRateLimiter,
  requireApprovedSeller,
  sellersController.attachProductImage,
);
router.delete(
  "/products/:productId/images/:imageId",
  authenticateToken,
  sellerFulfillmentRateLimiter,
  requireApprovedSeller,
  sellersController.removeProductImage,
);
router.patch(
  "/products/:productId/images/reorder",
  authenticateToken,
  sellerFulfillmentRateLimiter,
  requireApprovedSeller,
  sellersController.reorderProductImages,
);
router.patch(
  "/products/:productId/images/:imageId/primary",
  authenticateToken,
  sellerFulfillmentRateLimiter,
  requireApprovedSeller,
  sellersController.setPrimaryProductImage,
);
router.put(
  "/products/:productId/images/:imageId",
  authenticateToken,
  sellerFulfillmentRateLimiter,
  requireApprovedSeller,
  sellersController.replaceProductImage,
);

// Seller Inventory Management
router.get(
  "/inventory",
  authenticateToken,
  requireRole("seller", "admin"),
  sellersController.getInventory,
);
router.patch(
  "/inventory/:productId",
  authenticateToken,
  sellerFulfillmentRateLimiter,
  requireApprovedSeller,
  sellersController.updateInventory,
);

// Seller Orders & Fulfillment Isolation
router.get(
  "/orders",
  authenticateToken,
  requireRole("seller", "admin"),
  sellersController.getOrders,
);
router.get(
  "/orders/:id",
  authenticateToken,
  requireRole("seller", "admin"),
  sellersController.getOrderById,
);
router.post(
  "/fulfillment",
  authenticateToken,
  sellerFulfillmentRateLimiter,
  requireApprovedSeller,
  sellersController.updateFulfillment,
);
router.post(
  "/fulfillment/:orderId/status",
  authenticateToken,
  sellerFulfillmentRateLimiter,
  requireApprovedSeller,
  sellersController.updateFulfillment,
);

// Documents, Financials & Settings
router.get(
  "/earnings",
  authenticateToken,
  requireRole("seller", "admin"),
  sellersController.getEarnings,
);
router.get(
  "/payouts",
  authenticateToken,
  requireRole("seller", "admin"),
  sellersController.getPayouts,
);
router.get(
  "/analytics",
  authenticateToken,
  requireRole("seller", "admin"),
  sellersController.getAnalytics,
);
router.get(
  "/documents",
  authenticateToken,
  requireRole("seller", "admin"),
  sellersController.getDocuments,
);
router.post(
  "/documents",
  authenticateToken,
  sellerFulfillmentRateLimiter,
  requireRole("seller", "admin"),
  sellersController.uploadDocument,
);
router.get(
  "/settings/financials",
  authenticateToken,
  requireRole("seller", "admin"),
  sellersController.getFinancialSettings,
);
router.get(
  "/settings/notifications",
  authenticateToken,
  requireRole("seller", "admin"),
  sellersController.getNotificationSettings,
);
router.patch(
  "/settings/notifications",
  authenticateToken,
  sellerFulfillmentRateLimiter,
  requireRole("seller", "admin"),
  sellersController.updateNotificationSettings,
);

export default router;
