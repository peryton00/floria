"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Floria API — Notifications Routes Placeholder (Foundation)
const express_1 = require("express");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
router.get("/", auth_js_1.authenticateToken, (_req, res) => {
    res.json({ success: true, data: [] });
});
exports.default = router;
