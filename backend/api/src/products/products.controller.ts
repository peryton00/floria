// Floria API — Products Controller
import { Request, Response, NextFunction } from "express";
import { productsService } from "./products.service.js";

export class ProductsController {
  async getProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categoryId = req.query.category_id as string | undefined;
      const search = req.query.search as string | undefined;
      const products = await productsService.getProducts(categoryId, search);
      res.json({ success: true, data: products });
    } catch (err) {
      next(err);
    }
  }

  async getProductBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await productsService.getProductBySlug(String(req.params.slug));
      res.json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  }
}

export const productsController = new ProductsController();
