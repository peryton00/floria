// Floria API — Products Controller
import { Request, Response, NextFunction } from "express";
import { productsService } from "./products.service.js";
import { productRepository } from "../database/repositories/product.repository.js";
import { nurseryRepository } from "../database/repositories/nursery.repository.js";

export class ProductsController {
  async getProducts(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const categoryParam = (req.query.category ||
        req.query.category_id ||
        req.query.categoryId) as string | undefined;
      const sellerParam = (req.query.seller_id ||
        req.query.sellerId ||
        req.query.nursery_id ||
        req.query.nurseryId) as string | undefined;
      const search = req.query.search as string | undefined;
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const products = await productsService.getProducts(
        categoryParam,
        search,
        sellerParam,
        limit,
      );
      res.json({ success: true, data: products });
    } catch (err) {
      next(err);
    }
  }

  async getNurseryById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const sellerId = String(req.params.id);
      const { sellerRepository } = await import(
        "../database/repositories/seller.repository.js"
      );
      const nursery = await sellerRepository.findById(sellerId);
      if (!nursery) {
        res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Nursery not found." },
        });
        return;
      }
      res.json({ success: true, data: nursery });
    } catch (err) {
      next(err);
    }
  }

  async getProductBySlug(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const product = await productsService.getProductBySlug(
        String(req.params.slug),
      );
      res.json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  }
  async getRelated(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const product = await productRepository.findBySlug(
        String(req.params.slug),
      );
      if (!product) {
        res
          .status(404)
          .json({
            success: false,
            error: { code: "NOT_FOUND", message: "Product not found." },
          });
        return;
      }
      const related = await productsService.getRelated(
        product.product?.id ?? product.id,
        product.product?.category_id ?? product.category_id,
      );
      res.json({ success: true, data: related });
    } catch (err) {
      next(err);
    }
  }

  async getTrending(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const limit = Math.min(20, Number(req.query.limit) || 12);
      const products = await productsService.getTrending(limit);
      res.json({ success: true, data: products });
    } catch (err) {
      next(err);
    }
  }

  async getRankedNurseries(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const nurseries = await nurseryRepository.findRanked();
      res.json({ success: true, data: nurseries });
    } catch (err) {
      next(err);
    }
  }
}

export const productsController = new ProductsController();
