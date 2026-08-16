// Floria API — Seller Portal Routes
import { Router } from "express";
import { sellersController } from "./sellers.controller.js";
import { authenticateToken } from "../middleware/auth.js";
import { requireApprovedSeller, requireRole } from "../middleware/authorization.js";
import { sellerFulfillmentRateLimiter } from "../middleware/rateLimit.js";

const router = Router();

// Profile & Onboarding (Accessible to seller role even if pending/suspended)
router.get("/profile", authenticateToken, requireRole("seller", "admin", "super_admin"), sellersController.getProfile);
router.patch("/profile", authenticateToken, sellerFulfillmentRateLimiter, requireRole("seller", "admin", "super_admin"), sellersController.updateProfile);
router.post("/applications", authenticateToken, sellerFulfillmentRateLimiter, requireRole("seller", "customer", "admin"), sellersController.submitApplication);
router.get("/applications", authenticateToken, requireRole("seller", "customer", "admin"), sellersController.getApplication);
router.get("/application", authenticateToken, requireRole("seller", "customer", "admin"), sellersController.getApplication);

// Seller Dashboard KPIs
router.get("/dashboard", authenticateToken, requireRole("seller", "admin"), sellersController.getDashboard);

// Seller Products Management
router.get("/products", authenticateToken, requireRole("seller", "admin"), sellersController.getProducts);
router.get("/products/:id", authenticateToken, requireRole("seller", "admin"), sellersController.getProductById);
router.post("/products", authenticateToken, sellerFulfillmentRateLimiter, requireApprovedSeller, sellersController.createProduct);
router.patch("/products/:id", authenticateToken, sellerFulfillmentRateLimiter, requireApprovedSeller, sellersController.updateProduct);
router.patch("/products/:id/status", authenticateToken, sellerFulfillmentRateLimiter, requireApprovedSeller, sellersController.updateProductStatus);
router.delete("/products/:id", authenticateToken, sellerFulfillmentRateLimiter, requireApprovedSeller, sellersController.deleteProduct);

// Seller Inventory Management
router.get("/inventory", authenticateToken, requireRole("seller", "admin"), sellersController.getInventory);
router.patch("/inventory/:productId", authenticateToken, sellerFulfillmentRateLimiter, requireApprovedSeller, sellersController.updateInventory);

// Seller Orders & Fulfillment Isolation
router.get("/orders", authenticateToken, requireRole("seller", "admin"), sellersController.getOrders);
router.get("/orders/:id", authenticateToken, requireRole("seller", "admin"), sellersController.getOrderById);
router.post("/fulfillment", authenticateToken, sellerFulfillmentRateLimiter, requireApprovedSeller, sellersController.updateFulfillment);
router.post("/fulfillment/:orderId/status", authenticateToken, sellerFulfillmentRateLimiter, requireApprovedSeller, sellersController.updateFulfillment);

// Documents & Settings
router.get("/documents", authenticateToken, requireRole("seller", "admin"), sellersController.getDocuments);
router.post("/documents", authenticateToken, sellerFulfillmentRateLimiter, requireRole("seller", "admin"), sellersController.uploadDocument);
router.get("/settings/notifications", authenticateToken, requireRole("seller", "admin"), sellersController.getNotificationSettings);
router.patch("/settings/notifications", authenticateToken, sellerFulfillmentRateLimiter, requireRole("seller", "admin"), sellersController.updateNotificationSettings);

export default router;
