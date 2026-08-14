"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Floria API — Inventory Routes
const express_1 = require("express");
const auth_js_1 = require("../middleware/auth.js");
const authorization_js_1 = require("../middleware/authorization.js");
const router = (0, express_1.Router)();
router.get("/", auth_js_1.authenticateToken, authorization_js_1.requireApprovedSeller, (_req, res) => {
    res.json({ success: true, data: [] });
});
exports.default = router;
