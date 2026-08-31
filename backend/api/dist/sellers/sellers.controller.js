"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sellersController = exports.SellersController = void 0;
const sellers_service_js_1 = require("./sellers.service.js");
const seller_auth_service_js_1 = require("./seller-auth.service.js");
const getTargetSellerId = (req) => req.user?.sellerId || req.user?.id || "";
class SellersController {
    async login(req, res, next) {
        try {
            const { identifier, password } = req.body;
            if (!identifier || !password) {
                res.status(400).json({
                    success: false,
                    error: { code: "VALIDATION_ERROR", message: "Email or Seller ID and password are required." },
                });
                return;
            }
            const result = await seller_auth_service_js_1.sellerAuthService.login(identifier, password);
            res.json({
                success: true,
                data: result,
            });
        }
        catch (err) {
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
    async apply(req, res, next) {
        try {
            const result = await seller_auth_service_js_1.sellerAuthService.submitApplication(req.body);
            res.status(201).json({
                success: true,
                data: result,
            });
        }
        catch (err) {
            next(err);
        }
    }
    async forgotPassword(req, res, next) {
        try {
            const { identifier } = req.body;
            if (!identifier) {
                res.status(400).json({
                    success: false,
                    error: { code: "VALIDATION_ERROR", message: "Email or Seller ID is required." },
                });
                return;
            }
            const result = await seller_auth_service_js_1.sellerAuthService.requestPasswordReset(identifier);
            res.json({
                success: true,
                data: result,
            });
        }
        catch (err) {
            next(err);
        }
    }
    async resetPassword(req, res, next) {
        try {
            const { token, password } = req.body;
            if (!token || !password) {
                res.status(400).json({
                    success: false,
                    error: { code: "VALIDATION_ERROR", message: "Reset token and new password are required." },
                });
                return;
            }
            const result = await seller_auth_service_js_1.sellerAuthService.resetPassword(token, password);
            res.json({
                success: true,
                data: result,
            });
        }
        catch (err) {
            next(err);
        }
    }
    async getApplicationStatus(req, res, next) {
        try {
            const sellerId = req.user?.sellerId || req.query.sellerId;
            if (!sellerId) {
                res.status(400).json({
                    success: false,
                    error: { code: "VALIDATION_ERROR", message: "Seller ID is required." },
                });
                return;
            }
            const application = await seller_auth_service_js_1.sellerAuthService.getApplicationStatus(sellerId);
            res.json({
                success: true,
                data: application,
            });
        }
        catch (err) {
            next(err);
        }
    }
    async resubmitApplication(req, res, next) {
        try {
            const sellerId = req.user?.sellerId || req.body.sellerId;
            if (!sellerId) {
                res.status(400).json({
                    success: false,
                    error: { code: "VALIDATION_ERROR", message: "Seller ID is required." },
                });
                return;
            }
            const result = await seller_auth_service_js_1.sellerAuthService.resubmitApplication(sellerId, req.body);
            res.json({
                success: true,
                data: result,
            });
        }
        catch (err) {
            next(err);
        }
    }
    async getProfile(req, res, next) {
        try {
            const profile = await sellers_service_js_1.sellersService.getProfile(getTargetSellerId(req));
            res.json({ success: true, data: profile });
        }
        catch (err) {
            next(err);
        }
    }
    async updateProfile(req, res, next) {
        try {
            const updated = await sellers_service_js_1.sellersService.updateProfile(getTargetSellerId(req), req.body);
            res.json({ success: true, data: updated });
        }
        catch (err) {
            next(err);
        }
    }
    async submitApplication(req, res, next) {
        try {
            // If user provided password & username, route to sellerAuthService
            if (req.body.password && req.body.username) {
                const result = await seller_auth_service_js_1.sellerAuthService.submitApplication(req.body);
                res.status(201).json({ success: true, data: result });
                return;
            }
            const profile = await sellers_service_js_1.sellersService.submitApplication(getTargetSellerId(req), req.body);
            res.json({ success: true, data: profile });
        }
        catch (err) {
            next(err);
        }
    }
    async getApplication(req, res, next) {
        try {
            const profile = await sellers_service_js_1.sellersService.getApplication(getTargetSellerId(req));
            res.json({ success: true, data: profile });
        }
        catch (err) {
            next(err);
        }
    }
    async getProducts(req, res, next) {
        try {
            const profile = await sellers_service_js_1.sellersService.getProfile(getTargetSellerId(req));
            const search = typeof req.query.search === "string" ? req.query.search : undefined;
            const status = typeof req.query.status === "string" ? req.query.status : undefined;
            const stock = typeof req.query.stock === "string" ? req.query.stock : undefined;
            const products = await sellers_service_js_1.sellersService.getProducts(profile.id, {
                search,
                status,
                stock,
            });
            res.json({ success: true, data: products });
        }
        catch (err) {
            next(err);
        }
    }
    async getProductById(req, res, next) {
        try {
            const profile = await sellers_service_js_1.sellersService.getProfile(getTargetSellerId(req));
            const product = await sellers_service_js_1.sellersService.getProductById(profile.id, req.params.id);
            res.json({ success: true, data: product });
        }
        catch (err) {
            next(err);
        }
    }
    async createProduct(req, res, next) {
        try {
            const profile = await sellers_service_js_1.sellersService.getProfile(getTargetSellerId(req));
            const product = await sellers_service_js_1.sellersService.createProduct(profile, req.body);
            res.status(201).json({ success: true, data: product });
        }
        catch (err) {
            next(err);
        }
    }
    async updateProduct(req, res, next) {
        try {
            const profile = await sellers_service_js_1.sellersService.getProfile(getTargetSellerId(req));
            const product = await sellers_service_js_1.sellersService.updateProduct(profile, req.params.id, req.body);
            res.json({ success: true, data: product });
        }
        catch (err) {
            next(err);
        }
    }
    async updateProductStatus(req, res, next) {
        try {
            const profile = await sellers_service_js_1.sellersService.getProfile(getTargetSellerId(req));
            const product = await sellers_service_js_1.sellersService.updateProductStatus(profile, req.params.id, req.body.status);
            res.json({ success: true, data: product });
        }
        catch (err) {
            next(err);
        }
    }
    async deleteProduct(req, res, next) {
        try {
            const profile = await sellers_service_js_1.sellersService.getProfile(getTargetSellerId(req));
            const result = await sellers_service_js_1.sellersService.deleteProduct(profile, req.params.id);
            res.json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    }
    async attachProductImage(req, res, next) {
        try {
            const profile = await sellers_service_js_1.sellersService.getProfile(getTargetSellerId(req));
            const product = await sellers_service_js_1.sellersService.attachProductImage(profile, req.params.productId, req.body);
            res.status(201).json({ success: true, data: product });
        }
        catch (err) {
            next(err);
        }
    }
    async removeProductImage(req, res, next) {
        try {
            const profile = await sellers_service_js_1.sellersService.getProfile(getTargetSellerId(req));
            const product = await sellers_service_js_1.sellersService.removeProductImage(profile, req.params.productId, req.params.imageId);
            res.json({ success: true, data: product });
        }
        catch (err) {
            next(err);
        }
    }
    async reorderProductImages(req, res, next) {
        try {
            const profile = await sellers_service_js_1.sellersService.getProfile(getTargetSellerId(req));
            const product = await sellers_service_js_1.sellersService.reorderProductImages(profile, req.params.productId, req.body.imageOrders);
            res.json({ success: true, data: product });
        }
        catch (err) {
            next(err);
        }
    }
    async setPrimaryProductImage(req, res, next) {
        try {
            const profile = await sellers_service_js_1.sellersService.getProfile(getTargetSellerId(req));
            const product = await sellers_service_js_1.sellersService.setPrimaryProductImage(profile, req.params.productId, req.params.imageId);
            res.json({ success: true, data: product });
        }
        catch (err) {
            next(err);
        }
    }
    async replaceProductImage(req, res, next) {
        try {
            const profile = await sellers_service_js_1.sellersService.getProfile(getTargetSellerId(req));
            const product = await sellers_service_js_1.sellersService.replaceProductImage(profile, req.params.productId, req.params.imageId, req.body);
            res.json({ success: true, data: product });
        }
        catch (err) {
            next(err);
        }
    }
    async getInventory(req, res, next) {
        try {
            const profile = await sellers_service_js_1.sellersService.getProfile(getTargetSellerId(req));
            const inv = await sellers_service_js_1.sellersService.getInventory(profile.id);
            res.json({ success: true, data: inv });
        }
        catch (err) {
            next(err);
        }
    }
    async updateInventory(req, res, next) {
        try {
            const profile = await sellers_service_js_1.sellersService.getProfile(getTargetSellerId(req));
            const inv = await sellers_service_js_1.sellersService.updateInventory(profile, req.params.productId, req.body);
            res.json({ success: true, data: inv });
        }
        catch (err) {
            next(err);
        }
    }
    async getOrders(req, res, next) {
        try {
            const profile = await sellers_service_js_1.sellersService.getProfile(getTargetSellerId(req));
            const search = typeof req.query.search === "string" ? req.query.search : undefined;
            const status = typeof req.query.status === "string" ? req.query.status : undefined;
            const orders = await sellers_service_js_1.sellersService.getOrders(profile.id, {
                search,
                status,
            });
            res.json({ success: true, data: orders });
        }
        catch (err) {
            next(err);
        }
    }
    async getOrderById(req, res, next) {
        try {
            const profile = await sellers_service_js_1.sellersService.getProfile(getTargetSellerId(req));
            const order = await sellers_service_js_1.sellersService.getOrderById(profile.id, req.params.id);
            res.json({ success: true, data: order });
        }
        catch (err) {
            next(err);
        }
    }
    async updateFulfillment(req, res, next) {
        try {
            const profile = await sellers_service_js_1.sellersService.getProfile(getTargetSellerId(req));
            const masterOrderId = req.body.masterOrderId || req.params.orderId;
            const newStatus = req.body.newStatus || req.body.status;
            const orderView = await sellers_service_js_1.sellersService.updateFulfillment(profile, masterOrderId, newStatus);
            res.json({ success: true, data: orderView });
        }
        catch (err) {
            next(err);
        }
    }
    async getDashboard(req, res, next) {
        try {
            const profile = await sellers_service_js_1.sellersService.getProfile(getTargetSellerId(req));
            const stats = await sellers_service_js_1.sellersService.getDashboard(profile.id);
            res.json({ success: true, data: stats });
        }
        catch (err) {
            next(err);
        }
    }
    async getEarnings(req, res, next) {
        try {
            const profile = await sellers_service_js_1.sellersService.getProfile(getTargetSellerId(req));
            const earnings = await sellers_service_js_1.sellersService.getEarnings(profile.id);
            res.json({ success: true, data: earnings });
        }
        catch (err) {
            next(err);
        }
    }
    async getPayouts(req, res, next) {
        try {
            const profile = await sellers_service_js_1.sellersService.getProfile(getTargetSellerId(req));
            const payouts = await sellers_service_js_1.sellersService.getPayouts(profile.id);
            res.json({ success: true, data: payouts });
        }
        catch (err) {
            next(err);
        }
    }
    async getAnalytics(req, res, next) {
        try {
            const profile = await sellers_service_js_1.sellersService.getProfile(getTargetSellerId(req));
            const range = typeof req.query.range === "string" ? req.query.range : "30d";
            const stats = await sellers_service_js_1.sellersService.getAnalytics(profile.id, range);
            res.json({ success: true, data: stats });
        }
        catch (err) {
            next(err);
        }
    }
    async getDocuments(req, res, next) {
        try {
            const profile = await sellers_service_js_1.sellersService.getProfile(getTargetSellerId(req));
            const docs = await sellers_service_js_1.sellersService.getDocuments(profile.id);
            res.json({ success: true, data: docs });
        }
        catch (err) {
            next(err);
        }
    }
    async uploadDocument(req, res, next) {
        try {
            const profile = await sellers_service_js_1.sellersService.getProfile(getTargetSellerId(req));
            const doc = await sellers_service_js_1.sellersService.uploadDocument(profile.id, req.body);
            res.json({ success: true, data: doc });
        }
        catch (err) {
            next(err);
        }
    }
    async getNotificationSettings(req, res, next) {
        try {
            const profile = await sellers_service_js_1.sellersService.getProfile(getTargetSellerId(req));
            const settings = await sellers_service_js_1.sellersService.getNotificationSettings(profile.id);
            res.json({ success: true, data: settings });
        }
        catch (err) {
            next(err);
        }
    }
    async updateNotificationSettings(req, res, next) {
        try {
            const profile = await sellers_service_js_1.sellersService.getProfile(getTargetSellerId(req));
            const updated = await sellers_service_js_1.sellersService.updateNotificationSettings(profile.id, req.body);
            res.json({ success: true, data: updated });
        }
        catch (err) {
            next(err);
        }
    }
    async getFinancialSettings(_req, res, next) {
        try {
            const { pricingService } = await import("../pricing/pricing.service.js");
            const settings = await pricingService.getFinancialSettings();
            res.json({ success: true, data: settings });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.SellersController = SellersController;
exports.sellersController = new SellersController();
