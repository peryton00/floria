"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Floria Media Infrastructure — Media API Router
const express_1 = require("express");
const auth_js_1 = require("../middleware/auth.js");
const rateLimit_js_1 = require("../middleware/rateLimit.js");
const media_controller_js_1 = require("./media.controller.js");
const router = (0, express_1.Router)();
// Require Authentication for all Media API endpoints
router.use(auth_js_1.authenticateToken);
router.post("/upload-session", rateLimit_js_1.mediaUploadRateLimiter, media_controller_js_1.createUploadSession);
router.post("/upload-session/:sessionId/complete", rateLimit_js_1.mediaUploadRateLimiter, media_controller_js_1.completeUploadSession);
router.get("/upload-session/:sessionId", media_controller_js_1.getUploadSessionStatus);
exports.default = router;
