"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cartController = exports.CartController = void 0;
const cart_service_js_1 = require("./cart.service.js");
class CartController {
    async getCart(req, res, next) {
        try {
            const cart = await cart_service_js_1.cartService.getCart(req.user.id);
            res.json({ success: true, data: cart });
        }
        catch (err) {
            next(err);
        }
    }
    async addItem(req, res, next) {
        try {
            const { productId, quantity } = req.body;
            const cart = await cart_service_js_1.cartService.addItem(req.user.id, productId, quantity || 1);
            res.json({ success: true, data: cart });
        }
        catch (err) {
            next(err);
        }
    }
    async updateQuantity(req, res, next) {
        try {
            const { productId } = req.params;
            const { quantity } = req.body;
            const cart = await cart_service_js_1.cartService.updateQuantity(req.user.id, String(productId), quantity);
            res.json({ success: true, data: cart });
        }
        catch (err) {
            next(err);
        }
    }
    async removeItem(req, res, next) {
        try {
            const { productId } = req.params;
            const cart = await cart_service_js_1.cartService.removeItem(req.user.id, String(productId));
            res.json({ success: true, data: cart });
        }
        catch (err) {
            next(err);
        }
    }
    async clearCart(req, res, next) {
        try {
            const cart = await cart_service_js_1.cartService.clearCart(req.user.id);
            res.json({ success: true, data: cart });
        }
        catch (err) {
            next(err);
        }
    }
    async mergeCart(req, res, next) {
        try {
            const { items } = req.body;
            const cart = await cart_service_js_1.cartService.mergeCart(req.user.id, items || []);
            res.json({ success: true, data: cart });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.CartController = CartController;
exports.cartController = new CartController();
