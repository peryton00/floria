"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Floria API — Checkout Routes
const express_1 = require("express");
const checkout_controller_js_1 = require("./checkout.controller.js");
const auth_js_1 = require("../middleware/auth.js");
const rateLimit_js_1 = require("../middleware/rateLimit.js");
const validation_js_1 = require("../middleware/validation.js");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const checkoutSchema = {
    body: zod_1.z.object({
        addressId: zod_1.z.string().optional(),
        address: zod_1.z.record(zod_1.z.unknown()).optional(),
        paymentMethod: zod_1.z.enum(["online", "cod"]),
    }),
};
router.post(["/", ""], auth_js_1.authenticateToken, rateLimit_js_1.checkoutRateLimiter, (0, validation_js_1.validateRequest)(checkoutSchema), checkout_controller_js_1.checkoutController.processCheckout);
exports.default = router;
