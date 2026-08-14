"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ordersService = exports.OrdersService = void 0;
// Floria API — Orders Service
const order_repository_js_1 = require("../database/repositories/order.repository.js");
const errors_js_1 = require("../utils/errors.js");
class OrdersService {
    async getCustomerOrders(userId) {
        return order_repository_js_1.orderRepository.findByCustomerId(userId);
    }
    async getOrderById(userId, userRole, orderId) {
        const order = await order_repository_js_1.orderRepository.findById(orderId);
        if (!order)
            throw errors_js_1.Errors.notFound("Order");
        // Access control
        if (userRole === "customer" && order.customer_id !== userId) {
            throw errors_js_1.Errors.forbidden("You do not have permission to view this order.");
        }
        return order;
    }
}
exports.OrdersService = OrdersService;
exports.ordersService = new OrdersService();
