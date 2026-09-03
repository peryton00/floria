// Floria API — Admin Routes
import { Router } from "express";
import { adminController } from "./admin.controller.js";
import { authenticateToken } from "../middleware/auth.js";
import { requireRole } from "../middleware/authorization.js";
import { adminRateLimiter } from "../middleware/rateLimit.js";
import { validateRequest } from "../middleware/validation.js";
import { z } from "zod";

const router = Router();

const uuidParamSchema = {
  params: z.object({
    id: z.string().uuid("Invalid ID format"),
  }),
};

router.use(
  authenticateToken,
  requireRole("admin", "super_admin"),
  adminRateLimiter,
);

// Dashboard & Health
router.get("/health", adminController.getHealth);
router.get("/dashboard", adminController.getDashboard);
router.get("/analytics", adminController.getAnalytics);

// Customer Management
router.get("/users", adminController.getUsers);
router.get(
  "/users/:id",
  validateRequest(uuidParamSchema),
  adminController.getUserById,
);
router.patch(
  "/users/:id/status",
  validateRequest(uuidParamSchema),
  adminController.updateUserStatus,
);
router.patch(
  "/users/:id",
  validateRequest(uuidParamSchema),
  adminController.updateUser,
);

// Seller Administration
router.get("/sellers", adminController.getSellers);
router.get("/seller-applications", adminController.getSellerApplications);
router.get(
  "/sellers/:id",
  validateRequest(uuidParamSchema),
  adminController.getSellerById,
);
router.post(
  "/sellers/:id/approve",
  validateRequest(uuidParamSchema),
  adminController.approveSeller,
);
router.post(
  "/sellers/:id/reject",
  validateRequest(uuidParamSchema),
  adminController.rejectSeller,
);
router.post(
  "/sellers/:id/request-correction",
  validateRequest(uuidParamSchema),
  adminController.requestCorrection,
);
router.post(
  "/sellers/:id/suspend",
  validateRequest(uuidParamSchema),
  adminController.suspendSeller,
);
router.post(
  "/sellers/:id/reactivate",
  validateRequest(uuidParamSchema),
  adminController.reactivateSeller,
);
router.get(
  "/sellers/:id/documents",
  validateRequest(uuidParamSchema),
  adminController.getSellerDocuments,
);
router.patch(
  "/sellers/:id",
  validateRequest(uuidParamSchema),
  adminController.updateSeller,
);

// Product Moderation
router.get("/products", adminController.getProducts);
router.get(
  "/products/:id/financial-calculation",
  validateRequest(uuidParamSchema),
  adminController.getProductFinancialCalculation,
);
router.get(
  "/products/:id",
  validateRequest(uuidParamSchema),
  adminController.getProductById,
);
router.patch(
  "/products/:id/status",
  validateRequest(uuidParamSchema),
  adminController.updateProductStatus,
);
router.patch(
  "/products/:id/publish",
  validateRequest(uuidParamSchema),
  adminController.publishProduct,
);
router.patch(
  "/products/:id/unpublish",
  validateRequest(uuidParamSchema),
  adminController.unpublishProduct,
);
router.patch(
  "/products/:id/archive",
  validateRequest(uuidParamSchema),
  adminController.archiveProduct,
);
router.patch(
  "/products/:id",
  validateRequest(uuidParamSchema),
  adminController.updateProduct,
);

// Category Management
router.get("/categories", adminController.getCategories);
router.get(
  "/categories/:id/products-count",
  validateRequest(uuidParamSchema),
  adminController.getCategoryProductsCount,
);
router.post("/categories", adminController.createCategory);
router.patch(
  "/categories/:id",
  validateRequest(uuidParamSchema),
  adminController.updateCategory,
);

// Platform Order Oversight
router.get("/orders", adminController.getOrders);
router.get(
  "/orders/:id/financial-breakdown",
  validateRequest(uuidParamSchema),
  adminController.getOrderFinancialBreakdown,
);
router.get("/orders/:id", adminController.getOrderById);
router.patch("/orders/:id", adminController.updateOrder);

// Audit Logging Visibility
router.get("/audit-logs", adminController.getAuditLogs);
router.get("/audit-logs/:id", adminController.getAuditLogById);

// Platform Settings & Financial Engine Governance
router.get("/settings/platform", adminController.getSettings);
router.patch("/settings/commission", adminController.updateCommissionRate);
router.get("/settings/delivery", adminController.getDeliverySettings);
router.patch("/settings/delivery", adminController.updateDeliverySettings);
router.post("/delivery/preview", adminController.previewDeliveryFee);
router.get("/settings/financials", adminController.getFinancialSettings);
router.patch("/settings/financials", adminController.updateFinancialSettings);

// Media & Image Management
router.get("/media", adminController.getMedia);
router.post("/media/upload", adminController.uploadMedia);
router.patch("/media/:id", adminController.updateMedia);
router.delete("/media/:id", adminController.deleteMedia);

// Versioned Pricing Policies (Phase 3.23)
import pricingPolicyRoutes from "./pricing-policy.routes.js";
router.use("/pricing-policies", pricingPolicyRoutes);

export default router;
