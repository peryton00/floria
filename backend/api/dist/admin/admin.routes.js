"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Floria API — Admin Routes
const express_1 = require("express");
const admin_controller_js_1 = require("./admin.controller.js");
const auth_js_1 = require("../middleware/auth.js");
const authorization_js_1 = require("../middleware/authorization.js");
const rateLimit_js_1 = require("../middleware/rateLimit.js");
const validation_js_1 = require("../middleware/validation.js");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const uuidParamSchema = {
    params: zod_1.z.object({
        id: zod_1.z.string().uuid("Invalid ID format"),
    }),
};
router.use(auth_js_1.authenticateToken, (0, authorization_js_1.requireRole)("admin", "super_admin"), rateLimit_js_1.adminRateLimiter);
// Dashboard & Health
router.get("/health", admin_controller_js_1.adminController.getHealth);
router.get("/dashboard", admin_controller_js_1.adminController.getDashboard);
router.get("/analytics", admin_controller_js_1.adminController.getAnalytics);
// Customer Management
router.get("/users", admin_controller_js_1.adminController.getUsers);
router.get("/users/:id", (0, validation_js_1.validateRequest)(uuidParamSchema), admin_controller_js_1.adminController.getUserById);
router.patch("/users/:id/status", (0, validation_js_1.validateRequest)(uuidParamSchema), admin_controller_js_1.adminController.updateUserStatus);
router.patch("/users/:id", (0, validation_js_1.validateRequest)(uuidParamSchema), admin_controller_js_1.adminController.updateUser);
// Seller Administration
router.get("/sellers", admin_controller_js_1.adminController.getSellers);
router.get("/sellers/:id", (0, validation_js_1.validateRequest)(uuidParamSchema), admin_controller_js_1.adminController.getSellerById);
router.post("/sellers/:id/approve", (0, validation_js_1.validateRequest)(uuidParamSchema), admin_controller_js_1.adminController.approveSeller);
router.post("/sellers/:id/reject", (0, validation_js_1.validateRequest)(uuidParamSchema), admin_controller_js_1.adminController.rejectSeller);
router.post("/sellers/:id/suspend", (0, validation_js_1.validateRequest)(uuidParamSchema), admin_controller_js_1.adminController.suspendSeller);
router.post("/sellers/:id/reactivate", (0, validation_js_1.validateRequest)(uuidParamSchema), admin_controller_js_1.adminController.reactivateSeller);
router.get("/sellers/:id/documents", (0, validation_js_1.validateRequest)(uuidParamSchema), admin_controller_js_1.adminController.getSellerDocuments);
router.patch("/sellers/:id", (0, validation_js_1.validateRequest)(uuidParamSchema), admin_controller_js_1.adminController.updateSeller);
// Product Moderation
router.get("/products", admin_controller_js_1.adminController.getProducts);
router.get("/products/:id/financial-calculation", (0, validation_js_1.validateRequest)(uuidParamSchema), admin_controller_js_1.adminController.getProductFinancialCalculation);
router.get("/products/:id", (0, validation_js_1.validateRequest)(uuidParamSchema), admin_controller_js_1.adminController.getProductById);
router.patch("/products/:id/status", (0, validation_js_1.validateRequest)(uuidParamSchema), admin_controller_js_1.adminController.updateProductStatus);
router.patch("/products/:id/publish", (0, validation_js_1.validateRequest)(uuidParamSchema), admin_controller_js_1.adminController.publishProduct);
router.patch("/products/:id/unpublish", (0, validation_js_1.validateRequest)(uuidParamSchema), admin_controller_js_1.adminController.unpublishProduct);
router.patch("/products/:id/archive", (0, validation_js_1.validateRequest)(uuidParamSchema), admin_controller_js_1.adminController.archiveProduct);
router.patch("/products/:id", (0, validation_js_1.validateRequest)(uuidParamSchema), admin_controller_js_1.adminController.updateProduct);
// Category Management
router.get("/categories", admin_controller_js_1.adminController.getCategories);
router.get("/categories/:id/products-count", (0, validation_js_1.validateRequest)(uuidParamSchema), admin_controller_js_1.adminController.getCategoryProductsCount);
router.post("/categories", admin_controller_js_1.adminController.createCategory);
router.patch("/categories/:id", (0, validation_js_1.validateRequest)(uuidParamSchema), admin_controller_js_1.adminController.updateCategory);
// Platform Order Oversight
router.get("/orders", admin_controller_js_1.adminController.getOrders);
router.get("/orders/:id/financial-breakdown", (0, validation_js_1.validateRequest)(uuidParamSchema), admin_controller_js_1.adminController.getOrderFinancialBreakdown);
router.get("/orders/:id", admin_controller_js_1.adminController.getOrderById);
router.patch("/orders/:id", admin_controller_js_1.adminController.updateOrder);
// Audit Logging Visibility
router.get("/audit-logs", admin_controller_js_1.adminController.getAuditLogs);
// Platform Settings & Financial Engine Governance
router.get("/settings/platform", admin_controller_js_1.adminController.getSettings);
router.patch("/settings/commission", admin_controller_js_1.adminController.updateCommissionRate);
router.get("/settings/delivery", admin_controller_js_1.adminController.getDeliverySettings);
router.patch("/settings/delivery", admin_controller_js_1.adminController.updateDeliverySettings);
router.post("/delivery/preview", admin_controller_js_1.adminController.previewDeliveryFee);
router.get("/settings/financials", admin_controller_js_1.adminController.getFinancialSettings);
router.patch("/settings/financials", admin_controller_js_1.adminController.updateFinancialSettings);
// Media & Image Management
router.get("/media", admin_controller_js_1.adminController.getMedia);
router.post("/media/upload", admin_controller_js_1.adminController.uploadMedia);
router.patch("/media/:id", admin_controller_js_1.adminController.updateMedia);
router.delete("/media/:id", admin_controller_js_1.adminController.deleteMedia);
// Versioned Pricing Policies (Phase 3.23)
const pricing_policy_routes_js_1 = __importDefault(require("./pricing-policy.routes.js"));
router.use("/pricing-policies", pricing_policy_routes_js_1.default);
exports.default = router;
