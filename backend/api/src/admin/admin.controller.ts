// Floria API — Admin Controller
import { Request, Response, NextFunction } from "express";
import { adminService } from "./admin.service.js";
import os from "os";
import { getAdminDb } from "../config/database.js";

export class AdminController {
  async getHealth(_req: Request, res: Response): Promise<void> {
    try {
      const start = Date.now();
      const db = getAdminDb();
      
      // Ping DB and execute table count aggregations in parallel
      const [
        _,
        { count: productCount },
        { count: orderCount },
        { count: sellerCount },
        { count: userCount },
        { count: categoryCount },
        { count: auditLogCount },
        { count: pendingSellersCount },
        { count: preparingOrdersCount },
        { count: lowStockCount },
      ] = await Promise.all([
        db.from("categories").select("id").limit(1),
        db.from("products").select("*", { count: "exact", head: true }),
        db.from("orders").select("*", { count: "exact", head: true }),
        db.from("seller_profiles").select("*", { count: "exact", head: true }),
        db.from("user_profiles").select("*", { count: "exact", head: true }),
        db.from("categories").select("*", { count: "exact", head: true }),
        db.from("audit_logs").select("*", { count: "exact", head: true }),
        db.from("seller_profiles").select("*", { count: "exact", head: true }).eq("status", "pending"),
        db.from("seller_order_fulfillments").select("*", { count: "exact", head: true }).eq("status", "preparing"),
        db.from("inventory").select("*", { count: "exact", head: true }).lte("stock_quantity", 5),
      ]);

      const dbPing = Date.now() - start;

      const freeMem = os.freemem();
      const totalMem = os.totalmem();
      const usedMem = totalMem - freeMem;
      const memUsage = process.memoryUsage();

      res.json({
        success: true,
        data: {
          status: "healthy",
          role: _req.user!.role,
          system: {
            uptime: Math.round(os.uptime()),
            processUptime: Math.round(process.uptime()),
            platform: os.platform(),
            arch: os.arch(),
            cpuLoad: os.loadavg(),
            cpuCount: os.cpus().length,
            memory: {
              free: Math.round(freeMem / 1024 / 1024),
              total: Math.round(totalMem / 1024 / 1024),
              used: Math.round(usedMem / 1024 / 1024),
              percentage: parseFloat(((usedMem / totalMem) * 100).toFixed(1)),
            },
            processMemory: {
              rssMb: parseFloat((memUsage.rss / 1024 / 1024).toFixed(1)),
              heapTotalMb: parseFloat((memUsage.heapTotal / 1024 / 1024).toFixed(1)),
              heapUsedMb: parseFloat((memUsage.heapUsed / 1024 / 1024).toFixed(1)),
              externalMb: parseFloat((memUsage.external / 1024 / 1024).toFixed(1)),
            },
          },
          database: {
            status: "connected",
            latencyMs: dbPing,
            records: {
              products: productCount ?? 0,
              orders: orderCount ?? 0,
              sellers: sellerCount ?? 0,
              users: userCount ?? 0,
              categories: categoryCount ?? 0,
              auditLogs: auditLogCount ?? 0,
            },
          },
          operationalQueues: {
            pendingApplications: pendingSellersCount ?? 0,
            preparingOrders: preparingOrdersCount ?? 0,
            lowStockAlerts: lowStockCount ?? 0,
          },
        },
      });
    } catch (e: any) {
      res.status(500).json({
        success: false,
        error: { message: "System health check failed: " + e.message },
      });
    }
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

  async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await adminService.updateUser(req.user!.id, req.params.id as string, req.body);
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  }

  async updateSeller(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const seller = await adminService.updateSeller(req.user!.id, req.params.id as string, req.body);
      res.json({ success: true, data: seller });
    } catch (err) {
      next(err);
    }
  }

  async updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const prod = await adminService.updateProduct(req.user!.id, req.params.id as string, req.body);
      res.json({ success: true, data: prod });
    } catch (err) {
      next(err);
    }
  }

  async updateOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const order = await adminService.updateOrder(req.user!.id, req.params.id as string, req.body);
      res.json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  }
}

export const adminController = new AdminController();
