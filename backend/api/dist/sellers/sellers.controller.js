"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sellersController = exports.SellersController = void 0;
const sellers_service_js_1 = require("./sellers.service.js");
class SellersController {
    async getProfile(req, res, next) {
        try {
            const profile = await sellers_service_js_1.sellersService.getProfile(req.user.id);
            res.json({ success: true, data: profile });
        }
        catch (err) {
            next(err);
        }
    }
    async updateProfile(req, res, next) {
        try {
            const updated = await sellers_service_js_1.sellersService.updateProfile(req.user.id, req.body);
            res.json({ success: true, data: updated });
        }
        catch (err) {
            next(err);
        }
    }
    async submitApplication(req, res, next) {
        try {
            const profile = await sellers_service_js_1.sellersService.submitApplication(req.user.id, req.body);
            res.json({ success: true, data: profile });
        }
        catch (err) {
            next(err);
        }
    }
    async getApplication(req, res, next) {
        try {
            const profile = await sellers_service_js_1.sellersService.getApplication(req.user.id);
            res.json({ success: true, data: profile });
        }
        catch (err) {
            next(err);
        }
    }
    async getProducts(req, res, next) {
        try {
            const profile = await sellers_service_js_1.sellersService.getProfile(req.user.id);
            const search = typeof req.query.search === "string" ? req.query.search : undefined;
            const status = typeof req.query.status === "string" ? req.query.status : undefined;
            const stock = typeof req.query.stock === "string" ? req.query.stock : undefined;
            const products = await sellers_service_js_1.sellersService.getProducts(profile.id, { search, status, stock });
            res.json({ success: true, data: products });
        }
        catch (err) {
            next(err);
        }
    }
    async getProductById(req, res, next) {
        try {
            const profile = await sellers_service_js_1.sellersService.getProfile(req.user.id);
            const product = await sellers_service_js_1.sellersService.getProductById(profile.id, req.params.id);
            res.json({ success: true, data: product });
        }
        catch (err) {
            next(err);
        }
    }
    async createProduct(req, res, next) {
        try {
            const profile = await sellers_service_js_1.sellersService.getProfile(req.user.id);
            const product = await sellers_service_js_1.sellersService.createProduct(profile, req.body);
            res.status(201).json({ success: true, data: product });
        }
        catch (err) {
            next(err);
        }
    }
    async updateProduct(req, res, next) {
        try {
            const profile = await sellers_service_js_1.sellersService.getProfile(req.user.id);
            const product = await sellers_service_js_1.sellersService.updateProduct(profile, req.params.id, req.body);
            res.json({ success: true, data: product });
        }
        catch (err) {
            next(err);
        }
    }
    async updateProductStatus(req, res, next) {
        try {
            const profile = await sellers_service_js_1.sellersService.getProfile(req.user.id);
            const product = await sellers_service_js_1.sellersService.updateProductStatus(profile, req.params.id, req.body.status);
            res.json({ success: true, data: product });
        }
        catch (err) {
            next(err);
        }
    }
    async deleteProduct(req, res, next) {
        try {
            const profile = await sellers_service_js_1.sellersService.getProfile(req.user.id);
            const result = await sellers_service_js_1.sellersService.deleteProduct(profile, req.params.id);
            res.json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    }
    async getInventory(req, res, next) {
        try {
            const profile = await sellers_service_js_1.sellersService.getProfile(req.user.id);
            const inv = await sellers_service_js_1.sellersService.getInventory(profile.id);
            res.json({ success: true, data: inv });
        }
        catch (err) {
            next(err);
        }
    }
    async updateInventory(req, res, next) {
        try {
            const profile = await sellers_service_js_1.sellersService.getProfile(req.user.id);
            const inv = await sellers_service_js_1.sellersService.updateInventory(profile, req.params.productId, req.body);
            res.json({ success: true, data: inv });
        }
        catch (err) {
            next(err);
        }
    }
    async getOrders(req, res, next) {
        try {
            const profile = await sellers_service_js_1.sellersService.getProfile(req.user.id);
            const search = typeof req.query.search === "string" ? req.query.search : undefined;
            const status = typeof req.query.status === "string" ? req.query.status : undefined;
            const orders = await sellers_service_js_1.sellersService.getOrders(profile.id, { search, status });
            res.json({ success: true, data: orders });
        }
        catch (err) {
            next(err);
        }
    }
    async getOrderById(req, res, next) {
        try {
            const profile = await sellers_service_js_1.sellersService.getProfile(req.user.id);
            const order = await sellers_service_js_1.sellersService.getOrderById(profile.id, req.params.id);
            res.json({ success: true, data: order });
        }
        catch (err) {
            next(err);
        }
    }
    async updateFulfillment(req, res, next) {
        try {
            const profile = await sellers_service_js_1.sellersService.getProfile(req.user.id);
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
            const profile = await sellers_service_js_1.sellersService.getProfile(req.user.id);
            const stats = await sellers_service_js_1.sellersService.getDashboard(profile.id);
            res.json({ success: true, data: stats });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.SellersController = SellersController;
exports.sellersController = new SellersController();
