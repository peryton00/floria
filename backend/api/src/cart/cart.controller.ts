// Floria API — Cart Controller
import { Request, Response, NextFunction } from "express";
import { cartService } from "./cart.service.js";

export class CartController {
  async getCart(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const cart = await cartService.getCart(req.user!.id, req.token);
      res.json({ success: true, data: cart });
    } catch (err) {
      next(err);
    }
  }

  async addItem(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { productId, quantity } = req.body;
      const cart = await cartService.addItem(
        req.user!.id,
        productId,
        quantity || 1,
        req.token,
      );
      res.json({ success: true, data: cart });
    } catch (err) {
      next(err);
    }
  }

  async updateQuantity(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { productId } = req.params;
      const { quantity } = req.body;
      const cart = await cartService.updateQuantity(
        req.user!.id,
        String(productId),
        quantity,
        req.token,
      );
      res.json({ success: true, data: cart });
    } catch (err) {
      next(err);
    }
  }

  async removeItem(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { productId } = req.params;
      const cart = await cartService.removeItem(
        req.user!.id,
        String(productId),
        req.token,
      );
      res.json({ success: true, data: cart });
    } catch (err) {
      next(err);
    }
  }

  async clearCart(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const cart = await cartService.clearCart(req.user!.id, req.token);
      res.json({ success: true, data: cart });
    } catch (err) {
      next(err);
    }
  }

  async mergeCart(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { items } = req.body;
      const cart = await cartService.mergeCart(req.user!.id, items || [], req.token);
      res.json({ success: true, data: cart });
    } catch (err) {
      next(err);
    }
  }
}

export const cartController = new CartController();
