// Floria API — Checkout Controller
import { Request, Response, NextFunction } from "express";
import { checkoutService } from "./checkout.service.js";

export class CheckoutController {
  async processCheckout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { addressId, address, paymentMethod } = req.body;
      const result = await checkoutService.processCheckout({
        userId: req.user!.id,
        addressId,
        address,
        paymentMethod: paymentMethod || "online",
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}

export const checkoutController = new CheckoutController();
