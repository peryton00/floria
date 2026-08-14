"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fulfillmentController = exports.FulfillmentController = void 0;
const fulfillment_service_js_1 = require("./fulfillment.service.js");
class FulfillmentController {
    async getMyFulfillments(req, res, next) {
        try {
            const sellerId = req.user.sellerId;
            const data = await fulfillment_service_js_1.fulfillmentService.getSellerFulfillments(sellerId);
            res.json({ success: true, data });
        }
        catch (err) {
            next(err);
        }
    }
    async updateStatus(req, res, next) {
        try {
            const { masterOrderId, newStatus } = req.body;
            const sellerId = req.user.sellerId;
            const result = await fulfillment_service_js_1.fulfillmentService.updateStatus(req.user.id, sellerId, masterOrderId, newStatus);
            res.json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.FulfillmentController = FulfillmentController;
exports.fulfillmentController = new FulfillmentController();
