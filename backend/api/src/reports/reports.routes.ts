// Floria API — Reports Routes Placeholder (Foundation)
import { Router, Request, Response } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { requireRole } from "../middleware/authorization.js";

const router = Router();

router.get(
  "/",
  authenticateToken,
  requireRole("admin", "super_admin"),
  (_req: Request, res: Response) => {
    res.json({ success: true, data: { status: "reports_foundation" } });
  },
);

export default router;
