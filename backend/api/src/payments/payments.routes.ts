// Floria API — Payments & Cashfree Routes
import { Router } from "express";
import { paymentsController } from "./payments.controller.js";
import { authenticateToken } from "../middleware/auth.js";
import { requireRole } from "../middleware/authorization.js";

const router = Router();

// Public / Provider Webhooks
router.post("/webhooks/cashfree", paymentsController.handleCashfreeWebhook);
router.post("/webhooks", paymentsController.handleCashfreeWebhook); // Alias

// Authenticated Client Payment Endpoints
router.post("/create-session", authenticateToken, paymentsController.createPaymentSession);
router.get("/:paymentId/status", authenticateToken, paymentsController.getPaymentStatus);

// Authorized Admin Refund Endpoint
router.post("/:paymentId/refund", authenticateToken, requireRole("admin", "operations"), paymentsController.processRefund);

export default router;
