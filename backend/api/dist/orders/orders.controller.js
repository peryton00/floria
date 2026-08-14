"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ordersController = exports.OrdersController = void 0;
const orders_service_js_1 = require("./orders.service.js");
class OrdersController {
    async getMyOrders(req, res, next) {
        try {
            const orders = await orders_service_js_1.ordersService.getCustomerOrders(req.user.id);
            res.json({ success: true, data: orders });
        }
        catch (err) {
            next(err);
        }
    }
    async getOrderById(req, res, next) {
        try {
            const order = await orders_service_js_1.ordersService.getOrderById(req.user.id, req.user.role, String(req.params.id));
            res.json({ success: true, data: order });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.OrdersController = OrdersController;
exports.ordersController = new OrdersController();
