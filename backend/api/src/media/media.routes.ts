// Floria Media Infrastructure — Media API Router
import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { mediaUploadRateLimiter } from "../middleware/rateLimit.js";
import * as mediaController from "./media.controller.js";

const router = Router();

// Require Authentication for all Media API endpoints
router.use(authenticateToken);

router.post(
  "/upload-session",
  mediaUploadRateLimiter,
  mediaController.createUploadSession,
);
router.post(
  "/upload-direct",
  mediaUploadRateLimiter,
  mediaController.uploadDirectMedia,
);
router.post(
  "/upload-session/:sessionId/complete",
  mediaUploadRateLimiter,
  mediaController.completeUploadSession,
);
router.get(
  "/upload-session/:sessionId",
  mediaController.getUploadSessionStatus,
);

// Domain Media Integration Endpoints (Stage 9)
router.patch(
  "/seller-logo",
  mediaUploadRateLimiter,
  mediaController.updateSellerLogo,
);
router.patch(
  "/user-avatar",
  mediaUploadRateLimiter,
  mediaController.updateUserAvatar,
);
router.patch(
  "/category-banner/:categoryId",
  mediaUploadRateLimiter,
  mediaController.updateCategoryBanner,
);
router.post(
  "/reviews/:reviewId/images",
  mediaUploadRateLimiter,
  mediaController.attachReviewImage,
);
router.post(
  "/seller-documents",
  mediaUploadRateLimiter,
  mediaController.attachSellerDocument,
);
router.get(
  "/seller-documents/:documentId/download",
  mediaController.getSignedDocumentUrl,
);
router.patch(
  "/nursery-banner",
  mediaUploadRateLimiter,
  mediaController.updateNurseryBanner,
);

export default router;
