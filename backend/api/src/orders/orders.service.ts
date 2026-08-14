// Floria API — Orders Service
import { orderRepository } from "../database/repositories/order.repository.js";
import { Errors } from "../utils/errors.js";

export class OrdersService {
  async getCustomerOrders(userId: string) {
    return orderRepository.findByCustomerId(userId);
  }

  async getOrderById(userId: string, userRole: string, orderId: string) {
    const order = await orderRepository.findById(orderId);
    if (!order) throw Errors.notFound("Order");

    // Access control
    if (userRole === "customer" && order.customer_id !== userId) {
      throw Errors.forbidden("You do not have permission to view this order.");
    }

    return order;
  }
}

export const ordersService = new OrdersService();
