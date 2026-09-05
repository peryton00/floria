// Floria API — Internal Asynchronous Jobs Router (QStash Protected)
import { Router, Request, Response } from "express";
import { qstashService } from "./qstash.service.js";
import { Errors } from "../utils/errors.js";
import { orderRepository } from "../database/repositories/order.repository.js";
import { notificationService } from "../notifications/notification.service.js";

export function createInternalJobsRouter(): Router {
  const router = Router();

  // Middleware: Verify QStash Signature
  router.use(async (req: Request, _res: Response, next) => {
    const signature = (req.headers["upstash-signature"] ||
      req.headers["x-qstash-signature"]) as string;

    const rawBody = typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;

    const isValid = await qstashService.verifySignature(
      signature,
      rawBody,
      fullUrl,
    );

    if (!isValid) {
      return next(
        Errors.authRequired("Invalid or missing QStash webhook signature."),
      );
    }

    next();
  });

  // POST /api/v1/internal/jobs/order-confirmation
  router.post(
    "/order-confirmation",
    async (req: Request, res: Response, next) => {
      try {
        const { orderId } = req.body;
        if (!orderId) {
          throw Errors.validation("Missing required field 'orderId'.");
        }

        const order = await orderRepository.findById(orderId);
        if (!order) {
          throw Errors.notFound("Order");
        }

        // Dispatch notifications via centralized direct executor
        const { checkoutService } = await import(
          "../checkout/checkout.service.js"
        );
        await checkoutService.dispatchOrderPlacedNotificationsDirect(orderId);

        res.json({
          status: "success",
          job: "order-confirmation",
          orderId,
          processedAt: new Date().toISOString(),
        });
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
