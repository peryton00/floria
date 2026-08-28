// Floria API — Operations Routes
import { Router } from "express";
import { operationsController } from "./operations.controller.js";
import { authenticateToken } from "../middleware/auth.js";
import { requireRole } from "../middleware/authorization.js";

const router = Router();

router.use(
  authenticateToken,
  requireRole("operations", "admin", "super_admin"),
);

// Dashboard & Health
router.get("/health", operationsController.getHealth);
router.get("/dashboard", operationsController.getDashboard);

// Operations Order Oversight
router.get("/orders", operationsController.getOrders);
router.get("/orders/:id", operationsController.getOrderById);
router.post("/orders/:id/status", operationsController.updateOrderStatus);

// Pickup Queue Workflow
router.get("/pickups", operationsController.getPickups);
router.post("/pickups/:id/status", operationsController.updatePickupStatus);

// Packing Queue Workflow
router.get("/packing", operationsController.getPackingTasks);
router.post("/packing/:id/status", operationsController.updatePackingTask);

// Delivery Assignments Workflow
router.get("/deliveries", operationsController.getDeliveries);
router.get("/deliveries/:id", operationsController.getDeliveryById);
router.post("/deliveries/:id/assign", operationsController.assignDelivery);
router.post("/deliveries/:id/reassign", operationsController.reassignDelivery);
router.post(
  "/deliveries/:id/status",
  operationsController.updateDeliveryStatus,
);
router.post(
  "/deliveries/:id/complete",
  operationsController.completeDeliveryWithPod,
);
router.get("/deliveries/:id/pod", operationsController.getDeliveryPod);

export default router;
