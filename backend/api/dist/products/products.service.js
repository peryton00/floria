"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productsService = exports.ProductsService = void 0;
// Floria API — Products Catalog Service
const product_repository_js_1 = require("../database/repositories/product.repository.js");
const pricing_service_js_1 = require("../pricing/pricing.service.js");
const database_js_1 = require("../config/database.js");
const errors_js_1 = require("../utils/errors.js");
class ProductsService {
    enrichWithDbPricing(product, settings, overrideMap) {
        if (!product)
            return product;
        const rawInventory = product.inventory;
        if (!rawInventory)
            return product;
        const override = overrideMap?.get(product.id);
        const enrichSingle = (inv) => {
            const basePrice = inv.base_price_paise ?? inv.price_paise ?? 0;
            const calc = pricing_service_js_1.pricingService.calculateProductPricingSync(basePrice, settings);
            const customerPrice = override?.custom_customer_price_paise ?? calc.customerProductPricePaise;
            const originalPrice = inv.original_price_paise && inv.original_price_paise > customerPrice ? inv.original_price_paise : null;
            const discountAmount = originalPrice ? originalPrice - customerPrice : 0;
            const discountPercent = originalPrice ? Math.round((discountAmount / originalPrice) * 100) : 0;
            return {
                ...inv,
                base_price_paise: basePrice,
                price_paise: customerPrice,
                customer_price_paise: customerPrice,
                seller_net_paise: calc.sellerNetPaise,
                pricing: {
                    customerPricePaise: customerPrice,
                    sellingPricePaise: customerPrice,
                    originalPricePaise: originalPrice,
                    compareAtPricePaise: originalPrice,
                    discountAmountPaise: discountAmount,
                    discountPercentage: discountPercent,
                    isDiscounted: discountAmount > 0,
                    isFreeDelivery: calc.isFreeDeliveryEligible,
                    isOverride: Boolean(override),
                },
            };
        };
        if (Array.isArray(rawInventory)) {
            const enriched = rawInventory.map(enrichSingle);
            const primaryPricing = enriched[0]?.pricing;
            return { ...product, inventory: enriched, pricing: primaryPricing };
        }
        else {
            const enriched = enrichSingle(rawInventory);
            return {
                ...product,
                inventory: enriched,
                pricing: enriched.pricing,
            };
        }
    }
    async getProducts(categoryId, search) {
        const settings = await pricing_service_js_1.pricingService.getFinancialSettings();
        const products = await product_repository_js_1.productRepository.findActiveCatalog(categoryId, search);
        // Check for active overrides in parallel
        const overrideMap = await this.getActiveOverridesMap();
        return products.map((p) => this.enrichWithDbPricing(p, settings, overrideMap));
    }
    async getProductBySlug(slug) {
        const settings = await pricing_service_js_1.pricingService.getFinancialSettings();
        const product = await product_repository_js_1.productRepository.findBySlug(slug);
        if (!product)
            throw errors_js_1.Errors.notFound("Product");
        const overrideMap = await this.getActiveOverridesMap();
        return this.enrichWithDbPricing(product, settings, overrideMap);
    }
    async getRelated(productId, categoryId, limit = 6) {
        const settings = await pricing_service_js_1.pricingService.getFinancialSettings();
        const products = await product_repository_js_1.productRepository.findRelated(productId, categoryId, limit);
        const overrideMap = await this.getActiveOverridesMap();
        return products.map((p) => this.enrichWithDbPricing(p, settings, overrideMap));
    }
    async getTrending(limit = 12) {
        const settings = await pricing_service_js_1.pricingService.getFinancialSettings();
        const products = await product_repository_js_1.productRepository.findTrending(limit);
        const overrideMap = await this.getActiveOverridesMap();
        return products.map((p) => this.enrichWithDbPricing(p, settings, overrideMap));
    }
    async getActiveOverridesMap() {
        try {
            const db = (0, database_js_1.getAdminDb)();
            const { data } = await db
                .from("product_pricing_overrides")
                .select("product_id, custom_customer_price_paise, reason")
                .eq("is_active", true);
            if (!data)
                return new Map();
            return new Map(data.map((o) => [o.product_id, o]));
        }
        catch {
            return new Map();
        }
    }
}
exports.ProductsService = ProductsService;
exports.productsService = new ProductsService();
