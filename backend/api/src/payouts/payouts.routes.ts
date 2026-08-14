// Floria API — Payouts Routes Placeholder (Foundation)
import { Router, Request, Response } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { requireApprovedSeller } from "../middleware/authorization.js";

const router = Router();

router.get("/", authenticateToken, requireApprovedSeller, (_req: Request, res: Response) => {
  res.json({ success: true, data: [] });
});

export default router;
