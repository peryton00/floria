"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productsService = exports.ProductsService = void 0;
// Floria API — Products Catalog Service
const product_repository_js_1 = require("../database/repositories/product.repository.js");
const errors_js_1 = require("../utils/errors.js");
class ProductsService {
    async getProducts(categoryId, search) {
        return product_repository_js_1.productRepository.findActiveCatalog(categoryId, search);
    }
    async getProductBySlug(slug) {
        const product = await product_repository_js_1.productRepository.findBySlug(slug);
        if (!product)
            throw errors_js_1.Errors.notFound("Product");
        return product;
    }
}
exports.ProductsService = ProductsService;
exports.productsService = new ProductsService();
