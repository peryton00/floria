"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Floria API — Payments & Cashfree Routes
const express_1 = require("express");
const payments_controller_js_1 = require("./payments.controller.js");
const auth_js_1 = require("../middleware/auth.js");
const authorization_js_1 = require("../middleware/authorization.js");
const router = (0, express_1.Router)();
// Public / Provider Webhooks
router.post([
    "/webhooks/cashfree",
    "/webhooks/cashfree/",
    "/webhook/cashfree",
    "/webhook/cashfree/",
], payments_controller_js_1.paymentsController.handleCashfreeWebhook);
router.post(["/webhooks", "/webhooks/", "/webhook", "/webhook/"], payments_controller_js_1.paymentsController.handleCashfreeWebhook);
// Authenticated Client Payment Endpoints
router.get("/lookup-order", payments_controller_js_1.paymentsController.lookupOrderByCfOrderId);
router.post("/create-session", auth_js_1.authenticateToken, payments_controller_js_1.paymentsController.createPaymentSession);
router.get("/:paymentId/status", auth_js_1.authenticateToken, payments_controller_js_1.paymentsController.getPaymentStatus);
// Authorized Admin Endpoints
router.get("/admin/all", auth_js_1.authenticateToken, (0, authorization_js_1.requireRole)("admin", "operations"), payments_controller_js_1.paymentsController.getAdminTransactions);
router.post("/:paymentId/refund", auth_js_1.authenticateToken, (0, authorization_js_1.requireRole)("admin", "operations"), payments_controller_js_1.paymentsController.processRefund);
exports.default = router;
