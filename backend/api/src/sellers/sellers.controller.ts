// Floria API — Sellers Controller
import { Request, Response, NextFunction } from "express";
import { sellersService } from "./sellers.service.js";

export class SellersController {
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await sellersService.getProfile(req.user!.id);
      res.json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await sellersService.updateProfile(req.user!.id, req.body);
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  async submitApplication(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await sellersService.submitApplication(req.user!.id, req.body);
      res.json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  }

  async getApplication(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await sellersService.getApplication(req.user!.id);
      res.json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  }

  async getProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await sellersService.getProfile(req.user!.id);
      const search = typeof req.query.search === "string" ? req.query.search : undefined;
      const status = typeof req.query.status === "string" ? req.query.status : undefined;
      const stock = typeof req.query.stock === "string" ? req.query.stock : undefined;

      const products = await sellersService.getProducts(profile.id, { search, status, stock });
      res.json({ success: true, data: products });
    } catch (err) {
      next(err);
    }
  }

  async getProductById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await sellersService.getProfile(req.user!.id);
      const product = await sellersService.getProductById(profile.id, req.params.id as string);
      res.json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  }

  async createProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await sellersService.getProfile(req.user!.id);
      const product = await sellersService.createProduct(profile, req.body);
      res.status(201).json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  }

  async updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await sellersService.getProfile(req.user!.id);
      const product = await sellersService.updateProduct(profile, req.params.id as string, req.body);
      res.json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  }

  async updateProductStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await sellersService.getProfile(req.user!.id);
      const product = await sellersService.updateProductStatus(profile, req.params.id as string, req.body.status);
      res.json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  }

  async deleteProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await sellersService.getProfile(req.user!.id);
      const result = await sellersService.deleteProduct(profile, req.params.id as string);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getInventory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await sellersService.getProfile(req.user!.id);
      const inv = await sellersService.getInventory(profile.id);
      res.json({ success: true, data: inv });
    } catch (err) {
      next(err);
    }
  }

  async updateInventory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await sellersService.getProfile(req.user!.id);
      const inv = await sellersService.updateInventory(profile, req.params.productId as string, req.body);
      res.json({ success: true, data: inv });
    } catch (err) {
      next(err);
    }
  }

  async getOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await sellersService.getProfile(req.user!.id);
      const search = typeof req.query.search === "string" ? req.query.search : undefined;
      const status = typeof req.query.status === "string" ? req.query.status : undefined;

      const orders = await sellersService.getOrders(profile.id, { search, status });
      res.json({ success: true, data: orders });
    } catch (err) {
      next(err);
    }
  }

  async getOrderById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await sellersService.getProfile(req.user!.id);
      const order = await sellersService.getOrderById(profile.id, req.params.id as string);
      res.json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  }

  async updateFulfillment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await sellersService.getProfile(req.user!.id);
      const masterOrderId = req.body.masterOrderId || req.params.orderId;
      const newStatus = req.body.newStatus || req.body.status;

      const orderView = await sellersService.updateFulfillment(profile, masterOrderId, newStatus);
      res.json({ success: true, data: orderView });
    } catch (err) {
      next(err);
    }
  }

  async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await sellersService.getProfile(req.user!.id);
      const stats = await sellersService.getDashboard(profile.id);
      res.json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  }
}

export const sellersController = new SellersController();
