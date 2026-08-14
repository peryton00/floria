"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentsService = exports.PaymentsService = void 0;
// Floria API — Payments & Webhooks Idempotency Service
const database_js_1 = require("../config/database.js");
const audit_repository_js_1 = require("../database/repositories/audit.repository.js");
const processedWebhooks = new Set();
class PaymentsService {
    async processWebhook(payload) {
        const eventId = payload.eventId;
        if (!eventId) {
            return { success: false, idempotent: false, message: "Missing eventId" };
        }
        // 1. Idempotency Check (In-memory Set + DB check)
        if (processedWebhooks.has(eventId)) {
            return {
                success: true,
                idempotent: true,
                message: "Webhook event already processed",
            };
        }
        const db = (0, database_js_1.getAdminDb)();
        const { data: existingPayment } = await db
            .from("payments")
            .select("id")
            .eq("provider_payment_id", eventId)
            .maybeSingle();
        if (existingPayment) {
            processedWebhooks.add(eventId);
            return {
                success: true,
                idempotent: true,
                message: "Webhook event already recorded in database",
            };
        }
        // 2. Process First Delivery of Webhook
        processedWebhooks.add(eventId);
        if (payload.orderId) {
            await db.from("payments").insert({
                order_id: payload.orderId,
                provider: "razorpay",
                provider_payment_id: eventId,
                amount_paise: payload.amountPaise || 0,
                currency: "INR",
                status: "captured",
                webhook_verified: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            });
        }
        await audit_repository_js_1.auditRepository.log({
            actor_role: "system",
            action: "PAYMENT_WEBHOOK_PROCESSED",
            resource_type: "payment_webhook",
            resource_id: eventId,
            metadata: { orderId: payload.orderId, status: payload.status },
        });
        return {
            success: true,
            idempotent: false,
            message: "Webhook processed successfully",
        };
    }
}
exports.PaymentsService = PaymentsService;
exports.paymentsService = new PaymentsService();
