"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkoutController = exports.CheckoutController = void 0;
const checkout_service_js_1 = require("./checkout.service.js");
class CheckoutController {
    async processCheckout(req, res, next) {
        try {
            const { addressId, address, paymentMethod } = req.body;
            const result = await checkout_service_js_1.checkoutService.processCheckout({
                userId: req.user.id,
                addressId,
                address,
                paymentMethod: paymentMethod || "online",
            });
            res.json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.CheckoutController = CheckoutController;
exports.checkoutController = new CheckoutController();
