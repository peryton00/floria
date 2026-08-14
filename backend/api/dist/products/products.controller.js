"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productsController = exports.ProductsController = void 0;
const products_service_js_1 = require("./products.service.js");
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
}
exports.ProductsController = ProductsController;
exports.productsController = new ProductsController();
