"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
// Floria Media Infrastructure — Media API Router
const express_1 = require("express");
const auth_js_1 = require("../middleware/auth.js");
const rateLimit_js_1 = require("../middleware/rateLimit.js");
const mediaController = __importStar(require("./media.controller.js"));
const router = (0, express_1.Router)();
// Require Authentication for all Media API endpoints
router.use(auth_js_1.authenticateToken);
router.post("/upload-session", rateLimit_js_1.mediaUploadRateLimiter, mediaController.createUploadSession);
router.post("/upload-session/:sessionId/complete", rateLimit_js_1.mediaUploadRateLimiter, mediaController.completeUploadSession);
router.get("/upload-session/:sessionId", mediaController.getUploadSessionStatus);
// Domain Media Integration Endpoints (Stage 9)
router.patch("/seller-logo", rateLimit_js_1.mediaUploadRateLimiter, mediaController.updateSellerLogo);
router.patch("/user-avatar", rateLimit_js_1.mediaUploadRateLimiter, mediaController.updateUserAvatar);
router.patch("/category-banner/:categoryId", rateLimit_js_1.mediaUploadRateLimiter, mediaController.updateCategoryBanner);
router.post("/reviews/:reviewId/images", rateLimit_js_1.mediaUploadRateLimiter, mediaController.attachReviewImage);
router.post("/seller-documents", rateLimit_js_1.mediaUploadRateLimiter, mediaController.attachSellerDocument);
router.get("/seller-documents/:documentId/download", mediaController.getSignedDocumentUrl);
router.patch("/nursery-banner", rateLimit_js_1.mediaUploadRateLimiter, mediaController.updateNurseryBanner);
exports.default = router;
