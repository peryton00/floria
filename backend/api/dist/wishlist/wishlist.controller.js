"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wishlistController = exports.WishlistController = void 0;
const wishlist_service_js_1 = require("./wishlist.service.js");
class WishlistController {
    async getWishlist(req, res, next) {
        try {
            const wishlist = await wishlist_service_js_1.wishlistService.getWishlist(req.user.id);
            res.json({ success: true, data: wishlist });
        }
        catch (err) {
            next(err);
        }
    }
    async addItem(req, res, next) {
        try {
            const { productId } = req.body;
            const wishlist = await wishlist_service_js_1.wishlistService.addItem(req.user.id, productId);
            res.json({ success: true, data: wishlist });
        }
        catch (err) {
            next(err);
        }
    }
    async removeItem(req, res, next) {
        try {
            const { productId } = req.params;
            const wishlist = await wishlist_service_js_1.wishlistService.removeItem(req.user.id, String(productId));
            res.json({ success: true, data: wishlist });
        }
        catch (err) {
            next(err);
        }
    }
    async mergeWishlist(req, res, next) {
        try {
            const { productIds } = req.body;
            const wishlist = await wishlist_service_js_1.wishlistService.mergeWishlist(req.user.id, productIds || []);
            res.json({ success: true, data: wishlist });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.WishlistController = WishlistController;
exports.wishlistController = new WishlistController();
