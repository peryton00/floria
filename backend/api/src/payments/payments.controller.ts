// Floria API — Payments & Cashfree Controller
import { Request, Response, NextFunction } from "express";
import { paymentsService } from "./payments.service.js";

export class PaymentsController {
  /**
   * POST /api/v1/payments/create-session
   * Authenticated user creates or retrieves Cashfree payment session for an order.
   */
  async createPaymentSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { orderId } = req.body;

      if (!orderId) {
        res.status(422).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "orderId is required" },
        });
        return;
      }

      const session = await paymentsService.createPaymentSession(userId, orderId);
      res.json({
        success: true,
        data: session,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/payments/:paymentId/status
   * Fetch authoritative status of a payment.
   */
  async getPaymentStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const paymentId = Array.isArray(req.params.paymentId) ? req.params.paymentId[0] : String(req.params.paymentId);

      const payment = await paymentsService.verifyAndReconcilePayment(userId, paymentId);
      res.json({
        success: true,
        data: payment,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/payments/webhooks/cashfree
   * Production Cashfree webhook endpoint with signature verification & idempotency.
   */
  async handleCashfreeWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawSig = req.headers["x-webhook-signature"] || req.headers["x-cashfree-signature"] || "";
      const rawTs = req.headers["x-webhook-timestamp"] || "";
      const signature = Array.isArray(rawSig) ? rawSig[0] : String(rawSig);
      const timestamp = Array.isArray(rawTs) ? rawTs[0] : String(rawTs);
      const rawBody = typeof req.body === "string" ? req.body : JSON.stringify(req.body);

      const result = await paymentsService.processWebhookInput({
        signature,
        timestamp,
        rawBody,
        headers: req.headers as Record<string, string | string[] | undefined>,
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/payments/:paymentId/refund
   * Authorized admin/seller initiates refund.
   */
  async processRefund(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const paymentId = Array.isArray(req.params.paymentId) ? req.params.paymentId[0] : String(req.params.paymentId);
      const { amountPaise, reason } = req.body;

      const refund = await paymentsService.processRefund(userId, paymentId, Number(amountPaise), reason);
      res.json({
        success: true,
        data: refund,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/payments/admin/all
   * Authorized admin query to fetch transaction logs across all marketplace orders.
   */
  async getAdminTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = typeof req.query.status === "string" ? req.query.status : undefined;
      const search = typeof req.query.search === "string" ? req.query.search : undefined;
      const limit = typeof req.query.limit === "string" ? parseInt(req.query.limit, 10) : 100;

      const transactions = await paymentsService.getAdminTransactions({ status, search, limit });
      res.json({
        success: true,
        data: transactions,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const paymentsController = new PaymentsController();
