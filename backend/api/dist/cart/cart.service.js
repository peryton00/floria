"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cartService = exports.CartService = void 0;
// Floria API — Cart Service
const database_js_1 = require("../config/database.js");
const errors_js_1 = require("../utils/errors.js");
const products_service_js_1 = require("../products/products.service.js");
const pricing_service_js_1 = require("../pricing/pricing.service.js");
class CartService {
    async getCart(userId) {
        const db = (0, database_js_1.getAdminDb)();
        const { data: cart } = await db
            .from("carts")
            .select("*, cart_items(*, product:products(*, inventory(*), images:product_images(*)))")
            .eq("user_id", userId)
            .maybeSingle();
        if (!cart) {
            return { user_id: userId, cart_items: [] };
        }
        const settings = await pricing_service_js_1.pricingService.getFinancialSettings();
        let overrideMap = new Map();
        try {
            const { data: overrides } = await db
                .from("product_pricing_overrides")
                .select("product_id, custom_customer_price_paise")
                .eq("is_active", true);
            if (overrides) {
                overrideMap = new Map(overrides.map((o) => [o.product_id, o]));
            }
        }
        catch { }
        if (cart.cart_items && Array.isArray(cart.cart_items)) {
            cart.cart_items = cart.cart_items.map((ci) => {
                if (ci.product) {
                    ci.product = products_service_js_1.productsService.enrichWithDbPricing(ci.product, settings, overrideMap);
                }
                return ci;
            });
        }
        return cart;
    }
    async addItem(userId, productId, quantity) {
        const db = (0, database_js_1.getAdminDb)();
        const { data: product } = await db
            .from("products")
            .select("id, name, seller_id, status")
            .eq("id", productId)
            .maybeSingle();
        if (!product || product.status !== "active") {
            throw errors_js_1.Errors.notFound("Active product");
        }
        const { data: inv } = await db
            .from("inventory")
            .select("stock_quantity")
            .eq("product_id", productId)
            .maybeSingle();
        if (!inv || inv.stock_quantity < quantity) {
            throw errors_js_1.Errors.outOfStock(product.name);
        }
        let { data: cart } = await db
            .from("carts")
            .select("id")
            .eq("user_id", userId)
            .maybeSingle();
        if (!cart) {
            const { data: newCart, error: cartErr } = await db
                .from("carts")
                .insert({ user_id: userId })
                .select("id")
                .single();
            if (cartErr)
                throw errors_js_1.Errors.database("Failed to create cart.");
            cart = newCart;
        }
        // Check existing item
        const { data: existingItem } = await db
            .from("cart_items")
            .select("quantity")
            .eq("cart_id", cart.id)
            .eq("product_id", productId)
            .maybeSingle();
        const newQty = existingItem ? existingItem.quantity + quantity : quantity;
        const { error: itemErr } = await db
            .from("cart_items")
            .upsert({ cart_id: cart.id, product_id: productId, quantity: newQty }, { onConflict: "cart_id,product_id" });
        if (itemErr)
            throw errors_js_1.Errors.database("Failed to update cart item.");
        return this.getCart(userId);
    }
    async updateQuantity(userId, productId, quantity) {
        const db = (0, database_js_1.getAdminDb)();
        const { data: cart } = await db
            .from("carts")
            .select("id")
            .eq("user_id", userId)
            .maybeSingle();
        if (!cart)
            throw errors_js_1.Errors.notFound("Cart");
        if (quantity <= 0) {
            return this.removeItem(userId, productId);
        }
        const { error } = await db
            .from("cart_items")
            .update({ quantity })
            .eq("cart_id", cart.id)
            .eq("product_id", productId);
        if (error)
            throw errors_js_1.Errors.database("Failed to update item quantity.");
        return this.getCart(userId);
    }
    async removeItem(userId, productId) {
        const db = (0, database_js_1.getAdminDb)();
        const { data: cart } = await db
            .from("carts")
            .select("id")
            .eq("user_id", userId)
            .maybeSingle();
        if (!cart)
            return this.getCart(userId);
        await db
            .from("cart_items")
            .delete()
            .eq("cart_id", cart.id)
            .eq("product_id", productId);
        return this.getCart(userId);
    }
    async clearCart(userId) {
        const db = (0, database_js_1.getAdminDb)();
        const { data: cart } = await db
            .from("carts")
            .select("id")
            .eq("user_id", userId)
            .maybeSingle();
        if (cart) {
            await db.from("cart_items").delete().eq("cart_id", cart.id);
        }
        return this.getCart(userId);
    }
    async mergeCart(userId, items) {
        for (const item of items) {
            try {
                await this.addItem(userId, item.productId, item.quantity);
            }
            catch (e) {
                // Skip items that are out of stock or inactive
            }
        }
        return this.getCart(userId);
    }
}
exports.CartService = CartService;
exports.cartService = new CartService();
