"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Floria API — Seller Fulfillment Routes
const express_1 = require("express");
const fulfillment_controller_js_1 = require("./fulfillment.controller.js");
const auth_js_1 = require("../middleware/auth.js");
const authorization_js_1 = require("../middleware/authorization.js");
const rateLimit_js_1 = require("../middleware/rateLimit.js");
const validation_js_1 = require("../middleware/validation.js");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const fulfillmentSchema = {
    body: zod_1.z.object({
        masterOrderId: zod_1.z.string().uuid("Invalid master order ID"),
        newStatus: zod_1.z.string().min(1, "newStatus is required"),
    }),
};
router.get("/", auth_js_1.authenticateToken, authorization_js_1.requireApprovedSeller, fulfillment_controller_js_1.fulfillmentController.getMyFulfillments);
router.post("/", auth_js_1.authenticateToken, authorization_js_1.requireApprovedSeller, rateLimit_js_1.sellerFulfillmentRateLimiter, (0, validation_js_1.validateRequest)(fulfillmentSchema), fulfillment_controller_js_1.fulfillmentController.updateStatus);
exports.default = router;
