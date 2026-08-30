// Floria API — Auth Routes (/api/v1/auth)
import { Router } from "express";
import { authController } from "./auth.controller.js";
import { sellersController } from "../sellers/sellers.controller.js";
import { authenticateToken } from "../middleware/auth.js";
import { authRateLimiter } from "../middleware/rateLimit.js";

const router = Router();

router.get("/me", authRateLimiter, authenticateToken, authController.getMe);

// Dedicated Seller Credential Authentication Endpoints
router.post("/seller/login", authRateLimiter, sellersController.login);
router.post("/seller/register", authRateLimiter, sellersController.apply);
router.post("/seller/apply", authRateLimiter, sellersController.apply);
router.post("/seller/forgot-password", authRateLimiter, sellersController.forgotPassword);
router.post("/seller/reset-password", authRateLimiter, sellersController.resetPassword);

export default router;
