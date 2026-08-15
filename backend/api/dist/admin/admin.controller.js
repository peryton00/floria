"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminController = exports.AdminController = void 0;
const admin_service_js_1 = require("./admin.service.js");
const os_1 = __importDefault(require("os"));
const database_js_1 = require("../config/database.js");
class AdminController {
    async getHealth(_req, res) {
        try {
            const start = Date.now();
            const db = (0, database_js_1.getAdminDb)();
            await db.from("categories").select("id").limit(1);
            const dbPing = Date.now() - start;
            const freeMem = os_1.default.freemem();
            const totalMem = os_1.default.totalmem();
            const usedMem = totalMem - freeMem;
            res.json({
                success: true,
                data: {
                    status: "healthy",
                    role: _req.user.role,
                    system: {
                        uptime: Math.round(os_1.default.uptime()),
                        processUptime: Math.round(process.uptime()),
                        platform: os_1.default.platform(),
                        arch: os_1.default.arch(),
                        cpuLoad: os_1.default.loadavg(),
                        cpuCount: os_1.default.cpus().length,
                        memory: {
                            free: Math.round(freeMem / 1024 / 1024),
                            total: Math.round(totalMem / 1024 / 1024),
                            used: Math.round(usedMem / 1024 / 1024),
                            percentage: parseFloat(((usedMem / totalMem) * 100).toFixed(1)),
                        },
                    },
                    database: {
                        status: "connected",
                        latencyMs: dbPing,
                    },
                },
            });
        }
        catch (e) {
            res.status(500).json({
                success: false,
                error: { message: "System health check failed: " + e.message },
            });
        }
    }
    async getDashboard(_req, res, next) {
        try {
            const stats = await admin_service_js_1.adminService.getDashboard();
            res.json({ success: true, data: stats });
        }
        catch (err) {
            next(err);
        }
    }
    async getAnalytics(req, res, next) {
        try {
            const range = req.query.range;
            const data = await admin_service_js_1.adminService.getAnalytics({ range });
            res.json({ success: true, data });
        }
        catch (err) {
            next(err);
        }
    }
    async getUsers(_req, res, next) {
        try {
            const users = await admin_service_js_1.adminService.getUsers();
            res.json({ success: true, data: users });
        }
        catch (err) {
            next(err);
        }
    }
    async getUserById(req, res, next) {
        try {
            const user = await admin_service_js_1.adminService.getUserById(req.params.id);
            res.json({ success: true, data: user });
        }
        catch (err) {
            next(err);
        }
    }
    async updateUserStatus(req, res, next) {
        try {
            const result = await admin_service_js_1.adminService.updateUserStatus(req.user.id, req.params.id, req.body.status, req.body.rationale);
            res.json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    }
    async getSellers(req, res, next) {
        try {
            const status = req.query.status;
            const sellers = await admin_service_js_1.adminService.getSellers(status);
            res.json({ success: true, data: sellers });
        }
        catch (err) {
            next(err);
        }
    }
    async getSellerById(req, res, next) {
        try {
            const seller = await admin_service_js_1.adminService.getSellerById(req.params.id);
            res.json({ success: true, data: seller });
        }
        catch (err) {
            next(err);
        }
    }
    async approveSeller(req, res, next) {
        try {
            const result = await admin_service_js_1.adminService.updateSellerStatus(req.user.id, req.params.id, "approved");
            res.json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    }
    async rejectSeller(req, res, next) {
        try {
            const result = await admin_service_js_1.adminService.updateSellerStatus(req.user.id, req.params.id, "rejected");
            res.json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    }
    async suspendSeller(req, res, next) {
        try {
            const result = await admin_service_js_1.adminService.updateSellerStatus(req.user.id, req.params.id, "suspended");
            res.json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    }
    async reactivateSeller(req, res, next) {
        try {
            const result = await admin_service_js_1.adminService.updateSellerStatus(req.user.id, req.params.id, "approved");
            res.json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    }
    async getSellerDocuments(req, res, next) {
        try {
            const docs = await admin_service_js_1.adminService.getSellerDocuments(req.params.id);
            res.json({ success: true, data: docs });
        }
        catch (err) {
            next(err);
        }
    }
    async getProducts(req, res, next) {
        try {
            const search = typeof req.query.search === "string" ? req.query.search : undefined;
            const status = typeof req.query.status === "string" ? req.query.status : undefined;
            const categoryId = typeof req.query.categoryId === "string" ? req.query.categoryId : undefined;
            const sellerId = typeof req.query.sellerId === "string" ? req.query.sellerId : undefined;
            const prods = await admin_service_js_1.adminService.getProducts({ search, status, categoryId, sellerId });
            res.json({ success: true, data: prods });
        }
        catch (err) {
            next(err);
        }
    }
    async getProductById(req, res, next) {
        try {
            const prod = await admin_service_js_1.adminService.getProductById(req.params.id);
            res.json({ success: true, data: prod });
        }
        catch (err) {
            next(err);
        }
    }
    async updateProductStatus(req, res, next) {
        try {
            const result = await admin_service_js_1.adminService.updateProductStatus(req.user.id, req.params.id, req.body.status);
            res.json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    }
    async publishProduct(req, res, next) {
        try {
            const result = await admin_service_js_1.adminService.updateProductStatus(req.user.id, req.params.id, "active");
            res.json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    }
    async unpublishProduct(req, res, next) {
        try {
            const result = await admin_service_js_1.adminService.updateProductStatus(req.user.id, req.params.id, "inactive");
            res.json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    }
    async archiveProduct(req, res, next) {
        try {
            const result = await admin_service_js_1.adminService.updateProductStatus(req.user.id, req.params.id, "deleted");
            res.json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    }
    async getCategories(_req, res, next) {
        try {
            const cats = await admin_service_js_1.adminService.getCategories();
            res.json({ success: true, data: cats });
        }
        catch (err) {
            next(err);
        }
    }
    async getCategoryProductsCount(req, res, next) {
        try {
            const count = await admin_service_js_1.adminService.getCategoryProductsCount(req.params.id);
            res.json({ success: true, data: count });
        }
        catch (err) {
            next(err);
        }
    }
    async createCategory(req, res, next) {
        try {
            const cat = await admin_service_js_1.adminService.createCategory(req.user.id, req.body);
            res.status(201).json({ success: true, data: cat });
        }
        catch (err) {
            next(err);
        }
    }
    async updateCategory(req, res, next) {
        try {
            const cat = await admin_service_js_1.adminService.updateCategory(req.user.id, req.params.id, req.body);
            res.json({ success: true, data: cat });
        }
        catch (err) {
            next(err);
        }
    }
    async getOrders(req, res, next) {
        try {
            const search = typeof req.query.search === "string" ? req.query.search : undefined;
            const status = typeof req.query.status === "string" ? req.query.status : undefined;
            const orders = await admin_service_js_1.adminService.getOrders(req.user.id, { search, status });
            res.json({ success: true, data: orders });
        }
        catch (err) {
            next(err);
        }
    }
    async getOrderById(req, res, next) {
        try {
            const order = await admin_service_js_1.adminService.getOrderById(req.user.id, req.params.id);
            res.json({ success: true, data: order });
        }
        catch (err) {
            next(err);
        }
    }
    async getAuditLogs(req, res, next) {
        try {
            const role = typeof req.query.role === "string" ? req.query.role : undefined;
            const action = typeof req.query.action === "string" ? req.query.action : undefined;
            const actorId = typeof req.query.actorId === "string" ? req.query.actorId : undefined;
            const logs = await admin_service_js_1.adminService.getAuditLogs({ role, action, actorId });
            res.json({ success: true, data: logs });
        }
        catch (err) {
            next(err);
        }
    }
    async getSettings(_req, res, next) {
        try {
            const { settingsRepository } = await import("../database/repositories/settings.repository.js");
            const commissionRate = await settingsRepository.getCommissionRate();
            res.json({
                success: true,
                data: {
                    commissionRate,
                },
            });
        }
        catch (err) {
            next(err);
        }
    }
    async updateCommissionRate(req, res, next) {
        try {
            const { settingsRepository } = await import("../database/repositories/settings.repository.js");
            const rate = Number(req.body.commissionRate);
            const updatedRate = await settingsRepository.updateCommissionRate(rate, req.user.id);
            res.json({
                success: true,
                data: {
                    commissionRate: updatedRate,
                },
            });
        }
        catch (err) {
            next(err);
        }
    }
    async updateUser(req, res, next) {
        try {
            const user = await admin_service_js_1.adminService.updateUser(req.user.id, req.params.id, req.body);
            res.json({ success: true, data: user });
        }
        catch (err) {
            next(err);
        }
    }
    async updateSeller(req, res, next) {
        try {
            const seller = await admin_service_js_1.adminService.updateSeller(req.user.id, req.params.id, req.body);
            res.json({ success: true, data: seller });
        }
        catch (err) {
            next(err);
        }
    }
    async updateProduct(req, res, next) {
        try {
            const prod = await admin_service_js_1.adminService.updateProduct(req.user.id, req.params.id, req.body);
            res.json({ success: true, data: prod });
        }
        catch (err) {
            next(err);
        }
    }
    async updateOrder(req, res, next) {
        try {
            const order = await admin_service_js_1.adminService.updateOrder(req.user.id, req.params.id, req.body);
            res.json({ success: true, data: order });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.AdminController = AdminController;
exports.adminController = new AdminController();
