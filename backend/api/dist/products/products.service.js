"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productsService = exports.ProductsService = void 0;
// Floria API — Products Catalog Service
const product_repository_js_1 = require("../database/repositories/product.repository.js");
const pricing_service_js_1 = require("../pricing/pricing.service.js");
const errors_js_1 = require("../utils/errors.js");
class ProductsService {
    enrichWithDbPricing(product, settings) {
        if (!product)
            return product;
        const rawInventory = product.inventory;
        if (!rawInventory)
            return product;
        if (Array.isArray(rawInventory)) {
            const enriched = rawInventory.map((inv) => {
                const basePrice = inv.price_paise ?? 0;
                const calc = pricing_service_js_1.pricingService.calculateProductPricingSync(basePrice, settings);
                return {
                    ...inv,
                    base_price_paise: basePrice,
                    price_paise: calc.customerProductPricePaise,
                    customer_price_paise: calc.customerProductPricePaise,
                    seller_net_paise: calc.sellerNetPaise,
                };
            });
            return { ...product, inventory: enriched };
        }
        else {
            const basePrice = rawInventory.price_paise ?? 0;
            const calc = pricing_service_js_1.pricingService.calculateProductPricingSync(basePrice, settings);
            return {
                ...product,
                inventory: {
                    ...rawInventory,
                    base_price_paise: basePrice,
                    price_paise: calc.customerProductPricePaise,
                    customer_price_paise: calc.customerProductPricePaise,
                    seller_net_paise: calc.sellerNetPaise,
                },
            };
        }
    }
    async getProducts(categoryId, search) {
        const settings = await pricing_service_js_1.pricingService.getFinancialSettings();
        const products = await product_repository_js_1.productRepository.findActiveCatalog(categoryId, search);
        return products.map((p) => this.enrichWithDbPricing(p, settings));
    }
    async getProductBySlug(slug) {
        const settings = await pricing_service_js_1.pricingService.getFinancialSettings();
        const product = await product_repository_js_1.productRepository.findBySlug(slug);
        if (!product)
            throw errors_js_1.Errors.notFound("Product");
        return this.enrichWithDbPricing(product, settings);
    }
}
exports.ProductsService = ProductsService;
exports.productsService = new ProductsService();
