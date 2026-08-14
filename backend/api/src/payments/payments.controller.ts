// Floria API — Payments Controller
import { Request, Response, NextFunction } from "express";
import { paymentsService } from "./payments.service.js";

export class PaymentsController {
  async handleWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventId = req.body.eventId || req.headers["x-razorpay-event-id"] || req.body.id;
      const orderId = req.body.orderId || req.body.payload?.payment?.entity?.notes?.order_id;
      const amountPaise = req.body.amountPaise || req.body.payload?.payment?.entity?.amount;
      const status = req.body.status || req.body.event;

      const result = await paymentsService.processWebhook({
        eventId: String(eventId),
        orderId: orderId ? String(orderId) : undefined,
        amountPaise: amountPaise ? Number(amountPaise) : undefined,
        status: status ? String(status) : undefined,
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

export const paymentsController = new PaymentsController();
