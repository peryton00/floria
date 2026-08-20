"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Floria API — Seller Portal Routes
const express_1 = require("express");
const sellers_controller_js_1 = require("./sellers.controller.js");
const auth_js_1 = require("../middleware/auth.js");
const authorization_js_1 = require("../middleware/authorization.js");
const rateLimit_js_1 = require("../middleware/rateLimit.js");
const router = (0, express_1.Router)();
// Profile & Onboarding (Accessible to seller role even if pending/suspended)
router.get("/profile", auth_js_1.authenticateToken, (0, authorization_js_1.requireRole)("seller", "admin", "super_admin"), sellers_controller_js_1.sellersController.getProfile);
router.patch("/profile", auth_js_1.authenticateToken, rateLimit_js_1.sellerFulfillmentRateLimiter, (0, authorization_js_1.requireRole)("seller", "admin", "super_admin"), sellers_controller_js_1.sellersController.updateProfile);
router.post("/applications", auth_js_1.authenticateToken, rateLimit_js_1.sellerFulfillmentRateLimiter, (0, authorization_js_1.requireRole)("seller", "customer", "admin"), sellers_controller_js_1.sellersController.submitApplication);
router.get("/applications", auth_js_1.authenticateToken, (0, authorization_js_1.requireRole)("seller", "customer", "admin"), sellers_controller_js_1.sellersController.getApplication);
router.get("/application", auth_js_1.authenticateToken, (0, authorization_js_1.requireRole)("seller", "customer", "admin"), sellers_controller_js_1.sellersController.getApplication);
// Seller Dashboard KPIs
router.get("/dashboard", auth_js_1.authenticateToken, (0, authorization_js_1.requireRole)("seller", "admin"), sellers_controller_js_1.sellersController.getDashboard);
// Seller Products Management
router.get("/products", auth_js_1.authenticateToken, (0, authorization_js_1.requireRole)("seller", "admin"), sellers_controller_js_1.sellersController.getProducts);
router.get("/products/:id", auth_js_1.authenticateToken, (0, authorization_js_1.requireRole)("seller", "admin"), sellers_controller_js_1.sellersController.getProductById);
router.post("/products", auth_js_1.authenticateToken, rateLimit_js_1.sellerFulfillmentRateLimiter, authorization_js_1.requireApprovedSeller, sellers_controller_js_1.sellersController.createProduct);
router.patch("/products/:id", auth_js_1.authenticateToken, rateLimit_js_1.sellerFulfillmentRateLimiter, authorization_js_1.requireApprovedSeller, sellers_controller_js_1.sellersController.updateProduct);
router.patch("/products/:id/status", auth_js_1.authenticateToken, rateLimit_js_1.sellerFulfillmentRateLimiter, authorization_js_1.requireApprovedSeller, sellers_controller_js_1.sellersController.updateProductStatus);
router.delete("/products/:id", auth_js_1.authenticateToken, rateLimit_js_1.sellerFulfillmentRateLimiter, authorization_js_1.requireApprovedSeller, sellers_controller_js_1.sellersController.deleteProduct);
// Seller Product Media Asset Management
router.post("/products/:productId/images", auth_js_1.authenticateToken, rateLimit_js_1.sellerFulfillmentRateLimiter, authorization_js_1.requireApprovedSeller, sellers_controller_js_1.sellersController.attachProductImage);
router.delete("/products/:productId/images/:imageId", auth_js_1.authenticateToken, rateLimit_js_1.sellerFulfillmentRateLimiter, authorization_js_1.requireApprovedSeller, sellers_controller_js_1.sellersController.removeProductImage);
router.patch("/products/:productId/images/reorder", auth_js_1.authenticateToken, rateLimit_js_1.sellerFulfillmentRateLimiter, authorization_js_1.requireApprovedSeller, sellers_controller_js_1.sellersController.reorderProductImages);
router.patch("/products/:productId/images/:imageId/primary", auth_js_1.authenticateToken, rateLimit_js_1.sellerFulfillmentRateLimiter, authorization_js_1.requireApprovedSeller, sellers_controller_js_1.sellersController.setPrimaryProductImage);
router.put("/products/:productId/images/:imageId", auth_js_1.authenticateToken, rateLimit_js_1.sellerFulfillmentRateLimiter, authorization_js_1.requireApprovedSeller, sellers_controller_js_1.sellersController.replaceProductImage);
// Seller Inventory Management
router.get("/inventory", auth_js_1.authenticateToken, (0, authorization_js_1.requireRole)("seller", "admin"), sellers_controller_js_1.sellersController.getInventory);
router.patch("/inventory/:productId", auth_js_1.authenticateToken, rateLimit_js_1.sellerFulfillmentRateLimiter, authorization_js_1.requireApprovedSeller, sellers_controller_js_1.sellersController.updateInventory);
// Seller Orders & Fulfillment Isolation
router.get("/orders", auth_js_1.authenticateToken, (0, authorization_js_1.requireRole)("seller", "admin"), sellers_controller_js_1.sellersController.getOrders);
router.get("/orders/:id", auth_js_1.authenticateToken, (0, authorization_js_1.requireRole)("seller", "admin"), sellers_controller_js_1.sellersController.getOrderById);
router.post("/fulfillment", auth_js_1.authenticateToken, rateLimit_js_1.sellerFulfillmentRateLimiter, authorization_js_1.requireApprovedSeller, sellers_controller_js_1.sellersController.updateFulfillment);
router.post("/fulfillment/:orderId/status", auth_js_1.authenticateToken, rateLimit_js_1.sellerFulfillmentRateLimiter, authorization_js_1.requireApprovedSeller, sellers_controller_js_1.sellersController.updateFulfillment);
// Documents, Financials & Settings
router.get("/earnings", auth_js_1.authenticateToken, (0, authorization_js_1.requireRole)("seller", "admin"), sellers_controller_js_1.sellersController.getEarnings);
router.get("/payouts", auth_js_1.authenticateToken, (0, authorization_js_1.requireRole)("seller", "admin"), sellers_controller_js_1.sellersController.getPayouts);
router.get("/analytics", auth_js_1.authenticateToken, (0, authorization_js_1.requireRole)("seller", "admin"), sellers_controller_js_1.sellersController.getAnalytics);
router.get("/documents", auth_js_1.authenticateToken, (0, authorization_js_1.requireRole)("seller", "admin"), sellers_controller_js_1.sellersController.getDocuments);
router.post("/documents", auth_js_1.authenticateToken, rateLimit_js_1.sellerFulfillmentRateLimiter, (0, authorization_js_1.requireRole)("seller", "admin"), sellers_controller_js_1.sellersController.uploadDocument);
router.get("/settings/notifications", auth_js_1.authenticateToken, (0, authorization_js_1.requireRole)("seller", "admin"), sellers_controller_js_1.sellersController.getNotificationSettings);
router.patch("/settings/notifications", auth_js_1.authenticateToken, rateLimit_js_1.sellerFulfillmentRateLimiter, (0, authorization_js_1.requireRole)("seller", "admin"), sellers_controller_js_1.sellersController.updateNotificationSettings);
exports.default = router;
