"use strict";
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
// Customer Management
router.get("/users", admin_controller_js_1.adminController.getUsers);
router.get("/users/:id", (0, validation_js_1.validateRequest)(uuidParamSchema), admin_controller_js_1.adminController.getUserById);
router.patch("/users/:id/status", (0, validation_js_1.validateRequest)(uuidParamSchema), admin_controller_js_1.adminController.updateUserStatus);
// Seller Administration
router.get("/sellers", admin_controller_js_1.adminController.getSellers);
router.get("/sellers/:id", (0, validation_js_1.validateRequest)(uuidParamSchema), admin_controller_js_1.adminController.getSellerById);
router.post("/sellers/:id/approve", (0, validation_js_1.validateRequest)(uuidParamSchema), admin_controller_js_1.adminController.approveSeller);
router.post("/sellers/:id/reject", (0, validation_js_1.validateRequest)(uuidParamSchema), admin_controller_js_1.adminController.rejectSeller);
router.post("/sellers/:id/suspend", (0, validation_js_1.validateRequest)(uuidParamSchema), admin_controller_js_1.adminController.suspendSeller);
router.post("/sellers/:id/reactivate", (0, validation_js_1.validateRequest)(uuidParamSchema), admin_controller_js_1.adminController.reactivateSeller);
router.get("/sellers/:id/documents", (0, validation_js_1.validateRequest)(uuidParamSchema), admin_controller_js_1.adminController.getSellerDocuments);
// Product Moderation
router.get("/products", admin_controller_js_1.adminController.getProducts);
router.get("/products/:id", (0, validation_js_1.validateRequest)(uuidParamSchema), admin_controller_js_1.adminController.getProductById);
router.patch("/products/:id/status", (0, validation_js_1.validateRequest)(uuidParamSchema), admin_controller_js_1.adminController.updateProductStatus);
router.patch("/products/:id/publish", (0, validation_js_1.validateRequest)(uuidParamSchema), admin_controller_js_1.adminController.publishProduct);
router.patch("/products/:id/unpublish", (0, validation_js_1.validateRequest)(uuidParamSchema), admin_controller_js_1.adminController.unpublishProduct);
router.patch("/products/:id/archive", (0, validation_js_1.validateRequest)(uuidParamSchema), admin_controller_js_1.adminController.archiveProduct);
// Category Management
router.get("/categories", admin_controller_js_1.adminController.getCategories);
router.get("/categories/:id/products-count", (0, validation_js_1.validateRequest)(uuidParamSchema), admin_controller_js_1.adminController.getCategoryProductsCount);
router.post("/categories", admin_controller_js_1.adminController.createCategory);
router.patch("/categories/:id", (0, validation_js_1.validateRequest)(uuidParamSchema), admin_controller_js_1.adminController.updateCategory);
// Platform Order Oversight
router.get("/orders", admin_controller_js_1.adminController.getOrders);
router.get("/orders/:id", admin_controller_js_1.adminController.getOrderById);
// Audit Logging Visibility
router.get("/audit-logs", admin_controller_js_1.adminController.getAuditLogs);
// Platform Settings & Commission Rate Management
router.get("/settings/platform", admin_controller_js_1.adminController.getSettings);
router.patch("/settings/commission", admin_controller_js_1.adminController.updateCommissionRate);
exports.default = router;
