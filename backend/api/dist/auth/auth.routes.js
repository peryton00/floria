"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Floria API — Auth Routes (/api/v1/auth)
const express_1 = require("express");
const auth_controller_js_1 = require("./auth.controller.js");
const sellers_controller_js_1 = require("../sellers/sellers.controller.js");
const auth_js_1 = require("../middleware/auth.js");
const rateLimit_js_1 = require("../middleware/rateLimit.js");
const router = (0, express_1.Router)();
router.get("/me", rateLimit_js_1.authRateLimiter, auth_js_1.authenticateToken, auth_controller_js_1.authController.getMe);
// Dedicated Seller Credential Authentication Endpoints
router.post("/seller/login", rateLimit_js_1.authRateLimiter, sellers_controller_js_1.sellersController.login);
router.post("/seller/register", rateLimit_js_1.authRateLimiter, sellers_controller_js_1.sellersController.apply);
router.post("/seller/apply", rateLimit_js_1.authRateLimiter, sellers_controller_js_1.sellersController.apply);
router.post("/seller/forgot-password", rateLimit_js_1.authRateLimiter, sellers_controller_js_1.sellersController.forgotPassword);
router.post("/seller/reset-password", rateLimit_js_1.authRateLimiter, sellers_controller_js_1.sellersController.resetPassword);
exports.default = router;
