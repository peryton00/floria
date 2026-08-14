"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Floria API — Operations Routes
const express_1 = require("express");
const operations_controller_js_1 = require("./operations.controller.js");
const auth_js_1 = require("../middleware/auth.js");
const authorization_js_1 = require("../middleware/authorization.js");
const router = (0, express_1.Router)();
router.use(auth_js_1.authenticateToken, (0, authorization_js_1.requireRole)("operations", "admin", "super_admin"));
// Dashboard & Health
router.get("/health", operations_controller_js_1.operationsController.getHealth);
router.get("/dashboard", operations_controller_js_1.operationsController.getDashboard);
// Operations Order Oversight
router.get("/orders", operations_controller_js_1.operationsController.getOrders);
router.get("/orders/:id", operations_controller_js_1.operationsController.getOrderById);
router.post("/orders/:id/status", operations_controller_js_1.operationsController.updateOrderStatus);
// Pickup Queue Workflow
router.get("/pickups", operations_controller_js_1.operationsController.getPickups);
router.post("/pickups/:id/status", operations_controller_js_1.operationsController.updatePickupStatus);
// Packing Queue Workflow
router.get("/packing", operations_controller_js_1.operationsController.getPackingTasks);
router.post("/packing/:id/status", operations_controller_js_1.operationsController.updatePackingTask);
// Delivery Assignments Workflow
router.get("/deliveries", operations_controller_js_1.operationsController.getDeliveries);
router.get("/deliveries/:id", operations_controller_js_1.operationsController.getDeliveryById);
router.post("/deliveries/:id/assign", operations_controller_js_1.operationsController.assignDelivery);
router.post("/deliveries/:id/reassign", operations_controller_js_1.operationsController.reassignDelivery);
router.post("/deliveries/:id/status", operations_controller_js_1.operationsController.updateDeliveryStatus);
exports.default = router;
