"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Floria API — Cart Routes
const express_1 = require("express");
const cart_controller_js_1 = require("./cart.controller.js");
const auth_js_1 = require("../middleware/auth.js");
const validation_js_1 = require("../middleware/validation.js");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const addToCartSchema = {
    body: zod_1.z.object({
        productId: zod_1.z.string().uuid("Invalid product ID format"),
        quantity: zod_1.z.number().int().positive("Quantity must be positive"),
    }),
};
const updateQuantitySchema = {
    params: zod_1.z.object({
        productId: zod_1.z.string().uuid("Invalid product ID format"),
    }),
    body: zod_1.z.object({
        quantity: zod_1.z.number().int().nonnegative("Quantity cannot be negative"),
    }),
};
const mergeCartSchema = {
    body: zod_1.z.object({
        items: zod_1.z.array(zod_1.z.object({
            productId: zod_1.z.string().uuid(),
            quantity: zod_1.z.number().int().positive(),
        })),
    }),
};
router.use(auth_js_1.authenticateToken);
router.get("/", cart_controller_js_1.cartController.getCart);
router.post("/items", (0, validation_js_1.validateRequest)(addToCartSchema), cart_controller_js_1.cartController.addItem);
router.patch("/items/:productId", (0, validation_js_1.validateRequest)(updateQuantitySchema), cart_controller_js_1.cartController.updateQuantity);
router.delete("/items/:productId", cart_controller_js_1.cartController.removeItem);
router.delete("/", cart_controller_js_1.cartController.clearCart);
router.post("/merge", (0, validation_js_1.validateRequest)(mergeCartSchema), cart_controller_js_1.cartController.mergeCart);
exports.default = router;
