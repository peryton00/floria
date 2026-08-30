// Floria API — Sellers Controller
import { Request, Response, NextFunction } from "express";
import { sellersService } from "./sellers.service.js";
import { sellerAuthService } from "./seller-auth.service.js";

export class SellersController {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { identifier, password } = req.body;
      if (!identifier || !password) {
        res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Email or Seller ID and password are required." },
        });
        return;
      }
      const result = await sellerAuthService.login(identifier, password);
      res.json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      if (err.code && err.statusCode) {
        res.status(err.statusCode).json({
          success: false,
          error: { code: err.code, message: err.message, data: err.data },
        });
        return;
      }
      next(err);
    }
  }

  async apply(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await sellerAuthService.submitApplication(req.body);
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { identifier } = req.body;
      if (!identifier) {
        res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Email or Seller ID is required." },
        });
        return;
      }
      const result = await sellerAuthService.requestPasswordReset(identifier);
      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, password } = req.body;
      if (!token || !password) {
        res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Reset token and new password are required." },
        });
        return;
      }
      const result = await sellerAuthService.resetPassword(token, password);
      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getApplicationStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sellerId = req.user?.sellerId || (req.query.sellerId as string);
      if (!sellerId) {
        res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Seller ID is required." },
        });
        return;
      }
      const application = await sellerAuthService.getApplicationStatus(sellerId);
      res.json({
        success: true,
        data: application,
      });
    } catch (err) {
      next(err);
    }
  }

  async resubmitApplication(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sellerId = req.user?.sellerId || req.body.sellerId;
      if (!sellerId) {
        res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Seller ID is required." },
        });
        return;
      }
      const result = await sellerAuthService.resubmitApplication(sellerId, req.body);
      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getProfile(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const profile = await sellersService.getProfile(req.user!.id);
      res.json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const updated = await sellersService.updateProfile(
        req.user!.id,
        req.body,
      );
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  async submitApplication(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // If user provided password & username, route to sellerAuthService
      if (req.body.password && req.body.username) {
        const result = await sellerAuthService.submitApplication(req.body);
        res.status(201).json({ success: true, data: result });
        return;
      }

      const profile = await sellersService.submitApplication(
        req.user!.id,
        req.body,
      );
      res.json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  }

  async getApplication(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const profile = await sellersService.getApplication(req.user!.id);
      res.json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  }

  async getProducts(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const profile = await sellersService.getProfile(req.user!.id);
      const search =
        typeof req.query.search === "string" ? req.query.search : undefined;
      const status =
        typeof req.query.status === "string" ? req.query.status : undefined;
      const stock =
        typeof req.query.stock === "string" ? req.query.stock : undefined;

      const products = await sellersService.getProducts(profile.id, {
        search,
        status,
        stock,
      });
      res.json({ success: true, data: products });
    } catch (err) {
      next(err);
    }
  }

  async getProductById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const profile = await sellersService.getProfile(req.user!.id);
      const product = await sellersService.getProductById(
        profile.id,
        req.params.id as string,
      );
      res.json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  }

  async createProduct(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const profile = await sellersService.getProfile(req.user!.id);
      const product = await sellersService.createProduct(profile, req.body);
      res.status(201).json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  }

  async updateProduct(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const profile = await sellersService.getProfile(req.user!.id);
      const product = await sellersService.updateProduct(
        profile,
        req.params.id as string,
        req.body,
      );
      res.json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  }

  async updateProductStatus(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const profile = await sellersService.getProfile(req.user!.id);
      const product = await sellersService.updateProductStatus(
        profile,
        req.params.id as string,
        req.body.status,
      );
      res.json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  }

  async deleteProduct(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const profile = await sellersService.getProfile(req.user!.id);
      const result = await sellersService.deleteProduct(
        profile,
        req.params.id as string,
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async attachProductImage(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const profile = await sellersService.getProfile(req.user!.id);
      const product = await sellersService.attachProductImage(
        profile,
        req.params.productId as string,
        req.body,
      );
      res.status(201).json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  }

  async removeProductImage(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const profile = await sellersService.getProfile(req.user!.id);
      const product = await sellersService.removeProductImage(
        profile,
        req.params.productId as string,
        req.params.imageId as string,
      );
      res.json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  }

  async reorderProductImages(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const profile = await sellersService.getProfile(req.user!.id);
      const product = await sellersService.reorderProductImages(
        profile,
        req.params.productId as string,
        req.body.imageOrders,
      );
      res.json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  }

  async setPrimaryProductImage(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const profile = await sellersService.getProfile(req.user!.id);
      const product = await sellersService.setPrimaryProductImage(
        profile,
        req.params.productId as string,
        req.params.imageId as string,
      );
      res.json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  }

  async replaceProductImage(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const profile = await sellersService.getProfile(req.user!.id);
      const product = await sellersService.replaceProductImage(
        profile,
        req.params.productId as string,
        req.params.imageId as string,
        req.body,
      );
      res.json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  }

  async getInventory(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const profile = await sellersService.getProfile(req.user!.id);
      const inv = await sellersService.getInventory(profile.id);
      res.json({ success: true, data: inv });
    } catch (err) {
      next(err);
    }
  }

  async updateInventory(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const profile = await sellersService.getProfile(req.user!.id);
      const inv = await sellersService.updateInventory(
        profile,
        req.params.productId as string,
        req.body,
      );
      res.json({ success: true, data: inv });
    } catch (err) {
      next(err);
    }
  }

  async getOrders(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const profile = await sellersService.getProfile(req.user!.id);
      const search =
        typeof req.query.search === "string" ? req.query.search : undefined;
      const status =
        typeof req.query.status === "string" ? req.query.status : undefined;

      const orders = await sellersService.getOrders(profile.id, {
        search,
        status,
      });
      res.json({ success: true, data: orders });
    } catch (err) {
      next(err);
    }
  }

  async getOrderById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const profile = await sellersService.getProfile(req.user!.id);
      const order = await sellersService.getOrderById(
        profile.id,
        req.params.id as string,
      );
      res.json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  }

  async updateFulfillment(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const profile = await sellersService.getProfile(req.user!.id);
      const masterOrderId = req.body.masterOrderId || req.params.orderId;
      const newStatus = req.body.newStatus || req.body.status;

      const orderView = await sellersService.updateFulfillment(
        profile,
        masterOrderId,
        newStatus,
      );
      res.json({ success: true, data: orderView });
    } catch (err) {
      next(err);
    }
  }

  async getDashboard(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const profile = await sellersService.getProfile(req.user!.id);
      const stats = await sellersService.getDashboard(profile.id);
      res.json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  }

  async getEarnings(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const profile = await sellersService.getProfile(req.user!.id);
      const earnings = await sellersService.getEarnings(profile.id);
      res.json({ success: true, data: earnings });
    } catch (err) {
      next(err);
    }
  }

  async getPayouts(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const profile = await sellersService.getProfile(req.user!.id);
      const payouts = await sellersService.getPayouts(profile.id);
      res.json({ success: true, data: payouts });
    } catch (err) {
      next(err);
    }
  }

  async getAnalytics(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const profile = await sellersService.getProfile(req.user!.id);
      const range =
        typeof req.query.range === "string" ? req.query.range : "30d";
      const stats = await sellersService.getAnalytics(profile.id, range);
      res.json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  }

  async getDocuments(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const profile = await sellersService.getProfile(req.user!.id);
      const docs = await sellersService.getDocuments(profile.id);
      res.json({ success: true, data: docs });
    } catch (err) {
      next(err);
    }
  }

  async uploadDocument(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const profile = await sellersService.getProfile(req.user!.id);
      const doc = await sellersService.uploadDocument(profile.id, req.body);
      res.json({ success: true, data: doc });
    } catch (err) {
      next(err);
    }
  }

  async getNotificationSettings(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const profile = await sellersService.getProfile(req.user!.id);
      const settings = await sellersService.getNotificationSettings(profile.id);
      res.json({ success: true, data: settings });
    } catch (err) {
      next(err);
    }
  }

  async updateNotificationSettings(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const profile = await sellersService.getProfile(req.user!.id);
      const updated = await sellersService.updateNotificationSettings(
        profile.id,
        req.body,
      );
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  async getFinancialSettings(
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { pricingService } = await import("../pricing/pricing.service.js");
      const settings = await pricingService.getFinancialSettings();
      res.json({ success: true, data: settings });
    } catch (err) {
      next(err);
    }
  }
}

export const sellersController = new SellersController();
