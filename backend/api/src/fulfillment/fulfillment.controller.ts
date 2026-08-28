// Floria API — Seller Fulfillment Controller
import { Request, Response, NextFunction } from "express";
import { fulfillmentService } from "./fulfillment.service.js";

export class FulfillmentController {
  async getMyFulfillments(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const sellerId = req.user!.sellerId!;
      const data = await fulfillmentService.getSellerFulfillments(sellerId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { masterOrderId, newStatus } = req.body;
      const sellerId = req.user!.sellerId!;
      const result = await fulfillmentService.updateStatus(
        req.user!.id,
        sellerId,
        masterOrderId,
        newStatus,
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}

export const fulfillmentController = new FulfillmentController();
