// Floria API — Wishlist Controller
import { Request, Response, NextFunction } from "express";
import { wishlistService } from "./wishlist.service.js";

export class WishlistController {
  async getWishlist(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const wishlist = await wishlistService.getWishlist(req.user!.id);
      res.json({ success: true, data: wishlist });
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
      const { productId } = req.body;
      const wishlist = await wishlistService.addItem(req.user!.id, productId);
      res.json({ success: true, data: wishlist });
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
      const wishlist = await wishlistService.removeItem(
        req.user!.id,
        String(productId),
      );
      res.json({ success: true, data: wishlist });
    } catch (err) {
      next(err);
    }
  }

  async mergeWishlist(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { productIds } = req.body;
      const wishlist = await wishlistService.mergeWishlist(
        req.user!.id,
        productIds || [],
      );
      res.json({ success: true, data: wishlist });
    } catch (err) {
      next(err);
    }
  }
}

export const wishlistController = new WishlistController();
