// Floria API — Customer Orders Routes
import { Router } from "express";
import { ordersController } from "./orders.controller.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

router.get("/", authenticateToken, ordersController.getMyOrders);
router.get("/:id", authenticateToken, ordersController.getOrderById);

export default router;
