"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productsController = exports.ProductsController = void 0;
const products_service_js_1 = require("./products.service.js");
const product_repository_js_1 = require("../database/repositories/product.repository.js");
const nursery_repository_js_1 = require("../database/repositories/nursery.repository.js");
class ProductsController {
    async getProducts(req, res, next) {
        try {
            const categoryId = req.query.category_id;
            const search = req.query.search;
            const products = await products_service_js_1.productsService.getProducts(categoryId, search);
            res.json({ success: true, data: products });
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
                res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Product not found." } });
                return;
            }
            const related = await product_repository_js_1.productRepository.findRelated(product.product?.id ?? product.id, product.product?.category_id ?? product.category_id);
            res.json({ success: true, data: related });
        }
        catch (err) {
            next(err);
        }
    }
    async getTrending(req, res, next) {
        try {
            const limit = Math.min(20, Number(req.query.limit) || 12);
            const products = await product_repository_js_1.productRepository.findTrending(limit);
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
