// Floria API — Auth Routes (/api/v1/auth)
import { Router } from "express";
import { authController } from "./auth.controller.js";
import { authenticateToken } from "../middleware/auth.js";
import { authRateLimiter } from "../middleware/rateLimit.js";

const router = Router();

router.get("/me", authRateLimiter, authenticateToken, authController.getMe);

export default router;
