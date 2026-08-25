"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentsController = exports.PaymentsController = void 0;
const payments_service_js_1 = require("./payments.service.js");
class PaymentsController {
    /**
     * POST /api/v1/payments/create-session
     * Authenticated user creates or retrieves Cashfree payment session for an order.
     */
    async createPaymentSession(req, res, next) {
        try {
            const userId = req.user.id;
            const { orderId } = req.body;
            if (!orderId) {
                res.status(422).json({
                    success: false,
                    error: { code: "VALIDATION_ERROR", message: "orderId is required" },
                });
                return;
            }
            const session = await payments_service_js_1.paymentsService.createPaymentSession(userId, orderId);
            res.json({
                success: true,
                data: session,
            });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * GET /api/v1/payments/:paymentId/status
     * Fetch authoritative status of a payment.
     */
    async getPaymentStatus(req, res, next) {
        try {
            const userId = req.user.id;
            const paymentId = Array.isArray(req.params.paymentId) ? req.params.paymentId[0] : String(req.params.paymentId);
            const payment = await payments_service_js_1.paymentsService.verifyAndReconcilePayment(userId, paymentId);
            res.json({
                success: true,
                data: payment,
            });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * POST /api/v1/payments/webhooks/cashfree
     * Production Cashfree webhook endpoint with signature verification & idempotency.
     */
    async handleCashfreeWebhook(req, res, next) {
        try {
            const rawSig = req.headers["x-webhook-signature"] || req.headers["x-cashfree-signature"] || "";
            const rawTs = req.headers["x-webhook-timestamp"] || "";
            const signature = Array.isArray(rawSig) ? rawSig[0] : String(rawSig);
            const timestamp = Array.isArray(rawTs) ? rawTs[0] : String(rawTs);
            const rawBody = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
            const result = await payments_service_js_1.paymentsService.processWebhookInput({
                signature,
                timestamp,
                rawBody,
                headers: req.headers,
            });
            res.json(result);
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * POST /api/v1/payments/:paymentId/refund
     * Authorized admin/seller initiates refund.
     */
    async processRefund(req, res, next) {
        try {
            const userId = req.user.id;
            const paymentId = Array.isArray(req.params.paymentId) ? req.params.paymentId[0] : String(req.params.paymentId);
            const { amountPaise, reason } = req.body;
            const refund = await payments_service_js_1.paymentsService.processRefund(userId, paymentId, Number(amountPaise), reason);
            res.json({
                success: true,
                data: refund,
            });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.PaymentsController = PaymentsController;
exports.paymentsController = new PaymentsController();
