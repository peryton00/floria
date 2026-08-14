"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Floria API — Wishlist Routes
const express_1 = require("express");
const wishlist_controller_js_1 = require("./wishlist.controller.js");
const auth_js_1 = require("../middleware/auth.js");
const validation_js_1 = require("../middleware/validation.js");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const addItemSchema = {
    body: zod_1.z.object({
        productId: zod_1.z.string().uuid("Invalid product ID"),
    }),
};
const mergeSchema = {
    body: zod_1.z.object({
        productIds: zod_1.z.array(zod_1.z.string().uuid()),
    }),
};
router.use(auth_js_1.authenticateToken);
router.get("/", wishlist_controller_js_1.wishlistController.getWishlist);
router.post("/items", (0, validation_js_1.validateRequest)(addItemSchema), wishlist_controller_js_1.wishlistController.addItem);
router.delete("/items/:productId", wishlist_controller_js_1.wishlistController.removeItem);
router.post("/merge", (0, validation_js_1.validateRequest)(mergeSchema), wishlist_controller_js_1.wishlistController.mergeWishlist);
exports.default = router;
