"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentsController = exports.PaymentsController = void 0;
const payments_service_js_1 = require("./payments.service.js");
class PaymentsController {
    async handleWebhook(req, res, next) {
        try {
            const eventId = req.body.eventId || req.headers["x-razorpay-event-id"] || req.body.id;
            const orderId = req.body.orderId || req.body.payload?.payment?.entity?.notes?.order_id;
            const amountPaise = req.body.amountPaise || req.body.payload?.payment?.entity?.amount;
            const status = req.body.status || req.body.event;
            const result = await payments_service_js_1.paymentsService.processWebhook({
                eventId: String(eventId),
                orderId: orderId ? String(orderId) : undefined,
                amountPaise: amountPaise ? Number(amountPaise) : undefined,
                status: status ? String(status) : undefined,
            });
            res.json(result);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.PaymentsController = PaymentsController;
exports.paymentsController = new PaymentsController();
