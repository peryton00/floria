// Floria API — Payments & Webhooks Routes
import { Router, Request, Response } from "express";
import { paymentsController } from "./payments.controller.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

router.get("/", authenticateToken, (_req: Request, res: Response) => {
  res.json({ success: true, data: { status: "foundation_ready" } });
});

router.post("/webhook", (req, res, next) => paymentsController.handleWebhook(req, res, next));

export default router;
