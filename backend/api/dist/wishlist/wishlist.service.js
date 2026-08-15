"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wishlistService = exports.WishlistService = void 0;
// Floria API — Wishlist Service
const database_js_1 = require("../config/database.js");
const errors_js_1 = require("../utils/errors.js");
class WishlistService {
    async getWishlist(userId) {
        const db = (0, database_js_1.getAdminDb)();
        const { data: wishlist } = await db
            .from("wishlists")
            .select("*, wishlist_items(*, product:products(*, inventory(*), images:product_images(*)))")
            .eq("user_id", userId)
            .maybeSingle();
        return wishlist || { user_id: userId, wishlist_items: [] };
    }
    async addItem(userId, productId) {
        const db = (0, database_js_1.getAdminDb)();
        let { data: wishlist } = await db
            .from("wishlists")
            .select("id")
            .eq("user_id", userId)
            .maybeSingle();
        if (!wishlist) {
            const { data: newWishlist, error: wErr } = await db
                .from("wishlists")
                .insert({ user_id: userId })
                .select("id")
                .single();
            if (wErr)
                throw errors_js_1.Errors.database("Failed to create wishlist.");
            wishlist = newWishlist;
        }
        const { error } = await db
            .from("wishlist_items")
            .upsert({ wishlist_id: wishlist.id, product_id: productId }, { onConflict: "wishlist_id,product_id" });
        if (error)
            throw errors_js_1.Errors.database("Failed to add item to wishlist.");
        return this.getWishlist(userId);
    }
    async removeItem(userId, productId) {
        const db = (0, database_js_1.getAdminDb)();
        const { data: wishlist } = await db
            .from("wishlists")
            .select("id")
            .eq("user_id", userId)
            .maybeSingle();
        if (wishlist) {
            await db
                .from("wishlist_items")
                .delete()
                .eq("wishlist_id", wishlist.id)
                .eq("product_id", productId);
        }
        return this.getWishlist(userId);
    }
    async mergeWishlist(userId, productIds) {
        for (const pid of productIds) {
            try {
                await this.addItem(userId, pid);
            }
            catch (e) {
                // Ignore errors
            }
        }
        return this.getWishlist(userId);
    }
}
exports.WishlistService = WishlistService;
exports.wishlistService = new WishlistService();
