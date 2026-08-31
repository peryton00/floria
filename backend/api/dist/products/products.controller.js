"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productsController = exports.ProductsController = void 0;
const products_service_js_1 = require("./products.service.js");
const product_repository_js_1 = require("../database/repositories/product.repository.js");
const nursery_repository_js_1 = require("../database/repositories/nursery.repository.js");
class ProductsController {
    async getProducts(req, res, next) {
        try {
            const categoryParam = (req.query.category ||
                req.query.category_id ||
                req.query.categoryId);
            const sellerParam = (req.query.seller_id ||
                req.query.sellerId ||
                req.query.nursery_id ||
                req.query.nurseryId);
            const search = req.query.search;
            const limit = req.query.limit ? Number(req.query.limit) : undefined;
            const products = await products_service_js_1.productsService.getProducts(categoryParam, search, sellerParam, limit);
            res.json({ success: true, data: products });
        }
        catch (err) {
            next(err);
        }
    }
    async getNurseryById(req, res, next) {
        try {
            const sellerId = String(req.params.id);
            const { sellerRepository } = await import("../database/repositories/seller.repository.js");
            const nursery = await sellerRepository.findById(sellerId);
            if (!nursery) {
                res.status(404).json({
                    success: false,
                    error: { code: "NOT_FOUND", message: "Nursery not found." },
                });
                return;
            }
            res.json({ success: true, data: nursery });
        }
        catch (err) {
            next(err);
        }
    }
    async getProductBySlug(req, res, next) {
        try {
            const product = await products_service_js_1.productsService.getProductBySlug(String(req.params.slug));
            res.json({ success: true, data: product });
        }
        catch (err) {
            next(err);
        }
    }
    async getRelated(req, res, next) {
        try {
            const product = await product_repository_js_1.productRepository.findBySlug(String(req.params.slug));
            if (!product) {
                res
                    .status(404)
                    .json({
                    success: false,
                    error: { code: "NOT_FOUND", message: "Product not found." },
                });
                return;
            }
            const related = await products_service_js_1.productsService.getRelated(product.product?.id ?? product.id, product.product?.category_id ?? product.category_id);
            res.json({ success: true, data: related });
        }
        catch (err) {
            next(err);
        }
    }
    async getTrending(req, res, next) {
        try {
            const limit = Math.min(20, Number(req.query.limit) || 12);
            const products = await products_service_js_1.productsService.getTrending(limit);
            res.json({ success: true, data: products });
        }
        catch (err) {
            next(err);
        }
    }
    async getRankedNurseries(req, res, next) {
        try {
            const nurseries = await nursery_repository_js_1.nurseryRepository.findRanked();
            res.json({ success: true, data: nurseries });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.ProductsController = ProductsController;
exports.productsController = new ProductsController();
