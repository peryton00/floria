"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Floria API — Customer Orders Routes
const express_1 = require("express");
const orders_controller_js_1 = require("./orders.controller.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
router.get("/", auth_js_1.authenticateToken, orders_controller_js_1.ordersController.getMyOrders);
router.get("/:id", auth_js_1.authenticateToken, orders_controller_js_1.ordersController.getOrderById);
exports.default = router;
