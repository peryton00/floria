// Floria Media Infrastructure — Media API Router
import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { mediaUploadRateLimiter } from "../middleware/rateLimit.js";
import {
  createUploadSession,
  completeUploadSession,
  getUploadSessionStatus,
} from "./media.controller.js";

const router = Router();

// Require Authentication for all Media API endpoints
router.use(authenticateToken);

router.post("/upload-session", mediaUploadRateLimiter, createUploadSession);
router.post("/upload-session/:sessionId/complete", mediaUploadRateLimiter, completeUploadSession);
router.get("/upload-session/:sessionId", getUploadSessionStatus);

export default router;
