"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Floria API — Payments & Cashfree Routes
const express_1 = require("express");
const payments_controller_js_1 = require("./payments.controller.js");
const auth_js_1 = require("../middleware/auth.js");
const authorization_js_1 = require("../middleware/authorization.js");
const router = (0, express_1.Router)();
// Public / Provider Webhooks
router.post("/webhooks/cashfree", payments_controller_js_1.paymentsController.handleCashfreeWebhook);
router.post("/webhooks", payments_controller_js_1.paymentsController.handleCashfreeWebhook); // Alias
// Authenticated Client Payment Endpoints
router.post("/create-session", auth_js_1.authenticateToken, payments_controller_js_1.paymentsController.createPaymentSession);
router.get("/:paymentId/status", auth_js_1.authenticateToken, payments_controller_js_1.paymentsController.getPaymentStatus);
// Authorized Admin Refund Endpoint
router.post("/:paymentId/refund", auth_js_1.authenticateToken, (0, authorization_js_1.requireRole)("admin", "operations"), payments_controller_js_1.paymentsController.processRefund);
exports.default = router;
