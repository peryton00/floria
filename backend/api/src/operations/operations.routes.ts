// Floria API — Operations Routes
import { Router } from "express";
import { operationsController } from "./operations.controller.js";
import { authenticateToken } from "../middleware/auth.js";
import { requireRole } from "../middleware/authorization.js";

const router = Router();

router.use(
  authenticateToken,
  requireRole(
    "operations",
    "admin",
    "super_admin",
    "delivery_partner",
    "courier",
  ),
);

// Dashboard & Health (Operations & Admin only)
router.get("/health", operationsController.getHealth);
router.get(
  "/dashboard",
  requireRole("operations", "admin", "super_admin"),
  operationsController.getDashboard,
);

// Operations Order Oversight
router.get(
  "/orders",
  requireRole("operations", "admin", "super_admin"),
  operationsController.getOrders,
);
router.get(
  "/orders/:id",
  requireRole("operations", "admin", "super_admin"),
  operationsController.getOrderById,
);
router.post(
  "/orders/:id/status",
  requireRole("operations", "admin", "super_admin"),
  operationsController.updateOrderStatus,
);

// Pickup Queue Workflow
router.get(
  "/pickups",
  requireRole("operations", "admin", "super_admin"),
  operationsController.getPickups,
);
router.post(
  "/pickups/:id/status",
  requireRole("operations", "admin", "super_admin"),
  operationsController.updatePickupStatus,
);

// Packing Queue Workflow
router.get(
  "/packing",
  requireRole("operations", "admin", "super_admin"),
  operationsController.getPackingTasks,
);
router.post(
  "/packing/:id/status",
  requireRole("operations", "admin", "super_admin"),
  operationsController.updatePackingTask,
);

// Delivery Assignments Workflow (Accessible to Operations, Admin, and assigned Delivery Partners)
router.get("/deliveries", operationsController.getDeliveries);
router.get("/deliveries/:id", operationsController.getDeliveryById);
router.post(
  "/deliveries/:id/assign",
  requireRole("operations", "admin", "super_admin"),
  operationsController.assignDelivery,
);
router.post(
  "/deliveries/:id/reassign",
  requireRole("operations", "admin", "super_admin"),
  operationsController.reassignDelivery,
);
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
