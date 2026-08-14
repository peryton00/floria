// Floria API — Categories Controller
import { Request, Response, NextFunction } from "express";
import { categoriesService } from "./categories.service.js";

export class CategoriesController {
  async getCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await categoriesService.getCategories();
      res.json({ success: true, data: categories });
    } catch (err) {
      next(err);
    }
  }

  async getCategoryBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await categoriesService.getCategoryBySlug(String(req.params.slug));
      res.json({ success: true, data: category });
    } catch (err) {
      next(err);
    }
  }
}

export const categoriesController = new CategoriesController();
