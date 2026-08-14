// Floria API — Notifications Routes Placeholder (Foundation)
import { Router, Request, Response } from "express";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

router.get("/", authenticateToken, (_req: Request, res: Response) => {
  res.json({ success: true, data: [] });
});

export default router;
