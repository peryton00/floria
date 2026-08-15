// Floria API — Admin Controller
import { Request, Response, NextFunction } from "express";
import { adminService } from "./admin.service.js";

export class AdminController {
  async getHealth(_req: Request, res: Response): Promise<void> {
    res.json({ success: true, data: { status: "healthy", role: _req.user!.role } });
  }

  async getDashboard(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await adminService.getDashboard();
      res.json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  }

  async getAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const range = req.query.range as string | undefined;
      const data = await adminService.getAnalytics({ range });
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getUsers(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await adminService.getUsers();
      res.json({ success: true, data: users });
    } catch (err) {
      next(err);
    }
  }

  async getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await adminService.getUserById(req.params.id as string);
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  }

  async updateUserStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await adminService.updateUserStatus(req.user!.id, req.params.id as string, req.body.status, req.body.rationale);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getSellers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = req.query.status as string | undefined;
      const sellers = await adminService.getSellers(status);
      res.json({ success: true, data: sellers });
    } catch (err) {
      next(err);
    }
  }

  async getSellerById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const seller = await adminService.getSellerById(req.params.id as string);
      res.json({ success: true, data: seller });
    } catch (err) {
      next(err);
    }
  }

  async approveSeller(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await adminService.updateSellerStatus(req.user!.id, req.params.id as string, "approved");
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async rejectSeller(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await adminService.updateSellerStatus(req.user!.id, req.params.id as string, "rejected");
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async suspendSeller(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await adminService.updateSellerStatus(req.user!.id, req.params.id as string, "suspended");
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async reactivateSeller(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await adminService.updateSellerStatus(req.user!.id, req.params.id as string, "approved");
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getSellerDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const docs = await adminService.getSellerDocuments(req.params.id as string);
      res.json({ success: true, data: docs });
    } catch (err) {
      next(err);
    }
  }

  async getProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const search = typeof req.query.search === "string" ? req.query.search : undefined;
      const status = typeof req.query.status === "string" ? req.query.status : undefined;
      const categoryId = typeof req.query.categoryId === "string" ? req.query.categoryId : undefined;
      const sellerId = typeof req.query.sellerId === "string" ? req.query.sellerId : undefined;

      const prods = await adminService.getProducts({ search, status, categoryId, sellerId });
      res.json({ success: true, data: prods });
    } catch (err) {
      next(err);
    }
  }

  async getProductById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const prod = await adminService.getProductById(req.params.id as string);
      res.json({ success: true, data: prod });
    } catch (err) {
      next(err);
    }
  }

  async updateProductStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await adminService.updateProductStatus(req.user!.id, req.params.id as string, req.body.status);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async publishProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await adminService.updateProductStatus(req.user!.id, req.params.id as string, "active");
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async unpublishProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await adminService.updateProductStatus(req.user!.id, req.params.id as string, "inactive");
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async archiveProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await adminService.updateProductStatus(req.user!.id, req.params.id as string, "deleted");
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cats = await adminService.getCategories();
      res.json({ success: true, data: cats });
    } catch (err) {
      next(err);
    }
  }

  async getCategoryProductsCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const count = await adminService.getCategoryProductsCount(req.params.id as string);
      res.json({ success: true, data: count });
    } catch (err) {
      next(err);
    }
  }

  async createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cat = await adminService.createCategory(req.user!.id, req.body);
      res.status(201).json({ success: true, data: cat });
    } catch (err) {
      next(err);
    }
  }

  async updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cat = await adminService.updateCategory(req.user!.id, req.params.id as string, req.body);
      res.json({ success: true, data: cat });
    } catch (err) {
      next(err);
    }
  }

  async getOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const search = typeof req.query.search === "string" ? req.query.search : undefined;
      const status = typeof req.query.status === "string" ? req.query.status : undefined;
      const orders = await adminService.getOrders(req.user!.id, { search, status });
      res.json({ success: true, data: orders });
    } catch (err) {
      next(err);
    }
  }

  async getOrderById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const order = await adminService.getOrderById(req.user!.id, req.params.id as string);
      res.json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  }

  async getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const role = typeof req.query.role === "string" ? req.query.role : undefined;
      const action = typeof req.query.action === "string" ? req.query.action : undefined;
      const actorId = typeof req.query.actorId === "string" ? req.query.actorId : undefined;

      const logs = await adminService.getAuditLogs({ role, action, actorId });
      res.json({ success: true, data: logs });
    } catch (err) {
      next(err);
    }
  }

  async getSettings(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { settingsRepository } = await import("../database/repositories/settings.repository.js");
      const commissionRate = await settingsRepository.getCommissionRate();
      res.json({
        success: true,
        data: {
          commissionRate,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async updateCommissionRate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { settingsRepository } = await import("../database/repositories/settings.repository.js");
      const rate = Number(req.body.commissionRate);
      const updatedRate = await settingsRepository.updateCommissionRate(rate, req.user!.id);
      res.json({
        success: true,
        data: {
          commissionRate: updatedRate,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const adminController = new AdminController();
