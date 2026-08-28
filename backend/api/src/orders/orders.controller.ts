// Floria API — Orders Controller
import { Request, Response, NextFunction } from "express";
import { ordersService } from "./orders.service.js";

export class OrdersController {
  async getMyOrders(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const orders = await ordersService.getCustomerOrders(req.user!.id);
      res.json({ success: true, data: orders });
    } catch (err) {
      next(err);
    }
  }

  async getOrderById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const order = await ordersService.getOrderById(
        req.user!.id,
        req.user!.role,
        String(req.params.id),
      );
      res.json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  }
}

export const ordersController = new OrdersController();
